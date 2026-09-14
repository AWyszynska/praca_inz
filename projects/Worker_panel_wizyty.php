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

function dt_value($value): string {
    if ($value instanceof DateTimeInterface) {
        return $value->format('Y-m-d H:i:s');
    }

    return trim((string)$value);
}

function format_date($value): string {
    $raw = dt_value($value);

    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('d.m.Y');
    } catch (Throwable $e) {
        return substr($raw, 0, 10);
    }
}

function format_time($value): string {
    $raw = dt_value($value);

    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('H:i');
    } catch (Throwable $e) {
        return substr($raw, 11, 5);
    }
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$employeeId = $_SESSION['employee_id'] ?? null;

if (!$employeeId && ($_SESSION['user_type'] ?? '') === 'employee') {
    $employeeId = $_SESSION['user_id'] ?? null;
}

if (!$employeeId) {
    out_json([
        'ok' => false,
        'message' => 'Brak zalogowanego pracownika.',
        'redirect' => 'final_view.php?file=login.xml'
    ], 401);
}
$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'list');

if ($action === 'cancel' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        $data = $_POST;
    }

    $visitId = (int)($data['visit_id'] ?? 0);

    if ($visitId <= 0) {
        out_json([
            'ok' => false,
            'message' => 'Brak ID wizyty.'
        ], 422);
    }

    try {
        $check = $pdo->prepare("
            SELECT id, visit_status
            FROM dbo.visit
            WHERE id = :visit_id
              AND employee_id = :employee_id
        ");

        $check->execute([
            ':visit_id' => $visitId,
            ':employee_id' => (int)$employeeId
        ]);

        $visit = $check->fetch(PDO::FETCH_ASSOC);

        if (!$visit) {
            out_json([
                'ok' => false,
                'message' => 'Nie znaleziono wizyty.'
            ], 404);
        }

        $status = strtoupper((string)($visit['visit_status'] ?? ''));

        if (in_array($status, ['DONE', 'CANCELLED', 'CANCELED', 'ANULOWANA', 'FREE'], true)) {
            out_json([
                'ok' => false,
                'message' => 'Tej wizyty nie można już odwołać.'
            ], 409);
        }

        $stmt = $pdo->prepare("
            UPDATE dbo.visit
            SET visit_status = 'CANCELLED'
            WHERE id = :visit_id
              AND employee_id = :employee_id
        ");

        $stmt->execute([
            ':visit_id' => $visitId,
            ':employee_id' => (int)$employeeId
        ]);

        out_json([
            'ok' => true,
            'message' => 'Wizyta została odwołana.'
        ]);

    } catch (Throwable $e) {
        error_log('[Worker_panel_wizyty.php cancel] ' . $e->getMessage());

        out_json([
            'ok' => false,
            'message' => 'Błąd odwoływania wizyty.'
        ], 500);
    }
}

if ($action !== 'list') {
    out_json([
        'ok' => false,
        'message' => 'Nieznana akcja.'
    ], 400);
}
try {
    $stmt = $pdo->prepare("
        SELECT TOP 50
            v.id,
            v.employee_id,
            v.client_id,
            v.pet_id,
            v.start_datetime,
            v.duration_min,
            v.visit_status,
            v.notes,

            c.first_name AS client_first_name,
            c.last_name AS client_last_name,
            c.email AS client_email,
            c.phone AS client_phone
        FROM dbo.visit v
        LEFT JOIN dbo.client c ON c.id = v.client_id
        WHERE v.employee_id = :employee_id
          AND v.start_datetime >= GETDATE()
          AND UPPER(COALESCE(v.visit_status, '')) NOT IN ('FREE')
        ORDER BY v.start_datetime ASC
    ");

    $stmt->execute([
        ':employee_id' => (int)$employeeId
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $visits = [];

    foreach ($rows as $row) {
        $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));

        if ($clientName === '') {
            $clientName = $row['client_id'] !== null ? 'Klient #' . $row['client_id'] : 'Brak klienta';
        }

        $visits[] = [
            'id' => (int)$row['id'],
            'date' => format_date($row['start_datetime']),
            'time' => format_time($row['start_datetime']),
            'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
            'client_name' => $clientName,
            'client_phone' => (string)($row['client_phone'] ?? ''),
            'client_email' => (string)($row['client_email'] ?? ''),
            'pet_id' => $row['pet_id'] !== null ? (int)$row['pet_id'] : null,
            'duration_min' => $row['duration_min'] !== null ? (int)$row['duration_min'] : null,
            'status' => (string)($row['visit_status'] ?? ''),
            'notes' => (string)($row['notes'] ?? ''),
        ];
    }

    out_json([
        'ok' => true,
        'visits' => $visits
    ]);
} catch (Throwable $e) {
    error_log('[Worker_panel_wizyty.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania wizyt.'
    ], 500);
}