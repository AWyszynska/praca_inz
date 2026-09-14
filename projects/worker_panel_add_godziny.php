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

function get_employee_id(): int {
    $employeeId = $_SESSION['employee_id'] ?? null;

    if (!$employeeId && ($_SESSION['user_type'] ?? '') === 'employee') {
        $employeeId = $_SESSION['user_id'] ?? null;
    }

    return (int)($employeeId ?: 0);
}

function load_services(PDO $pdo): array {
    $stmt = $pdo->query("
        SELECT id, name, description, price, default_duration_min
        FROM dbo.service
        WHERE is_active = 1
        ORDER BY name ASC
    ");

    $services = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $services[(int)$row['id']] = [
            'id' => (int)$row['id'],
            'name' => (string)$row['name'],
            'description' => (string)($row['description'] ?? ''),
            'price' => $row['price'] !== null ? (float)$row['price'] : 0,
            'duration_min' => $row['default_duration_min'] !== null ? (int)$row['default_duration_min'] : 30,
        ];
    }

    return $services;
}

function has_overlap(PDO $pdo, int $employeeId, string $startDt, int $durationMin, int $excludeId = 0): bool {
    $start = new DateTime($startDt);
    $end = (clone $start)->modify('+' . $durationMin . ' minutes')->format('Y-m-d H:i:s');

    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM dbo.visit
        WHERE employee_id = :employee_id
          AND id <> :exclude_id
          AND UPPER(COALESCE(visit_status, '')) NOT IN ('CANCELLED', 'CANCELED', 'ANULOWANA')
          AND start_datetime < :end_dt
          AND DATEADD(minute, COALESCE(duration_min, 30), start_datetime) > :start_dt
    ");

    $stmt->execute([
        ':employee_id' => $employeeId,
        ':exclude_id' => $excludeId,
        ':start_dt' => $startDt,
        ':end_dt' => $end,
    ]);

    return ((int)$stmt->fetchColumn()) > 0;
}

function attach_service(PDO $pdo, int $visitId, int $serviceId): void {
    try {
        $pdo->prepare("DELETE FROM dbo.visit_service WHERE visit_id = :visit_id")
            ->execute([':visit_id' => $visitId]);

        if ($serviceId > 0) {
            $pdo->prepare("
                INSERT INTO dbo.visit_service (visit_id, service_id)
                VALUES (:visit_id, :service_id)
            ")->execute([
                ':visit_id' => $visitId,
                ':service_id' => $serviceId,
            ]);
        }
    } catch (Throwable $e) {
        error_log('[worker_panel_add_godziny attach_service] ' . $e->getMessage());
    }
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$employeeId = get_employee_id();

if ($employeeId <= 0) {
    out_json([
        'ok' => false,
        'message' => 'Brak zalogowanego lekarza.',
        'redirect' => 'final_view.php?file=login.xml'
    ], 401);
}

$body = get_body();
$action = (string)($body['action'] ?? $_GET['action'] ?? 'data');

