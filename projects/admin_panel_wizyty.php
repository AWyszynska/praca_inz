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

function money_pl($value): string {
    $n = (float)($value ?? 0);
    return number_format($n, 2, ',', ' ') . ' zł';
}

function normalize_status(string $status, $clientId): string {
    $s = strtoupper(trim($status));

    if (in_array($s, ['FREE', 'WOLNA', 'WOLNY'], true)) return 'FREE';
    if (in_array($s, ['BOOKED', 'UMOWIONA', 'UMÓWIONA'], true)) return 'BOOKED';
    if (in_array($s, ['CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE'], true)) return 'CONFIRMED';
    if (in_array($s, ['IN_PROGRESS', 'W_TRAKCIE'], true)) return 'IN_PROGRESS';
    if (in_array($s, ['DONE', 'ZREALIZOWANA', 'ZAKONCZONA', 'ZAKOŃCZONA'], true)) return 'DONE';
    if (in_array($s, ['CANCELLED', 'CANCELED', 'ANULOWANA'], true)) return 'CANCELLED';
    if (in_array($s, ['NOT_DONE', 'NIEZREALIZOWANA'], true)) return 'NOT_DONE';

    return $clientId ? 'BOOKED' : 'FREE';
}

function status_label(string $status): string {
    $s = strtoupper(trim($status));

    if ($s === 'FREE') return 'Wolny termin';
    if ($s === 'BOOKED') return 'Umówiona';
    if ($s === 'CONFIRMED') return 'Potwierdzona';
    if ($s === 'IN_PROGRESS') return 'W trakcie';
    if ($s === 'DONE') return 'Zrealizowana';
    if ($s === 'CANCELLED') return 'Anulowana';
    if ($s === 'NOT_DONE') return 'Niezrealizowana';

    return $status !== '' ? $status : 'Brak statusu';
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$action = (string)($_GET['action'] ?? $_POST['action'] ?? 'list');
if ($action === 'cancel' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        $data = $_POST;
    }

    $visitId = (int)($data['visit_id'] ?? 0);
    $reason = trim((string)($data['reason'] ?? ''));

    if ($visitId <= 0) {
        out_json([
            'ok' => false,
            'message' => 'Brak ID wizyty.'
        ], 422);
    }

    if ($reason === '') {
        out_json([
            'ok' => false,
            'message' => 'Podaj powód odwołania wizyty.'
        ], 422);
    }

    try {
        $check = $pdo->prepare("
            SELECT
                id,
                client_id,
                employee_id,
                visit_status
            FROM dbo.visit
            WHERE id = :visit_id
        ");

        $check->execute([
            ':visit_id' => $visitId
        ]);

        $visit = $check->fetch(PDO::FETCH_ASSOC);

        if (!$visit) {
            out_json([
                'ok' => false,
                'message' => 'Nie znaleziono wizyty.'
            ], 404);
        }

        $status = strtoupper((string)($visit['visit_status'] ?? ''));

        if (in_array($status, ['FREE', 'DONE', 'CANCELLED', 'CANCELED', 'ANULOWANA', 'NOT_DONE', 'IN_PROGRESS'], true)) {
            out_json([
                'ok' => false,
                'message' => 'Tej wizyty nie można już odwołać.'
            ], 409);
        }

        $clientId = isset($visit['client_id']) ? (int)$visit['client_id'] : 0;
        $employeeId = isset($visit['employee_id']) && $visit['employee_id'] !== null
            ? (int)$visit['employee_id']
            : null;

        if ($clientId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Ta wizyta nie ma przypisanego pacjenta.'
            ], 409);
        }

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            UPDATE dbo.visit
            SET visit_status = 'CANCELLED',
                cancellation_reason = :reason,
                cancelled_at = SYSDATETIME()
            WHERE id = :visit_id
        ");

        $stmt->execute([
            ':reason' => $reason,
            ':visit_id' => $visitId
        ]);

        $notificationText = 'Twoja wizyta #' . $visitId . ' została odwołana. Powód: ' . $reason;

        $notify = $pdo->prepare("
            INSERT INTO dbo.notification
                (
                    employee_id,
                    client_id,
                    [text],
                    is_read,
                    created_at,
                    notification_type,
                    visit_id,
                    cancellation_reason
                )
            VALUES
                (
                    :employee_id,
                    :client_id,
                    :text,
                    0,
                    SYSDATETIME(),
                    :notification_type,
                    :visit_id,
                    :cancellation_reason
                )
        ");

        $notify->execute([
            ':employee_id' => $employeeId,
            ':client_id' => $clientId,
            ':text' => $notificationText,
            ':notification_type' => 'VISIT_CANCELLED',
            ':visit_id' => $visitId,
            ':cancellation_reason' => $reason
        ]);

        $pdo->commit();

        out_json([
            'ok' => true,
            'message' => 'Wizyta została anulowana i wysłano powiadomienie do pacjenta.'
        ]);

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log('[admin_panel_wizyty.php cancel] ' . $e->getMessage());

        out_json([
            'ok' => false,
            'message' => 'Błąd anulowania wizyty.'
        ], 500);
    }
}
if ($action === 'confirm' && $_SERVER['REQUEST_METHOD'] === 'POST') {
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
        ");

        $check->execute([
            ':visit_id' => $visitId
        ]);

        $visit = $check->fetch(PDO::FETCH_ASSOC);

        if (!$visit) {
            out_json([
                'ok' => false,
                'message' => 'Nie znaleziono wizyty.'
            ], 404);
        }

        $status = strtoupper((string)($visit['visit_status'] ?? ''));

        if ($status !== 'BOOKED') {
            out_json([
                'ok' => false,
                'message' => 'Tylko wizytę umówioną można potwierdzić.'
            ], 409);
        }

        $stmt = $pdo->prepare("
            UPDATE dbo.visit
            SET visit_status = 'CONFIRMED'
            WHERE id = :visit_id
        ");

        $stmt->execute([
            ':visit_id' => $visitId
        ]);

        out_json([
            'ok' => true,
            'message' => 'Wizyta została potwierdzona.'
        ]);

    } catch (Throwable $e) {
        error_log('[admin_panel_wizyty.php confirm] ' . $e->getMessage());

        out_json([
            'ok' => false,
            'message' => 'Błąd potwierdzania wizyty.'
        ], 500);
    }
}
try {
    if ($action !== 'list') {
        out_json([
            'ok' => false,
            'message' => 'Nieznana akcja.'
        ], 400);
    }

    $employeesStmt = $pdo->query("
        SELECT
            id,
            first_name,
            last_name,
            role,
            is_active
        FROM dbo.employee
        WHERE COALESCE(is_active, 1) = 1
        ORDER BY last_name ASC, first_name ASC
    ");

    $employees = [];

    foreach ($employeesStmt->fetchAll(PDO::FETCH_ASSOC) as $emp) {
        $name = trim((string)($emp['first_name'] ?? '') . ' ' . (string)($emp['last_name'] ?? ''));

        $employees[] = [
            'id' => (int)$emp['id'],
            'name' => $name !== '' ? $name : 'Pracownik #' . (int)$emp['id'],
            'role' => (string)($emp['role'] ?? ''),
            'is_active' => (bool)($emp['is_active'] ?? true)
        ];
    }

    $stmt = $pdo->prepare("
        SELECT TOP 200
            v.id,
            v.employee_id,
            v.client_id,
            v.pet_id,
            v.start_datetime,
            v.duration_min,
            v.total_price,
            v.visit_status,
            v.notes,

            c.first_name AS client_first_name,
            c.last_name AS client_last_name,
            c.email AS client_email,
            c.phone AS client_phone,

            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.role AS employee_role
        FROM dbo.visit v
        LEFT JOIN dbo.client c ON c.id = v.client_id
        LEFT JOIN dbo.employee e ON e.id = v.employee_id
        WHERE v.start_datetime >= GETDATE()
        ORDER BY v.start_datetime ASC
    ");

    $stmt->execute();

    $visits = [];
    $stats = [
        'all' => 0,
        'booked' => 0,
        'confirmed' => 0,
        'in_progress' => 0,
        'done' => 0,
        'free' => 0,
        'cancelled' => 0
    ];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $status = normalize_status((string)($row['visit_status'] ?? ''), $row['client_id'] ?? null);

        $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));

        if ($clientName === '') {
            $clientName = $row['client_id'] !== null ? 'Klient #' . $row['client_id'] : '-';
        }

        $employeeName = trim((string)($row['employee_first_name'] ?? '') . ' ' . (string)($row['employee_last_name'] ?? ''));

        if ($employeeName === '') {
            $employeeName = $row['employee_id'] !== null ? 'Lekarz #' . $row['employee_id'] : '-';
        }

        $stats['all']++;

        if ($status === 'BOOKED') $stats['booked']++;
        if ($status === 'CONFIRMED') $stats['confirmed']++;
        if ($status === 'IN_PROGRESS') $stats['in_progress']++;
        if ($status === 'DONE') $stats['done']++;
        if ($status === 'FREE') $stats['free']++;
        if ($status === 'CANCELLED' || $status === 'NOT_DONE') $stats['cancelled']++;

        $visits[] = [
            'id' => (int)$row['id'],
            'employee_id' => $row['employee_id'] !== null ? (int)$row['employee_id'] : null,
            'employee_name' => $employeeName,
            'employee_role' => (string)($row['employee_role'] ?? ''),
            'date' => format_date($row['start_datetime']),
            'time' => format_time($row['start_datetime']),
            'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
            'client_name' => $clientName,
            'client_phone' => (string)($row['client_phone'] ?? ''),
            'client_email' => (string)($row['client_email'] ?? ''),
            'pet_id' => $row['pet_id'] !== null ? (int)$row['pet_id'] : null,
            'duration_min' => $row['duration_min'] !== null ? (int)$row['duration_min'] : null,
            'total_price' => $row['total_price'] !== null ? (float)$row['total_price'] : 0,
            'total_price_label' => money_pl($row['total_price'] ?? 0),
            'status' => $status,
            'status_label' => status_label($status),
            'notes' => (string)($row['notes'] ?? '')
        ];
    }

    out_json([
        'ok' => true,
        'visits' => $visits,
        'employees' => $employees,
        'stats' => $stats
    ]);
} catch (Throwable $e) {
    error_log('[admin_panel_wizyty.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania wizyt administratora.'
    ], 500);
}