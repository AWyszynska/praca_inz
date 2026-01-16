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
  if ($name === '') $name = 'generated_page.xml';
  if (!preg_match('/\.xml$/i', $name)) $name .= '.xml';
  return $name;
}
function sg_norm_css_value(string $s): string {
  $s = trim($s);
  if ($s === '') return '';
  $s = str_replace('"', "'", $s);
  $s = preg_replace('/\s+/', ' ', $s);
  $s = preg_replace('/,\s+/', ',', $s);
  return $s;
}

function sg_add_child_compact(SimpleXMLElement $node, string $name, $val, $default = null, bool $escape = false): void {
  $v = (string)($val ?? '');

  if ($default === null) {
    if (trim($v) === '') return;
  } else {
    $dv = (string)$default;

    $cmpV = $v;
    $cmpD = $dv;
    $toNorm = ['bg','border','borderRadius','boxShadow','fontFamily','color','backdropFilter'];
    if (in_array($name, $toNorm, true)) {
      $cmpV = sg_norm_css_value($v);
      $cmpD = sg_norm_css_value($dv);
    }

    if ($cmpV === $cmpD) return;
  }

  $node->addChild($name, $escape ? htmlspecialchars($v, ENT_QUOTES | ENT_XML1, 'UTF-8') : $v);
}


$requested = isset($_GET['file']) ? (string)$_GET['file'] : '';
if ($requested !== '') {
  $_SESSION['sg_xml_file'] = sg_clean_file_name($requested);
}

$selected = sg_clean_file_name((string)($_SESSION['sg_xml_file'] ?? 'generated_page.xml'));

$legacyXml = __DIR__ . DIRECTORY_SEPARATOR . 'generated_page.xml';
$newXmlFile = ($selected === 'generated_page.xml')
  ? $legacyXml
  : ($projectsDir . DIRECTORY_SEPARATOR . $selected);

