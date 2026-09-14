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

function fmt_datetime($value): string {
    $raw = dt_value($value);

    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('d.m.Y H:i');
    } catch (Throwable $e) {
        return $raw;
    }
}

function fmt_date_for_sql($value): ?string {
    $value = trim((string)$value);

    if ($value === '') return null;

    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return $value . ' 00:00:00';
    }

    if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $value)) {
        return str_replace('T', ' ', $value) . ':00';
    }

    return null;
}

function clean_text($value, int $max = 80): string {
    return mb_substr(trim((string)$value), 0, $max);
}

function parse_amount($value): float {
    $value = str_replace(',', '.', trim((string)$value));

    if ($value === '' || !is_numeric($value)) {
        return 0.0;
    }

    return max(0, (float)$value);
}

function money_pl($value): string {
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
    if ($action === 'list') {
        $stmt = $pdo->query("
            SELECT TOP 300
                p.id,
                p.visit_id,
                p.amount,
                p.method,
                p.paid_at,
                p.status,

                v.start_datetime,
                v.visit_status,
                v.total_price,

                c.id AS client_id,
                c.first_name AS client_first_name,
                c.last_name AS client_last_name,
                c.email AS client_email,
                c.phone AS client_phone,

                e.id AS employee_id,
                e.first_name AS employee_first_name,
                e.last_name AS employee_last_name
            FROM dbo.payment p
            LEFT JOIN dbo.visit v ON v.id = p.visit_id
            LEFT JOIN dbo.client c ON c.id = v.client_id
            LEFT JOIN dbo.employee e ON e.id = v.employee_id
            ORDER BY p.paid_at DESC, p.id DESC
        ");

        $payments = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));
            $employeeName = trim((string)($row['employee_first_name'] ?? '') . ' ' . (string)($row['employee_last_name'] ?? ''));

            $payments[] = [
                'id' => (int)$row['id'],
                'visit_id' => $row['visit_id'] !== null ? (int)$row['visit_id'] : null,
                'amount' => (float)($row['amount'] ?? 0),
                'amount_label' => money_pl($row['amount'] ?? 0),
                'method' => (string)($row['method'] ?? ''),
                'paid_at_raw' => dt_value($row['paid_at'] ?? ''),
                'paid_at' => fmt_datetime($row['paid_at'] ?? ''),
                'status' => (string)($row['status'] ?? ''),

                'visit_datetime' => fmt_datetime($row['start_datetime'] ?? ''),
                'visit_status' => (string)($row['visit_status'] ?? ''),
                'visit_price' => (float)($row['total_price'] ?? 0),
                'visit_price_label' => money_pl($row['total_price'] ?? 0),

                'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
                'client_name' => $clientName !== '' ? $clientName : '-',
                'client_email' => (string)($row['client_email'] ?? ''),
                'client_phone' => (string)($row['client_phone'] ?? ''),

                'employee_id' => $row['employee_id'] !== null ? (int)$row['employee_id'] : null,
                'employee_name' => $employeeName !== '' ? $employeeName : '-',
            ];
        }

        $visitStmt = $pdo->query("
            SELECT TOP 200
                v.id,
                v.start_datetime,
                v.total_price,
                v.visit_status,

                c.first_name AS client_first_name,
                c.last_name AS client_last_name,

                e.first_name AS employee_first_name,
                e.last_name AS employee_last_name
            FROM dbo.visit v
            LEFT JOIN dbo.client c ON c.id = v.client_id
            LEFT JOIN dbo.employee e ON e.id = v.employee_id
            WHERE v.client_id IS NOT NULL
            ORDER BY v.start_datetime DESC
        ");

        $visits = [];

        foreach ($visitStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));
            $employeeName = trim((string)($row['employee_first_name'] ?? '') . ' ' . (string)($row['employee_last_name'] ?? ''));

            $visits[] = [
                'id' => (int)$row['id'],
                'label' => '#' . (int)$row['id'] . ' — ' . fmt_datetime($row['start_datetime']) . ' — ' . ($clientName !== '' ? $clientName : 'Klient') . ' — ' . ($employeeName !== '' ? $employeeName : 'Lekarz'),
                'price' => (float)($row['total_price'] ?? 0),
                'price_label' => money_pl($row['total_price'] ?? 0),
            ];
        }

        $totalPaid = 0.0;
        $paidCount = 0;
        $pendingCount = 0;
        $cancelledCount = 0;

        foreach ($payments as $payment) {
            $s = strtoupper(trim((string)$payment['status']));

            if ($s === 'PAID' || $s === 'ZAPLACONE' || $s === 'ZAPŁACONE' || $s === 'DONE' || $s === 'COMPLETED') {
                $totalPaid += (float)$payment['amount'];
                $paidCount++;
            } elseif ($s === 'CANCELLED' || $s === 'ANULOWANE' || $s === 'REFUNDED') {
                $cancelledCount++;
            } else {
                $pendingCount++;
            }
        }

        out_json([
            'ok' => true,
            'payments' => $payments,
            'visits' => $visits,
            'stats' => [
                'all' => count($payments),
                'paid' => $paidCount,
                'pending' => $pendingCount,
                'cancelled' => $cancelledCount,
                'total_paid' => $totalPaid,
                'total_paid_label' => money_pl($totalPaid),
            ]
        ]);
    }

    if ($action === 'save') {
        $id = (int)($body['id'] ?? 0);
        $visitId = (int)($body['visit_id'] ?? 0);
        $amount = parse_amount($body['amount'] ?? 0);
        $method = clean_text($body['method'] ?? '', 40);
        $status = clean_text($body['status'] ?? 'PENDING', 40);
        $paidAt = fmt_date_for_sql($body['paid_at'] ?? '');

        if ($visitId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Wybierz wizytę.'
            ], 422);
        }

        if ($amount <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Kwota płatności musi być większa od 0.'
            ], 422);
        }

        if ($method === '') {
            $method = 'CASH';
        }

        if ($status === '') {
            $status = 'PENDING';
        }

        if ($paidAt === null) {
            $paidAt = date('Y-m-d H:i:s');
        }

        if ($id > 0) {
            $stmt = $pdo->prepare("
                UPDATE dbo.payment
                SET
                    visit_id = :visit_id,
                    amount = :amount,
                    method = :method,
                    paid_at = :paid_at,
                    status = :status
                WHERE id = :id
            ");

            $stmt->execute([
                ':visit_id' => $visitId,
                ':amount' => $amount,
                ':method' => $method,
                ':paid_at' => $paidAt,
                ':status' => $status,
                ':id' => $id
            ]);

            out_json([
                'ok' => true,
                'message' => 'Płatność została zaktualizowana.'
            ]);
        }

        $stmt = $pdo->prepare("
            INSERT INTO dbo.payment
                (visit_id, amount, method, paid_at, status)
            OUTPUT INSERTED.id
            VALUES
                (:visit_id, :amount, :method, :paid_at, :status)
        ");

        $stmt->execute([
            ':visit_id' => $visitId,
            ':amount' => $amount,
            ':method' => $method,
            ':paid_at' => $paidAt,
            ':status' => $status
        ]);

        $newId = (int)$stmt->fetchColumn();

        out_json([
            'ok' => true,
            'message' => 'Płatność została dodana.',
            'id' => $newId
        ]);
    }

    if ($action === 'set_status') {
        $id = (int)($body['id'] ?? 0);
        $status = clean_text($body['status'] ?? '', 40);

        if ($id <= 0 || $status === '') {
            out_json([
                'ok' => false,
                'message' => 'Brak ID płatności albo statusu.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            UPDATE dbo.payment
            SET status = :status
            WHERE id = :id
        ");

        $stmt->execute([
            ':status' => $status,
            ':id' => $id
        ]);

        out_json([
            'ok' => true,
            'message' => 'Status płatności został zmieniony.'
        ]);
    }

    if ($action === 'delete') {
        $id = (int)($body['id'] ?? 0);

        if ($id <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID płatności.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            DELETE FROM dbo.payment
            WHERE id = :id
        ");

        $stmt->execute([
            ':id' => $id
        ]);

        out_json([
            'ok' => true,
            'message' => 'Płatność została usunięta.'
        ]);
    }

    out_json([
        'ok' => false,
        'message' => 'Nieznana akcja.'
    ], 400);
} catch (Throwable $e) {
    error_log('[admin_panel_platnosci.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd obsługi płatności.'
    ], 500);
}