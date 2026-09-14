<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../db.php';

function out_json(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_body(): array {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw ?: '', true);

    if (!is_array($json)) {
        $json = [];
    }

    return array_merge($_POST, $json);
}

function dt_value($value): string {
    if ($value instanceof DateTimeInterface) {
        return $value->format('Y-m-d H:i:s');
    }

    return trim((string)$value);
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

function format_time($value): string {
    $raw = dt_value($value);

    if ($raw === '') return '';

    try {
        return (new DateTime($raw))->format('H:i');
    } catch (Throwable $e) {
        return substr($raw, 11, 5);
    }
}

function get_employee_id(): ?int {
    if (!empty($_SESSION['employee_id'])) {
        return (int)$_SESSION['employee_id'];
    }

    if (($_SESSION['user_type'] ?? '') === 'employee' && !empty($_SESSION['user_id'])) {
        return (int)$_SESSION['user_id'];
    }

    return null;
}

function is_admin_user(): bool {
    return ($_SESSION['user_type'] ?? '') === 'admin';
}

function clean_status(string $status): string {
    $status = strtoupper(trim($status));

    $allowed = [
        'BOOKED',
        'CONFIRMED',
        'IN_PROGRESS',
        'DONE',
        'NOT_DONE'
    ];

    return in_array($status, $allowed, true) ? $status : 'DONE';
}

function money_value($value): float {
    $value = str_replace(',', '.', trim((string)$value));

    if ($value === '' || !is_numeric($value)) {
        return 0.0;
    }

    return max(0, (float)$value);
}
function safe_html($value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function build_prescription_html(array $data, bool $withButton = true): string {
    $clientName = safe_html($data['client_name'] ?? 'Pacjent');
    $date = safe_html($data['date'] ?? date('d.m.Y'));
    $time = safe_html($data['time'] ?? '');
    $visitId = safe_html($data['visit_id'] ?? '');
    $text = nl2br(safe_html($data['text'] ?? ''));

    $buttonHtml = $withButton
        ? '<div class="actions"><button onclick="window.print()">Drukuj / zapisz jako PDF</button></div>'
        : '';

    return '<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>Zalecenia / recepta</title>
<style>
  * {
    box-sizing: border-box;
  }
@page {
  size: A4;
  margin: 0;
}

body {
  margin: 0;
  padding: 38px;
  background: #f3f4f6;
  font-family: Arial, sans-serif;
  color: #0f172a;
}
  body {
    margin: 0;
    padding: 38px;
    background: #f3f4f6;
    font-family: Arial, sans-serif;
    color: #0f172a;
  }

  .page {
    max-width: 820px;
    min-height: 1080px;
    margin: 0 auto;
    background: #ffffff;
    padding: 38px 52px;
    border-radius: 0;
    box-shadow: 0 12px 32px rgba(15, 23, 42, .10);
  }

  .brand {
    text-align: center;
    margin-bottom: 20px;
  }

  .brand-name {
    display: inline-block;
    color: #6a9be8;
    font-family: Georgia, serif;
    font-size: 54px;
    font-style: italic;
    font-weight: 700;
    line-height: 1;
    border-bottom: 3px solid #6a9be8;
    padding: 0 42px 8px 42px;
  }

  h1 {
    margin: 30px 0 28px 0;
    text-align: center;
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
  }

  .meta {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 32px;
    font-size: 14px;
  }

  .meta td {
    padding: 5px 0;
    vertical-align: top;
  }

  .label {
    display: block;
    font-size: 11px;
    color: #64748b;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .3px;
    margin-bottom: 4px;
  }

  .value {
    font-size: 15px;
    color: #0f172a;
  }

  .section-title {
    margin: 0 0 12px 0;
    font-size: 17px;
    font-weight: 800;
  }

  .content {
    min-height: 520px;
    padding-top: 4px;
    font-size: 15px;
    line-height: 1.7;
    color: #111827;
  }

  .footer {
    margin-top: 50px;
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    color: #475569;
  }

  .footer td {
    vertical-align: bottom;
  }

  .sign {
    width: 260px;
    border-top: 1px solid #64748b;
    padding-top: 8px;
    text-align: center;
  }

  .actions {
    max-width: 820px;
    margin: 18px auto 0;
    text-align: right;
  }

  button {
    border: none;
    border-radius: 12px;
    background: #1d4ed8;
    color: #ffffff;
    padding: 12px 18px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
  }

  @media print {
    body {
      background: #ffffff;
      padding: 0;
    }

    .page {
      max-width: none;
      min-height: auto;
      box-shadow: none;
      padding: 28px 42px;
    }

    .actions {
      display: none;
    }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="brand">
      <div class="brand-name">VetMell</div>
    </div>

    <h1>Zalecenia / recepta po wizycie</h1>

    <table class="meta">
      <tr>
        <td style="width:50%;">
          <span class="label">Pacjent / klient</span>
          <span class="value">' . $clientName . '</span>
        </td>
        <td style="width:50%;">
          <span class="label">Numer wizyty</span>
          <span class="value">' . $visitId . '</span>
        </td>
      </tr>
      <tr>
        <td>
          <span class="label">Data wystawienia</span>
          <span class="value">' . $date . '</span>
        </td>
        <td>
          <span class="label">Godzina wizyty</span>
          <span class="value">' . $time . '</span>
        </td>
      </tr>
    </table>

    <div class="section-title">Treść zaleceń:</div>

    <div class="content">' . $text . '</div>

    <table class="footer">
      <tr>
        <td>
          Dokument wygenerowany elektronicznie.<br>
          Data wydruku: ' . date('d.m.Y H:i') . '
        </td>
        <td style="text-align:right;">
          <div class="sign">podpis lekarza</div>
        </td>
      </tr>
    </table>
  </div>

  ' . $buttonHtml . '
</body>
</html>';
}
function pdf_ascii_text($value): string {
    $text = (string)$value;
    $text = str_replace(["\r\n", "\r"], "\n", $text);

    $converted = @iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $text);

    if ($converted === false) {
        $converted = preg_replace('/[^\x20-\x7E\n]/', '', $text);
    }

    return (string)$converted;
}

function pdf_escape($value): string {
    $text = pdf_ascii_text($value);
    return str_replace(
        ["\\", "(", ")"],
        ["\\\\", "\\(", "\\)"],
        $text
    );
}

function pdf_text_cmd(float $x, float $y, string $font, int $size, string $text): string {
    return "BT /{$font} {$size} Tf "
        . number_format($x, 2, '.', '')
        . " "
        . number_format($y, 2, '.', '')
        . " Td ("
        . pdf_escape($text)
        . ") Tj ET\n";
}

function pdf_wrap_lines(string $text, int $limit = 82): array {
    $text = pdf_ascii_text($text);
    $parts = explode("\n", $text);
    $lines = [];

    foreach ($parts as $part) {
        $part = trim($part);

        if ($part === '') {
            $lines[] = '';
            continue;
        }

        $wrapped = wordwrap($part, $limit, "\n", true);
        foreach (explode("\n", $wrapped) as $line) {
            $lines[] = $line;
        }
    }

    return $lines;
}

function build_simple_prescription_pdf(array $data): string {
    $clientName = (string)($data['client_name'] ?? 'Pacjent');
    $visitId = (string)($data['visit_id'] ?? '');
    $date = (string)($data['date'] ?? date('d.m.Y'));
    $time = (string)($data['time'] ?? '');
    $contentText = (string)($data['text'] ?? '');

    $stream = "";

    /*
      Wygląd zbliżony do podglądu:
      - białe tło
      - logo VetMell na środku
      - niebieska linia pod logo
      - bez ramki wokół danych pacjenta
      - dane w dwóch kolumnach
    */

    // Logo VetMell
    $stream .= "0.38 0.57 0.91 rg\n";
    $stream .= pdf_text_cmd(198, 770, "F3", 42, "VetMell");

    // Linia pod logo
    $stream .= "0.38 0.57 0.91 RG\n";
    $stream .= "1.6 w\n";
    $stream .= "160 748 m 435 748 l S\n";

    // Tytuł
    $stream .= "0 0 0 rg\n";
    $stream .= pdf_text_cmd(135, 695, "F1", 20, "Zalecenia / recepta po wizycie");

    // Dane — lewa kolumna
    $stream .= "0.36 0.43 0.54 rg\n";
    $stream .= pdf_text_cmd(60, 645, "F1", 9, "PACJENT / KLIENT");
    $stream .= "0 0 0 rg\n";
    $stream .= pdf_text_cmd(60, 628, "F2", 11, $clientName);

    $stream .= "0.36 0.43 0.54 rg\n";
    $stream .= pdf_text_cmd(60, 600, "F1", 9, "DATA WYSTAWIENIA");
    $stream .= "0 0 0 rg\n";
    $stream .= pdf_text_cmd(60, 583, "F2", 11, $date);

    // Dane — prawa kolumna
    $stream .= "0.36 0.43 0.54 rg\n";
    $stream .= pdf_text_cmd(315, 645, "F1", 9, "NUMER WIZYTY");
    $stream .= "0 0 0 rg\n";
    $stream .= pdf_text_cmd(315, 628, "F2", 11, $visitId);

    $stream .= "0.36 0.43 0.54 rg\n";
    $stream .= pdf_text_cmd(315, 600, "F1", 9, "GODZINA WIZYTY");
    $stream .= "0 0 0 rg\n";
    $stream .= pdf_text_cmd(315, 583, "F2", 11, $time);

    // Treść zaleceń
    $stream .= "0 0 0 rg\n";
    $stream .= pdf_text_cmd(60, 525, "F1", 15, "Tresc zalecen:");

    $y = 495;
    $lines = pdf_wrap_lines($contentText, 86);

    foreach ($lines as $line) {
        if ($y < 120) {
            break;
        }

        if ($line === '') {
            $y -= 15;
            continue;
        }

        $stream .= pdf_text_cmd(60, $y, "F2", 11, $line);
        $y -= 16;
    }

    // Stopka jak w podglądzie
    $stream .= "0.35 0.42 0.50 rg\n";
    $stream .= pdf_text_cmd(60, 70, "F2", 9, "Dokument wygenerowany elektronicznie.");
    $stream .= pdf_text_cmd(60, 56, "F2", 9, "Data wydruku: " . date('d.m.Y H:i'));

    $stream .= "0.35 0.42 0.50 RG\n";
    $stream .= "330 74 m 520 74 l S\n";
    $stream .= pdf_text_cmd(390, 58, "F2", 9, "podpis lekarza");

    $objects = [];

    $objects[] = "<< /Type /Catalog /Pages 2 0 R >>";
    $objects[] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
    $objects[] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>";
    $objects[] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    $objects[] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    $objects[] = "<< /Type /Font /Subtype /Type1 /BaseFont /Times-BoldItalic /Encoding /WinAnsiEncoding >>";
    $objects[] = "<< /Length " . strlen($stream) . " >>\nstream\n" . $stream . "endstream";

    $pdf = "%PDF-1.4\n";
    $offsets = [0];

    foreach ($objects as $i => $object) {
        $offsets[] = strlen($pdf);
        $num = $i + 1;
        $pdf .= $num . " 0 obj\n" . $object . "\nendobj\n";
    }

    $xref = strlen($pdf);
    $pdf .= "xref\n";
    $pdf .= "0 " . (count($objects) + 1) . "\n";
    $pdf .= "0000000000 65535 f \n";

    for ($i = 1; $i <= count($objects); $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    }

    $pdf .= "trailer\n";
    $pdf .= "<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
    $pdf .= "startxref\n";
    $pdf .= $xref . "\n";
    $pdf .= "%%EOF";

    return $pdf;
}
function find_browser_for_pdf(): ?string {
    $paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ];

    foreach ($paths as $path) {
        if (is_file($path)) {
            return $path;
        }
    }

    return null;
}

function save_html_as_pdf(string $html, string $pdfPath): void {
    $browser = find_browser_for_pdf();

    if (!$browser) {
        throw new RuntimeException('Nie znaleziono Chrome ani Edge do wygenerowania PDF.');
    }

    $tmpDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'tmp';

    if (!is_dir($tmpDir)) {
        mkdir($tmpDir, 0777, true);
    }

    $htmlPath = $tmpDir . DIRECTORY_SEPARATOR . 'prescription_' . date('Ymd_His') . '_' . random_int(1000, 9999) . '.html';

    file_put_contents($htmlPath, $html);

    /*
      Ważne:
      --no-pdf-header-footer usuwa stopkę typu file:///C:/...
      --print-to-pdf-no-header jest dla starszych wersji Chrome/Edge
    */
    $cmd =
        '"' . $browser . '" ' .
        '--headless ' .
        '--disable-gpu ' .
        '--no-sandbox ' .
        '--no-pdf-header-footer ' .
        '--print-to-pdf-no-header ' .
        '--print-to-pdf="' . $pdfPath . '" ' .
        '"' . $htmlPath . '"';

    shell_exec($cmd);

    @unlink($htmlPath);

    if (!is_file($pdfPath) || filesize($pdfPath) <= 0) {
        throw new RuntimeException('Nie udało się zapisać pliku PDF.');
    }
}



$body = get_body();
$action = (string)($_GET['action'] ?? $body['action'] ?? '');

if (!isset($pdo) || !$pdo instanceof PDO) {
    out_json([
        'ok' => false,
        'message' => 'Brak połączenia z bazą danych.'
    ], 500);
}

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$employeeId = get_employee_id();
$isAdmin = is_admin_user();

if (!$employeeId && !$isAdmin) {
    out_json([
        'ok' => false,
        'message' => 'Brak zalogowanego pracownika.',
        'redirect' => '../final_view.php?file=login.xml'
    ], 401);
}

/*
  PODGLĄD RECEPTY — otwiera się jako zwykła strona do druku.
*/
if ($action === 'prescription_preview') {
    $payloadRaw = (string)($_POST['payload'] ?? '');
    $payload = json_decode($payloadRaw, true);

    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $visitId = (int)($payload['visit_id'] ?? 0);
    $content = trim((string)($payload['prescription_text'] ?? ''));

    if ($visitId <= 0) {
        header('Content-Type: text/html; charset=utf-8');
        echo 'Brak ID wizyty.';
        exit;
    }

    if ($content === '') {
        header('Content-Type: text/html; charset=utf-8');
        echo 'Brak treści recepty.';
        exit;
    }

    $previewData = [
        'visit_id' => $visitId,
        'client_name' => (string)($payload['client_name'] ?? 'Pacjent'),
        'date' => (string)($payload['date'] ?? date('d.m.Y')),
        'time' => (string)($payload['time'] ?? ''),
        'text' => $content
    ];

    header('Content-Type: text/html; charset=utf-8');
    echo build_prescription_html($previewData, true);
    exit;
}

try {
    /*
      POBRANIE DANYCH WIZYTY
    */
    if ($action === 'get') {
        $visitId = (int)($_GET['visit_id'] ?? 0);

        if ($visitId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID wizyty.'
            ], 422);
        }

        $sql = "
            SELECT TOP 1
                v.id,
                v.employee_id,
                v.client_id,
                v.pet_id,
                v.start_datetime,
                v.duration_min,
                v.visit_status,
                v.notes,
                v.total_price,

                c.first_name AS client_first_name,
                c.last_name AS client_last_name,
                c.email AS client_email,
                c.phone AS client_phone
            FROM dbo.visit v
            LEFT JOIN dbo.client c ON c.id = v.client_id
            WHERE v.id = :visit_id
        ";

        $params = [
            ':visit_id' => $visitId
        ];

        if (!$isAdmin) {
            $sql .= " AND v.employee_id = :employee_id";
            $params[':employee_id'] = $employeeId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            out_json([
                'ok' => false,
                'message' => 'Nie znaleziono wizyty.'
            ], 404);
        }

        $clientName = trim((string)($row['client_first_name'] ?? '') . ' ' . (string)($row['client_last_name'] ?? ''));

        if ($clientName === '') {
            $clientName = $row['client_id'] !== null ? 'Klient #' . $row['client_id'] : 'Brak klienta';
        }

        $visit = [
            'id' => (int)$row['id'],
            'employee_id' => $row['employee_id'] !== null ? (int)$row['employee_id'] : null,
            'client_id' => $row['client_id'] !== null ? (int)$row['client_id'] : null,
            'pet_id' => $row['pet_id'] !== null ? (int)$row['pet_id'] : null,
            'date' => format_date($row['start_datetime']),
            'time' => format_time($row['start_datetime']),
            'duration_min' => $row['duration_min'] !== null ? (int)$row['duration_min'] : null,
            'status' => (string)($row['visit_status'] ?? ''),
            'notes' => (string)($row['notes'] ?? ''),
            'total_price' => $row['total_price'] !== null ? (float)$row['total_price'] : 0,
            'client_name' => $clientName,
            'client_phone' => (string)($row['client_phone'] ?? ''),
            'client_email' => (string)($row['client_email'] ?? ''),
        ];

        $servicesStmt = $pdo->query("
            SELECT
                id,
                name,
                price,
                default_duration_min
            FROM dbo.service
            WHERE COALESCE(is_active, 1) = 1
            ORDER BY name ASC
        ");

        $services = [];

        foreach ($servicesStmt->fetchAll(PDO::FETCH_ASSOC) as $srv) {
            $services[] = [
                'id' => (int)$srv['id'],
                'name' => (string)$srv['name'],
                'price' => (float)($srv['price'] ?? 0),
                'default_duration_min' => (int)($srv['default_duration_min'] ?? 0),
            ];
        }

        out_json([
            'ok' => true,
            'visit' => $visit,
            'services' => $services
        ]);
    }

    /*
      ZAPIS WIZYTY
    */
    if ($action === 'save') {
        $visitId = (int)($body['visit_id'] ?? 0);
        $historyText = trim((string)($body['history_text'] ?? ''));
        $status = clean_status((string)($body['status'] ?? 'DONE'));
        $totalPrice = money_value($body['total_price'] ?? 0);
        $serviceIds = $body['service_ids'] ?? [];

        if (!is_array($serviceIds)) {
            $serviceIds = [];
        }

        $serviceIds = array_values(array_unique(array_filter(array_map('intval', $serviceIds))));

        if ($visitId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID wizyty.'
            ], 422);
        }

        if ($historyText === '') {
            out_json([
                'ok' => false,
                'message' => 'Opis wizyty nie może być pusty.'
            ], 422);
        }

        $sql = "
            SELECT TOP 1
                id,
                employee_id,
                client_id
            FROM dbo.visit
            WHERE id = :visit_id
        ";

        $params = [
            ':visit_id' => $visitId
        ];

        if (!$isAdmin) {
            $sql .= " AND employee_id = :employee_id";
            $params[':employee_id'] = $employeeId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $visit = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$visit) {
            out_json([
                'ok' => false,
                'message' => 'Nie znaleziono wizyty.'
            ], 404);
        }

        $visitEmployeeId = $visit['employee_id'] !== null ? (int)$visit['employee_id'] : $employeeId;
        $clientId = $visit['client_id'] !== null ? (int)$visit['client_id'] : null;

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            UPDATE dbo.visit
            SET
                visit_status = :status,
                total_price = :total_price,
                notes = :notes
            WHERE id = :visit_id
        ");

        $stmt->execute([
            ':status' => $status,
            ':total_price' => $totalPrice,
            ':notes' => $historyText,
            ':visit_id' => $visitId
        ]);

        $stmt = $pdo->prepare("
            INSERT INTO dbo.visit_history
                (
                    visit_id,
                    created_at,
                    employee_id,
                    client_id,
                    text,
                    history_type,
                    attachment_id
                )
            VALUES
                (
                    :visit_id,
                    SYSDATETIME(),
                    :employee_id,
                    :client_id,
                    :text,
                    :history_type,
                    NULL
                )
        ");

        $stmt->execute([
            ':visit_id' => $visitId,
            ':employee_id' => $visitEmployeeId,
            ':client_id' => $clientId,
            ':text' => $historyText,
            ':history_type' => 'NOTE'
        ]);

        /*
          Jeżeli tabela visit_service istnieje, zapisujemy zaznaczone usługi.
          Jeśli jej nie ma albo ma inną strukturę, nie blokujemy zapisu wizyty.
        */
        try {
            $pdo->prepare("DELETE FROM dbo.visit_service WHERE visit_id = :visit_id")
                ->execute([':visit_id' => $visitId]);

            if ($serviceIds) {
                $insertService = $pdo->prepare("
                    INSERT INTO dbo.visit_service (visit_id, service_id)
                    VALUES (:visit_id, :service_id)
                ");

                foreach ($serviceIds as $serviceId) {
                    $insertService->execute([
                        ':visit_id' => $visitId,
                        ':service_id' => $serviceId
                    ]);
                }
            }
        } catch (Throwable $e) {
            error_log('[wizyta_pacjent.php visit_service] ' . $e->getMessage());
        }

        /*
  Automatyczne utworzenie płatności:
  gdy lekarz zapisze wizytę jako DONE/Zrealizowana i wpisze cenę,
  w tabeli payment powstaje wpis oczekujący na opłatę.
  Status w bazie zapisujemy po angielsku: PENDING.
*/
if ($status === 'DONE' && $totalPrice > 0) {
            $paymentStmt = $pdo->prepare("
                SELECT TOP 1
                    id,
                    status
                FROM dbo.payment
                WHERE visit_id = :visit_id
                ORDER BY id DESC
            ");

            $paymentStmt->execute([
                ':visit_id' => $visitId
            ]);

            $existingPayment = $paymentStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingPayment) {
                $paymentStatus = strtoupper(trim((string)($existingPayment['status'] ?? '')));

                $alreadyPaid = in_array($paymentStatus, [
                    'PAID',
                    'ZAPLACONE',
                    'ZAPŁACONE',
                    'DONE',
                    'COMPLETED'
                ], true);

                if (!$alreadyPaid) {
                    $updatePayment = $pdo->prepare("
                        UPDATE dbo.payment
                        SET
                            amount = :amount,
                            paid_at = NULL,
                            status = 'PENDING'
                        WHERE id = :id
                    ");

                    $updatePayment->execute([
                        ':amount' => $totalPrice,
                        ':id' => (int)$existingPayment['id']
                    ]);
                }
            } else {
                $insertPayment = $pdo->prepare("
                    INSERT INTO dbo.payment
                        (visit_id, amount, method, paid_at, status)
                    VALUES
                        (:visit_id, :amount, :method, NULL, 'PENDING')
                ");

                $insertPayment->execute([
                    ':visit_id' => $visitId,
                    ':amount' => $totalPrice,
                    ':method' => ''
                ]);
            }
        }

        $pdo->commit();

        out_json([
            'ok' => true,
            'message' => 'Zapisano wizytę.'
        ]);
    }

    /*
      ZAPIS RECEPTY / ZALECEŃ DO HISTORII
      attachment_id zapisze się tylko wtedy, kiedy JS wyśle pdf_base64.
      Obecnie JS wysyła pusty pdf_base64, więc attachment_id będzie NULL.
    */
    if ($action === 'save_prescription') {
        $visitId = (int)($body['visit_id'] ?? $_GET['visit_id'] ?? 0);
        $content = trim((string)($body['content'] ?? ''));
        $pdfBase64 = trim((string)($body['pdf_base64'] ?? ''));

        if ($visitId <= 0) {
            out_json([
                'ok' => false,
                'message' => 'Brak ID wizyty.'
            ], 422);
        }

        if ($content === '') {
            out_json([
                'ok' => false,
                'message' => 'Nie wpisano treści recepty/zaleceń.'
            ], 422);
        }

        $sql = "
            SELECT TOP 1
                id,
                employee_id,
                client_id
            FROM dbo.visit
            WHERE id = :visit_id
        ";

        $params = [
            ':visit_id' => $visitId
        ];

        if (!$isAdmin) {
            $sql .= " AND employee_id = :employee_id";
            $params[':employee_id'] = $employeeId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $visit = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$visit) {
            out_json([
                'ok' => false,
                'message' => 'Nie znaleziono wizyty albo nie należy do zalogowanego lekarza.'
            ], 404);
        }

        $visitEmployeeId = $visit['employee_id'] !== null ? (int)$visit['employee_id'] : $employeeId;
        $clientId = $visit['client_id'] !== null ? (int)$visit['client_id'] : null;
        $attachmentId = null;

        try {
            $pdo->beginTransaction();

            if ($pdfBase64 !== '') {
                $pdfBase64 = preg_replace('#^data:application/pdf;base64,#', '', $pdfBase64);
                $pdfBinary = base64_decode($pdfBase64, true);

                if ($pdfBinary === false) {
                    throw new RuntimeException('Niepoprawny plik PDF.');
                }

                $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'prescriptions';

                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $originalFilename = 'prescription_visit_' . $visitId . '_' . date('Ymd_His') . '.pdf';
                $serverPath = $uploadDir . DIRECTORY_SEPARATOR . $originalFilename;

                file_put_contents($serverPath, $pdfBinary);

                $filePath = 'projects/uploads/prescriptions/' . $originalFilename;

                $stmt = $pdo->prepare("
                    INSERT INTO dbo.attachment
                        (visit_id, file_path, mime_type, original_filename, uploaded_at)
                    OUTPUT INSERTED.id
                    VALUES
                        (:visit_id, :file_path, :mime_type, :original_filename, SYSDATETIME())
                ");

                $stmt->execute([
                    ':visit_id' => $visitId,
                    ':file_path' => $filePath,
                    ':mime_type' => 'application/pdf',
                    ':original_filename' => $originalFilename
                ]);

                $attachmentId = (int)$stmt->fetchColumn();
            }

            $historyText = "Prescription / recommendations:\n\n" . $content;

            $stmt = $pdo->prepare("
                INSERT INTO dbo.visit_history
                    (
                        visit_id,
                        created_at,
                        employee_id,
                        client_id,
                        text,
                        history_type,
                        attachment_id
                    )
                VALUES
                    (
                        :visit_id,
                        SYSDATETIME(),
                        :employee_id,
                        :client_id,
                        :text,
                        :history_type,
                        :attachment_id
                    )
            ");

            $stmt->execute([
                ':visit_id' => $visitId,
                ':employee_id' => $visitEmployeeId,
                ':client_id' => $clientId,
                ':text' => $historyText,
                ':history_type' => 'PRESCRIPTION',
                ':attachment_id' => $attachmentId
            ]);

            $pdo->commit();

            out_json([
                'ok' => true,
                'message' => 'Recepta została zapisana w historii wizyty.',
                'attachment_id' => $attachmentId
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            error_log('[save_prescription] ' . $e->getMessage());

            out_json([
                'ok' => false,
                'message' => 'Błąd zapisu recepty.'
            ], 500);
        }
    }
if ($action === 'generate_prescription_pdf') {
    $visitId = (int)($body['visit_id'] ?? 0);
    $content = trim((string)($body['content'] ?? ''));

    if ($visitId <= 0) {
        out_json([
            'ok' => false,
            'message' => 'Brak ID wizyty.'
        ], 422);
    }

    if ($content === '') {
        out_json([
            'ok' => false,
            'message' => 'Wpisz treść recepty/zaleceń.'
        ], 422);
    }

    $sql = "
        SELECT TOP 1
            v.id,
            v.employee_id,
            v.client_id,
            v.start_datetime,

            c.first_name AS client_first_name,
            c.last_name AS client_last_name
        FROM dbo.visit v
        LEFT JOIN dbo.client c ON c.id = v.client_id
        WHERE v.id = :visit_id
    ";

    $params = [
        ':visit_id' => $visitId
    ];

    if (!$isAdmin) {
        $sql .= " AND v.employee_id = :employee_id";
        $params[':employee_id'] = $employeeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $visit = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$visit) {
        out_json([
            'ok' => false,
            'message' => 'Nie znaleziono wizyty albo nie należy do zalogowanego lekarza.'
        ], 404);
    }

    $visitEmployeeId = $visit['employee_id'] !== null ? (int)$visit['employee_id'] : $employeeId;
    $clientId = $visit['client_id'] !== null ? (int)$visit['client_id'] : null;

    $clientName = trim((string)($visit['client_first_name'] ?? '') . ' ' . (string)($visit['client_last_name'] ?? ''));

    if ($clientName === '') {
        $clientName = 'Pacjent';
    }

    $pdfData = [
        'visit_id' => $visitId,
        'client_name' => $clientName,
        'date' => format_date($visit['start_datetime'] ?? date('Y-m-d')),
        'time' => format_time($visit['start_datetime'] ?? ''),
        'text' => $content
    ];

    try {
        $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'prescriptions';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $originalFilename = 'prescription_visit_' . $visitId . '_' . date('Ymd_His') . '.pdf';
        $serverPath = $uploadDir . DIRECTORY_SEPARATOR . $originalFilename;
        $filePath = 'projects/uploads/prescriptions/' . $originalFilename;

        $htmlForPdf = build_prescription_html($pdfData, false);

save_html_as_pdf($htmlForPdf, $serverPath);

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO dbo.attachment
                (visit_id, file_path, mime_type, original_filename, uploaded_at)
            OUTPUT INSERTED.id
            VALUES
                (:visit_id, :file_path, :mime_type, :original_filename, SYSDATETIME())
        ");

        $stmt->execute([
            ':visit_id' => $visitId,
            ':file_path' => $filePath,
            ':mime_type' => 'application/pdf',
            ':original_filename' => $originalFilename
        ]);

        $attachmentId = (int)$stmt->fetchColumn();

        $historyText = "Prescription / recommendations:\n\n" . $content;

        $stmt = $pdo->prepare("
            INSERT INTO dbo.visit_history
                (
                    visit_id,
                    created_at,
                    employee_id,
                    client_id,
                    text,
                    history_type,
                    attachment_id
                )
            VALUES
                (
                    :visit_id,
                    SYSDATETIME(),
                    :employee_id,
                    :client_id,
                    :text,
                    :history_type,
                    :attachment_id
                )
        ");

        $stmt->execute([
            ':visit_id' => $visitId,
            ':employee_id' => $visitEmployeeId,
            ':client_id' => $clientId,
            ':text' => $historyText,
            ':history_type' => 'PRESCRIPTION',
            ':attachment_id' => $attachmentId
        ]);

        $pdo->commit();

        out_json([
            'ok' => true,
            'message' => 'Recepta PDF została wygenerowana i zapisana.',
            'attachment_id' => $attachmentId,
            'file_path' => $filePath,
            'filename' => $originalFilename
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log('[generate_prescription_pdf] ' . $e->getMessage());

        out_json([
            'ok' => false,
            'message' => 'Błąd generowania recepty PDF.'
        ], 500);
    }
}
    out_json([
        'ok' => false,
        'message' => 'Nieznana akcja.'
    ], 400);
} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('[wizyta_pacjent.php] ' . $e->getMessage());

    out_json([
        'ok' => false,
        'message' => 'Błąd obsługi wizyty.'
    ], 500);
}