$FOOTER_PLUGIN_PART = 'functions';
require_once __DIR__ . '/footer_plugin.php';
if (($_GET['action'] ?? '') === 'read_xml') {
  $file = sg_clean_file_name((string)($_GET['file'] ?? ''));
  $legacyXml = __DIR__ . DIRECTORY_SEPARATOR . 'generated_page.xml';
  $path = ($file === 'generated_page.xml')
    ? $legacyXml
    : (__DIR__ . DIRECTORY_SEPARATOR . 'projects' . DIRECTORY_SEPARATOR . $file);

  if (!is_file($path)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Plik nie istnieje']);
    exit;
  }

  header('Content-Type: application/xml; charset=utf-8');
  readfile($path);
  exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'generate_xml') {
    $elements = json_decode($_POST['elements'], true);
    $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><customPage></customPage>');
    $xml->addChild('generatedAt', date('Y-m-d H:i:s'));
    $rawBase = trim((string)($_POST['baseFile'] ?? ''));
$baseFile = $rawBase !== '' ? sg_clean_file_name($rawBase) : '';
if ($baseFile !== '' && $baseFile !== $selected) {
  $xml->addChild('extends', $baseFile);
}


    if (!empty($elements)) {

function saveRecursive($items, $xmlNode) {
  foreach ($items as $item) {
    if (!is_array($item)) continue;
    if (empty($item['id']) || empty($item['type'])) continue;

    $type = (string)$item['type'];

    $el = $xmlNode->addChild('element');
    $el->addAttribute('id', (string)$item['id']);
    $el->addAttribute('type', $type);

    sg_add_child_compact($el, 'htmlId', $item['htmlId'] ?? '', '', true);
    sg_add_child_compact($el, 'htmlClass', $item['htmlClass'] ?? '', '', true);

    $el->addChild('x', $item['x'] ?? 0);
    $el->addChild('y', $item['y'] ?? 0);
    $el->addChild('w', $item['w'] ?? 'auto');
    $el->addChild('h', $item['h'] ?? 'auto');

$defBg = 'transparent';
$defBorder = 'none';
$defRadius = '0px';
$defShadow = 'none';
$defOpacity = '1';
$defBackdrop = 'none';

if ($type === 'block') {
  $defBg     = 'rgb(255, 255, 255)';
  $defBorder = '1px solid rgb(226, 232, 240)';
  $defRadius = '16px';
  $defShadow = 'rgba(0, 0, 0, 0.12) 0px 12px 30px 0px';
}

sg_add_child_compact($el, 'bg', $item['bg'] ?? $defBg, $defBg);
sg_add_child_compact($el, 'border', $item['border'] ?? $defBorder, $defBorder);
sg_add_child_compact($el, 'zIndex', $item['zIndex'] ?? '0', '0');
sg_add_child_compact($el, 'borderRadius', $item['borderRadius'] ?? $defRadius, $defRadius);
sg_add_child_compact($el, 'boxShadow', $item['boxShadow'] ?? $defShadow, $defShadow);
sg_add_child_compact($el, 'opacity', $item['opacity'] ?? $defOpacity, $defOpacity);
sg_add_child_compact($el, 'backdropFilter', $item['backdropFilter'] ?? $defBackdrop, $defBackdrop);

    switch ($type) {

      case 'text':
        sg_add_child_compact($el, 'content', $item['content'] ?? '', '', true);

        sg_add_child_compact($el, 'color', $item['color'] ?? 'rgb(0, 0, 0)', 'rgb(0, 0, 0)');
        sg_add_child_compact($el, 'fontSize', $item['fontSize'] ?? '20px', '20px');
        sg_add_child_compact($el, 'fontFamily', $item['fontFamily'] ?? "'Segoe UI', sans-serif", "'Segoe UI', sans-serif");


        sg_add_child_compact($el, 'fontWeight', $item['fontWeight'] ?? '400', '400');
        sg_add_child_compact($el, 'fontStyle', $item['fontStyle'] ?? 'normal', 'normal');
        sg_add_child_compact($el, 'textDecoration', $item['textDecoration'] ?? 'none', 'none');
        sg_add_child_compact($el, 'textTransform', $item['textTransform'] ?? 'none', 'none');

        sg_add_child_compact($el, 'textAlign', $item['textAlign'] ?? 'left', 'left');
        sg_add_child_compact($el, 'lineHeight', $item['lineHeight'] ?? '1.2', '1.2');
        sg_add_child_compact($el, 'letterSpacing', $item['letterSpacing'] ?? 'normal', 'normal');
        sg_add_child_compact($el, 'padding', $item['padding'] ?? '0px', '0px');
        break;

      case 'image':
        sg_add_child_compact($el, 'content', $item['content'] ?? '', '', true);

        sg_add_child_compact($el, 'imgFit', $item['imgFit'] ?? 'cover', 'cover');
        sg_add_child_compact($el, 'imgPosX', $item['imgPosX'] ?? '50', '50');
        sg_add_child_compact($el, 'imgPosY', $item['imgPosY'] ?? '50', '50');
        sg_add_child_compact($el, 'imgRotate', $item['imgRotate'] ?? '0', '0');
        sg_add_child_compact($el, 'imgScale', $item['imgScale'] ?? '1', '1');
        sg_add_child_compact($el, 'imgFlipX', $item['imgFlipX'] ?? '0', '0');
        sg_add_child_compact($el, 'imgFlipY', $item['imgFlipY'] ?? '0', '0');

        sg_add_child_compact($el, 'imgBlur', $item['imgBlur'] ?? '0', '0');
        sg_add_child_compact($el, 'imgGray', $item['imgGray'] ?? '0', '0');
        sg_add_child_compact($el, 'imgSepia', $item['imgSepia'] ?? '0', '0');
        sg_add_child_compact($el, 'imgBrightness', $item['imgBrightness'] ?? '100', '100');
        sg_add_child_compact($el, 'imgContrast', $item['imgContrast'] ?? '100', '100');
        sg_add_child_compact($el, 'imgSaturate', $item['imgSaturate'] ?? '100', '100');
        break;

      case 'button':
        sg_add_child_compact($el, 'btnText', $item['btnText'] ?? 'Kliknij', 'Kliknij', true);
        sg_add_child_compact($el, 'btnAction', $item['btnAction'] ?? 'link', 'link');
        sg_add_child_compact($el, 'btnUrl', $item['btnUrl'] ?? 'https://', 'https://', true);
        sg_add_child_compact($el, 'btnTarget', $item['btnTarget'] ?? '_blank', '_blank');

        sg_add_child_compact($el, 'btnScrollTargetId', $item['btnScrollTargetId'] ?? '', '', true);
        sg_add_child_compact($el, 'btnScrollOffset', $item['btnScrollOffset'] ?? '0', '0');

        sg_add_child_compact($el, 'btnPreset', $item['btnPreset'] ?? 'primary', 'primary');
        sg_add_child_compact($el, 'btnSize', $item['btnSize'] ?? 'md', 'md');
        sg_add_child_compact($el, 'btnIcon', $item['btnIcon'] ?? '', '', true);
        sg_add_child_compact($el, 'btnIconPos', $item['btnIconPos'] ?? 'left', 'left');

        sg_add_child_compact($el, 'btnRadius', $item['btnRadius'] ?? '10', '10');
        sg_add_child_compact($el, 'btnBorderW', $item['btnBorderW'] ?? '1', '1');
        sg_add_child_compact($el, 'btnWeight', $item['btnWeight'] ?? '700', '700');
        sg_add_child_compact($el, 'btnAlign', $item['btnAlign'] ?? 'center', 'center');
        sg_add_child_compact($el, 'btnUpper', $item['btnUpper'] ?? '0', '0');
        sg_add_child_compact($el, 'btnLetter', $item['btnLetter'] ?? '0', '0');

        sg_add_child_compact($el, 'btnBg', $item['btnBg'] ?? '#156fe5', '#156fe5');
        sg_add_child_compact($el, 'btnColor', $item['btnColor'] ?? '#ffffff', '#ffffff');
        sg_add_child_compact($el, 'btnBorderColor', $item['btnBorderColor'] ?? '#156fe5', '#156fe5');
        sg_add_child_compact($el, 'btnHoverBg', $item['btnHoverBg'] ?? '#0f5bd1', '#0f5bd1');
        sg_add_child_compact($el, 'btnHoverColor', $item['btnHoverColor'] ?? '#ffffff', '#ffffff');
        sg_add_child_compact($el, 'btnShadow', $item['btnShadow'] ?? 'soft', 'soft');

        sg_add_child_compact($el, 'btnGradient', $item['btnGradient'] ?? '0', '0');
        sg_add_child_compact($el, 'btnGradFrom', $item['btnGradFrom'] ?? '#156fe5', '#156fe5');
        sg_add_child_compact($el, 'btnGradTo', $item['btnGradTo'] ?? '#22c55e', '#22c55e');
        sg_add_child_compact($el, 'btnGradAngle', $item['btnGradAngle'] ?? '135', '135');

        sg_add_child_compact($el, 'btnName', $item['btnName'] ?? '', '', true);
        sg_add_child_compact($el, 'btnDisabled', $item['btnDisabled'] ?? '0', '0');
        break;

      case 'nav':
        sg_add_child_compact($el, 'navItems', $item['navItems'] ?? '', '', true);
        sg_add_child_compact($el, 'navOrientation', $item['navOrientation'] ?? 'horizontal', 'horizontal');
        sg_add_child_compact($el, 'navAlign', $item['navAlign'] ?? 'left', 'left');
        sg_add_child_compact($el, 'navGap', $item['navGap'] ?? '10', '10');
        sg_add_child_compact($el, 'navPad', $item['navPad'] ?? '10', '10');

        sg_add_child_compact($el, 'navLinkPadX', $item['navLinkPadX'] ?? '12', '12');
        sg_add_child_compact($el, 'navLinkPadY', $item['navLinkPadY'] ?? '8', '8');
        sg_add_child_compact($el, 'navLinkRadius', $item['navLinkRadius'] ?? '8', '8');
        sg_add_child_compact($el, 'navUnderline', $item['navUnderline'] ?? '0', '0');

        sg_add_child_compact($el, 'navLinkColor', $item['navLinkColor'] ?? '#ffffff', '#ffffff');
        sg_add_child_compact($el, 'navHoverBg', $item['navHoverBg'] ?? 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)', true);
        sg_add_child_compact($el, 'navHoverColor', $item['navHoverColor'] ?? '#ffffff', '#ffffff');
        sg_add_child_compact($el, 'navActiveBg', $item['navActiveBg'] ?? 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)', true);
        sg_add_child_compact($el, 'navActiveColor', $item['navActiveColor'] ?? '#ffffff', '#ffffff');
        sg_add_child_compact($el, 'navActiveMode', $item['navActiveMode'] ?? 'query_page', 'query_page');
        break;

      case 'block':
          sg_add_child_compact($el, 'blockUi', $item['blockUi'] ?? '', '', true);
      break;

      case 'calendar':
        sg_add_child_compact($el, 'calYear', $item['calYear'] ?? '2026', '2026');
        sg_add_child_compact($el, 'calMonth', $item['calMonth'] ?? '1', '1');
        sg_add_child_compact($el, 'calWeekStart', $item['calWeekStart'] ?? 'mon', 'mon');
        sg_add_child_compact($el, 'calTheme', $item['calTheme'] ?? 'blue', 'blue');

        sg_add_child_compact($el, 'calBgA', $item['calBgA'] ?? '', '', true);
        sg_add_child_compact($el, 'calBgB', $item['calBgB'] ?? '', '', true);
        sg_add_child_compact($el, 'calAccent', $item['calAccent'] ?? '', '', true);

        sg_add_child_compact($el, 'calRadius', $item['calRadius'] ?? '30', '30');
        sg_add_child_compact($el, 'calOuterPad', $item['calOuterPad'] ?? '22', '22');
        sg_add_child_compact($el, 'calGap', $item['calGap'] ?? '10', '10');
        sg_add_child_compact($el, 'calCellRadius', $item['calCellRadius'] ?? '16', '16');

        sg_add_child_compact($el, 'calMonthSize', $item['calMonthSize'] ?? '34', '34');
        sg_add_child_compact($el, 'calDaySize', $item['calDaySize'] ?? '18', '18');
        sg_add_child_compact($el, 'calWeekSize', $item['calWeekSize'] ?? '14', '14');
        sg_add_child_compact($el, 'calNavSize', $item['calNavSize'] ?? '44', '44');

        sg_add_child_compact($el, 'calShowOutside', $item['calShowOutside'] ?? '1', '1');
        sg_add_child_compact($el, 'calShowToday', $item['calShowToday'] ?? '1', '1');
        break;

      case 'slider':
        sg_add_child_compact($el, 'sliderLabel', $item['sliderLabel'] ?? '', '', true);
        sg_add_child_compact($el, 'sliderUnit', $item['sliderUnit'] ?? '', '', true);

        sg_add_child_compact($el, 'sliderMin', $item['sliderMin'] ?? '0', '0');
        sg_add_child_compact($el, 'sliderMax', $item['sliderMax'] ?? '100', '100');
        sg_add_child_compact($el, 'sliderStep', $item['sliderStep'] ?? '1', '1');
        sg_add_child_compact($el, 'sliderValue', $item['sliderValue'] ?? '0', '0');

        sg_add_child_compact($el, 'sliderShowValue', $item['sliderShowValue'] ?? '1', '1');
        sg_add_child_compact($el, 'sliderShowMinMax', $item['sliderShowMinMax'] ?? '0', '0');
        sg_add_child_compact($el, 'sliderPreset', $item['sliderPreset'] ?? 'soft', 'soft');

        sg_add_child_compact($el, 'sliderTrack', $item['sliderTrack'] ?? '#e2e8f0', '#e2e8f0');
        sg_add_child_compact($el, 'sliderFill', $item['sliderFill'] ?? '#156fe5', '#156fe5');
        sg_add_child_compact($el, 'sliderThumb', $item['sliderThumb'] ?? '#156fe5', '#156fe5');

        sg_add_child_compact($el, 'sliderTrackH', $item['sliderTrackH'] ?? '8', '8');
        sg_add_child_compact($el, 'sliderThumbS', $item['sliderThumbS'] ?? '18', '18');
        break;

      case 'sidescroll':
        sg_add_child_compact($el, 'scrollTargetMode', $item['scrollTargetMode'] ?? 'page', 'page');
        sg_add_child_compact($el, 'scrollTargetId', $item['scrollTargetId'] ?? '', '', true);

        sg_add_child_compact($el, 'scrollPinMode', $item['scrollPinMode'] ?? 'fixed', 'fixed');
        sg_add_child_compact($el, 'scrollSide', $item['scrollSide'] ?? 'right', 'right');

        sg_add_child_compact($el, 'scrollOffsetTop', $item['scrollOffsetTop'] ?? '120', '120');
        sg_add_child_compact($el, 'scrollOffsetSide', $item['scrollOffsetSide'] ?? '16', '16');
        sg_add_child_compact($el, 'scrollHeight', $item['scrollHeight'] ?? '260', '260');

        sg_add_child_compact($el, 'scrollTrackW', $item['scrollTrackW'] ?? '10', '10');
        sg_add_child_compact($el, 'scrollThumbH', $item['scrollThumbH'] ?? '64', '64');
        sg_add_child_compact($el, 'scrollValue', $item['scrollValue'] ?? '0', '0');

        sg_add_child_compact($el, 'scrollTrackColor', $item['scrollTrackColor'] ?? '#e2e8f0', '#e2e8f0');
        sg_add_child_compact($el, 'scrollThumbColor', $item['scrollThumbColor'] ?? '#64748b', '#64748b');
        sg_add_child_compact($el, 'scrollRadius', $item['scrollRadius'] ?? '999', '999');
        break;

      case 'form':
        sg_add_child_compact($el, 'formType', $item['formType'] ?? 'text', 'text');
        sg_add_child_compact($el, 'label', $item['label'] ?? '', '', true);
        sg_add_child_compact($el, 'options', $item['options'] ?? '', '', true);
        sg_add_child_compact($el, 'accentColor', $item['accentColor'] ?? '#156fe5', '#156fe5');

        sg_add_child_compact($el, 'formHelpText', $item['formHelpText'] ?? '', '', true);
        sg_add_child_compact($el, 'formPlaceholder', $item['formPlaceholder'] ?? '', '', true);
        sg_add_child_compact($el, 'formName', $item['formName'] ?? '', '', true);

        sg_add_child_compact($el, 'formRequired', $item['formRequired'] ?? '0', '0');
        sg_add_child_compact($el, 'formInline', $item['formInline'] ?? '0', '0');

        sg_add_child_compact($el, 'formRows', $item['formRows'] ?? '3', '3');
        sg_add_child_compact($el, 'formMin', $item['formMin'] ?? '', '', true);
        sg_add_child_compact($el, 'formMax', $item['formMax'] ?? '', '', true);
        sg_add_child_compact($el, 'formStep', $item['formStep'] ?? '', '', true);

        sg_add_child_compact($el, 'ratingMin', $item['ratingMin'] ?? '1', '1');
        sg_add_child_compact($el, 'ratingMax', $item['ratingMax'] ?? '5', '5');
        sg_add_child_compact($el, 'ratingStep', $item['ratingStep'] ?? '1', '1');
        sg_add_child_compact($el, 'ratingMinLabel', $item['ratingMinLabel'] ?? '', '', true);
        sg_add_child_compact($el, 'ratingMaxLabel', $item['ratingMaxLabel'] ?? '', '', true);

        sg_add_child_compact($el, 'likertMin', $item['likertMin'] ?? '1', '1');
        sg_add_child_compact($el, 'likertMax', $item['likertMax'] ?? '5', '5');
        sg_add_child_compact($el, 'likertLeft', $item['likertLeft'] ?? '', '', true);
        sg_add_child_compact($el, 'likertRight', $item['likertRight'] ?? '', '', true);

        sg_add_child_compact($el, 'formInputRadius', $item['formInputRadius'] ?? '10', '10');
        break;

      default:

        if (($item['isFooter'] ?? '0') === '1') {
          sg_add_child_compact($el, 'isFooter', '1', '0');
          sg_add_child_compact($el, 'footerDock', $item['footerDock'] ?? 'bottom', 'bottom');
          sg_add_child_compact($el, 'footerBottom', $item['footerBottom'] ?? '0', '0');
          sg_add_child_compact($el, 'footerLeft', $item['footerLeft'] ?? '0', '0');
        }
        break;
    }
    if (!empty($item['children'])) {
      $childrenNode = $el->addChild('children');
      saveRecursive($item['children'], $childrenNode);
    }
  }
}

        saveRecursive($elements, $xml);
    }
    $xml->asXML($newXmlFile);
    echo "Plik XML został pomyślnie zaktualizowany!";
    exit;
}
?>

