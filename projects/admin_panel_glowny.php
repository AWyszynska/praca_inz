<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

function out_json(array $data, int $code = 200) {
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

function pl_date($value): string {
    $raw = dt_value($value);
    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('d.m.Y');
    } catch (Throwable $e) {
        return substr($raw, 0, 10);
    }
}

function pl_time($value): string {
    $raw = dt_value($value);
    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('H:i');
    } catch (Throwable $e) {
        return substr($raw, 11, 5);
    }
}

function money_pl(float $value): string {
    return number_format($value, 2, ',', ' ') . ' zł';
}

function normalize_status(string $status, $clientId): string {
    $s = strtoupper(trim($status));

    if (in_array($s, ['FREE', 'WOLNA', 'WOLNY'], true)) return 'free';
    if (in_array($s, ['BOOKED', 'UMOWIONA', 'UMÓWIONA'], true)) return 'booked';
    if (in_array($s, ['CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE'], true)) return 'confirmed';
    if (in_array($s, ['IN_PROGRESS', 'W_TRAKCIE'], true)) return 'in_progress';
    if (in_array($s, ['DONE', 'ZREALIZOWANA', 'ZAKONCZONA', 'ZAKOŃCZONA'], true)) return 'done';
    if (in_array($s, ['CANCELLED', 'CANCELED', 'ANULOWANA', 'NOT_DONE', 'NIEZREALIZOWANA'], true)) return 'cancelled';

    return $clientId ? 'booked' : 'free';
}

