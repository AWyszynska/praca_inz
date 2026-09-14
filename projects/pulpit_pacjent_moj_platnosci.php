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

/*
  payment nie ma client_id, więc płatności pacjenta bierzemy po visit_id.
  visit_history ma visit_id oraz client_id, dlatego tutaj filtrujemy po zalogowanym pacjencie.
*/
$sql = "
    WITH patient_visits AS (
        SELECT
            visit_id,
            MAX(client_id) AS client_id,
            MAX(employee_id) AS employee_id,
            MIN(created_at) AS visit_datetime
        FROM visit_history
        WHERE client_id = ?
        GROUP BY visit_id
    )
    SELECT
        p.id AS payment_id,
        p.visit_id,
        p.amount,
        p.method,
        p.paid_at,
        p.status,
        pv.visit_datetime,

        LTRIM(RTRIM(CONCAT(
            COALESCE(e.first_name, ''),
            CASE
                WHEN e.last_name IS NULL OR e.last_name = '' THEN ''
                ELSE CONCAT(' ', e.last_name)
            END
        ))) AS employee_name
    FROM payment p
    INNER JOIN patient_visits pv ON pv.visit_id = p.visit_id
    LEFT JOIN employee e ON e.id = pv.employee_id
    ORDER BY
        COALESCE(p.paid_at, pv.visit_datetime) DESC,
        p.id DESC
";

$rows = db_fetch_all($sql, [$clientId]);

$items = [];

foreach ($rows as $row) {
    $amountRaw = $row['amount'] ?? null;

    $items[] = [
        'payment_id' => trim((string)($row['payment_id'] ?? '')),
        'visit_id' => trim((string)($row['visit_id'] ?? '')),
        'amount' => $amountRaw === null || $amountRaw === '' ? null : (float)$amountRaw,
        'method' => trim((string)($row['method'] ?? '')),
        'status' => trim((string)($row['status'] ?? '')),
        'payment_datetime' => dt_value($row['paid_at'] ?? ''),
        'visit_datetime' => dt_value($row['visit_datetime'] ?? ''),
        'visit_status' => '',
        'employee_name' => trim((string)($row['employee_name'] ?? '')),
        'service_name' => '',
        'pet_name' => ''
    ];
}

out_json([
    'success' => true,
    'client_id' => $clientId,
    'count' => count($items),
    'items' => $items
]);