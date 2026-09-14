<?php
require_once dirname(__DIR__) . '/pulpit_pacjent/pulpit_pacjent.php';

$jsPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uslugi_home.js';
$ver = is_file($jsPath) ? filemtime($jsPath) : time();

echo '<script src="projects/uslugi_home.js?v=' . $ver . '" defer></script>' . PHP_EOL;