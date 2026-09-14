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
        return $value->format('Y-m-d');
    }

    return trim((string)$value);
}

function bit_value($value): bool {
    if (is_bool($value)) return $value;
    $v = strtolower(trim((string)$value));
    return in_array($v, ['1', 'true', 'yes', 'tak'], true);
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

function get_logged_client_id(): int {
    $clientId = get_session_client_id();

    if (!$clientId) {
        $email = get_session_email();

        if ($email !== '') {
            $client = db_fetch_one(
                "SELECT TOP 1 id FROM dbo.client WHERE email = ?",
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

    return $clientId;
}

$clientId = get_logged_client_id();

$rawInput = file_get_contents('php://input');
$body = [];

if ($rawInput) {
    $decoded = json_decode($rawInput, true);

    if (is_array($decoded)) {
        $body = $decoded;
    }
}

$action = trim((string)($_GET['action'] ?? $_POST['action'] ?? $body['action'] ?? ''));

if ($action === 'save_address') {
    $street = trim((string)($body['street'] ?? $_POST['street'] ?? ''));
    $buildingNumber = trim((string)($body['building_number'] ?? $_POST['building_number'] ?? ''));
    $apartmentNumber = trim((string)($body['apartment_number'] ?? $_POST['apartment_number'] ?? ''));
    $city = trim((string)($body['city'] ?? $_POST['city'] ?? ''));
    $postalCode = trim((string)($body['postal_code'] ?? $_POST['postal_code'] ?? ''));
    $isDefault = !empty($body['is_default']) || !empty($_POST['is_default']);

    if ($street === '' || $buildingNumber === '' || $city === '' || $postalCode === '') {
        out_json([
            'success' => false,
            'message' => 'Ulica, numer budynku, kod pocztowy i miasto są wymagane.'
        ], 400);
    }

    if ($isDefault) {
        db_exec(
            "UPDATE dbo.[address]
             SET is_default = 0
             WHERE client_id = ?",
            [$clientId]
        );
    }

    db_exec(
        "INSERT INTO dbo.[address] 
            (client_id, apartment_number, building_number, street, city, postal_code, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            $clientId,
            $apartmentNumber,
            $buildingNumber,
            $street,
            $city,
            $postalCode,
            $isDefault ? 1 : 0
        ]
    );

    out_json([
        'success' => true,
        'message' => 'Adres został zapisany.'
    ]);
}

$client = db_fetch_one(
    "SELECT TOP 1
        id,
        first_name,
        last_name,
        birth_date,
        email,
        phone
     FROM dbo.client
     WHERE id = ?",
    [$clientId]
);

if (!$client) {
    out_json([
        'success' => false,
        'message' => 'Nie znaleziono danych pacjenta.'
    ], 404);
}

$addressRows = db_fetch_all(
    "SELECT
        id,
        client_id,
        apartment_number,
        building_number,
        street,
        city,
        postal_code,
        is_default
     FROM dbo.[address]
     WHERE client_id = ?
     ORDER BY is_default DESC, id DESC",
    [$clientId]
);

$addresses = [];

foreach ($addressRows as $row) {
    $addresses[] = [
        'id' => (int)($row['id'] ?? 0),
        'client_id' => (int)($row['client_id'] ?? 0),
        'apartment_number' => trim((string)($row['apartment_number'] ?? '')),
        'building_number' => trim((string)($row['building_number'] ?? '')),
        'street' => trim((string)($row['street'] ?? '')),
        'city' => trim((string)($row['city'] ?? '')),
        'postal_code' => trim((string)($row['postal_code'] ?? '')),
        'is_default' => bit_value($row['is_default'] ?? 0)
    ];
}

out_json([
    'success' => true,
    'client_id' => $clientId,
    'profile' => [
        'id' => (int)($client['id'] ?? 0),
        'first_name' => trim((string)($client['first_name'] ?? '')),
        'last_name' => trim((string)($client['last_name'] ?? '')),
        'birth_date' => dt_value($client['birth_date'] ?? ''),
        'email' => trim((string)($client['email'] ?? '')),
        'phone' => trim((string)($client['phone'] ?? ''))
    ],
    'addresses' => $addresses
]);