<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Praca inzynierska</title>
<style>
    :root { --panel-w: 320px; --accent: #2bb021; --dark: #1e293b; }
    body { margin: 0; padding: 0; height: 100vh; font-family: 'Segoe UI', sans-serif; overflow: hidden; background: white; }
    #preview-canvas { position: absolute; inset: 0; z-index: 1; background: white; }
    #controls-panel { 
        position: absolute; top: 20px; right: 20px; width: var(--panel-w);
        background: white; border: 1px solid #cbd5e1; border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; display: flex; flex-direction: column;
    }
    .panel-header { background: var(--dark); color: white; padding: 10px 15px; cursor: move; border-radius: 8px 8px 0 0; }
    .panel-content { padding: 15px; max-height: 85vh; overflow-y: auto; }
    
    .canvas-element { position: absolute; padding: 0 !important; margin: 0 !important; cursor: move; outline: none; box-sizing: border-box; }
    .canvas-element div, .canvas-element p { margin: 0 !important; padding: 0 !important; line-height: inherit; }
    .canvas-element.active { outline: 2px dashed #156fe5 !important; }

    
.type-text{
  white-space: pre-wrap;
  display: inline-block;
  line-height: 1.2;
  overflow: visible;
  min-width: 10px;
  vertical-align: top;
}

    .type-block { 
    display: block; 
    overflow: visible; 
    position: absolute; 
}

    .btn { width: 100%; padding: 10px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px; transition: 0.2s; }
    .btn-save { background: var(--accent); color: white; margin-top: 15px; }
    #controls-panel label { 
    display: block; 
    margin-top: 10px; 
    font-weight: bold; 
    font-size: 11px; 
    color: #64748b; 
    text-transform: uppercase; 
}
    input, select { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 13px; }
    #hidden-tools { display: none; }
