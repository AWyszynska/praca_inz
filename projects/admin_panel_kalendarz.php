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

    if ($raw === '') {
        return '';
    }

    try {
        return (new DateTime($raw))->format('Y-m-d');
    } catch (Throwable $e) {
        return substr($raw, 0, 10);
    }
}

function fmt_time($value): string {
    $raw = dt_value($value);

    if ($raw === '') {
        return '';
    }

    try {
        return (new DateTime($raw))->format('H:i');
    } catch (Throwable $e) {
        return substr($raw, 11, 5);
    }
}

function normalize_status(string $status, $clientId): string {
    $s = strtoupper(trim($status));

    if (in_array($s, ['FREE', 'WOLNY', 'WOLNA'], true)) return 'FREE';
    if (in_array($s, ['BOOKED', 'UMOWIONA', 'UMÓWIONA'], true)) return 'BOOKED';
    if (in_array($s, ['CONFIRMED', 'POTWIERDZONA'], true)) return 'CONFIRMED';
    if (in_array($s, ['IN_PROGRESS', 'W_TRAKCIE'], true)) return 'IN_PROGRESS';
    if (in_array($s, ['DONE', 'ZREALIZOWANA', 'ZAKONCZONA', 'ZAKOŃCZONA'], true)) return 'DONE';
    if (in_array($s, ['CANCELLED', 'CANCELED', 'ANULOWANA'], true)) return 'CANCELLED';
    if (in_array($s, ['NOT_DONE', 'NIEZREALIZOWANA'], true)) return 'NOT_DONE';

    return $clientId ? 'BOOKED' : 'FREE';
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$body = get_body();
$action = (string)($body['action'] ?? $_GET['action'] ?? 'data');

try {
    if ($action === 'add_note') {
        $employeeId = (int)($body['employee_id'] ?? 0);
        $noteDate = trim((string)($body['note_date'] ?? ''));
        $noteTime = trim((string)($body['note_time'] ?? ''));
        $noteText = trim((string)($body['note_text'] ?? ''));

        if ($employeeId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Wybierz lekarza dla notatki.'
            ], 422);
        }

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
        ");

        $stmt->execute([
            ':id' => $noteId,
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

    $empStmt = $pdo->query("
        SELECT id, first_name, last_name, role, is_active
        FROM dbo.employee
        WHERE COALESCE(is_active, 1) = 1
        ORDER BY last_name ASC, first_name ASC
    ");

    $employees = [];

    foreach ($empStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $name = trim((string)($row['first_name'] ?? '') . ' ' . (string)($row['last_name'] ?? ''));

        $employees[] = [
            'id' => (int)$row['id'],
            'name' => $name !== '' ? $name : 'Lekarz #' . (int)$row['id'],
            'role' => (string)($row['role'] ?? ''),
        ];
    }

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
            c.phone AS client_phone,

            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name
        FROM dbo.visit v
        LEFT JOIN dbo.client c ON c.id = v.client_id
        LEFT JOIN dbo.employee e ON e.id = v.employee_id
        WHERE v.start_datetime >= :start_date
          AND v.start_datetime < :end_date
        ORDER BY v.start_datetime ASC
    ");

    $stmt->execute([
        ':start_date' => $start,
        ':end_date' => $end,
    ]);

    $visits = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));

        if ($clientName === '') {
            $clientName = $row['client_id'] !== null ? 'Klient #' . $row['client_id'] : 'Wolny termin';
        }

        $employeeName = trim((string)($row['employee_first_name'] ?? '') . ' ' . (string)($row['employee_last_name'] ?? ''));

        if ($employeeName === '') {
            $employeeName = $row['employee_id'] !== null ? 'Lekarz #' . $row['employee_id'] : '-';
        }

        $status = normalize_status((string)($row['visit_status'] ?? ''), $row['client_id'] ?? null);

        $visits[] = [
            'id' => (int)$row['id'],
            'employee_id' => $row['employee_id'] !== null ? (int)$row['employee_id'] : null,
            'employee_name' => $employeeName,
            'date' => fmt_date($row['start_datetime']),
            'time' => fmt_time($row['start_datetime']),
            'duration_min' => $row['duration_min'] !== null ? (int)$row['duration_min'] : null,
            'status' => $status,
            'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
            'client_name' => $clientName,
            'client_phone' => (string)($row['client_phone'] ?? ''),
            'client_email' => (string)($row['client_email'] ?? ''),
            'pet_id' => $row['pet_id'] !== null ? (int)$row['pet_id'] : null,
            'notes' => (string)($row['notes'] ?? ''),
        ];
    }

    $stmt = $pdo->prepare("
        SELECT
            cal.id,
            cal.employee_id,
            cal.note_date,
            cal.note_time,
            cal.note_text,
            cal.created_at,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name
        FROM dbo.calendar cal
        LEFT JOIN dbo.employee e ON e.id = cal.employee_id
        WHERE cal.note_date >= :start_date
          AND cal.note_date < :end_date
        ORDER BY cal.note_date ASC, cal.created_at DESC
    ");

    $stmt->execute([
        ':start_date' => $start,
        ':end_date' => $end,
    ]);

    $notes = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $employeeName = trim((string)($row['employee_first_name'] ?? '') . ' ' . (string)($row['employee_last_name'] ?? ''));

        if ($employeeName === '') {
            $employeeName = $row['employee_id'] !== null ? 'Lekarz #' . $row['employee_id'] : '-';
        }

        $notes[] = [
            'id' => (int)$row['id'],
            'employee_id' => $row['employee_id'] !== null ? (int)$row['employee_id'] : null,
            'employee_name' => $employeeName,
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
        'employees' => $employees,
        'visits' => $visits,
        'notes' => $notes,
    ]);
} catch (Throwable $e) {
    error_log('[admin_panel_kalendarz.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania danych kalendarza administratora.'
    ], 500);
}