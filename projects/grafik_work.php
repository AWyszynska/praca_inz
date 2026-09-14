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

function get_employee_id(): ?int {
    $employeeId = $_SESSION['employee_id'] ?? null;

    if (!$employeeId && ($_SESSION['user_type'] ?? '') === 'employee') {
        $employeeId = $_SESSION['user_id'] ?? null;
    }

    return $employeeId ? (int)$employeeId : null;
}

function dt_value($value): string {
    if ($value instanceof DateTimeInterface) {
        return $value->format('Y-m-d H:i:s');
    }

    return trim((string)$value);
}

function pl_date(DateTimeInterface $dt): string {
    return $dt->format('d.m.Y');
}

function pl_time(DateTimeInterface $dt): string {
    return $dt->format('H:i');
}

function day_label_pl(int $index): string {
    $days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
    return $days[$index] ?? '';
}

function normalize_status(string $status, $clientId): string {
    $s = strtoupper(trim($status));

    if (in_array($s, ['FREE', 'WOLNA', 'WOLNY'], true)) return 'free';
    if (in_array($s, ['CONFIRMED', 'POTWIERDZONA', 'POTWIERDZONE'], true)) return 'confirmed';
    if (in_array($s, ['BOOKED', 'UMOWIONA', 'UMÓWIONA'], true)) return 'booked';
    if (in_array($s, ['IN_PROGRESS', 'W_TRAKCIE'], true)) return 'in_progress';
    if (in_array($s, ['DONE', 'ZREALIZOWANA', 'ZAKONCZONA', 'ZAKOŃCZONA'], true)) return 'done';
    if (in_array($s, ['CANCELLED', 'CANCELED', 'ANULOWANA', 'NOT_DONE', 'NIEZREALIZOWANA'], true)) return 'cancelled';

    return $clientId ? 'booked' : 'free';
}