.canvas-element,
.canvas-element input,
.canvas-element label,
.canvas-element div,
.canvas-element span {
  text-transform: none !important;
  font-weight: inherit;
}
.text-toolbar{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin:10px 0;
}
.tool-btn{
  border:1px solid #d1d5db;
  background:#fff;
  border-radius:6px;
  padding:6px 8px;
  cursor:pointer;
  font-size:13px;
}
.tool-btn:hover{ background:#f1f5f9; }
.tool-sep{
  width:1px;
  background:#e2e8f0;
  margin:0 4px;
}
.tool-btn.active{
  background:#e2e8f0;
  border-color:#94a3b8;
}


</style>
</head>
<body>

<div id="preview-canvas"></div>

<?php include 'layers_manager.php'; ?>

<aside id="controls-panel">
    <div class="panel-header" id="panel-drag-handle"> Narzędzia Projektu</div>
    <div class="panel-content">
        <button id="add-text-btn" class="btn" style="background: var(--dark); color: white;"> DODAJ TEKST</button>
        <button id="add-block-btn" class="btn" style="background: #475569; color: white;"> DODAJ RAMKĘ</button>
        <button id="add-image-btn" class="btn" style="background: #6366f1; color: white;"> DODAJ ZDJĘCIE</button>
            <input type="file" id="image-upload-input" style="display:none" accept="image/*">
            <button id="add-form-btn" class="btn" style="background: #f59e0b; color: white;"> DODAJ FORMULARZ</button>
            <button id="add-sidescroll-btn" class="btn" style="background:#0ea5e9; color:white;"> DODAJ SUWAK BOCZNY</button>

            <button id="add-slider-btn" class="btn" style="background:#06b6d4; color:white;"> DODAJ ZSUWAK</button>
<button id="add-footer-bottom-btn" class="btn" style="background:#111827;color:white;">
  DODAJ STOPKĘ DÓŁ
</button>

<button id="add-footer-top-btn" class="btn" style="background:#374151;color:white;">
  DODAJ STOPKĘ GÓRA
</button>
<button id="add-button-btn" class="btn" style="background:#10b981; color:white;">
  DODAJ GUZIK
</button>
<button id="add-nav-btn" class="btn" style="background:#0f172a;color:white;">DODAJ PANEL NAWIGACYJNY</button>
<button id="add-calendar-btn" class="btn" style="background:#2563eb;color:white;">DODAJ KALENDARZ</button>


        <button id="generate-btn" class="btn btn-save">ZAPISZ ZMIANY W XML</button>

<div style="margin-top:10px; border-top:1px solid #e5e7eb; padding-top:10px;">
  <div style="font-size:12px; color:#334155; font-weight:700; margin-bottom:6px;">Tło (baza pliku)</div>

  <select id="base-file" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:10px;">
    <option value="">— brak —</option>
    <?php
$files = glob($projectsDir . DIRECTORY_SEPARATOR . '*.xml') ?: [];
sort($files);
foreach ($files as $p) {
  $fn = basename($p);
  echo '<option value="'.htmlspecialchars($fn).'">'.htmlspecialchars($fn).'</option>';
}
?>

  </select>

  <div style="display:flex; gap:8px; margin-top:8px;">
    <button id="set-base-btn" type="button">Ustaw tło</button>
    <button id="clear-base-btn" type="button" class="secondary">Usuń tło</button>
  </div>

  <div id="base-status" style="margin-top:8px; font-size:12px; color:#64748b;">
    Tło: brak
  </div>
</div>




        <div id="hidden-tools" style="margin-top:15px; border-top: 2px solid #f1f5f9;">
            <div id="meta-edit-section" style="display:none; border-top:2px solid #f1f5f9; padding-top:10px; margin-top:10px;">
  <label>ID (HTML):</label>
  <input type="text" id="prop-html-id" placeholder="np. mainNav">

  <label>Klasy CSS:</label>
  <input type="text" id="prop-html-class" placeholder="np. hero dark rounded">
</div>

            <div id="text-edit-section" style="display:none;">
                <label>Kolor czcionki:</label>
                <input type="color" id="prop-color">
                <label>Rozmiar (px):</label>
                <input type="number" id="prop-size" value="20">
                <?php include 'font_manager.php'; ?>
            </div>
            <?php include 'block_manager.php'; ?>
            <?php include 'image_manager.php'; ?>
            <?php include 'ankieta_manager.php'; ?>

            <?php include 'slider_manager.php'; ?>
            <?php include 'sidescroll_manager.php'; ?>
            <?php include 'footer_manager.php'; ?>
<?php include 'button_manager.php'; ?>
<?php include 'nav_menager.php'; ?>
<?php include 'calendar_menager.php'; ?>

        </div>
    </div>
</aside>

<script>
var canvas = document.getElementById('preview-canvas');
var hiddenTools = document.getElementById('hidden-tools');
var layersList = document.getElementById('layers-list');

var activeElement = null;
var activeContainer = canvas;
var addMode = null;
var savedRange = null;
var zCounter = 10;


function setAsTarget(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el || el.dataset.type !== 'block') return;
  selectElement(el);

  if (activeContainer === el) {
    resetToCanvas();
  } else {
    activeContainer = el;
    const display = document.getElementById('current-target-display');
    if (display) display.innerText = "Ramka (" + id.slice(-4) + ")";

    if (activeElement && activeElement !== el) {
      if (confirm("Czy przenieść zaznaczony element do tej ramki?")) {
        nestElement(activeElement.dataset.id, el.dataset.id);
      }
    }
  }
  refreshLayers();
}

    function resetToCanvas() {
    activeContainer = canvas;
    const display = document.getElementById('current-target-display');
    if(display) display.innerText = "Główny ekran";
    refreshLayers();
}

    function refreshLayers() {
        layersList.innerHTML = '';
        
        function drawLayerTree(container, level = 0) {
            const elements = Array.from(container.children).filter(el => el.classList.contains('canvas-element'));
            elements.sort((a, b) => parseInt(b.style.zIndex || 0) - parseInt(a.style.zIndex || 0));

            elements.forEach(el => {
                const li = document.createElement('li');
                const isTarget = activeContainer === el;
                li.className = 'layer-item' + (activeElement === el ? ' active' : '') + (isTarget ? ' is-target' : '');
                li.style.marginLeft = (level * 15) + 'px'; 

                const previewColor = el.dataset.type === 'text' ? (el.style.color || '#000000') : (el.style.backgroundColor || '#ffffff');

             const targetBtn = (el.dataset.type === 'block' && el.dataset.isFooter !== "1") ?
  `<button class="layer-btn-target" onclick="event.stopPropagation(); setAsTarget('${el.dataset.id}')">🎯 OTWÓRZ TĄ WARSTWĘ</button>` : '';
const domId = (el.dataset.htmlId || '').trim();
const domClass = (el.dataset.htmlClass || '').trim();

const metaTxt = [
  domId ? `#${domId}` : '',
  domClass ? `.${domClass.split(/\s+/).join('.')}` : ''
].filter(Boolean).join(' ');


                li.innerHTML = `
  <div class="layer-top-row" style="display:flex; justify-content:space-between; align-items:center;">
    <div style="display:flex; align-items:center;">
      <div class="layer-color-preview" style="background-color: ${previewColor}"></div>
      <span>${level > 0 ? '↳ ' : ''}${el.dataset.type === 'text' ? '🔤' : '📦'} ${el.dataset.id.slice(-4)}</span>
    </div>
    <div class="layer-controls">
      <button class="layer-btn" onclick="event.stopPropagation(); changeOrder('${el.dataset.id}', 1)">▲</button>
      <button class="layer-btn" onclick="event.stopPropagation(); changeOrder('${el.dataset.id}', -1)">▼</button>
    </div>
  </div>

  ${targetBtn}

  ${metaTxt ? `<div style="font-size:11px;color:#64748b;margin-top:4px;">${metaTxt}</div>` : ''}
  <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${el.dataset.id}</div>
`;
                li.onclick = (e) => selectElement(el);
                layersList.appendChild(li);
                
                drawLayerTree(el, level + 1); 
            });
        }

        drawLayerTree(canvas);
        const allElements = document.querySelectorAll('.canvas-element');
        document.getElementById('layers-empty-msg').style.display = allElements.length === 0 ? 'block' : 'none';
    }

