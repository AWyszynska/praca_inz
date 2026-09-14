<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$userName = trim((string)($_SESSION['user_name'] ?? ''));
$userEmail = trim((string)($_SESSION['user_email'] ?? ''));

$displayName = $userName !== ''
    ? $userName
    : ($userEmail !== '' ? $userEmail : 'KONTO');

$baseUrl = $SG_PAGE_BASE_URL ?? 'projects/main_home';
$baseDir = $SG_PAGE_BASE_DIR ?? __DIR__;

$jsPath = $baseDir . DIRECTORY_SEPARATOR . 'main_home.js';
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
  type: <?= json_encode((string)($_SESSION['user_type'] ?? ''), JSON_UNESCAPED_UNICODE) ?>
};

window.VETMELL_LOGOUT_URL = "/praca_inz/projects/login/login.php";
</script>

<script src="<?= htmlspecialchars($baseUrl, ENT_QUOTES) ?>/main_home.js?v=<?= $ver ?>" defer></script>