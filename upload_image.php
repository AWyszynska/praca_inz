<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Tylko POST']);
  exit;
}

if (!isset($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Błąd uploadu lub brak pliku']);
  exit;
}

$maxBytes = 12 * 1024 * 1024; 
if (($_FILES['image']['size'] ?? 0) > $maxBytes) {
  http_response_code(413);
  echo json_encode(['ok' => false, 'error' => 'Plik za duży (max 12MB)']);
  exit;
}

$allowed = [
  'image/jpeg' => 'jpg',
  'image/png'  => 'png',
  'image/webp' => 'webp',
  'image/gif'  => 'gif',
];

$tmp = $_FILES['image']['tmp_name'];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $tmp);
finfo_close($finfo);

if (!isset($allowed[$mime])) {
  http_response_code(415);
  echo json_encode(['ok' => false, 'error' => 'Nieobsługiwany format obrazu']);
  exit;
}
$imgInfo = @getimagesize($tmp);
if (!$imgInfo || empty($imgInfo[0]) || empty($imgInfo[1])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Plik nie jest poprawnym obrazem']);
  exit;
}
[$w, $h] = $imgInfo;

$uploadDirFs = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
if (!is_dir($uploadDirFs)) {
  mkdir($uploadDirFs, 0777, true);
}

$ext  = $allowed[$mime];
$name = 'img_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;

$destFs  = $uploadDirFs . DIRECTORY_SEPARATOR . $name;
$destUrl = 'uploads/' . $name;

if (!move_uploaded_file($tmp, $destFs)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Nie udało się zapisać pliku na serwerze']);
  exit;
}

echo json_encode([
  'ok' => true,
  'url' => $destUrl,
  'meta' => [
    'mime' => $mime,
    'width' => $w,
    'height' => $h,
  ]
]);