function createElement(x, y, type) {
if (type === 'button') {
  if (typeof createButtonElement === "function") {
    createButtonElement(x, y);
  } else {
    alert("Brakuje funkcji createButtonElement() - sprawdź czy sg_button.js się ładuje.");
  }
  addMode = null;
  return;
}
if (type === 'nav') {
  if (typeof createNavElement === "function") createNavElement(x, y);
  else alert("Brakuje createNavElement() - sprawdź czy sg_nav.js się ładuje.");
  addMode = null;
  return;
}
if (type === 'calendar') {
  if (typeof createCalendarElement === "function") createCalendarElement(x, y);
  else alert("Brakuje createCalendarElement() - sprawdź czy sg_calendar.js się ładuje.");
  addMode = null;
  return;
}

  if (type === 'block') {
    createBlockElement(x, y);
    addMode = null;
    return;
  }

  if (type === 'slider') {
    createSliderElement(x, y);
    addMode = null;
    return;
  }
if (type === 'sidescroll') { createSideScrollElement(x, y); addMode=null; return; }

  zCounter++;
  const div = document.createElement('div');
  div.className = 'canvas-element type-' + type;
  div.dataset.id = 'el_' + Date.now();
  div.dataset.type = type;
  div.style.zIndex = zCounter;
  div.spellcheck = false;

    if (type === 'text') {
        div.contentEditable = "false";
        div.dataset.editing = "0";
        div.innerText = "Wpisz tekst...";
        div.style.fontSize = "20px";
        div.style.fontFamily = "'Segoe UI', sans-serif";
        div.ondblclick = (e) => { e.stopPropagation(); enterTextEdit(div); };
    } else {
        div.style.width = "200px";
        div.style.height = "100px";
        div.style.backgroundColor = "#e2e8f0";
        div.style.border = "1px solid #000000";
        div.contentEditable = "true";
    }


    const rect = activeContainer.getBoundingClientRect();
    div.style.left = (x - rect.left) + 'px';
    div.style.top  = (y - rect.top) + 'px';

    setupElementMovement(div, type);
    activeContainer.appendChild(div);
    selectElement(div);
    refreshLayers();
}


    function nestElement(childId, parentId) {
    const child = document.querySelector(`[data-id="${childId}"]`);
    const parent = document.querySelector(`[data-id="${parentId}"]`);
    if (!child || !parent || child === parent) return;

    const pRect = parent.getBoundingClientRect();
    const cRect = child.getBoundingClientRect();

    child.style.left = (cRect.left - pRect.left) + 'px';
    child.style.top = (cRect.top - pRect.top) + 'px';
    
    parent.appendChild(child);
    refreshLayers();
}

    function unNestElement(el) {
    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    canvas.appendChild(el);
    el.style.left = (rect.left - canvasRect.left) + 'px';
    el.style.top = (rect.top - canvasRect.top) + 'px';
    refreshLayers();
}


function selectElement(el) {
    if (el?.dataset?.locked === "1") return;
    if (activeElement && activeElement !== el && activeElement.dataset.type === 'text' && activeElement.dataset.editing === "1") {
    exitTextEdit(activeElement);
}
    if(activeElement) activeElement.classList.remove('active');
    activeElement = el;
    el.classList.add('active');
    hiddenTools.style.display = 'block';
    document.getElementById('delete-element-btn').style.display = 'block';
    
    const type = el.dataset.type; 

    document.getElementById('text-edit-section').style.display = (type === 'text') ? 'block' : 'none';
    document.getElementById('block-edit-section').style.display = (type === 'block') ? 'block' : 'none';
    document.getElementById('image-edit-section').style.display = (type === 'image') ? 'block' : 'none';
    document.getElementById('form-edit-section').style.display = (type === 'form') ? 'block' : 'none';
    document.getElementById('slider-edit-section').style.display = (type === 'slider') ? 'block' : 'none';
    document.getElementById('sidescroll-edit-section').style.display = (type === 'sidescroll') ? 'block' : 'none';
if (type === 'sidescroll' && typeof syncSideScrollInputs === "function") syncSideScrollInputs(el);
document.getElementById('button-edit-section').style.display = (type === 'button') ? 'block' : 'none';
if (type === 'button' && typeof syncButtonInputs === "function") syncButtonInputs(el);
document.getElementById('nav-edit-section').style.display = (type === 'nav') ? 'block' : 'none';
if (type === 'nav' && typeof syncNavInputs === "function") syncNavInputs(el);
const calSec = document.getElementById('calendar-edit-section');
if (calSec) calSec.style.display = (type === 'calendar') ? 'block' : 'none';
if (type === 'calendar' && typeof syncCalendarInputs === "function") syncCalendarInputs(el);


    if (type === 'form') {
  if (typeof syncFormInputs === "function") syncFormInputs(el);
} else if (type === 'image') {
  if (typeof syncImageInputs === "function") syncImageInputs(el);
} else if (type === 'block') {
    if (typeof syncBlockInputs === "function") syncBlockInputs(el);
    syncBlockUiChecks(el);
    } else if (type === 'text') {
        document.getElementById('prop-size').value = parseInt(el.style.fontSize) || 20;
        document.getElementById('prop-color').value = rgbToHex(el.style.color);
        if (typeof updateTextToolbarState === "function") updateTextToolbarState();

    }
     else if (type === 'slider') {
  if (typeof syncSliderInputs === "function") syncSliderInputs(el);
}

    refreshLayers();
    const metaSec = document.getElementById('meta-edit-section');
if (metaSec) metaSec.style.display = 'block';

const idInp = document.getElementById('prop-html-id');
const clsInp = document.getElementById('prop-html-class');

if (idInp) idInp.value = el.dataset.htmlId || "";
if (clsInp) clsInp.value = el.dataset.htmlClass || "";

}

    function deselectAll() {
        if (activeElement && activeElement.dataset.type === 'text' && activeElement.dataset.editing === "1") {
    exitTextEdit(activeElement);
}
        if(activeElement) activeElement.classList.remove('active');
        activeElement = null; hiddenTools.style.display = 'none'; 
        document.getElementById('delete-element-btn').style.display = 'none';
        refreshLayers();
    }



document.getElementById('add-text-btn').onclick = () => { addMode = 'text'; };

document.getElementById('add-form-btn').onclick = () => { addMode = 'form'; }; 
document.getElementById('add-sidescroll-btn').onclick = () => { addMode = 'sidescroll'; };
document.getElementById('add-button-btn').onclick = () => { addMode = 'button'; };
document.getElementById('add-calendar-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const r = canvas.getBoundingClientRect();
  const cx = r.left + r.width * 0.5;
  const cy = r.top  + r.height * 0.55;

  createElement(cx, cy, 'calendar');
};

document.getElementById('add-nav-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const r = canvas.getBoundingClientRect();
  const cx = r.left + r.width * 0.5;
  const cy = r.top  + r.height * 0.28;

  createElement(cx, cy, 'nav');
};


canvas.onclick = (e) => { 
    if (addMode === 'form') { 
        createFormElement(e.clientX, e.clientY); 
        addMode = null; 
    } else if (addMode) { 
        createElement(e.clientX, e.clientY, addMode); 
        addMode = null; 
    } else if (e.target === canvas) { 
        deselectAll(); 
    } 
};

    document.getElementById('delete-element-btn').onclick = () => { if(activeElement) { activeElement.remove(); deselectAll(); } };