function status_label(string $kind, string $rawStatus): string {
    if ($kind === 'free') return 'Wolne';
    if ($kind === 'confirmed') return 'Potwierdzona';
    if ($kind === 'booked') return 'Umówiona';
    if ($kind === 'in_progress') return 'W trakcie';
    if ($kind === 'done') return 'Zrealizowana';
    if ($kind === 'cancelled') return 'Niezrealizowana';

    return $rawStatus !== '' ? $rawStatus : 'Brak statusu';
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$employeeId = get_employee_id();

if (!$employeeId) {
    out_json([
        'ok' => false,
        'message' => 'Brak zalogowanego pracownika.',
        'redirect' => 'final_view.php?file=login.xml'
    ], 401);
}

$action = (string)($_GET['action'] ?? 'week');

try {
    if ($action !== 'week') {
        out_json([
            'ok' => false,
            'message' => 'Nieznana akcja.'
        ], 400);
    }

    $rawWeekStart = trim((string)($_GET['week_start'] ?? ''));

    if ($rawWeekStart !== '') {
        $baseDate = new DateTimeImmutable($rawWeekStart);
    } else {
        $baseDate = new DateTimeImmutable('today');
    }

    $weekStart = $baseDate->modify('monday this week')->setTime(0, 0, 0);
    $weekEnd = $weekStart->modify('+7 days');

    $days = [];
    $statsByDate = [];

    for ($i = 0; $i < 7; $i++) {
        $day = $weekStart->modify("+{$i} days");
        $dateIso = $day->format('Y-m-d');

        $days[] = [
            'date_iso' => $dateIso,
            'date_pl' => pl_date($day),
            'label' => day_label_pl($i),
            'is_today' => $dateIso === (new DateTimeImmutable('today'))->format('Y-m-d')
        ];

        $statsByDate[$dateIso] = [
            'work_min' => 0,
            'free_min' => 0,
            'booked_min' => 0,
            'confirmed_min' => 0,
            'not_confirmed_min' => 0,
            'done_min' => 0,
            'cancelled_min' => 0,
            'visits_count' => 0,
            'free_count' => 0
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
            v.total_price,
            v.visit_status,
            v.notes,

            c.first_name AS client_first_name,
            c.last_name AS client_last_name,
            c.email AS client_email,
            c.phone AS client_phone
        FROM dbo.visit v
        LEFT JOIN dbo.client c ON c.id = v.client_id
        WHERE v.employee_id = :employee_id
          AND v.start_datetime >= :week_start
          AND v.start_datetime < :week_end
        ORDER BY v.start_datetime ASC
    ");

    $stmt->execute([
        ':employee_id' => $employeeId,
        ':week_start' => $weekStart->format('Y-m-d H:i:s'),
        ':week_end' => $weekEnd->format('Y-m-d H:i:s')
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $slots = [];

    foreach ($rows as $row) {
        $startRaw = dt_value($row['start_datetime'] ?? '');
        if ($startRaw === '') continue;

        try {
            $start = new DateTimeImmutable($startRaw);
        } catch (Throwable $e) {
            continue;
        }

        $duration = (int)($row['duration_min'] ?? 30);
        if ($duration <= 0) $duration = 30;

        $end = $start->modify("+{$duration} minutes");

        $dateIso = $start->format('Y-m-d');
        if (!isset($statsByDate[$dateIso])) continue;

        $rawStatus = (string)($row['visit_status'] ?? '');
        $kind = normalize_status($rawStatus, $row['client_id'] ?? null);

        $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));

        if ($clientName === '') {
            $clientName = $row['client_id'] !== null ? 'Klient #' . $row['client_id'] : '';
        }

        $isWorkingSlot = $kind !== 'cancelled';

        if ($isWorkingSlot) {
            $statsByDate[$dateIso]['work_min'] += $duration;
        }

        if ($kind === 'free') {
            $statsByDate[$dateIso]['free_min'] += $duration;
            $statsByDate[$dateIso]['free_count']++;
        } else {
            if ($kind !== 'cancelled') {
                $statsByDate[$dateIso]['booked_min'] += $duration;
                $statsByDate[$dateIso]['visits_count']++;
            }

            if ($kind === 'confirmed') {
                $statsByDate[$dateIso]['confirmed_min'] += $duration;
            } elseif ($kind === 'booked') {
                $statsByDate[$dateIso]['not_confirmed_min'] += $duration;
            } elseif ($kind === 'done') {
                $statsByDate[$dateIso]['done_min'] += $duration;
            } elseif ($kind === 'cancelled') {
                $statsByDate[$dateIso]['cancelled_min'] += $duration;
            }
        }

        $startMin = ((int)$start->format('H')) * 60 + (int)$start->format('i');

        $slots[] = [
            'id' => (int)$row['id'],
            'date_iso' => $dateIso,
            'date_pl' => pl_date($start),
            'start_time' => pl_time($start),
            'end_time' => pl_time($end),
            'start_minutes' => $startMin,
            'duration_min' => $duration,
            'status' => $rawStatus,
            'status_kind' => $kind,
            'status_label' => status_label($kind, $rawStatus),
            'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
            'client_name' => $clientName,
            'client_phone' => (string)($row['client_phone'] ?? ''),
            'client_email' => (string)($row['client_email'] ?? ''),
            'pet_id' => $row['pet_id'] !== null ? (int)$row['pet_id'] : null,
            'total_price' => $row['total_price'] !== null ? (float)$row['total_price'] : 0,
            'notes' => (string)($row['notes'] ?? '')
        ];
    }

    $total = [
        'work_min' => 0,
        'free_min' => 0,
        'booked_min' => 0,
        'confirmed_min' => 0,
        'not_confirmed_min' => 0,
        'done_min' => 0,
        'cancelled_min' => 0,
        'visits_count' => 0,
        'free_count' => 0
    ];

    foreach ($statsByDate as $dayStats) {
        foreach ($total as $key => $_) {
            $total[$key] += (int)($dayStats[$key] ?? 0);
        }
    }

    $dayStatsOut = [];

    foreach ($statsByDate as $dateIso => $stats) {
        $dayStatsOut[] = [
            'date_iso' => $dateIso,
            'work_min' => $stats['work_min'],
            'free_min' => $stats['free_min'],
            'booked_min' => $stats['booked_min'],
            'confirmed_min' => $stats['confirmed_min'],
            'not_confirmed_min' => $stats['not_confirmed_min'],
            'done_min' => $stats['done_min'],
            'cancelled_min' => $stats['cancelled_min'],
            'visits_count' => $stats['visits_count'],
            'free_count' => $stats['free_count']
        ];
    }

    out_json([
        'ok' => true,
        'employee_id' => $employeeId,
        'week_start' => $weekStart->format('Y-m-d'),
        'week_end' => $weekEnd->modify('-1 day')->format('Y-m-d'),
        'week_label' => pl_date($weekStart) . ' - ' . pl_date($weekEnd->modify('-1 day')),
        'days' => $days,
        'slots' => $slots,
        'stats_by_day' => $dayStatsOut,
        'stats' => $total
    ]);
} catch (Throwable $e) {
    error_log('[grafik_work.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania grafiku pracy.'
    ], 500);
}