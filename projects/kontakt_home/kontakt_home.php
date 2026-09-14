<?php
require_once dirname(__DIR__) . '/pulpit_pacjent/pulpit_pacjent.php';

$baseUrl = 'projects/kontakt_home';
$baseDir = __DIR__;

$jsPath = $baseDir . DIRECTORY_SEPARATOR . 'kontakt_home.js';
$ver = is_file($jsPath) ? filemtime($jsPath) : time();

echo '<script src="' . htmlspecialchars($baseUrl, ENT_QUOTES) . '/kontakt_home.js?v=' . $ver . '" defer></script>' . PHP_EOL;
?>