function status_label(string $kind, string $raw = ''): string {
    if ($kind === 'free') return 'Wolny termin';
    if ($kind === 'booked') return 'Umówiona';
    if ($kind === 'confirmed') return 'Potwierdzona';
    if ($kind === 'in_progress') return 'W trakcie';
    if ($kind === 'done') return 'Zrealizowana';
    if ($kind === 'cancelled') return 'Niezrealizowana';

    return $raw !== '' ? $raw : 'Brak statusu';
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$action = (string)($_GET['action'] ?? 'dashboard');

if ($action !== 'dashboard') {
    out_json([
        'ok' => false,
        'message' => 'Nieznana akcja.'
    ], 400);
}

try {
    $today = new DateTimeImmutable('today');
    $tomorrow = $today->modify('+1 day');

    $monthStart = $today->modify('first day of this month')->setTime(0, 0, 0);
    $nextMonthStart = $monthStart->modify('+1 month');

    $todayStartSql = $today->format('Y-m-d 00:00:00');
    $tomorrowStartSql = $tomorrow->format('Y-m-d 00:00:00');
    $monthStartSql = $monthStart->format('Y-m-d 00:00:00');
    $nextMonthStartSql = $nextMonthStart->format('Y-m-d 00:00:00');

    $stmt = $pdo->prepare("
        SELECT
            SUM(CASE WHEN client_id IS NOT NULL AND UPPER(COALESCE(visit_status, '')) <> 'FREE' THEN 1 ELSE 0 END) AS today_visits,
            SUM(CASE WHEN client_id IS NULL OR UPPER(COALESCE(visit_status, '')) = 'FREE' THEN 1 ELSE 0 END) AS today_free,
            SUM(CASE WHEN UPPER(COALESCE(visit_status, '')) = 'BOOKED' THEN 1 ELSE 0 END) AS today_booked,
            SUM(CASE WHEN UPPER(COALESCE(visit_status, '')) = 'CONFIRMED' THEN 1 ELSE 0 END) AS today_confirmed,
            SUM(CASE WHEN UPPER(COALESCE(visit_status, '')) = 'DONE' THEN 1 ELSE 0 END) AS today_done
        FROM dbo.visit
        WHERE start_datetime >= :today_start
          AND start_datetime < :tomorrow_start
    ");

    $stmt->execute([
        ':today_start' => $todayStartSql,
        ':tomorrow_start' => $tomorrowStartSql
    ]);

    $todayStats = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $todayVisits = (int)($todayStats['today_visits'] ?? 0);
    $todayFree = (int)($todayStats['today_free'] ?? 0);
    $todayBooked = (int)($todayStats['today_booked'] ?? 0);
    $todayConfirmed = (int)($todayStats['today_confirmed'] ?? 0);
    $todayDone = (int)($todayStats['today_done'] ?? 0);

    $clientsCount = 0;
    try {
        $clientsCount = (int)$pdo->query("SELECT COUNT(*) FROM dbo.client")->fetchColumn();
    } catch (Throwable $e) {
        $clientsCount = 0;
    }

    $employeesCount = 0;
    try {
        $employeesCount = (int)$pdo->query("
            SELECT COUNT(*)
            FROM dbo.employee
            WHERE COALESCE(is_active, 1) = 1
        ")->fetchColumn();
    } catch (Throwable $e) {
        $employeesCount = 0;
    }

    $servicesCount = 0;
    try {
        $servicesCount = (int)$pdo->query("
            SELECT COUNT(*)
            FROM dbo.service
            WHERE COALESCE(is_active, 1) = 1
        ")->fetchColumn();
    } catch (Throwable $e) {
        $servicesCount = 0;
    }

    $monthlyRevenue = 0.0;

    try {
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(CAST(amount AS decimal(18,2))), 0)
            FROM dbo.payment
            WHERE paid_at >= :month_start
              AND paid_at < :next_month_start
              AND (
                status IS NULL
                OR UPPER(status) IN ('PAID', 'ZAPLACONE', 'ZAPŁACONE', 'COMPLETED', 'DONE')
              )
        ");

        $stmt->execute([
            ':month_start' => $monthStartSql,
            ':next_month_start' => $nextMonthStartSql
        ]);

        $monthlyRevenue = (float)$stmt->fetchColumn();
    } catch (Throwable $e) {
        $monthlyRevenue = 0.0;
    }

    if ($monthlyRevenue <= 0) {
        try {
            $stmt = $pdo->prepare("
                SELECT COALESCE(SUM(CAST(total_price AS decimal(18,2))), 0)
                FROM dbo.visit
                WHERE start_datetime >= :month_start
                  AND start_datetime < :next_month_start
                  AND UPPER(COALESCE(visit_status, '')) IN ('DONE', 'ZREALIZOWANA')
            ");

            $stmt->execute([
                ':month_start' => $monthStartSql,
                ':next_month_start' => $nextMonthStartSql
            ]);

            $monthlyRevenue = (float)$stmt->fetchColumn();
        } catch (Throwable $e) {
            $monthlyRevenue = 0.0;
        }
    }

    $pendingPayments = 0;
    try {
        $pendingPayments = (int)$pdo->query("
            SELECT COUNT(*)
            FROM dbo.payment
            WHERE status IS NULL
               OR UPPER(status) NOT IN ('PAID', 'ZAPLACONE', 'ZAPŁACONE', 'COMPLETED', 'DONE')
        ")->fetchColumn();
    } catch (Throwable $e) {
        $pendingPayments = 0;
    }

    $nextVisit = null;

    $stmt = $pdo->prepare("
        SELECT TOP 1
            v.id,
            v.start_datetime,
            v.duration_min,
            v.visit_status,
            v.client_id,
            c.first_name AS client_first_name,
            c.last_name AS client_last_name,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name
        FROM dbo.visit v
        LEFT JOIN dbo.client c ON c.id = v.client_id
        LEFT JOIN dbo.employee e ON e.id = v.employee_id
        WHERE v.start_datetime >= GETDATE()
          AND v.client_id IS NOT NULL
          AND UPPER(COALESCE(v.visit_status, '')) <> 'FREE'
        ORDER BY v.start_datetime ASC
    ");

    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $kind = normalize_status((string)($row['visit_status'] ?? ''), $row['client_id'] ?? null);
        $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));
        $employeeName = trim((string)($row['employee_first_name'] ?? '') . ' ' . (string)($row['employee_last_name'] ?? ''));

        $nextVisit = [
            'id' => (int)$row['id'],
            'date' => pl_date($row['start_datetime']),
            'time' => pl_time($row['start_datetime']),
            'client_name' => $clientName !== '' ? $clientName : 'Klient #' . (int)$row['client_id'],
            'employee_name' => $employeeName !== '' ? $employeeName : '-',
            'status' => status_label($kind, (string)($row['visit_status'] ?? '')),
            'status_kind' => $kind
        ];
    }

    $stmt = $pdo->prepare("
        SELECT TOP 8
            v.id,
            v.start_datetime,
            v.duration_min,
            v.visit_status,
            v.client_id,
            c.first_name AS client_first_name,
            c.last_name AS client_last_name,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name
        FROM dbo.visit v
        LEFT JOIN dbo.client c ON c.id = v.client_id
        LEFT JOIN dbo.employee e ON e.id = v.employee_id
        WHERE v.start_datetime >= :today_start
          AND v.start_datetime < :tomorrow_start
        ORDER BY v.start_datetime ASC
    ");

    $stmt->execute([
        ':today_start' => $todayStartSql,
        ':tomorrow_start' => $tomorrowStartSql
    ]);

    $schedule = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $kind = normalize_status((string)($row['visit_status'] ?? ''), $row['client_id'] ?? null);

        $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));
        $employeeName = trim((string)($row['employee_first_name'] ?? '') . ' ' . (string)($row['employee_last_name'] ?? ''));

        $schedule[] = [
            'id' => (int)$row['id'],
            'time' => pl_time($row['start_datetime']),
            'duration_min' => (int)($row['duration_min'] ?? 30),
            'client_name' => $clientName !== '' ? $clientName : ($kind === 'free' ? 'Wolny termin' : 'Klient #' . (int)$row['client_id']),
            'employee_name' => $employeeName !== '' ? $employeeName : '-',
            'status' => status_label($kind, (string)($row['visit_status'] ?? '')),
            'status_kind' => $kind
        ];
    }

    $stmt = $pdo->prepare("
        SELECT
            e.id,
            e.first_name,
            e.last_name,
            MIN(v.start_datetime) AS first_slot,
            MAX(DATEADD(minute, COALESCE(v.duration_min, 30), v.start_datetime)) AS last_slot,
            SUM(CASE WHEN v.client_id IS NOT NULL AND UPPER(COALESCE(v.visit_status, '')) <> 'FREE' THEN 1 ELSE 0 END) AS visits_count,
            SUM(CASE WHEN v.client_id IS NULL OR UPPER(COALESCE(v.visit_status, '')) = 'FREE' THEN 1 ELSE 0 END) AS free_count
        FROM dbo.employee e
        LEFT JOIN dbo.visit v
          ON v.employee_id = e.id
         AND v.start_datetime >= :today_start
         AND v.start_datetime < :tomorrow_start
        WHERE COALESCE(e.is_active, 1) = 1
        GROUP BY e.id, e.first_name, e.last_name
        ORDER BY e.last_name ASC, e.first_name ASC
    ");

    $stmt->execute([
        ':today_start' => $todayStartSql,
        ':tomorrow_start' => $tomorrowStartSql
    ]);

    $employeesToday = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $firstSlot = dt_value($row['first_slot'] ?? '');
        $lastSlot = dt_value($row['last_slot'] ?? '');

        $employeesToday[] = [
            'id' => (int)$row['id'],
            'name' => trim((string)$row['first_name'] . ' ' . (string)$row['last_name']),
            'work_time' => $firstSlot !== '' && $lastSlot !== ''
                ? pl_time($firstSlot) . ' - ' . pl_time($lastSlot)
                : 'Brak grafiku',
            'visits_count' => (int)($row['visits_count'] ?? 0),
            'free_count' => (int)($row['free_count'] ?? 0)
        ];
    }

    $info = [];

    if ($todayBooked > 0) {
        $info[] = [
            'type' => 'warning',
            'title' => 'Wizyty bez potwierdzenia',
            'text' => $todayBooked . ' wizyt ma status „Umówiona”.'
        ];
    }

    if ($pendingPayments > 0) {
        $info[] = [
            'type' => 'warning',
            'title' => 'Płatności do sprawdzenia',
            'text' => $pendingPayments . ' płatności oczekuje na rozliczenie.'
        ];
    }

    if ($todayFree <= 2) {
        $info[] = [
            'type' => 'info',
            'title' => 'Mało wolnych terminów',
            'text' => 'Na dziś zostało tylko ' . $todayFree . ' wolnych terminów.'
        ];
    }

    $info[] = [
        'type' => 'ok',
        'title' => 'Aktywni pracownicy',
        'text' => 'W systemie aktywnych jest ' . $employeesCount . ' pracowników.'
    ];

    $info[] = [
        'type' => 'ok',
        'title' => 'Aktywne usługi',
        'text' => 'W cenniku aktywnych jest ' . $servicesCount . ' usług.'
    ];

    out_json([
        'ok' => true,
        'generated_at' => date('Y-m-d H:i:s'),
        'today_label' => $today->format('d.m.Y'),
        'stats' => [
            'today_visits' => $todayVisits,
            'today_free' => $todayFree,
            'today_booked' => $todayBooked,
            'today_confirmed' => $todayConfirmed,
            'today_done' => $todayDone,
            'clients_count' => $clientsCount,
            'employees_count' => $employeesCount,
            'services_count' => $servicesCount,
            'monthly_revenue' => $monthlyRevenue,
            'monthly_revenue_label' => money_pl($monthlyRevenue),
            'pending_payments' => $pendingPayments
        ],
        'next_visit' => $nextVisit,
        'schedule' => $schedule,
        'employees_today' => $employeesToday,
        'info' => $info
    ]);
} catch (Throwable $e) {
    error_log('[admin_panel_glowny.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania danych panelu administratora.'
    ], 500);
}