function getElementData(el) {
  if (el?.dataset?.locked === "1") return;

  const wasActive = el.classList.contains('active');
  if (wasActive) el.classList.remove('active');

  const cs = window.getComputedStyle(el);

  if (wasActive) el.classList.add('active');



  const children = [];
  Array.from(el.children).forEach(child => {
    const childData = getElementData(child);
if (childData) children.push(childData);
  });

  let content = "";
  if (el.dataset.type === "text") {
    content = el.innerHTML.replace(/"/g, "'");
  } else if (el.dataset.type === "image") {
    const img = el.querySelector("img");
    content = img ? (img.getAttribute("src") || "") : "";
  }

  const bg = (el.style.background && el.style.background.trim() !== "")
    ? el.style.background
    : (el.style.backgroundColor && el.style.backgroundColor.trim() !== "")
      ? el.style.backgroundColor
      : (cs.backgroundImage && cs.backgroundImage !== "none")
        ? cs.backgroundImage
        : cs.backgroundColor;

  const border = (el.style.border && el.style.border.trim() !== "")
    ? el.style.border
    : (cs.borderStyle !== "none" && cs.borderWidth !== "0px")
      ? `${cs.borderWidth} ${cs.borderStyle} ${cs.borderColor}`
      : "none";

  return {
    htmlId: el.dataset.htmlId || "",
htmlClass: el.dataset.htmlClass || "",

    id: el.dataset.id,
    type: el.dataset.type,
    x: parseInt(el.style.left) || 0,
    y: parseInt(el.style.top) || 0,
    w: el.style.width || cs.width || "auto",
    h: el.style.height || cs.height || "auto",
    content: content,
    color: el.style.color || cs.color || "#000000",
    bg: bg || "transparent",
    fontSize: el.style.fontSize || cs.fontSize || "16px",
    fontFamily: el.style.fontFamily || cs.fontFamily || "'Segoe UI', sans-serif",
    fontWeight: el.style.fontWeight || cs.fontWeight || "400",
    fontStyle: el.style.fontStyle || cs.fontStyle || "normal",
    textDecoration: el.style.textDecoration || cs.textDecorationLine || "none",
    textAlign: el.style.textAlign || cs.textAlign || "left",
    lineHeight: el.style.lineHeight || cs.lineHeight || "1.2",
    letterSpacing: el.style.letterSpacing || cs.letterSpacing || "normal",
    textTransform: el.style.textTransform || cs.textTransform || "none",
    padding: el.style.padding || cs.padding || "0px",
    border: border,
    zIndex: el.style.zIndex || cs.zIndex || 0,
    borderRadius: el.style.borderRadius || cs.borderRadius || "0px",
    boxShadow: el.style.boxShadow || cs.boxShadow || "none",
    opacity: el.style.opacity || cs.opacity || "1",
    backdropFilter: el.style.backdropFilter || cs.backdropFilter || "none",
    formType: el.dataset.formType || "text",
    label: el.dataset.label || "",
    options: el.dataset.options || "",
    accentColor: el.dataset.accentColor || "#156fe5",
    sliderLabel: el.dataset.sliderLabel || "",
    sliderUnit: el.dataset.sliderUnit || "",
    sliderMin: el.dataset.sliderMin || "0",
    sliderMax: el.dataset.sliderMax || "100",
    sliderStep: el.dataset.sliderStep || "1",
    sliderValue: el.dataset.sliderValue || "0",
    sliderShowValue: el.dataset.sliderShowValue || "1",
    sliderShowMinMax: el.dataset.sliderShowMinMax || "0",
    sliderPreset: el.dataset.sliderPreset || "soft",
    sliderTrack: el.dataset.sliderTrack || "#e2e8f0",
    sliderFill: el.dataset.sliderFill || "#156fe5",
    sliderThumb: el.dataset.sliderThumb || "#156fe5",
    sliderTrackH: el.dataset.sliderTrackH || "8",
    sliderThumbS: el.dataset.sliderThumbS || "18",
    scrollTargetMode: el.dataset.scrollTargetMode || "page",
    scrollTargetId: el.dataset.scrollTargetId || "",
    scrollPinMode: el.dataset.scrollPinMode || "fixed",
    scrollSide: el.dataset.scrollSide || "right",
    scrollOffsetTop: el.dataset.scrollOffsetTop || "120",
    scrollOffsetSide: el.dataset.scrollOffsetSide || "16",
    scrollHeight: el.dataset.scrollHeight || "260",
    scrollTrackW: el.dataset.scrollTrackW || "10",
    scrollThumbH: el.dataset.scrollThumbH || "64",
    scrollValue: el.dataset.scrollValue || "0",
    scrollTrackColor: el.dataset.scrollTrackColor || "#e2e8f0",
    scrollThumbColor: el.dataset.scrollThumbColor || "#64748b",
    scrollRadius: el.dataset.scrollRadius || "999",
    isFooter: el.dataset.isFooter || "0",
    
footerDock: el.dataset.footerDock || "bottom",
footerBottom: el.dataset.footerBottom || "0",
footerLeft: el.dataset.footerLeft || "0",
imgFit: el.dataset.imgFit || 'cover',
imgPosX: el.dataset.imgPosX || '50',
imgPosY: el.dataset.imgPosY || '50',
imgRotate: el.dataset.imgRotate || '0',
imgScale: el.dataset.imgScale || '1',
imgFlipX: el.dataset.imgFlipX || '0',
imgFlipY: el.dataset.imgFlipY || '0',
btnText: el.dataset.btnText || 'Kliknij',
btnAction: el.dataset.btnAction || 'link',
btnUrl: el.dataset.btnUrl || 'https://',
btnTarget: el.dataset.btnTarget || '_blank',
btnScrollTargetId: el.dataset.btnScrollTargetId || '',
btnScrollOffset: el.dataset.btnScrollOffset || '0',
blockUi: el.dataset.blockUi || "",

btnPreset: el.dataset.btnPreset || 'primary',
btnSize: el.dataset.btnSize || 'md',
btnIcon: el.dataset.btnIcon || '',
btnIconPos: el.dataset.btnIconPos || 'left',

btnRadius: el.dataset.btnRadius || '10',
btnBorderW: el.dataset.btnBorderW || '1',
btnWeight: el.dataset.btnWeight || '700',
btnAlign: el.dataset.btnAlign || 'center',
btnUpper: el.dataset.btnUpper || '0',
btnLetter: el.dataset.btnLetter || '0',

btnBg: el.dataset.btnBg || '#156fe5',
btnColor: el.dataset.btnColor || '#ffffff',
btnBorderColor: el.dataset.btnBorderColor || '#156fe5',
btnHoverBg: el.dataset.btnHoverBg || '#0f5bd1',
btnHoverColor: el.dataset.btnHoverColor || '#ffffff',
btnShadow: el.dataset.btnShadow || 'soft',

btnGradient: el.dataset.btnGradient || '0',
btnGradFrom: el.dataset.btnGradFrom || '#156fe5',
btnGradTo: el.dataset.btnGradTo || '#22c55e',
btnGradAngle: el.dataset.btnGradAngle || '135',

btnName: el.dataset.btnName || '',
btnDisabled: el.dataset.btnDisabled || '0',

imgBlur: el.dataset.imgBlur || '0',
imgGray: el.dataset.imgGray || '0',
imgSepia: el.dataset.imgSepia || '0',
imgBrightness: el.dataset.imgBrightness || '100',
imgContrast: el.dataset.imgContrast || '100',
imgSaturate: el.dataset.imgSaturate || '100',
    navItems: el.dataset.navItems || "",
    navOrientation: el.dataset.navOrientation || "horizontal",
    navAlign: el.dataset.navAlign || "left",
    navGap: el.dataset.navGap || "10",
    navPad: el.dataset.navPad || "10",

    navLinkPadX: el.dataset.navLinkPadX || "12",
    navLinkPadY: el.dataset.navLinkPadY || "8",
    navLinkRadius: el.dataset.navLinkRadius || "8",
    navUnderline: el.dataset.navUnderline || "0",
blockUi: el.dataset.blockUi || '',

    navLinkColor: el.dataset.navLinkColor || "#ffffff",
    navHoverBg: el.dataset.navHoverBg || "rgba(255,255,255,0.12)",
    navHoverColor: el.dataset.navHoverColor || "#ffffff",
    navActiveBg: el.dataset.navActiveBg || "rgba(255,255,255,0.18)",
    navActiveColor: el.dataset.navActiveColor || "#ffffff",

    navActiveMode: el.dataset.navActiveMode || "query_page",
calYear: el.dataset.calYear || "2026",
calMonth: el.dataset.calMonth || "1",
calWeekStart: el.dataset.calWeekStart || "mon",
calTheme: el.dataset.calTheme || "blue",
calBgA: el.dataset.calBgA || "",
calBgB: el.dataset.calBgB || "",
calAccent: el.dataset.calAccent || "",

calRadius: el.dataset.calRadius || "30",
calOuterPad: el.dataset.calOuterPad || "22",
calGap: el.dataset.calGap || "10",
calCellRadius: el.dataset.calCellRadius || "16",

calMonthSize: el.dataset.calMonthSize || "34",
calDaySize: el.dataset.calDaySize || "18",
calWeekSize: el.dataset.calWeekSize || "14",
calNavSize: el.dataset.calNavSize || "44",

calShowOutside: el.dataset.calShowOutside || "1",
calShowToday: el.dataset.calShowToday || "1",

    children: children
  };
}


    document.getElementById('generate-btn').onclick = () => {
        const elementsData = [];
        
Array.from(canvas.children).forEach(el => {
  if (!el.classList.contains('canvas-element')) return;
  const d = getElementData(el);
  if (d) elementsData.push(d);
});

        const fd = new FormData();
        fd.append('action', 'generate_xml');
        fd.append('elements', JSON.stringify(elementsData));
        fd.append('baseFile', window.sgBaseFile || '');
        fetch('super_generator.php', { method: 'POST', body: fd }).then(res => res.text()).then(data => alert(data));
    };
window.sgBaseFile = '';

async function fetchXmlFile(fileName){
  const url = `super_generator.php?action=read_xml&file=${encodeURIComponent(fileName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Nie mogę wczytać XML: " + fileName);
  return await res.text();
}

function parseExtends(xmlText){
  try{
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const ext = doc.querySelector("customPage > extends");
    return ext ? (ext.textContent || "").trim() : "";
  }catch(e){ return ""; }
}

function clearBaseFromCanvas(){
  document.querySelectorAll('.canvas-element[data-origin="base"]').forEach(el => el.remove());
}

function markLocked(el){
  el.dataset.locked = "1";
  el.dataset.origin = "base";
  el.style.pointerEvents = "none";

  el.style.userSelect = "none";
  el.style.filter = "grayscale(0.05)";  
  el.style.opacity = "0.98";
}

function afterCreateFromXml(el){
  if (!el) return;
  requestAnimationFrame(() => {
    if (el.dataset.type === "slider") window.updateSliderVisuals?.(el);
    if (el.dataset.type === "image")  window.updateImageVisuals?.(el);
    if (el.dataset.type === "button") window.updateButtonVisuals?.(el);
    if (el.dataset.type === "nav")    window.updateNavVisuals?.(el);
    if (el.dataset.isFooter === "1")  window.applyFooterStyles?.(el);
  });
}
function parseXmlElements(xmlText){
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) return [];
  return Array.from(doc.querySelectorAll("customPage > element"));
}

function xmlElToItem(node){
  const get = (tag, def="") => {
    const n = node.querySelector(`:scope > ${tag}`);
    return n ? (n.textContent ?? def) : def;
  };

  const item = {
    id: node.getAttribute("id") || ("el_" + Date.now()),
    type: node.getAttribute("type") || "block",
    x: parseInt(get("x","0"),10) || 0,
    y: parseInt(get("y","0"),10) || 0,
    w: get("w","200px"),
    h: get("h","100px"),
    content: get("content",""),
    zIndex: parseInt(get("zIndex","0"),10) || 0,
    color: get("color","#000000"),
    bg: get("bg","transparent"),
    border: get("border","none"),
    borderRadius: get("borderRadius","0px"),
    boxShadow: get("boxShadow","none"),
    opacity: get("opacity","1"),
    backdropFilter: get("backdropFilter","none"),
    dataset: {},
    children: []
  };
  const skip = new Set(["x","y","w","h","content","color","bg","border","zIndex","borderRadius","boxShadow","opacity","backdropFilter"]);
  Array.from(node.children).forEach(ch => {
    const k = ch.tagName;
    if (skip.has(k)) return;
    if (k === "children") return;
    item.dataset[k] = ch.textContent ?? "";
  });

  const childrenNode = node.querySelector(":scope > children");
  if (childrenNode) {
    const childEls = Array.from(childrenNode.querySelectorAll(":scope > element"));
    item.children = childEls.map(xmlElToItem);
  }

  return item;
}

function spawnItem(item, origin){
  const el = document.createElement("div");
  el.className = "canvas-element type-" + item.type;
  el.dataset.id = item.id;
  el.dataset.type = item.type;

  el.style.left = item.x + "px";
  el.style.top  = item.y + "px";
  el.style.width  = item.w;
  el.style.height = item.h;
  if (item.zIndex) el.style.zIndex = item.zIndex;

  el.style.color = item.color;
  el.style.border = item.border;
  el.style.borderRadius = item.borderRadius;
  el.style.boxShadow = item.boxShadow;
  el.style.opacity = item.opacity;
  el.style.backdropFilter = item.backdropFilter;
  el.style.background = item.bg;
  Object.entries(item.dataset || {}).forEach(([k,v]) => el.dataset[k] = String(v));
  applySavedMeta(el);
  if (item.type === "text") {
    el.contentEditable = "false";
    el.dataset.editing = "0";
    el.innerHTML = item.content || "";
    el.style.fontSize = el.dataset.fontSize || "20px";
el.style.fontFamily = el.dataset.fontFamily || "'Segoe UI', sans-serif";
el.style.fontWeight = el.dataset.fontWeight || "400";
el.style.fontStyle = el.dataset.fontStyle || "normal";
el.style.textDecoration = el.dataset.textDecoration || "none";
el.style.textAlign = el.dataset.textAlign || "left";
el.style.lineHeight = el.dataset.lineHeight || "1.2";
el.style.letterSpacing = el.dataset.letterSpacing || "normal";
el.style.textTransform = el.dataset.textTransform || "none";
el.style.padding = el.dataset.padding || "0px";

    el.ondblclick = (e) => { e.stopPropagation(); if (el.dataset.locked !== "1") enterTextEdit(el); };
  } else if (item.type === "image") {
    const src = item.content || "";
    el.innerHTML = `<img src="${src.replaceAll('"','&quot;')}" alt="" style="width:100%;height:100%;object-fit:${el.dataset.imgFit||'cover'};">`;
  } else {
    el.contentEditable = "false";
  }

  setupElementMovement(el, item.type);
  if (origin === "base") markLocked(el);
  afterCreateFromXml(el);
  if (item.children && item.children.length) {
    item.children.forEach(ch => el.appendChild(spawnItem(ch, origin)));
  }

  return el;
}

