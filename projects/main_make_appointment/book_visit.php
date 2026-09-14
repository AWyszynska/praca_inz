<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../db.php';

function out_json(array $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_logged_client_id(): ?int {
    if (isset($_SESSION['client']['id'])) {
        return (int)$_SESSION['client']['id'];
    }

    if (isset($_SESSION['client_id'])) {
        return (int)$_SESSION['client_id'];
    }

    if (
        isset($_SESSION['user']['id'], $_SESSION['user']['role'])
        && in_array(strtolower((string)$_SESSION['user']['role']), ['client', 'pacjent', 'patient'], true)
    ) {
        return (int)$_SESSION['user']['id'];
    }

    return null;
}

function format_visit_datetime($value): string {
    if ($value instanceof DateTimeInterface) {
        return $value->format('d.m.Y H:i');
    }

    $raw = trim((string)$value);

    if ($raw === '') {
        return '';
    }

    try {
        return (new DateTime($raw))->format('d.m.Y H:i');
    } catch (Throwable $e) {
        return $raw;
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out_json([
        'success' => false,
        'error' => 'Invalid method',
    ], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input) || empty($input['visit_id'])) {
    out_json([
        'success' => false,
        'error' => 'Brak parametru visit_id',
    ], 400);
}

$visitId = (int)$input['visit_id'];
$clientId = get_logged_client_id();

if (!$clientId) {
    out_json([
        'success' => false,
        'error' => 'Brak zalogowanego pacjenta',
    ], 401);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        UPDATE dbo.visit
        SET client_id = :client_id,
            visit_status = 'BOOKED'
        WHERE id = :id
          AND client_id IS NULL
    ");

    $stmt->execute([
        ':client_id' => $clientId,
        ':id' => $visitId,
    ]);

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();

        out_json([
            'success' => false,
            'error' => 'Ten termin jest już zajęty lub nie istnieje.',
        ], 409);
    }

    $visitStmt = $pdo->prepare("
        SELECT TOP 1
            v.id,
            v.client_id,
            v.employee_id,
            v.start_datetime,
            e.first_name,
            e.last_name
        FROM dbo.visit v
        LEFT JOIN dbo.employee e ON e.id = v.employee_id
        WHERE v.id = :visit_id
    ");

    $visitStmt->execute([
        ':visit_id' => $visitId,
    ]);

    $visit = $visitStmt->fetch(PDO::FETCH_ASSOC);

    if (!$visit) {
        $pdo->rollBack();

        out_json([
            'success' => false,
            'error' => 'Nie znaleziono danych umówionej wizyty.',
        ], 404);
    }

    $employeeId = isset($visit['employee_id']) && $visit['employee_id'] !== null
        ? (int)$visit['employee_id']
        : null;

    $doctorName = trim((string)($visit['first_name'] ?? '') . ' ' . (string)($visit['last_name'] ?? ''));
    $visitDateText = format_visit_datetime($visit['start_datetime'] ?? '');

    $notificationText = 'Twoja wizyta została umówiona';

    if ($visitDateText !== '') {
        $notificationText .= ' na ' . $visitDateText;
    }

    if ($doctorName !== '') {
        $notificationText .= '. Lekarz: ' . $doctorName;
    }

    $notificationText .= '.';

    $notify = $pdo->prepare("
        INSERT INTO dbo.notification
            (
                employee_id,
                client_id,
                [text],
                is_read,
                created_at,
                notification_type,
                visit_id
            )
        VALUES
            (
                :employee_id,
                :client_id,
                :text,
                0,
                SYSDATETIME(),
                :notification_type,
                :visit_id
            )
    ");

    $notify->execute([
        ':employee_id' => $employeeId,
        ':client_id' => $clientId,
        ':text' => $notificationText,
        ':notification_type' => 'VISIT_BOOKED',
        ':visit_id' => $visitId,
    ]);

    $pdo->commit();

    out_json([
        'success' => true,
        'notification_created' => true,
        'message' => 'Wizyta została umówiona i dodano powiadomienie.',
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    out_json([
        'success' => false,
        'error' => 'Błąd bazy danych: ' . $e->getMessage(),
    ], 500);
}