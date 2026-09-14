<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/pulpit_pacjent/pulpit_pacjent.php';
/**
 * Runtime dla strony main_make_appointment.xml.
 * Ten plik NIE zwraca XML.
 * Jest dołączany przez final_view.php w <head>.
 */

$assetDir = $SG_PAGE_BASE_DIR ?? __DIR__;
$assetUrl = $SG_PAGE_BASE_URL ?? 'projects/main_make_appointment';

require_once dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'db.php';

$db = null;

if (isset($pdo) && $pdo instanceof PDO) {
  $db = $pdo;
} elseif (isset($conn) && $conn instanceof PDO) {
  $db = $conn;
}

$slotsByDay = [];

if ($db instanceof PDO) {
  try {
    $stmt = $db->query("
  SELECT
    v.id,
    v.employee_id,
    v.start_datetime,
    v.duration_min,
    v.visit_status,
    v.client_id,
    e.first_name,
    e.last_name
  FROM dbo.visit AS v
  INNER JOIN dbo.employee AS e
    ON e.id = v.employee_id
  WHERE v.client_id IS NULL
    AND v.start_datetime >= CAST(GETDATE() AS date)
    AND v.start_datetime < DATEADD(month, 6, CAST(GETDATE() AS date))
  ORDER BY v.start_datetime
");

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $row) {
      if (empty($row['start_datetime'])) {
        continue;
      }

      try {
        $dt = new DateTime((string)$row['start_datetime']);
      } catch (Exception $e) {
        continue;
      }

      $dayKey = $dt->format('Y-m-d');

      if (!isset($slotsByDay[$dayKey])) {
        $slotsByDay[$dayKey] = [];
      }

      $slotsByDay[$dayKey][] = [
        'id'          => (int)$row['id'],
        'employee_id' => (int)$row['employee_id'],
        'date'        => $dayKey,
        'time'        => $dt->format('H:i'),
        'doctor'      => trim((string)$row['first_name'] . ' ' . (string)$row['last_name']),
        'duration'    => (int)($row['duration_min'] ?? 0),
        'status'      => (string)($row['visit_status'] ?? ''),
      ];
    }
  } catch (Throwable $e) {
    $slotsByDay = [];
  }
}

$slotsJson = json_encode($slotsByDay, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($slotsJson === false) {
  $slotsJson = '{}';
}

$cssPath = $assetDir . DIRECTORY_SEPARATOR . 'main_make_appointment.css';
$jsPath  = $assetDir . DIRECTORY_SEPARATOR . 'main_make_appointment.js';

$cssVer = is_file($cssPath) ? filemtime($cssPath) : time();
$jsVer  = is_file($jsPath) ? filemtime($jsPath) : time();

$cssUrl = $assetUrl . '/main_make_appointment.css?v=' . $cssVer;
$jsUrl  = $assetUrl . '/main_make_appointment.js?v=' . $jsVer;
$bookUrl = $assetUrl . '/book_visit.php';
?>

<link rel="stylesheet" href="<?= htmlspecialchars($cssUrl, ENT_QUOTES) ?>">

<script>
window.VETMELL_FREE_SLOTS = <?= $slotsJson ?>;
window.VETMELL_BOOK_VISIT_URL = <?= json_encode($bookUrl, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
</script>

<script src="<?= htmlspecialchars($jsUrl, ENT_QUOTES) ?>" defer></script>