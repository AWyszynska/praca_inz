<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function register_json(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function register_pdo(): PDO {
    $paths = [
        dirname(__DIR__) . DIRECTORY_SEPARATOR . 'db.php',
        dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'db.php',
        dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'inzynierka' . DIRECTORY_SEPARATOR . 'db.php',
    ];

    foreach ($paths as $path) {
        if (is_file($path)) {
            require_once $path;

            if (isset($pdo) && $pdo instanceof PDO) {
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                return $pdo;
            }
        }
    }

    register_json([
        'ok' => false,
        'message' => 'Nie znaleziono połączenia PDO z bazą danych.'
    ], 500);
}

function clean_text($value): string {
    return trim((string)($value ?? ''));
}

function normalize_date(?string $value): ?string {
    $raw = trim((string)$value);

    if ($raw === '') {
        return null;
    }

    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
        return $raw;
    }

    if (preg_match('/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})$/', $raw, $m)) {
        return sprintf('%04d-%02d-%02d', (int)$m[3], (int)$m[2], (int)$m[1]);
    }

    return null;
}

function find_default_employee_id(PDO $pdo): ?int {
    try {
        $stmt = $pdo->query('SELECT TOP 1 id FROM dbo.employee ORDER BY id ASC');
        $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;

        if ($row && isset($row['id'])) {
            return (int)$row['id'];
        }
    } catch (Throwable $e) {
        error_log('[register.php employee] ' . $e->getMessage());
    }

    return null;
}

function create_welcome_notification(PDO $pdo, int $clientId): void {
    $employeeId = find_default_employee_id($pdo);

    $text = 'Witaj w klinice VetMell! Cieszymy się, że jesteś u nas. Dziękujemy za założenie konta.';

    $sql = '
        INSERT INTO dbo.notification
            (employee_id, client_id, text, is_read, created_at, read_at, notification_type, visit_id, cancellation_reason)
        VALUES
            (:employee_id, :client_id, :text, 0, GETDATE(), NULL, :notification_type, NULL, NULL)
    ';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':employee_id' => $employeeId,
        ':client_id' => $clientId,
        ':text' => $text,
        ':notification_type' => 'WELCOME'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        $data = $_POST;
    }

    $firstName = clean_text($data['first_name'] ?? '');
    $lastName = clean_text($data['last_name'] ?? '');
    $email = mb_strtolower(clean_text($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');
    $passwordRepeat = (string)($data['password_repeat'] ?? '');
    $phone = clean_text($data['phone'] ?? '');
    $birthDate = normalize_date(clean_text($data['birth_date'] ?? ''));
    $privacyConsent = !empty($data['privacy_consent']);

    if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
        register_json([
            'ok' => false,
            'message' => 'Uzupełnij imię, nazwisko, e-mail i hasło.'
        ], 422);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        register_json([
            'ok' => false,
            'message' => 'Podaj poprawny adres e-mail.'
        ], 422);
    }

    if (mb_strlen($password) < 6) {
        register_json([
            'ok' => false,
            'message' => 'Hasło musi mieć minimum 6 znaków.'
        ], 422);
    }

    if ($password !== $passwordRepeat) {
        register_json([
            'ok' => false,
            'message' => 'Hasła nie są takie same.'
        ], 422);
    }

    if (!$privacyConsent) {
        register_json([
            'ok' => false,
            'message' => 'Musisz wyrazić zgodę z polityką prywatności.'
        ], 422);
    }

    try {
        $pdo = register_pdo();

        $stmt = $pdo->prepare('SELECT TOP 1 id FROM dbo.client WHERE email = :email');
        $stmt->execute([':email' => $email]);

        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            register_json([
                'ok' => false,
                'message' => 'Konto z takim adresem e-mail już istnieje.'
            ], 409);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $pdo->beginTransaction();

        $insertClient = $pdo->prepare('
            INSERT INTO dbo.client
                (first_name, last_name, birth_date, email, password_hash, phone, account_created_at)
            OUTPUT INSERTED.id
            VALUES
                (:first_name, :last_name, :birth_date, :email, :password_hash, :phone, GETDATE())
        ');

        $insertClient->execute([
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':birth_date' => $birthDate,
            ':email' => $email,
            ':password_hash' => $passwordHash,
            ':phone' => $phone !== '' ? $phone : null
        ]);

        $clientId = (int)$insertClient->fetchColumn();

        if ($clientId <= 0) {
            throw new RuntimeException('Nie udało się pobrać ID nowego klienta.');
        }

        create_welcome_notification($pdo, $clientId);

        $pdo->commit();

register_json([
    'ok' => true,
    'client_id' => $clientId,
    'message' => 'Konto zostało utworzone. Możesz się teraz zalogować.',
    'redirect' => '/praca_inz/final_view.php?file=login.xml'
]);
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log('[projects/register.php] ' . $e->getMessage());

        register_json([
            'ok' => false,
            'message' => 'Nie udało się utworzyć konta. Sprawdź dane albo spróbuj ponownie.'
        ], 500);
    }
}

$baseUrl = $SG_PAGE_BASE_URL ?? 'projects';
$baseDir = $SG_PAGE_BASE_DIR ?? __DIR__;
$jsPath = $baseDir . DIRECTORY_SEPARATOR . 'register.js';
$ver = is_file($jsPath) ? filemtime($jsPath) : time();

echo '<script>window.REGISTER_API_URL = "' . htmlspecialchars($baseUrl, ENT_QUOTES) . '/register.php";</script>' . PHP_EOL;
echo '<script src="' . htmlspecialchars($baseUrl, ENT_QUOTES) . '/register.js?v=' . $ver . '" defer></script>' . PHP_EOL;