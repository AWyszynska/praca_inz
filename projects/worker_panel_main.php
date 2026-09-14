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

function get_json_body(): array {
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

function format_time($value): string {
    $raw = dt_value($value);

    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('H:i');
    } catch (Throwable $e) {
        return substr($raw, 11, 5);
    }
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

function format_datetime($value): string {
    $raw = dt_value($value);

    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('d.m.Y H:i');
    } catch (Throwable $e) {
        return $raw;
    }
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$sessionEmployeeId = $_SESSION['employee_id'] ?? null;

if (!$sessionEmployeeId && ($_SESSION['user_type'] ?? '') === 'employee') {
    $sessionEmployeeId = $_SESSION['user_id'] ?? null;
}

$userEmail = trim((string)($_SESSION['user_email'] ?? ''));

try {
    $employee = null;

    if ($sessionEmployeeId) {
        $stmt = $pdo->prepare("
            SELECT TOP 1 id, first_name, last_name, email, role
            FROM dbo.employee
            WHERE id = :id
              AND is_active = 1
        ");

        $stmt->execute([
            ':id' => $sessionEmployeeId
        ]);

        $employee = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    if (!$employee && $userEmail !== '') {
        $stmt = $pdo->prepare("
            SELECT TOP 1 id, first_name, last_name, email, role
            FROM dbo.employee
            WHERE email = :email
              AND is_active = 1
        ");

        $stmt->execute([
            ':email' => $userEmail
        ]);

        $employee = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    if (!$employee) {
        out_json([
            'ok' => false,
            'message' => 'Brak zalogowanego pracownika.',
            'redirect' => 'final_view.php?file=login.xml'
        ], 401);
    }

    $employeeId = (int)$employee['id'];
    $employeeName = trim((string)$employee['first_name'] . ' ' . (string)$employee['last_name']);

    $_SESSION['employee_id'] = $employeeId;
    $_SESSION['employee_name'] = $employeeName;
    $_SESSION['user_type'] = 'employee';
    $_SESSION['user_name'] = $employeeName;
    $_SESSION['user_email'] = (string)$employee['email'];
    $_SESSION['user_role'] = (string)($employee['role'] ?? '');

    $body = get_json_body();
    $action = (string)($body['action'] ?? $_GET['action'] ?? 'data');

    $loadNotes = function () use ($pdo, $employeeId): array {
        $stmt = $pdo->prepare("
            SELECT id, employee_id, note_text, created_at
            FROM dbo.note
            WHERE employee_id = :employee_id
            ORDER BY created_at DESC, id DESC
        ");

        $stmt->execute([
            ':employee_id' => $employeeId
        ]);

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $notes = [];

        foreach ($rows as $row) {
            $notes[] = [
                'id' => (int)$row['id'],
                'employee_id' => (int)$row['employee_id'],
                'note_text' => (string)$row['note_text'],
                'created_at' => format_datetime($row['created_at']),
            ];
        }

        return $notes;
    };

    if ($action === 'create_note') {
        $noteText = trim((string)($body['note_text'] ?? ''));

        if ($noteText === '') {
            out_json([
                'ok' => false,
                'message' => 'Treść notatki nie może być pusta.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            INSERT INTO dbo.note (employee_id, note_text)
            VALUES (:employee_id, :note_text)
        ");

        $stmt->execute([
            ':employee_id' => $employeeId,
            ':note_text' => $noteText
        ]);

        out_json([
            'ok' => true,
            'message' => 'Notatka została dodana.',
            'notes' => $loadNotes()
        ]);
    }

    if ($action === 'update_note') {
        $noteId = (int)($body['id'] ?? 0);
        $noteText = trim((string)($body['note_text'] ?? ''));

        if ($noteId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID notatki.'
            ], 422);
        }

        if ($noteText === '') {
            out_json([
                'ok' => false,
                'message' => 'Treść notatki nie może być pusta.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            UPDATE dbo.note
            SET note_text = :note_text
            WHERE id = :id
              AND employee_id = :employee_id
        ");

        $stmt->execute([
            ':note_text' => $noteText,
            ':id' => $noteId,
            ':employee_id' => $employeeId
        ]);

        out_json([
            'ok' => true,
            'message' => 'Notatka została zaktualizowana.',
            'notes' => $loadNotes()
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
            DELETE FROM dbo.note
            WHERE id = :id
              AND employee_id = :employee_id
        ");

        $stmt->execute([
            ':id' => $noteId,
            ':employee_id' => $employeeId
        ]);

        out_json([
            'ok' => true,
            'message' => 'Notatka została usunięta.',
            'notes' => $loadNotes()
        ]);
    }

    if ($action === 'list_notes') {
        out_json([
            'ok' => true,
            'notes' => $loadNotes()
        ]);
    }

    $today = date('Y-m-d');

    $bookedWhere = "
        employee_id = :employee_id
        AND (client_id IS NOT NULL OR pet_id IS NOT NULL)
        AND UPPER(COALESCE(visit_status, '')) NOT IN ('FREE', 'CANCELLED', 'CANCELED', 'ANULOWANA')
    ";

    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS cnt
        FROM dbo.visit
        WHERE {$bookedWhere}
          AND CAST(start_datetime AS date) = CAST(:today AS date)
    ");

    $stmt->execute([
        ':employee_id' => $employeeId,
        ':today' => $today
    ]);

    $todayVisits = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT
            CASE
                WHEN pet_id IS NOT NULL THEN CONCAT('p', pet_id)
                WHEN client_id IS NOT NULL THEN CONCAT('c', client_id)
                ELSE NULL
            END
        ) AS cnt
        FROM dbo.visit
        WHERE {$bookedWhere}
          AND CAST(start_datetime AS date) = CAST(:today AS date)
    ");

    $stmt->execute([
        ':employee_id' => $employeeId,
        ':today' => $today
    ]);

    $todayPatients = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT TOP 1 id, client_id, pet_id, start_datetime, duration_min, visit_status, notes
        FROM dbo.visit
        WHERE {$bookedWhere}
          AND start_datetime >= GETDATE()
        ORDER BY start_datetime ASC
    ");

    $stmt->execute([
        ':employee_id' => $employeeId
    ]);

    $nearest = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

    $stmt = $pdo->prepare("
        SELECT TOP 5 id, client_id, pet_id, start_datetime, duration_min, visit_status, notes
        FROM dbo.visit
        WHERE {$bookedWhere}
          AND start_datetime >= GETDATE()
        ORDER BY start_datetime ASC
    ");

    $stmt->execute([
        ':employee_id' => $employeeId
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $visits = [];

    foreach ($rows as $row) {
        $visits[] = [
            'id' => (int)$row['id'],
            'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
            'pet_id' => $row['pet_id'] !== null ? (int)$row['pet_id'] : null,
            'date' => format_date($row['start_datetime']),
            'time' => format_time($row['start_datetime']),
            'duration_min' => $row['duration_min'] !== null ? (int)$row['duration_min'] : null,
            'status' => (string)($row['visit_status'] ?? ''),
            'notes' => (string)($row['notes'] ?? ''),
        ];
    }

    $nearestText = 'Brak';

if ($nearest) {
    $nearestText = format_datetime($nearest['start_datetime']);
}

    out_json([
        'ok' => true,
        'employee' => [
            'id' => $employeeId,
            'name' => $employeeName,
            'first_name' => (string)$employee['first_name'],
            'last_name' => (string)$employee['last_name'],
            'email' => (string)$employee['email'],
            'role' => (string)($employee['role'] ?? ''),
        ],
        'today' => [
            'date' => date('d.m.Y'),
            'iso' => $today,
        ],
        'stats' => [
            'today_visits' => $todayVisits,
            'nearest_visit' => $nearestText,
            'today_patients' => $todayPatients,
        ],
        'visits' => $visits,
        'notes' => $loadNotes(),
    ]);
} catch (Throwable $e) {
    error_log('[worker_panel_main.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd pobierania danych panelu lekarza.'
    ], 500);
}