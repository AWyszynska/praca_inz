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

function get_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);

    if (is_array($data)) {
        return $data;
    }

    return $_POST;
}

function dt_value($value): string {
    if ($value instanceof DateTimeInterface) {
        return $value->format('Y-m-d H:i:s');
    }

    return trim((string)$value);
}

function fmt_date($value): string {
    $raw = dt_value($value);

    if ($raw === '') {
        return '';
    }

    try {
        return (new DateTime($raw))->format('d.m.Y');
    } catch (Throwable $e) {
        return substr($raw, 0, 10);
    }
}

function fmt_datetime($value): string {
    $raw = dt_value($value);

    if ($raw === '') {
        return '';
    }

    try {
        return (new DateTime($raw))->format('d.m.Y H:i');
    } catch (Throwable $e) {
        return $raw;
    }
}

function money_pl($value): string {
    if ($value === null || $value === '') {
        return '';
    }

    return number_format((float)$value, 2, ',', ' ') . ' zł';
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$body = get_body();
$action = (string)($body['action'] ?? $_GET['action'] ?? 'list');

try {
    if ($action === 'history') {
        $clientId = (int)($body['client_id'] ?? $_GET['client_id'] ?? 0);

        if ($clientId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID pacjenta.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            SELECT TOP 1
                id,
                first_name,
                last_name,
                birth_date,
                email,
                phone,
                account_created_at
            FROM dbo.client
            WHERE id = :id
        ");

        $stmt->execute([
            ':id' => $clientId
        ]);

        $client = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$client) {
            out_json([
                'ok' => false,
                'message' => 'Nie znaleziono pacjenta.'
            ], 404);
        }

        $stmt = $pdo->prepare("
            SELECT TOP 100
                v.id,
                v.employee_id,
                v.client_id,
                v.pet_id,
                v.start_datetime,
                v.duration_min,
                v.total_price,
                v.visit_status,
                v.notes,

                e.first_name AS employee_first_name,
                e.last_name AS employee_last_name
            FROM dbo.visit v
            LEFT JOIN dbo.employee e ON e.id = v.employee_id
            WHERE v.client_id = :client_id
            ORDER BY v.start_datetime DESC
        ");

        $stmt->execute([
            ':client_id' => $clientId
        ]);

        $visits = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $doctorName = trim((string)($row['employee_first_name'] ?? '') . ' ' . (string)($row['employee_last_name'] ?? ''));

            if ($doctorName === '') {
                $doctorName = $row['employee_id'] !== null ? 'Lekarz #' . (string)$row['employee_id'] : '-';
            }

            $visits[] = [
                'id' => (int)$row['id'],
                'date_time' => fmt_datetime($row['start_datetime']),
                'duration_min' => $row['duration_min'] !== null ? (int)$row['duration_min'] : null,
                'status' => (string)($row['visit_status'] ?? ''),
                'doctor' => $doctorName,
                'pet_id' => $row['pet_id'] !== null ? (int)$row['pet_id'] : null,
                'price' => money_pl($row['total_price'] ?? null),
                'notes' => (string)($row['notes'] ?? ''),
            ];
        }

        $clientName = trim((string)$client['first_name'] . ' ' . (string)$client['last_name']);

        out_json([
            'ok' => true,
            'client' => [
                'id' => (int)$client['id'],
                'name' => $clientName !== '' ? $clientName : 'Pacjent #' . (int)$client['id'],
                'first_name' => (string)$client['first_name'],
                'last_name' => (string)$client['last_name'],
                'birth_date' => fmt_date($client['birth_date']),
                'email' => (string)$client['email'],
                'phone' => (string)($client['phone'] ?? ''),
                'account_created_at' => fmt_datetime($client['account_created_at']),
            ],
            'visits' => $visits,
        ]);
    }

    if ($action !== 'list') {
        out_json([
            'ok' => false,
            'message' => 'Nieznana akcja.'
        ], 400);
    }

    $stmt = $pdo->query("
        SELECT
            c.id,
            c.first_name,
            c.last_name,
            c.birth_date,
            c.email,
            c.phone,
            c.account_created_at,

            (
                SELECT COUNT(*)
                FROM dbo.visit v
                WHERE v.client_id = c.id
            ) AS visits_count,

            (
                SELECT MAX(v.start_datetime)
                FROM dbo.visit v
                WHERE v.client_id = c.id
            ) AS last_visit
        FROM dbo.client c
        ORDER BY c.last_name ASC, c.first_name ASC
    ");

    $clients = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $name = trim((string)$row['first_name'] . ' ' . (string)$row['last_name']);

        $clients[] = [
            'id' => (int)$row['id'],
            'name' => $name !== '' ? $name : 'Pacjent #' . (int)$row['id'],
            'first_name' => (string)$row['first_name'],
            'last_name' => (string)$row['last_name'],
            'birth_date' => fmt_date($row['birth_date']),
            'email' => (string)$row['email'],
            'phone' => (string)($row['phone'] ?? ''),
            'account_created_at' => fmt_datetime($row['account_created_at']),
            'visits_count' => (int)($row['visits_count'] ?? 0),
            'last_visit' => fmt_datetime($row['last_visit']),
        ];
    }

    out_json([
        'ok' => true,
        'clients' => $clients,
    ]);
} catch (Throwable $e) {
    error_log('[admin_panel_pacjenci.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania pacjentów.'
    ], 500);
}