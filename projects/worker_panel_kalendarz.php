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
    return is_array($data) ? $data : $_POST;
}

function dt_value($value): string {
    if ($value instanceof DateTimeInterface) {
        return $value->format('Y-m-d H:i:s');
    }

    return trim((string)$value);
}

function fmt_date($value): string {
    $raw = dt_value($value);
    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('Y-m-d');
    } catch (Throwable $e) {
        return substr($raw, 0, 10);
    }
}

function fmt_time($value): string {
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
        'message' => 'Brak zalogowanego lekarza.',
        'redirect' => 'final_view.php?file=login.xml'
    ], 401);
}

$employeeId = (int)$employeeId;
$body = get_body();
$action = (string)($body['action'] ?? $_GET['action'] ?? 'data');

try {
    if ($action === 'add_note') {
        $noteDate = trim((string)($body['note_date'] ?? ''));
$noteTime = trim((string)($body['note_time'] ?? ''));
$noteText = trim((string)($body['note_text'] ?? ''));

        if ($noteDate === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $noteDate)) {
            out_json([
                'ok' => false,
                'message' => 'Wybierz poprawną datę.'
            ], 422);
        }
if ($noteTime !== '' && !preg_match('/^\d{2}:\d{2}$/', $noteTime)) {
    out_json([
        'ok' => false,
        'message' => 'Podaj poprawną godzinę.'
    ], 422);
}
        if ($noteText === '') {
            out_json([
                'ok' => false,
                'message' => 'Treść notatki nie może być pusta.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            INSERT INTO dbo.calendar (employee_id, note_date, note_time, note_text)
VALUES (:employee_id, :note_date, :note_time, :note_text)
        ");

        $stmt->execute([
    ':employee_id' => $employeeId,
    ':note_date' => $noteDate,
    ':note_time' => $noteTime !== '' ? $noteTime : null,
    ':note_text' => $noteText,
]);

        out_json([
            'ok' => true,
            'message' => 'Notatka została dodana.'
        ]);
    }

    if ($action === 'delete_note') {
        $noteId = (int)($body['id'] ?? 0);

        if ($noteId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID notatki.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            DELETE FROM dbo.calendar
            WHERE id = :id
              AND employee_id = :employee_id
        ");

        $stmt->execute([
            ':id' => $noteId,
            ':employee_id' => $employeeId,
        ]);

        out_json([
            'ok' => true,
            'message' => 'Notatka została usunięta.'
        ]);
    }

    $year = (int)($_GET['year'] ?? date('Y'));
    $month = (int)($_GET['month'] ?? date('n'));

    if ($year < 2020 || $year > 2100) {
        $year = (int)date('Y');
    }

    if ($month < 1 || $month > 12) {
        $month = (int)date('n');
    }

    $start = sprintf('%04d-%02d-01', $year, $month);
    $end = (new DateTime($start))->modify('+1 month')->format('Y-m-d');

    $stmt = $pdo->prepare("
        SELECT
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
          AND v.start_datetime >= :start_date
          AND v.start_datetime < :end_date
        ORDER BY v.start_datetime ASC
    ");

    $stmt->execute([
        ':employee_id' => $employeeId,
        ':start_date' => $start,
        ':end_date' => $end,
    ]);

    $visits = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));

        if ($clientName === '') {
            $clientName = $row['client_id'] !== null ? 'Klient #' . $row['client_id'] : 'Wolny termin';
        }

        $visits[] = [
            'id' => (int)$row['id'],
            'date' => fmt_date($row['start_datetime']),
            'time' => fmt_time($row['start_datetime']),
            'duration_min' => $row['duration_min'] !== null ? (int)$row['duration_min'] : null,
            'status' => (string)($row['visit_status'] ?? ''),
            'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
            'client_name' => $clientName,
            'client_phone' => (string)($row['client_phone'] ?? ''),
            'client_email' => (string)($row['client_email'] ?? ''),
            'pet_id' => $row['pet_id'] !== null ? (int)$row['pet_id'] : null,
            'notes' => (string)($row['notes'] ?? ''),
        ];
    }

    $stmt = $pdo->prepare("
        SELECT id, employee_id, note_date, note_time, note_text, created_at
FROM dbo.calendar
        WHERE employee_id = :employee_id
          AND note_date >= :start_date
          AND note_date < :end_date
        ORDER BY note_date ASC, created_at DESC
    ");

    $stmt->execute([
        ':employee_id' => $employeeId,
        ':start_date' => $start,
        ':end_date' => $end,
    ]);

    $notes = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $notes[] = [
    'id' => (int)$row['id'],
    'date' => fmt_date($row['note_date']),
    'time' => $row['note_time'] !== null ? substr(dt_value($row['note_time']), 0, 5) : '',
    'note_text' => (string)$row['note_text'],
    'created_at' => dt_value($row['created_at']),
];
    }

    out_json([
        'ok' => true,
        'year' => $year,
        'month' => $month,
        'visits' => $visits,
        'notes' => $notes,
    ]);
} catch (Throwable $e) {
    error_log('[worker_panel_kalendarz.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania danych kalendarza.'
    ], 500);
}