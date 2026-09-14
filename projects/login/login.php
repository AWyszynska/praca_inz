<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

function login_json(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function login_pdo(): PDO {
    $paths = [
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

    login_json([
        'ok' => false,
        'message' => 'Nie znaleziono pliku db.php.'
    ], 500);
}

/*
  Kiedy login.js wyśle POST bezpośrednio na:
  /praca_inz/projects/login/login.php
*/
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        $data = $_POST;
    }

    $email = trim((string)($data['email'] ?? $data['username'] ?? ''));
    $password = (string)($data['password'] ?? '');

    if ($email === '' || $password === '') {
        login_json([
            'ok' => false,
            'message' => 'Podaj e-mail i hasło.'
        ], 422);
    }

    try {
        $pdo = login_pdo();

        $user = null;
        $userType = null;

        /*
          1. Najpierw sprawdzamy klienta / właściciela zwierzęcia
        */
        $sqlClient = "
            SELECT id, first_name, last_name, email, password_hash
            FROM dbo.client
            WHERE email = :email
        ";

        $stmt = $pdo->prepare($sqlClient);
        $stmt->execute([
            ':email' => $email
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row && password_verify($password, (string)$row['password_hash'])) {
            $user = $row;
            $userType = 'client';
        }

        /*
          2. Jeśli to nie klient, sprawdzamy pracownika / lekarza
        */
        if ($userType === null) {
            $sqlEmp = "
                SELECT id, first_name, last_name, email, role, password_hash
                FROM dbo.employee
                WHERE email = :email
                  AND is_active = 1
            ";

            $stmt = $pdo->prepare($sqlEmp);
            $stmt->execute([
                ':email' => $email
            ]);

            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row && password_verify($password, (string)$row['password_hash'])) {
                $user = $row;
                $userType = 'employee';
            }
        }

        if ($userType === null || !$user) {
            login_json([
                'ok' => false,
                'message' => 'Nieprawidłowy login lub hasło.'
            ], 401);
        }

        /*
          3. Dane do sesji
        */
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        $_SESSION['user_type'] = $userType;

        if ($userType === 'employee') {
            $_SESSION['employee_id'] = $user['id'];
            $_SESSION['employee_name'] = $_SESSION['user_name'];
            $_SESSION['user_role'] = $user['role'] ?? '';
            unset($_SESSION['client_id'], $_SESSION['client_name']);
        }

        if ($userType === 'client') {
            $_SESSION['client_id'] = $user['id'];
            $_SESSION['client_name'] = $_SESSION['user_name'];
            unset($_SESSION['employee_id'], $_SESSION['employee_name'], $_SESSION['user_role']);
        }

        $_SESSION['user'] = $_SESSION['user_name'] !== ''
            ? $_SESSION['user_name']
            : $_SESSION['user_email'];

/*
  4. Przekierowanie zależne od typu konta
*/
$role = strtolower(trim((string)($user['role'] ?? '')));

if ($userType === 'employee' && $role === 'admin') {
    $_SESSION['user_type'] = 'admin';
    $_SESSION['user_role'] = 'admin';

    $redirect = '/praca_inz/final_view.php?file=admin_panel_glowny.xml';

} elseif ($userType === 'employee') {
    $redirect = '/praca_inz/final_view.php?file=worker_panel_main.xml';

} else {
    $redirect = '/praca_inz/final_view.php?file=main_home.xml';
}

login_json([
    'ok' => true,
    'user_type' => $_SESSION['user_type'],
    'role' => $user['role'] ?? null,
    'redirect' => $redirect
]);



    } catch (Throwable $e) {
        error_log('[projects/login/login.php] ' . $e->getMessage());

        login_json([
            'ok' => false,
            'message' => 'Błąd połączenia z bazą danych.'
        ], 500);
    }
}

/*
  Kiedy final_view.php robi include tego pliku w <head>,
  ten plik tylko dołącza JS.
*/
$baseUrl = $SG_PAGE_BASE_URL ?? 'projects/login';
$baseDir = $SG_PAGE_BASE_DIR ?? __DIR__;
$jsPath = $baseDir . DIRECTORY_SEPARATOR . 'login.js';
$ver = is_file($jsPath) ? filemtime($jsPath) : time();

echo '<script>window.LOGIN_API_URL = "' . htmlspecialchars($baseUrl, ENT_QUOTES) . '/login.php";</script>' . PHP_EOL;
echo '<script src="' . htmlspecialchars($baseUrl, ENT_QUOTES) . '/login.js?v=' . $ver . '" defer></script>' . PHP_EOL;