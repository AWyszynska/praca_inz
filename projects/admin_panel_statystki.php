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

function valid_date_or_default($value, string $default): string {
    $value = trim((string)$value);

    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return $value;
    }

    return $default;
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

function fmt_date_pl($value): string {
    $raw = dt_value($value);

    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('d.m.Y');
    } catch (Throwable $e) {
        return $raw;
    }
}

function money_pl($value): string {
    return number_format((float)$value, 2, ',', ' ') . ' zł';
}

function int_value($value): int {
    return (int)($value ?? 0);
}

function float_value($value): float {
    return (float)($value ?? 0);
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$action = (string)($_GET['action'] ?? 'data');

$today = new DateTime();
$defaultFrom = (new DateTime('first day of this month'))->format('Y-m-d');
$defaultTo = $today->format('Y-m-d');

$dateFrom = valid_date_or_default($_GET['date_from'] ?? '', $defaultFrom);
$dateTo = valid_date_or_default($_GET['date_to'] ?? '', $defaultTo);

if ($dateFrom > $dateTo) {
    [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
}

$dateToExclusive = (new DateTime($dateTo))->modify('+1 day')->format('Y-m-d');

try {
    if ($action !== 'data') {
        out_json([
            'ok' => false,
            'message' => 'Nieznana akcja.'
        ], 400);
    }

    /*
      Główne statystyki wizyt.
    */
    $stmt = $pdo->prepare("
        SELECT
            COUNT(v.id) AS total_slots,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('FREE', 'WOLNA', 'WOLNY')
                THEN 1 ELSE 0 END), 0) AS free_count,

            COALESCE(SUM(CASE
                WHEN v.client_id IS NOT NULL
                 AND UPPER(COALESCE(v.visit_status, '')) NOT IN ('FREE', 'WOLNA', 'WOLNY', 'CANCELLED', 'CANCELED', 'ANULOWANA')
                THEN 1 ELSE 0 END), 0) AS booked_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE')
                THEN 1 ELSE 0 END), 0) AS confirmed_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('BOOKED', 'UMOWIONA', N'UMÓWIONA')
                THEN 1 ELSE 0 END), 0) AS only_booked_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('DONE', 'ZREALIZOWANA', 'ZAKONCZONA', N'ZAKOŃCZONA')
                THEN 1 ELSE 0 END), 0) AS done_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('CANCELLED', 'CANCELED', 'ANULOWANA', 'NOT_DONE', 'NIEZREALIZOWANA')
                THEN 1 ELSE 0 END), 0) AS cancelled_count,

            COALESCE(SUM(CASE
                WHEN v.client_id IS NOT NULL
                 AND UPPER(COALESCE(v.visit_status, '')) NOT IN (
                    'FREE', 'WOLNA', 'WOLNY',
                    'CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE',
                    'DONE', 'ZREALIZOWANA', 'ZAKONCZONA', N'ZAKOŃCZONA',
                    'CANCELLED', 'CANCELED', 'ANULOWANA', 'NOT_DONE', 'NIEZREALIZOWANA'
                 )
                THEN 1 ELSE 0 END), 0) AS unconfirmed_count,

            COALESCE(SUM(COALESCE(v.total_price, 0)), 0) AS planned_revenue
        FROM dbo.visit v
        WHERE v.start_datetime >= :date_from
          AND v.start_datetime < :date_to
    ");

    $stmt->execute([
        ':date_from' => $dateFrom,
        ':date_to' => $dateToExclusive
    ]);

    $main = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    /*
      Płatności / przychód.
    */
    $stmt = $pdo->prepare("
        SELECT
            COUNT(p.id) AS payments_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(p.status, '')) IN ('PAID', 'ZAPLACONE', N'ZAPŁACONE', 'DONE', 'COMPLETED')
                THEN p.amount ELSE 0 END), 0) AS paid_revenue,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(p.status, '')) IN ('PENDING', 'OCZEKUJE', 'UNPAID')
                THEN p.amount ELSE 0 END), 0) AS pending_revenue,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(p.status, '')) IN ('CANCELLED', 'ANULOWANE', 'REFUNDED')
                THEN p.amount ELSE 0 END), 0) AS cancelled_revenue
        FROM dbo.payment p
        WHERE p.paid_at >= :date_from
          AND p.paid_at < :date_to
    ");

    $stmt->execute([
        ':date_from' => $dateFrom,
        ':date_to' => $dateToExclusive
    ]);

    $payments = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $stats = [
        'total_slots' => int_value($main['total_slots'] ?? 0),
        'free_count' => int_value($main['free_count'] ?? 0),
        'booked_count' => int_value($main['booked_count'] ?? 0),
        'confirmed_count' => int_value($main['confirmed_count'] ?? 0),
        'only_booked_count' => int_value($main['only_booked_count'] ?? 0),
        'done_count' => int_value($main['done_count'] ?? 0),
        'cancelled_count' => int_value($main['cancelled_count'] ?? 0),
        'unconfirmed_count' => int_value($main['unconfirmed_count'] ?? 0),

        'planned_revenue' => float_value($main['planned_revenue'] ?? 0),
        'planned_revenue_label' => money_pl($main['planned_revenue'] ?? 0),

        'payments_count' => int_value($payments['payments_count'] ?? 0),
        'paid_revenue' => float_value($payments['paid_revenue'] ?? 0),
        'paid_revenue_label' => money_pl($payments['paid_revenue'] ?? 0),
        'pending_revenue' => float_value($payments['pending_revenue'] ?? 0),
        'pending_revenue_label' => money_pl($payments['pending_revenue'] ?? 0),
        'cancelled_revenue' => float_value($payments['cancelled_revenue'] ?? 0),
        'cancelled_revenue_label' => money_pl($payments['cancelled_revenue'] ?? 0),
    ];

    /*
      Statystyki pracy lekarzy.
    */
    $stmt = $pdo->prepare("
        SELECT
            e.id,
            e.first_name,
            e.last_name,
            e.role,
            e.email,
            e.phone,

            COUNT(v.id) AS total_slots,

            COALESCE(SUM(CASE
                WHEN v.client_id IS NOT NULL
                 AND UPPER(COALESCE(v.visit_status, '')) NOT IN ('FREE', 'WOLNA', 'WOLNY', 'CANCELLED', 'CANCELED', 'ANULOWANA')
                THEN 1 ELSE 0 END), 0) AS visits_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('FREE', 'WOLNA', 'WOLNY')
                THEN 1 ELSE 0 END), 0) AS free_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE')
                THEN 1 ELSE 0 END), 0) AS confirmed_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('BOOKED', 'UMOWIONA', N'UMÓWIONA')
                THEN 1 ELSE 0 END), 0) AS booked_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('DONE', 'ZREALIZOWANA', 'ZAKONCZONA', N'ZAKOŃCZONA')
                THEN 1 ELSE 0 END), 0) AS done_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('CANCELLED', 'CANCELED', 'ANULOWANA', 'NOT_DONE', 'NIEZREALIZOWANA')
                THEN 1 ELSE 0 END), 0) AS cancelled_count,

            COALESCE(SUM(CASE
                WHEN v.client_id IS NOT NULL
                 AND UPPER(COALESCE(v.visit_status, '')) NOT IN (
                    'FREE', 'WOLNA', 'WOLNY',
                    'CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE',
                    'DONE', 'ZREALIZOWANA', 'ZAKONCZONA', N'ZAKOŃCZONA',
                    'CANCELLED', 'CANCELED', 'ANULOWANA', 'NOT_DONE', 'NIEZREALIZOWANA'
                 )
                THEN 1 ELSE 0 END), 0) AS unconfirmed_count,

            COALESCE(SUM(COALESCE(v.total_price, 0)), 0) AS planned_revenue,

            COALESCE(SUM(COALESCE(v.duration_min, 0)), 0) AS work_minutes
        FROM dbo.employee e
        LEFT JOIN dbo.visit v
          ON v.employee_id = e.id
         AND v.start_datetime >= :date_from
         AND v.start_datetime < :date_to
        GROUP BY
            e.id,
            e.first_name,
            e.last_name,
            e.role,
            e.email,
            e.phone
        ORDER BY visits_count DESC, planned_revenue DESC, e.last_name ASC
    ");

    $stmt->execute([
        ':date_from' => $dateFrom,
        ':date_to' => $dateToExclusive
    ]);

    $employees = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $employeeId = (int)$row['id'];

        $name = trim((string)($row['first_name'] ?? '') . ' ' . (string)($row['last_name'] ?? ''));

        $employees[$employeeId] = [
            'id' => $employeeId,
            'name' => $name !== '' ? $name : 'Pracownik #' . $employeeId,
            'role' => (string)($row['role'] ?? ''),
            'email' => (string)($row['email'] ?? ''),
            'phone' => (string)($row['phone'] ?? ''),

            'total_slots' => int_value($row['total_slots'] ?? 0),
            'visits_count' => int_value($row['visits_count'] ?? 0),
            'free_count' => int_value($row['free_count'] ?? 0),
            'confirmed_count' => int_value($row['confirmed_count'] ?? 0),
            'booked_count' => int_value($row['booked_count'] ?? 0),
            'done_count' => int_value($row['done_count'] ?? 0),
            'cancelled_count' => int_value($row['cancelled_count'] ?? 0),
            'unconfirmed_count' => int_value($row['unconfirmed_count'] ?? 0),

            'planned_revenue' => float_value($row['planned_revenue'] ?? 0),
            'planned_revenue_label' => money_pl($row['planned_revenue'] ?? 0),

            'paid_revenue' => 0,
            'paid_revenue_label' => money_pl(0),

            'payments_count' => 0,

            'work_minutes' => int_value($row['work_minutes'] ?? 0),
            'work_hours_label' => floor(int_value($row['work_minutes'] ?? 0) / 60) . 'h ' . (int_value($row['work_minutes'] ?? 0) % 60) . 'min',
        ];
    }

    $stmt = $pdo->prepare("
        SELECT
            v.employee_id,
            COUNT(p.id) AS payments_count,
            COALESCE(SUM(p.amount), 0) AS paid_revenue
        FROM dbo.payment p
        INNER JOIN dbo.visit v ON v.id = p.visit_id
        WHERE p.paid_at >= :date_from
          AND p.paid_at < :date_to
          AND UPPER(COALESCE(p.status, '')) IN ('PAID', 'ZAPLACONE', N'ZAPŁACONE', 'DONE', 'COMPLETED')
        GROUP BY v.employee_id
    ");

    $stmt->execute([
        ':date_from' => $dateFrom,
        ':date_to' => $dateToExclusive
    ]);

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $employeeId = (int)($row['employee_id'] ?? 0);

        if ($employeeId > 0 && isset($employees[$employeeId])) {
            $employees[$employeeId]['payments_count'] = int_value($row['payments_count'] ?? 0);
            $employees[$employeeId]['paid_revenue'] = float_value($row['paid_revenue'] ?? 0);
            $employees[$employeeId]['paid_revenue_label'] = money_pl($row['paid_revenue'] ?? 0);
        }
    }

    /*
      Wykres dzienny.
    */
    $stmt = $pdo->prepare("
        SELECT
            CAST(v.start_datetime AS date) AS day_date,

            COUNT(v.id) AS total_slots,

            COALESCE(SUM(CASE
                WHEN v.client_id IS NOT NULL
                 AND UPPER(COALESCE(v.visit_status, '')) NOT IN ('FREE', 'WOLNA', 'WOLNY', 'CANCELLED', 'CANCELED', 'ANULOWANA')
                THEN 1 ELSE 0 END), 0) AS booked_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('FREE', 'WOLNA', 'WOLNY')
                THEN 1 ELSE 0 END), 0) AS free_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE')
                THEN 1 ELSE 0 END), 0) AS confirmed_count,

            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(v.visit_status, '')) IN ('DONE', 'ZREALIZOWANA', 'ZAKONCZONA', N'ZAKOŃCZONA')
                THEN 1 ELSE 0 END), 0) AS done_count,

            COALESCE(SUM(CASE
                WHEN v.client_id IS NOT NULL
                 AND UPPER(COALESCE(v.visit_status, '')) NOT IN (
                    'FREE', 'WOLNA', 'WOLNY',
                    'CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE',
                    'DONE', 'ZREALIZOWANA', 'ZAKONCZONA', N'ZAKOŃCZONA',
                    'CANCELLED', 'CANCELED', 'ANULOWANA', 'NOT_DONE', 'NIEZREALIZOWANA'
                 )
                THEN 1 ELSE 0 END), 0) AS unconfirmed_count
        FROM dbo.visit v
        WHERE v.start_datetime >= :date_from
          AND v.start_datetime < :date_to
        GROUP BY CAST(v.start_datetime AS date)
        ORDER BY CAST(v.start_datetime AS date) ASC
    ");

    $stmt->execute([
        ':date_from' => $dateFrom,
        ':date_to' => $dateToExclusive
    ]);

    $dailyMap = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $key = fmt_date($row['day_date'] ?? '');

        $dailyMap[$key] = [
            'date' => $key,
            'date_label' => fmt_date_pl($key),
            'total_slots' => int_value($row['total_slots'] ?? 0),
            'booked_count' => int_value($row['booked_count'] ?? 0),
            'free_count' => int_value($row['free_count'] ?? 0),
            'confirmed_count' => int_value($row['confirmed_count'] ?? 0),
            'done_count' => int_value($row['done_count'] ?? 0),
            'unconfirmed_count' => int_value($row['unconfirmed_count'] ?? 0),
        ];
    }

    $daily = [];
    $period = new DatePeriod(
        new DateTime($dateFrom),
        new DateInterval('P1D'),
        new DateTime($dateToExclusive)
    );

    foreach ($period as $day) {
        $key = $day->format('Y-m-d');

        $daily[] = $dailyMap[$key] ?? [
            'date' => $key,
            'date_label' => $day->format('d.m.Y'),
            'total_slots' => 0,
            'booked_count' => 0,
            'free_count' => 0,
            'confirmed_count' => 0,
            'done_count' => 0,
            'unconfirmed_count' => 0,
        ];
    }

    /*
      Metody płatności.
    */
    $stmt = $pdo->prepare("
        SELECT
            COALESCE(NULLIF(p.method, ''), 'BRAK') AS method,
            COUNT(p.id) AS payments_count,
            COALESCE(SUM(p.amount), 0) AS amount
        FROM dbo.payment p
        WHERE p.paid_at >= :date_from
          AND p.paid_at < :date_to
        GROUP BY COALESCE(NULLIF(p.method, ''), 'BRAK')
        ORDER BY amount DESC
    ");

    $stmt->execute([
        ':date_from' => $dateFrom,
        ':date_to' => $dateToExclusive
    ]);

    $methods = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $methods[] = [
            'method' => (string)($row['method'] ?? ''),
            'payments_count' => int_value($row['payments_count'] ?? 0),
            'amount' => float_value($row['amount'] ?? 0),
            'amount_label' => money_pl($row['amount'] ?? 0),
        ];
    }

    /*
      Najlepsi klienci według liczby wizyt.
    */
    $stmt = $pdo->prepare("
        SELECT TOP 10
            c.id,
            c.first_name,
            c.last_name,
            c.email,
            c.phone,

            COUNT(DISTINCT v.id) AS visits_count,
            COALESCE(SUM(CASE
                WHEN UPPER(COALESCE(p.status, '')) IN ('PAID', 'ZAPLACONE', N'ZAPŁACONE', 'DONE', 'COMPLETED')
                THEN p.amount ELSE 0 END), 0) AS paid_revenue
        FROM dbo.client c
        INNER JOIN dbo.visit v ON v.client_id = c.id
        LEFT JOIN dbo.payment p ON p.visit_id = v.id
        WHERE v.start_datetime >= :date_from
          AND v.start_datetime < :date_to
        GROUP BY
            c.id,
            c.first_name,
            c.last_name,
            c.email,
            c.phone
        ORDER BY visits_count DESC, paid_revenue DESC
    ");

    $stmt->execute([
        ':date_from' => $dateFrom,
        ':date_to' => $dateToExclusive
    ]);

    $topClients = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $name = trim((string)($row['first_name'] ?? '') . ' ' . (string)($row['last_name'] ?? ''));

        $topClients[] = [
            'id' => (int)$row['id'],
            'name' => $name !== '' ? $name : 'Klient #' . (int)$row['id'],
            'email' => (string)($row['email'] ?? ''),
            'phone' => (string)($row['phone'] ?? ''),
            'visits_count' => int_value($row['visits_count'] ?? 0),
            'paid_revenue' => float_value($row['paid_revenue'] ?? 0),
            'paid_revenue_label' => money_pl($row['paid_revenue'] ?? 0),
        ];
    }

    /*
      Statystyki usług. Jeśli tabela visit_service ma inne kolumny albo jest pusta,
      strona nadal działa — zwróci pustą listę.
    */
    $services = [];

    try {
        $stmt = $pdo->prepare("
            SELECT TOP 20
                s.id,
                s.name,
                s.price,
                s.default_duration_min,
                COUNT(vs.visit_id) AS used_count,
                COALESCE(SUM(COALESCE(s.price, 0)), 0) AS services_value
            FROM dbo.service s
            LEFT JOIN dbo.visit_service vs ON vs.service_id = s.id
            LEFT JOIN dbo.visit v
              ON v.id = vs.visit_id
             AND v.start_datetime >= :date_from
             AND v.start_datetime < :date_to
            GROUP BY
                s.id,
                s.name,
                s.price,
                s.default_duration_min
            ORDER BY used_count DESC, services_value DESC, s.name ASC
        ");

        $stmt->execute([
            ':date_from' => $dateFrom,
            ':date_to' => $dateToExclusive
        ]);

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $services[] = [
                'id' => (int)$row['id'],
                'name' => (string)($row['name'] ?? ''),
                'price' => float_value($row['price'] ?? 0),
                'price_label' => money_pl($row['price'] ?? 0),
                'duration_min' => int_value($row['default_duration_min'] ?? 0),
                'used_count' => int_value($row['used_count'] ?? 0),
                'services_value' => float_value($row['services_value'] ?? 0),
                'services_value_label' => money_pl($row['services_value'] ?? 0),
            ];
        }
    } catch (Throwable $e) {
        error_log('[admin_panel_statystki.php services] ' . $e->getMessage());
        $services = [];
    }

    out_json([
        'ok' => true,
        'range' => [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'date_from_label' => fmt_date_pl($dateFrom),
            'date_to_label' => fmt_date_pl($dateTo),
        ],
        'stats' => $stats,
        'employees' => array_values($employees),
        'daily' => $daily,
        'methods' => $methods,
        'top_clients' => $topClients,
        'services' => $services,
    ]);
} catch (Throwable $e) {
    error_log('[admin_panel_statystki.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania statystyk.'
    ], 500);
}