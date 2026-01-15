<?php
session_start();

$projectsDir = __DIR__ . DIRECTORY_SEPARATOR . 'projects';
if (!is_dir($projectsDir)) {
  mkdir($projectsDir, 0777, true);
}

function sg_clean_file_name(string $name): string {
  $name = trim($name);
  $name = basename($name);
  $name = preg_replace('/[^a-zA-Z0-9._-]/', '_', $name);
  if ($name === '') $name = 'projekt';
  if (!preg_match('/\.xml$/i', $name)) $name .= '.xml';
  return $name;
}

function sg_make_default_project_name(): string {
  return 'projekt_' . date('Ymd_His') . '.xml';
}

function sg_blank_xml(): string {
  $ts = date('Y-m-d H:i:s');
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<customPage>\n  <generatedAt>{$ts}</generatedAt>\n</customPage>\n";
}

$legacyXml = __DIR__ . DIRECTORY_SEPARATOR . 'generated_page.xml';

$files = [];
foreach (glob($projectsDir . DIRECTORY_SEPARATOR . '*.xml') as $p) {
  $files[] = basename($p);
}
sort($files, SORT_NATURAL | SORT_FLAG_CASE);

if (file_exists($legacyXml)) {
  array_unshift($files, 'generated_page.xml');
}

$err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $action = $_POST['action'] ?? '';

  if ($action === 'create') {
    $rawName = (string)($_POST['new_name'] ?? '');
    $fileName = sg_clean_file_name($rawName !== '' ? $rawName : sg_make_default_project_name());

    $targetPath = ($fileName === 'generated_page.xml')
      ? $legacyXml
      : ($projectsDir . DIRECTORY_SEPARATOR . $fileName);

    if (!file_exists($targetPath)) {
      file_put_contents($targetPath, sg_blank_xml());
    }

    $_SESSION['sg_xml_file'] = $fileName;
    header('Location: super_generator.php?file=' . urlencode($fileName));
    exit;
  }

  if ($action === 'open') {
    $picked = sg_clean_file_name((string)($_POST['pick_file'] ?? ''));
    if ($picked === '') {
      $err = 'Wybierz plik.';
    } else {
      $_SESSION['sg_xml_file'] = $picked;
      header('Location: super_generator.php?file=' . urlencode($picked));
      exit;
    }
  }
}
?>
<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Start projektu</title>
  <style>
    body{margin:0;font-family:'Segoe UI',sans-serif;background:#f3f4f6;color:#0f172a;}
    .wrap{max-width:980px;margin:40px auto;padding:0 16px;}
    .top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;}
    .title{font-size:22px;font-weight:800;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 10px 26px rgba(2,6,23,.08);padding:16px;}
    .card h2{margin:0 0 10px;font-size:16px;}
    .muted{color:#64748b;font-size:12px;margin-top:4px;}
    label{display:block;font-size:12px;color:#334155;margin:10px 0 6px;}
    input,select{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;box-sizing:border-box;}
    .row{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;}
    button,a.btn{
      display:inline-flex;align-items:center;justify-content:center;
      padding:10px 14px;border-radius:10px;border:0;
      background:#111827;color:#fff;font-weight:800;cursor:pointer;text-decoration:none;
    }
    button.secondary{background:#2563eb;}
    a.btn.gray{background:#334155;}
    .err{background:#fee2e2;color:#991b1b;border:1px solid #fecaca;padding:10px 12px;border-radius:12px;margin-bottom:14px;}
    @media (max-width:860px){.grid{grid-template-columns:1fr;}}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="title">Panel startowy</div>
      <div class="muted">Wybierz projekt XML lub utwórz nowy.</div>
    </div>

    <?php if ($err !== ''): ?>
      <div class="err"><?= htmlspecialchars($err) ?></div>
    <?php endif; ?>

    <div class="grid">
      <div class="card">
        <h2>Utwórz nowy projekt</h2>
        <form method="post">
          <input type="hidden" name="action" value="create" />
          <label>Nazwa pliku (opcjonalnie)</label>
          <input name="new_name" placeholder="np. landing_v1.xml" />
          <div class="muted">Plik zostanie zapisany w folderze <b>projects</b> (chyba że wpiszesz generated_page.xml).</div>

          <div class="row">
            <button type="submit" class="secondary">Utwórz i otwórz</button>
          </div>
        </form>
      </div>

      <div class="card">
        <h2>Otwórz istniejący projekt</h2>
        <form method="post">
          <input type="hidden" name="action" value="open" />
          <label>Wybierz plik XML</label>
          <select name="pick_file">
            <option value="">— wybierz —</option>
            <?php foreach ($files as $f): ?>
              <option value="<?= htmlspecialchars($f, ENT_QUOTES) ?>"><?= htmlspecialchars($f) ?></option>
            <?php endforeach; ?>
          </select>
          <div class="row">
            <button type="submit">Otwórz w edytorze</button>
            <a class="btn gray" href="final_view.php" title="Otworzy final_view wg aktualnie wybranego projektu (session)">Final view</a>
          </div>
          <div class="muted">Final view użyje tego samego pliku, bo zapisujemy wybór w sesji.</div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