function renderXmlToCanvas(xmlText, origin){
  const rootEls = parseXmlElements(xmlText);
  const items = rootEls.map(xmlElToItem);
  items.forEach(item => canvas.appendChild(spawnItem(item, origin)));
}

function clearChildFromCanvas(){
  document.querySelectorAll('.canvas-element:not([data-origin="base"])').forEach(el => el.remove());
}

async function loadWithBase(childFile){
  clearChildFromCanvas();
  clearBaseFromCanvas();

  const childXml = await fetchXmlFile(childFile);
  const baseFile = parseExtends(childXml);

  if (baseFile){
    window.sgBaseFile = baseFile;
    const baseXml = await fetchXmlFile(baseFile);
    renderXmlToCanvas(baseXml, "base");
    document.getElementById("base-status").textContent = `Tło: ${baseFile} ( zablokowane)`;
    document.getElementById("base-file").value = baseFile; 
  } else {
    window.sgBaseFile = '';
    document.getElementById("base-status").textContent = `Tło: brak`;
    document.getElementById("base-file").value = "";
  }

  renderXmlToCanvas(childXml, "child");

  refreshLayers();
}

document.getElementById('set-base-btn').onclick = async (e) => {
  e.preventDefault();
  const base = document.getElementById('base-file').value.trim();
  if (!base) {
    alert("Wybierz plik bazy.");
    return;
  }
  clearBaseFromCanvas();
  window.sgBaseFile = base;

const baseXml = await fetchXmlFile(base);
renderXmlToCanvas(baseXml, "base");

  document.getElementById("base-status").textContent = `Tło: ${base} (🔒 zablokowane)`;
  refreshLayers();
};

