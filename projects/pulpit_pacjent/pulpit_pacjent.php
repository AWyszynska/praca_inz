<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$userName = trim((string)($_SESSION['user_name'] ?? ''));
$userEmail = trim((string)($_SESSION['user_email'] ?? ''));

$displayName = $userName !== ''
    ? $userName
    : ($userEmail !== '' ? $userEmail : 'KONTO');
$unreadNotifications = 0;

try {
    require_once __DIR__ . '/../../db.php';

    if (!function_exists('vetmell_fetch_one_for_badge')) {
        function vetmell_fetch_one_for_badge(string $sql, array $params = []): ?array {
            global $pdo, $conn;

            if (isset($pdo) && $pdo instanceof PDO) {
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                return $row ?: null;
            }

            if (isset($conn)) {
                $stmt = sqlsrv_query($conn, $sql, $params);

                if ($stmt === false) {
                    return null;
                }

                $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
                return $row ?: null;
            }

            return null;
        }
    }

    $clientId = null;

    $sessionKeys = [
        'client_id',
        'klient_id',
        'pacjent_id',
        'id_client',
        'logged_client_id'
    ];

    foreach ($sessionKeys as $key) {
        if (!empty($_SESSION[$key]) && is_numeric($_SESSION[$key])) {
            $clientId = (int)$_SESSION[$key];
            break;
        }
    }

    if (!$clientId && !empty($_SESSION['client']) && is_array($_SESSION['client']) && !empty($_SESSION['client']['id'])) {
        $clientId = (int)$_SESSION['client']['id'];
    }

    if (!$clientId && !empty($_SESSION['user']) && is_array($_SESSION['user']) && !empty($_SESSION['user']['id'])) {
        $role = strtolower((string)($_SESSION['user']['role'] ?? $_SESSION['role'] ?? $_SESSION['user_type'] ?? ''));

        if (in_array($role, ['client', 'pacjent', 'patient'], true)) {
            $clientId = (int)$_SESSION['user']['id'];
        }
    }

    if (!$clientId && !empty($_SESSION['user_id']) && is_numeric($_SESSION['user_id'])) {
        $role = strtolower((string)($_SESSION['role'] ?? $_SESSION['user_type'] ?? ''));

        if (in_array($role, ['client', 'pacjent', 'patient'], true)) {
            $clientId = (int)$_SESSION['user_id'];
        }
    }

    $emailCandidates = [
        $userEmail,
        $_SESSION['email'] ?? '',
        $_SESSION['client_email'] ?? '',
        $_SESSION['pacjent_email'] ?? '',
        $_SESSION['user_email'] ?? '',
        $_SESSION['client']['email'] ?? '',
        $_SESSION['user']['email'] ?? ''
    ];

    foreach ($emailCandidates as $emailCandidate) {
        $emailCandidate = trim((string)$emailCandidate);

        if ($emailCandidate !== '') {
            $userEmail = $emailCandidate;
            break;
        }
    }

    if (!$clientId && $userEmail !== '') {
        $clientRow = vetmell_fetch_one_for_badge(
            "SELECT TOP 1 id FROM dbo.client WHERE email = ?",
            [$userEmail]
        );

        if ($clientRow && !empty($clientRow['id'])) {
            $clientId = (int)$clientRow['id'];
        }
    }

    if (!$clientId && $displayName !== '' && $displayName !== 'KONTO') {
        $parts = preg_split('/\s+/', trim($displayName));

        if ($parts && count($parts) >= 2) {
            $firstName = $parts[0];
            $lastName = implode(' ', array_slice($parts, 1));

            $clientRow = vetmell_fetch_one_for_badge(
                "SELECT TOP 1 id
                 FROM dbo.client
                 WHERE first_name = ? AND last_name = ?
                 ORDER BY id DESC",
                [$firstName, $lastName]
            );

            if ($clientRow && !empty($clientRow['id'])) {
                $clientId = (int)$clientRow['id'];
            }
        }
    }

    if ($clientId) {
        $countRow = vetmell_fetch_one_for_badge(
            "SELECT COUNT(*) AS unread_count
             FROM dbo.notification
             WHERE client_id = ? AND is_read = 0",
            [$clientId]
        );

        if ($countRow) {
            $unreadNotifications = (int)($countRow['unread_count'] ?? 0);
        }
    }
} catch (Throwable $e) {
    $unreadNotifications = 0;
}
/*
  WAŻNE:
  To ma zawsze wskazywać na folder pulpit_pacjent,
  nawet kiedy ten plik jest dołączany z main_home/about_home/uslugi_home.
*/
$baseUrl = 'projects/pulpit_pacjent';
$baseDir = __DIR__;

$jsPath = $baseDir . DIRECTORY_SEPARATOR . 'pulpit_pacjent.js';
$ver = is_file($jsPath) ? filemtime($jsPath) : time();
?>

<style>
  #nav_1778694770291_8972,
  [data-id="nav_1778694770291_8972"] {
    display: none !important;
  }

  body.sg-account-menu-open #nav_1778694770291_8972,
  body.sg-account-menu-open [data-id="nav_1778694770291_8972"] {
    display: block !important;
  }
</style>

<script>
window.VETMELL_LOGGED_USER = {
  name: <?= json_encode($displayName, JSON_UNESCAPED_UNICODE) ?>,
  email: <?= json_encode($userEmail, JSON_UNESCAPED_UNICODE) ?>,
  type: <?= json_encode((string)($_SESSION['user_type'] ?? ''), JSON_UNESCAPED_UNICODE) ?>,
  unread_notifications: <?= (int)$unreadNotifications ?>
};

window.VETMELL_LOGOUT_URL = "/praca_inz/projects/login/login.php";
</script>

<script src="<?= htmlspecialchars($baseUrl, ENT_QUOTES) ?>/pulpit_pacjent.js?v=<?= $ver ?>" defer></script>