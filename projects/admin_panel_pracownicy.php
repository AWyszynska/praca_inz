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
        return (new DateTime($raw))->format('d.m.Y');
    } catch (Throwable $e) {
        return substr($raw, 0, 10);
    }
}

function sql_date_or_null($value): ?string {
    $value = trim((string)$value);

    if ($value === '') return null;

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return null;
    }

    return $value;
}

function clean_text($value, int $max = 255): string {
    $value = trim((string)$value);
    return mb_substr($value, 0, $max);
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
            SELECT
                e.id,
                e.role,
                e.first_name,
                e.last_name,
                e.birth_date,
                e.email,
                e.phone,
                e.hire_date,
                e.is_active,

                ei.id AS info_id,
                ei.file_name,
                ei.alt_text,
                ei.description
            FROM dbo.employee e
            LEFT JOIN dbo.employee_info ei ON ei.employee_id = e.id
            ORDER BY e.is_active DESC, e.last_name ASC, e.first_name ASC
        ");

        $employees = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $name = trim((string)($row['first_name'] ?? '') . ' ' . (string)($row['last_name'] ?? ''));

            $employees[] = [
                'id' => (int)$row['id'],
                'role' => (string)($row['role'] ?? ''),
                'first_name' => (string)($row['first_name'] ?? ''),
                'last_name' => (string)($row['last_name'] ?? ''),
                'name' => $name !== '' ? $name : 'Pracownik #' . (int)$row['id'],
                'birth_date' => fmt_date($row['birth_date'] ?? ''),
                'email' => (string)($row['email'] ?? ''),
                'phone' => (string)($row['phone'] ?? ''),
                'hire_date' => fmt_date($row['hire_date'] ?? ''),
                'is_active' => (bool)($row['is_active'] ?? false),
                'info_id' => $row['info_id'] !== null ? (int)$row['info_id'] : null,
                'file_name' => (string)($row['file_name'] ?? ''),
                'alt_text' => (string)($row['alt_text'] ?? ''),
                'description' => (string)($row['description'] ?? ''),
            ];
        }

        out_json([
            'ok' => true,
            'employees' => $employees
        ]);
    }

    if ($action === 'update_info') {
        $employeeId = (int)($body['employee_id'] ?? 0);

        if ($employeeId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID pracownika.'
            ], 422);
        }

        $fileName = clean_text($body['file_name'] ?? '', 255);
        $altText = clean_text($body['alt_text'] ?? '', 255);
        $description = trim((string)($body['description'] ?? ''));

        $check = $pdo->prepare("SELECT COUNT(*) FROM dbo.employee WHERE id = :id");
        $check->execute([':id' => $employeeId]);

        if ((int)$check->fetchColumn() === 0) {
            out_json([
                'ok' => false,
                'message' => 'Nie znaleziono pracownika.'
            ], 404);
        }

        $checkInfo = $pdo->prepare("SELECT id FROM dbo.employee_info WHERE employee_id = :employee_id");
        $checkInfo->execute([':employee_id' => $employeeId]);
        $infoId = $checkInfo->fetchColumn();

        if ($infoId) {
            $stmt = $pdo->prepare("
                UPDATE dbo.employee_info
                SET
                    file_name = :file_name,
                    alt_text = :alt_text,
                    description = :description
                WHERE employee_id = :employee_id
            ");

            $stmt->execute([
                ':file_name' => $fileName,
                ':alt_text' => $altText,
                ':description' => $description,
                ':employee_id' => $employeeId
            ]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO dbo.employee_info (employee_id, file_name, alt_text, description)
                VALUES (:employee_id, :file_name, :alt_text, :description)
            ");

            $stmt->execute([
                ':employee_id' => $employeeId,
                ':file_name' => $fileName,
                ':alt_text' => $altText,
                ':description' => $description
            ]);
        }

        out_json([
            'ok' => true,
            'message' => 'Opis pracownika został zapisany.'
        ]);
    }

    if ($action === 'add') {
        $role = clean_text($body['role'] ?? 'doctor', 50);
        $firstName = clean_text($body['first_name'] ?? '', 100);
        $lastName = clean_text($body['last_name'] ?? '', 100);
        $birthDate = sql_date_or_null($body['birth_date'] ?? '');
        $email = clean_text($body['email'] ?? '', 255);
        $phone = clean_text($body['phone'] ?? '', 50);
        $hireDate = sql_date_or_null($body['hire_date'] ?? date('Y-m-d'));
        $isActive = !empty($body['is_active']) ? 1 : 0;

        $fileName = clean_text($body['file_name'] ?? '', 255);
        $altText = clean_text($body['alt_text'] ?? '', 255);
        $description = trim((string)($body['description'] ?? ''));

        $password = trim((string)($body['password'] ?? ''));

        if ($password === '') {
            $password = 'VetMell123!';
        }

        if ($firstName === '' || $lastName === '' || $email === '') {
            out_json([
                'ok' => false,
                'message' => 'Imię, nazwisko i e-mail są wymagane.'
            ], 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            out_json([
                'ok' => false,
                'message' => 'Podaj poprawny adres e-mail.'
            ], 422);
        }

        $checkEmail = $pdo->prepare("SELECT COUNT(*) FROM dbo.employee WHERE email = :email");
        $checkEmail->execute([':email' => $email]);

        if ((int)$checkEmail->fetchColumn() > 0) {
            out_json([
                'ok' => false,
                'message' => 'Pracownik z takim adresem e-mail już istnieje.'
            ], 422);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO dbo.employee
                (role, first_name, last_name, birth_date, email, password_hash, phone, hire_date, is_active)
            OUTPUT INSERTED.id
            VALUES
                (:role, :first_name, :last_name, :birth_date, :email, :password_hash, :phone, :hire_date, :is_active)
        ");

        $stmt->execute([
            ':role' => $role,
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':birth_date' => $birthDate,
            ':email' => $email,
            ':password_hash' => $passwordHash,
            ':phone' => $phone,
            ':hire_date' => $hireDate,
            ':is_active' => $isActive
        ]);

        $employeeId = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("
            INSERT INTO dbo.employee_info
                (employee_id, file_name, alt_text, description)
            VALUES
                (:employee_id, :file_name, :alt_text, :description)
        ");

        $stmt->execute([
            ':employee_id' => $employeeId,
            ':file_name' => $fileName,
            ':alt_text' => $altText,
            ':description' => $description
        ]);

        $pdo->commit();

        out_json([
            'ok' => true,
            'message' => 'Pracownik został dodany.',
            'employee_id' => $employeeId
        ]);
    }

    if ($action === 'set_active') {
        $employeeId = (int)($body['employee_id'] ?? 0);
        $isActive = !empty($body['is_active']) ? 1 : 0;

        if ($employeeId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID pracownika.'
            ], 422);
        }

        $stmt = $pdo->prepare("
            UPDATE dbo.employee
            SET is_active = :is_active
            WHERE id = :id
        ");

        $stmt->execute([
            ':is_active' => $isActive,
            ':id' => $employeeId
        ]);

        out_json([
            'ok' => true,
            'message' => 'Status pracownika został zmieniony.'
        ]);
    }

    out_json([
        'ok' => false,
        'message' => 'Nieznana akcja.'
    ], 400);
} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('[admin_panel_pracownicy.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd obsługi pracowników.'
    ], 500);
}