try {
    $services = load_services($pdo);

    if ($action === 'data') {
        $weekStart = trim((string)($_GET['week_start'] ?? date('Y-m-d')));

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $weekStart)) {
            $weekStart = date('Y-m-d');
        }

        $start = new DateTime($weekStart);
        $end = (clone $start)->modify('+7 days')->format('Y-m-d');

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
                vs.service_id,
                s.name AS service_name
            FROM dbo.visit v
            LEFT JOIN dbo.visit_service vs ON vs.visit_id = v.id
            LEFT JOIN dbo.service s ON s.id = vs.service_id
            WHERE v.employee_id = :employee_id
              AND v.start_datetime >= :start_date
              AND v.start_datetime < :end_date
            ORDER BY v.start_datetime ASC
        ");

        $stmt->execute([
            ':employee_id' => $employeeId,
            ':start_date' => $start->format('Y-m-d'),
            ':end_date' => $end,
        ]);

        $slots = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $slots[] = [
                'id' => (int)$row['id'],
                'date' => fmt_date($row['start_datetime']),
                'time' => fmt_time($row['start_datetime']),
                'duration_min' => $row['duration_min'] !== null ? (int)$row['duration_min'] : 30,
                'status' => (string)($row['visit_status'] ?? ''),
                'notes' => (string)($row['notes'] ?? ''),
                'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
                'service_id' => $row['service_id'] !== null ? (int)$row['service_id'] : null,
                'service_name' => (string)($row['service_name'] ?? ''),
                'price' => $row['total_price'] !== null ? (float)$row['total_price'] : 0,
            ];
        }

        out_json([
            'ok' => true,
            'services' => array_values($services),
            'slots' => $slots,
        ]);
    }

    if ($action === 'generate') {
        $dateFrom = trim((string)($body['date_from'] ?? ''));
        $dateTo = trim((string)($body['date_to'] ?? ''));
        $startTime = trim((string)($body['start_time'] ?? ''));
        $endTime = trim((string)($body['end_time'] ?? ''));
        $breakMin = max(0, min(180, (int)($body['break_min'] ?? 0)));
        $customDuration = max(5, min(240, (int)($body['custom_duration_min'] ?? 30)));
        $note = trim((string)($body['notes'] ?? ''));

        $serviceIds = $body['service_ids'] ?? [];
        if (!is_array($serviceIds)) $serviceIds = [];

        $serviceIds = array_values(array_filter(array_map('intval', $serviceIds), function ($id) use ($services) {
            return $id > 0 && isset($services[$id]);
        }));

        $weekdays = $body['weekdays'] ?? [];
        if (!is_array($weekdays)) $weekdays = [];
        $weekdays = array_map('intval', $weekdays);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            out_json(['ok' => false, 'message' => 'Wybierz poprawną datę od i do.'], 422);
        }

        if (!preg_match('/^\d{2}:\d{2}$/', $startTime) || !preg_match('/^\d{2}:\d{2}$/', $endTime)) {
            out_json(['ok' => false, 'message' => 'Wybierz poprawną godzinę od i do.'], 422);
        }

        $from = new DateTime($dateFrom);
        $to = new DateTime($dateTo);

        if ($to < $from) {
            out_json(['ok' => false, 'message' => 'Data do nie może być wcześniejsza niż data od.'], 422);
        }

        $daysLimit = (int)$from->diff($to)->days;
        if ($daysLimit > 60) {
            out_json(['ok' => false, 'message' => 'Maksymalnie możesz dodać zakres 60 dni naraz.'], 422);
        }

        $added = 0;
        $skipped = 0;
        $serviceCycle = 0;

        $insert = $pdo->prepare("
            INSERT INTO dbo.visit
                (employee_id, client_id, pet_id, start_datetime, duration_min, total_price, visit_status, notes)
            OUTPUT INSERTED.id
            VALUES
                (:employee_id, NULL, NULL, :start_datetime, :duration_min, :total_price, 'FREE', :notes)
        ");

        $day = clone $from;

        while ($day <= $to) {
            $dayOfWeek = (int)$day->format('N');

            if ($weekdays && !in_array($dayOfWeek, $weekdays, true)) {
                $day->modify('+1 day');
                continue;
            }

            $dayStart = new DateTime($day->format('Y-m-d') . ' ' . $startTime . ':00');
            $dayEnd = new DateTime($day->format('Y-m-d') . ' ' . $endTime . ':00');

            if ($dayEnd <= $dayStart) {
                $day->modify('+1 day');
                continue;
            }

            $current = clone $dayStart;

            while ($current < $dayEnd) {
                $serviceId = 0;
                $serviceName = '';
                $durationMin = $customDuration;
                $price = 0.0;

                if ($serviceIds) {
                    $serviceId = $serviceIds[$serviceCycle % count($serviceIds)];
                    $serviceCycle++;

                    $srv = $services[$serviceId];
                    $serviceName = $srv['name'];
                    $durationMin = (int)$srv['duration_min'];
                    $price = (float)$srv['price'];
                }

                $slotEnd = (clone $current)->modify('+' . $durationMin . ' minutes');

                if ($slotEnd > $dayEnd) {
                    break;
                }

                $startDt = $current->format('Y-m-d H:i:s');

                if (has_overlap($pdo, $employeeId, $startDt, $durationMin)) {
                    $skipped++;
                    $current->modify('+' . ($durationMin + $breakMin) . ' minutes');
                    continue;
                }

                $slotNote = trim($note);
                if ($serviceName !== '') {
                    $slotNote = trim('Usługa: ' . $serviceName . ($slotNote !== '' ? "\n" . $slotNote : ''));
                }

                $insert->execute([
                    ':employee_id' => $employeeId,
                    ':start_datetime' => $startDt,
                    ':duration_min' => $durationMin,
                    ':total_price' => $price,
                    ':notes' => $slotNote,
                ]);

                $visitId = (int)$insert->fetchColumn();

                if ($visitId > 0 && $serviceId > 0) {
                    attach_service($pdo, $visitId, $serviceId);
                }

                $added++;
                $current->modify('+' . ($durationMin + $breakMin) . ' minutes');
            }

            $day->modify('+1 day');
        }

        out_json([
            'ok' => true,
            'message' => 'Dodano terminy.',
            'added' => $added,
            'skipped' => $skipped,
        ]);
    }

    if ($action === 'update_slot') {
        $id = (int)($body['id'] ?? 0);
        $date = trim((string)($body['date'] ?? ''));
        $time = trim((string)($body['time'] ?? ''));
        $durationMin = max(5, min(240, (int)($body['duration_min'] ?? 30)));
        $serviceId = (int)($body['service_id'] ?? 0);
        $note = trim((string)($body['notes'] ?? ''));

        if ($id <= 0) {
            out_json(['ok' => false, 'message' => 'Brak ID terminu.'], 422);
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $time)) {
            out_json(['ok' => false, 'message' => 'Niepoprawna data lub godzina.'], 422);
        }

        $startDt = $date . ' ' . $time . ':00';

        $check = $pdo->prepare("
            SELECT COUNT(*)
            FROM dbo.visit
            WHERE id = :id
              AND employee_id = :employee_id
              AND UPPER(COALESCE(visit_status, '')) = 'FREE'
        ");

        $check->execute([
            ':id' => $id,
            ':employee_id' => $employeeId,
        ]);

        if ((int)$check->fetchColumn() === 0) {
            out_json([
                'ok' => false,
                'message' => 'Możesz edytować tylko wolne terminy.'
            ], 403);
        }

        if (has_overlap($pdo, $employeeId, $startDt, $durationMin, $id)) {
            out_json([
                'ok' => false,
                'message' => 'Ten termin nachodzi na inną wizytę.'
            ], 422);
        }

        $price = 0.0;
        $serviceName = '';

        if ($serviceId > 0 && isset($services[$serviceId])) {
            $price = (float)$services[$serviceId]['price'];
            $serviceName = $services[$serviceId]['name'];
        } else {
            $serviceId = 0;
        }

        if ($serviceName !== '') {
            $note = trim('Usługa: ' . $serviceName . ($note !== '' ? "\n" . $note : ''));
        }

        $stmt = $pdo->prepare("
            UPDATE dbo.visit
            SET start_datetime = :start_datetime,
                duration_min = :duration_min,
                total_price = :total_price,
                notes = :notes
            WHERE id = :id
              AND employee_id = :employee_id
              AND UPPER(COALESCE(visit_status, '')) = 'FREE'
        ");

        $stmt->execute([
            ':start_datetime' => $startDt,
            ':duration_min' => $durationMin,
            ':total_price' => $price,
            ':notes' => $note,
            ':id' => $id,
            ':employee_id' => $employeeId,
        ]);

        attach_service($pdo, $id, $serviceId);

        out_json([
            'ok' => true,
            'message' => 'Termin został zapisany.'
        ]);
    }

    if ($action === 'delete_slot') {
        $id = (int)($body['id'] ?? 0);

        if ($id <= 0) {
            out_json(['ok' => false, 'message' => 'Brak ID terminu.'], 422);
        }

        try {
            $pdo->prepare("DELETE FROM dbo.visit_service WHERE visit_id = :id")
                ->execute([':id' => $id]);
        } catch (Throwable $e) {
            error_log('[delete visit_service] ' . $e->getMessage());
        }

        $stmt = $pdo->prepare("
            DELETE FROM dbo.visit
            WHERE id = :id
              AND employee_id = :employee_id
              AND UPPER(COALESCE(visit_status, '')) = 'FREE'
        ");

        $stmt->execute([
            ':id' => $id,
            ':employee_id' => $employeeId,
        ]);

        out_json([
            'ok' => true,
            'message' => 'Termin został usunięty.'
        ]);
    }

    out_json([
        'ok' => false,
        'message' => 'Nieznana akcja.'
    ], 400);
} catch (Throwable $e) {
    error_log('[worker_panel_add_godziny.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd panelu godzin pracy.'
    ], 500);
}