document.getElementById('clear-base-btn').onclick = (e) => {
  e.preventDefault();
  clearBaseFromCanvas();
  window.sgBaseFile = '';
  document.getElementById("base-status").textContent = "Tło: brak";
  refreshLayers();
};

    function changeOrder(id, dir) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return;

    if (dir === 1) { 
        const siblings = Array.from(el.parentElement.children).filter(s => s !== el && s.classList.contains('type-block'));
        if (siblings.length > 0) {
            nestElement(el.dataset.id, siblings[0].dataset.id);
        } else {
            el.style.zIndex = (parseInt(el.style.zIndex) || 0) + 1;
        }
    } else { 
        if (el.parentElement !== canvas) {
            unNestElement(el);
        } else {
            el.style.zIndex = Math.max(0, (parseInt(el.style.zIndex) || 0) - 1);
        }
    }
    refreshLayers();
}

    function makeDraggable(panelId, handleId) {
        const p = document.getElementById(panelId), h = document.getElementById(handleId);
        h.onmousedown = (e) => {
            if(e.target.tagName==='BUTTON' || e.target.tagName==='INPUT') return;
            let oX = e.clientX - p.offsetLeft, oY = e.clientY - p.offsetTop;
            document.onmousemove = (me) => { p.style.left = (me.clientX-oX)+'px'; p.style.top = (me.clientY-oY)+'px'; p.style.right = 'auto'; };
            document.onmouseup = () => { document.onmousemove = null; };
        };
    }
    makeDraggable('controls-panel', 'panel-drag-handle');
    makeDraggable('layers-panel', 'layers-drag-handle');

function rgbToHex(rgb) {
  if (!rgb) return "#ffffff";
  rgb = String(rgb).trim();
  if (rgb === "" || rgb === "transparent" || rgb === "none" || rgb === "inherit") {
    return "#ffffff";
  }

  if (rgb.startsWith("#")) return rgb;

  const vals = rgb.match(/\d+/g);
  if (!vals || vals.length < 3) return "#ffffff";

  return "#" + vals.slice(0, 3)
    .map(x => parseInt(x, 10).toString(16).padStart(2, "0"))
    .join("");
}

function enterTextEdit(el) {
    if (!el || el.dataset.type !== 'text') return;
    el.dataset.editing = "1";
    el.contentEditable = "true";
    el.style.cursor = "text";
    el.style.userSelect = "text";   
    el.focus();
}

function exitTextEdit(el) {
    if (!el || el.dataset.type !== 'text') return;
    el.dataset.editing = "0";
    el.contentEditable = "false";
    el.style.cursor = "move";
    el.style.userSelect = "none";  
}


function setupElementMovement(div, type) {
    div.onmousedown = (e) => {
e.stopPropagation();

if (type === 'text' && div.dataset.editing === "1") {
    return;
}

selectElement(div);

        let startX = e.clientX;
let startY = e.clientY;
let origX = div.offsetLeft;
let origY = div.offsetTop;
let isMoving = false;

document.onmousemove = (me) => {
    if (!isMoving && (Math.abs(me.clientX - startX) > 5 || Math.abs(me.clientY - startY) > 5)) {
        isMoving = true;
    }
    if (isMoving) {
        div.style.left = (origX + (me.clientX - startX)) + 'px';
        div.style.top  = (origY + (me.clientY - startY)) + 'px';
        div.style.pointerEvents = 'none';
    }
};

document.onmouseup = (mu) => {
    document.onmousemove = null;
    div.style.pointerEvents = 'auto';

    if (isMoving) {
        let target = document.elementFromPoint(mu.clientX, mu.clientY);
        let parentFrame = target ? target.closest('.type-block') : null;

        if (parentFrame && parentFrame !== div) {
            if (div.parentElement !== parentFrame) {
                nestElement(div.dataset.id, parentFrame.dataset.id);
            }
        } else if (!parentFrame && div.parentElement !== canvas) {
            unNestElement(div);
        }
    }

    document.onmouseup = null;
    refreshLayers();
};

    };
}
const currentFile = <?= json_encode($selected) ?>;
window.addEventListener('load', () => loadWithBase(currentFile));

function sanitizeHtmlId(raw){
  const v = String(raw || '').trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  return v;
}

function sanitizeCssClass(raw){
  return String(raw || '').trim()
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .replace(/\s+/g, ' ');
}

function setHtmlId(el, raw){
  const idVal = sanitizeHtmlId(raw);
  el.dataset.htmlId = idVal;

  if (idVal) el.id = idVal;
  else el.removeAttribute('id');
}


function setHtmlClass(el, raw){
  const next = sanitizeCssClass(raw);
  const prev = (el.dataset.htmlClass || '').trim();
  prev.split(/\s+/).filter(Boolean).forEach(c => el.classList.remove(c));
  next.split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));

  el.dataset.htmlClass = next;
}

function applySavedMeta(el){
  const savedId = (el.dataset.htmlId || '').trim();
  if (savedId) el.id = savedId;
  else el.removeAttribute('id');

  const savedCls = (el.dataset.htmlClass || '').trim();
  if (savedCls) savedCls.split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));
}

document.getElementById('prop-html-id')?.addEventListener('input', (e) => {
  if (!activeElement) return;
  setHtmlId(activeElement, e.target.value);
  refreshLayers();
});

document.getElementById('prop-html-class')?.addEventListener('input', (e) => {
  if (!activeElement) return;
  setHtmlClass(activeElement, e.target.value);
  refreshLayers();
});
function setBlockUiFromChecks(el){
  const picks = Array.from(document.querySelectorAll('.fvOpt'))
    .filter(c => c.checked)
    .map(c => c.value);
  el.dataset.blockUi = picks.join(',');
}

function syncBlockUiChecks(el){
  if (!el.dataset.blockUi || !el.dataset.blockUi.trim()) {
    el.dataset.blockUi = 'bg,border,radius,shadow,blur,opacity';
  }
  const cur = (el.dataset.blockUi || '').split(',').map(s => s.trim()).filter(Boolean);
  document.querySelectorAll('.fvOpt').forEach(c => c.checked = cur.includes(c.value));
}

document.addEventListener('change', (e) => {
  if (!e.target.classList.contains('fvOpt')) return;
  if (!activeElement || activeElement.dataset.type !== 'block') return;
  setBlockUiFromChecks(activeElement);
});

</script>
<script src="sg_blocks.js?v=2"></script>
<script src="sg_slider.js?v=1"></script>
<script src="sg_sidescroll.js?v=1"></script>

<script src="font.js"></script>
<script src="sg_footer.js?v=2"></script>
<script src="sg_images.js"></script>
<script src="sg_ankieta.js?v=1"></script>
<script src="sg_button.js?v=1"></script>
<script src="sg_nav.js"></script>
<script src="sg_calendar.js?v=1"></script>
<script src="sg_guides.js?v=1"></script>

</body>
</html>