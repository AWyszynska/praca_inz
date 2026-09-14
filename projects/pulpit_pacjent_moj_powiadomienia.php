<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

function out_json(array $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function db_fetch_all(string $sql, array $params = []): array {
    global $conn, $pdo;

    if (isset($pdo) && $pdo instanceof PDO) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    if (isset($conn)) {
        $stmt = sqlsrv_query($conn, $sql, $params);

        if ($stmt === false) {
            out_json([
                'success' => false,
                'message' => 'Błąd zapytania SQL.',
                'errors' => sqlsrv_errors()
            ], 500);
        }

        $rows = [];

        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $rows[] = $row;
        }

        return $rows;
    }

    out_json([
        'success' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

function db_fetch_one(string $sql, array $params = []): ?array {
    $rows = db_fetch_all($sql, $params);
    return $rows[0] ?? null;
}

function db_exec(string $sql, array $params = []): void {
    global $conn, $pdo;

    if (isset($pdo) && $pdo instanceof PDO) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return;
    }

    if (isset($conn)) {
        $stmt = sqlsrv_query($conn, $sql, $params);

        if ($stmt === false) {
            out_json([
                'success' => false,
                'message' => 'Błąd zapisu SQL.',
                'errors' => sqlsrv_errors()
            ], 500);
        }

        return;
    }

    out_json([
        'success' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

function dt_value($value): string {
    if ($value instanceof DateTimeInterface) {
        return $value->format('Y-m-d H:i:s');
    }

    return trim((string)$value);
}

function get_session_client_id(): ?int {
    $keys = [
        'client_id',
        'klient_id',
        'pacjent_id',
        'id_client',
        'logged_client_id'
    ];

    foreach ($keys as $key) {
        if (!empty($_SESSION[$key]) && is_numeric($_SESSION[$key])) {
            return (int)$_SESSION[$key];
        }
    }

    if (!empty($_SESSION['client']) && is_array($_SESSION['client']) && !empty($_SESSION['client']['id'])) {
        return (int)$_SESSION['client']['id'];
    }

    if (!empty($_SESSION['user']) && is_array($_SESSION['user']) && !empty($_SESSION['user']['id'])) {
        $role = strtolower((string)($_SESSION['user']['role'] ?? $_SESSION['role'] ?? ''));

        if (in_array($role, ['client', 'pacjent', 'patient'], true)) {
            return (int)$_SESSION['user']['id'];
        }
    }

    if (!empty($_SESSION['role']) && in_array(strtolower((string)$_SESSION['role']), ['client', 'pacjent', 'patient'], true)) {
        if (!empty($_SESSION['user_id']) && is_numeric($_SESSION['user_id'])) {
            return (int)$_SESSION['user_id'];
        }
    }

    return null;
}

function get_session_email(): string {
    $keys = ['email', 'client_email', 'pacjent_email', 'user_email'];

    foreach ($keys as $key) {
        if (!empty($_SESSION[$key])) {
            return trim((string)$_SESSION[$key]);
        }
    }

    if (!empty($_SESSION['client']) && is_array($_SESSION['client']) && !empty($_SESSION['client']['email'])) {
        return trim((string)$_SESSION['client']['email']);
    }

    if (!empty($_SESSION['user']) && is_array($_SESSION['user']) && !empty($_SESSION['user']['email'])) {
        return trim((string)$_SESSION['user']['email']);
    }

    return '';
}

$clientId = get_session_client_id();

if (!$clientId) {
    $email = get_session_email();

    if ($email !== '') {
        $client = db_fetch_one(
            "SELECT TOP 1 id FROM client WHERE email = ?",
            [$email]
        );

        if ($client && !empty($client['id'])) {
            $clientId = (int)$client['id'];
        }
    }
}

if (!$clientId) {
    out_json([
        'success' => false,
        'message' => 'Nie znaleziono zalogowanego pacjenta w sesji.'
    ], 401);
}

$table = db_fetch_one(
    "SELECT OBJECT_ID('dbo.notification') AS table_id"
);

if (!$table || empty($table['table_id'])) {
    out_json([
        'success' => false,
        'message' => 'Nie znaleziono tabeli dbo.notification. Najpierw utwórz tabelę notification.'
    ], 500);
}

$rawInput = file_get_contents('php://input');
$body = [];

if ($rawInput) {
    $decoded = json_decode($rawInput, true);

    if (is_array($decoded)) {
        $body = $decoded;
    }
}

$action = trim((string)($_GET['action'] ?? $_POST['action'] ?? $body['action'] ?? ''));

if ($action === 'mark_read') {
    $id = (int)($_GET['id'] ?? $_POST['id'] ?? $body['id'] ?? 0);

    if ($id <= 0) {
        out_json([
            'success' => false,
            'message' => 'Brak ID powiadomienia.'
        ], 400);
    }

    db_exec(
        "UPDATE dbo.notification
         SET is_read = 1,
             read_at = COALESCE(read_at, SYSDATETIME())
         WHERE id = ? AND client_id = ?",
        [$id, $clientId]
    );

    out_json([
        'success' => true,
        'message' => 'Powiadomienie oznaczone jako odczytane.'
    ]);
}

if ($action === 'mark_all_read') {
    db_exec(
        "UPDATE dbo.notification
         SET is_read = 1,
             read_at = COALESCE(read_at, SYSDATETIME())
         WHERE client_id = ? AND is_read = 0",
        [$clientId]
    );

    out_json([
        'success' => true,
        'message' => 'Wszystkie powiadomienia oznaczone jako odczytane.'
    ]);
}

$sql = "
    SELECT
        n.id,
        n.employee_id,
        n.client_id,
        n.[text],
        n.is_read,
        n.created_at,
        n.read_at,

        LTRIM(RTRIM(CONCAT(
            COALESCE(e.first_name, ''),
            CASE
                WHEN e.last_name IS NULL OR e.last_name = '' THEN ''
                ELSE CONCAT(' ', e.last_name)
            END
        ))) AS employee_name
    FROM dbo.notification n
    LEFT JOIN dbo.employee e ON e.id = n.employee_id
    WHERE n.client_id = ?
    ORDER BY
        n.is_read ASC,
        n.created_at DESC,
        n.id DESC
";

$rows = db_fetch_all($sql, [$clientId]);

$items = [];

foreach ($rows as $row) {
    $isRead = (int)($row['is_read'] ?? 0) === 1;

    $items[] = [
        'id' => (int)($row['id'] ?? 0),
        'employee_id' => isset($row['employee_id']) && $row['employee_id'] !== null
            ? (int)$row['employee_id']
            : null,
        'client_id' => (int)($row['client_id'] ?? 0),
        'text' => trim((string)($row['text'] ?? '')),
        'is_read' => $isRead,
        'created_at' => dt_value($row['created_at'] ?? ''),
        'read_at' => dt_value($row['read_at'] ?? ''),
        'employee_name' => trim((string)($row['employee_name'] ?? ''))
    ];
}

$unread = 0;

foreach ($items as $item) {
    if (!$item['is_read']) {
        $unread++;
    }
}

out_json([
    'success' => true,
    'client_id' => $clientId,
    'count' => count($items),
    'unread' => $unread,
    'items' => $items
]);