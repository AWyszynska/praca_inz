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

$sql = "
    SELECT
        vh.id,
        vh.visit_id,
        vh.created_at,
        vh.employee_id,
        vh.client_id,
        vh.text,
        vh.history_type,
        vh.attachment_id,

        LTRIM(RTRIM(CONCAT(
            COALESCE(e.first_name, ''),
            CASE
                WHEN e.last_name IS NULL OR e.last_name = '' THEN ''
                ELSE CONCAT(' ', e.last_name)
            END
        ))) AS employee_name
    FROM visit_history vh
    LEFT JOIN employee e ON e.id = vh.employee_id
    WHERE vh.client_id = ?
    ORDER BY vh.created_at DESC, vh.id DESC
";

$rows = db_fetch_all($sql, [$clientId]);

$items = [];

foreach ($rows as $row) {
    $historyType = strtoupper(trim((string)($row['history_type'] ?? '')));
    $attachmentId = isset($row['attachment_id']) && $row['attachment_id'] !== null
        ? (int)$row['attachment_id']
        : null;

    $isPrescription = $historyType === 'PRESCRIPTION';

    $items[] = [
        'id' => (int)($row['id'] ?? 0),
        'visit_id' => (int)($row['visit_id'] ?? 0),
        'created_at' => dt_value($row['created_at'] ?? ''),
        'employee_id' => isset($row['employee_id']) ? (int)$row['employee_id'] : null,
        'client_id' => isset($row['client_id']) ? (int)$row['client_id'] : null,
        'text' => trim((string)($row['text'] ?? '')),
        'history_type' => $historyType,
        'attachment_id' => $attachmentId,
        'has_attachment' => $attachmentId !== null,
        'is_prescription' => $isPrescription,
        'prescription_status' => $isPrescription ? 'WYSTAWIONA' : '',
        'employee_name' => trim((string)($row['employee_name'] ?? ''))
    ];
}

out_json([
    'success' => true,
    'client_id' => $clientId,
    'count' => count($items),
    'items' => $items
]);