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

function sg_add_scroll_block_xml(SimpleXMLElement $elNode, string $raw): void {
  $raw = trim($raw);
  if ($raw === '') return;
  $cfg = null;
  if ($raw !== '' && $raw[0] === '{') {
    $cfg = json_decode(html_entity_decode($raw, ENT_QUOTES | ENT_XML1, 'UTF-8'), true);
  }
  if (!is_array($cfg)) {
    $elNode->addChild('sgScrollBlock', htmlspecialchars($raw, ENT_QUOTES | ENT_XML1, 'UTF-8'));
    return;
  }

  $sb = $elNode->addChild('sgScrollBlock');
  $keys = [
    'enabled','axis','ySide','xSide',
    'thickness','gap','radius','thumbSize',
    'track','thumb','thumbHover',
    'autoHide','smooth','wheel','wheelStep',
    'fadeHint','fadeOpacity'
  ];

  foreach ($keys as $k) {
    if (!array_key_exists($k, $cfg)) continue;

    $v = $cfg[$k];

    if (is_bool($v)) $v = $v ? '1' : '0';
    else $v = (string)$v;

    $sb->addChild($k, htmlspecialchars($v, ENT_QUOTES | ENT_XML1, 'UTF-8'));
  }
}

function sg_add_child_compact(SimpleXMLElement $node, string $name, $val, $default = null, bool $escape = false): void {
  $v = (string)($val ?? '');

  if ($default === null && $v === '') return;
  if ($default !== null && $v === (string)$default) return;

  $node->addChild($name, $escape ? htmlspecialchars($v, ENT_QUOTES | ENT_XML1, 'UTF-8') : $v);
}
function sg_add_window_scroll_tags(SimpleXMLElement $xml, array $cfg): void {
  $ws = $xml->addChild('windowScroll');

  $enabled = (!empty($cfg['enabled']) && $cfg['enabled'] !== 'false') ? '1' : '0';
  $ffThin  = (!empty($cfg['firefoxThin']) && $cfg['firefoxThin'] !== 'false') ? '1' : '0';

  $ws->addChild('enabled', $enabled);
  $ws->addChild('firefoxThin', $ffThin);
  $ws->addChild('width', (string)($cfg['width'] ?? 12));
  $ws->addChild('radius', (string)($cfg['radius'] ?? 10));

  $ws->addChild('track', htmlspecialchars((string)($cfg['track'] ?? 'rgba(203,213,225,0.25)'), ENT_QUOTES | ENT_XML1, 'UTF-8'));
  $ws->addChild('thumb', htmlspecialchars((string)($cfg['thumb'] ?? 'rgba(15,23,42,0.55)'), ENT_QUOTES | ENT_XML1, 'UTF-8'));
  $ws->addChild('thumbHover', htmlspecialchars((string)($cfg['thumbHover'] ?? 'rgba(15,23,42,0.75)'), ENT_QUOTES | ENT_XML1, 'UTF-8'));
}
function sg_add_project_bg_tags(SimpleXMLElement $xml, array $cfg): void {
  $pb = $xml->addChild('projectBackground');

  $mode = (string)($cfg['mode'] ?? 'none');
  if (!in_array($mode, ['none','solid','gradient'], true)) $mode = 'none';

  $pb->addChild('mode', $mode);

  $pb->addChild('solid', htmlspecialchars((string)($cfg['solid'] ?? '#f3f4f6'), ENT_QUOTES | ENT_XML1, 'UTF-8'));

  $pb->addChild('gradType', htmlspecialchars((string)($cfg['gradType'] ?? 'linear'), ENT_QUOTES | ENT_XML1, 'UTF-8'));
  $pb->addChild('gradAngle', (string)((int)($cfg['gradAngle'] ?? 180)));

  $pb->addChild('gradFrom', htmlspecialchars((string)($cfg['gradFrom'] ?? '#0ea5e9'), ENT_QUOTES | ENT_XML1, 'UTF-8'));
  $pb->addChild('gradMid',  htmlspecialchars((string)($cfg['gradMid']  ?? '#6366f1'), ENT_QUOTES | ENT_XML1, 'UTF-8'));
  $pb->addChild('gradTo',   htmlspecialchars((string)($cfg['gradTo']   ?? '#111827'), ENT_QUOTES | ENT_XML1, 'UTF-8'));

  $useMid = (!empty($cfg['gradUseMid']) && $cfg['gradUseMid'] !== 'false') ? '1' : '0';
  $pb->addChild('gradUseMid', $useMid);

  $pb->addChild('gradPosX', (string)((int)($cfg['gradPosX'] ?? 50)));
  $pb->addChild('gradPosY', (string)((int)($cfg['gradPosY'] ?? 50)));

  $pb->addChild('gradPreset', htmlspecialchars((string)($cfg['gradPreset'] ?? ''), ENT_QUOTES | ENT_XML1, 'UTF-8'));
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
    $pageH = (int)($_POST['pageHeight'] ?? 2000);
if ($pageH < 800) $pageH = 800;
$xml->addChild('pageHeight', (string)$pageH);
$winScroll = [];
if (!empty($_POST['windowScroll'])) {
  $tmp = json_decode((string)$_POST['windowScroll'], true);
  if (is_array($tmp)) $winScroll = $tmp;
}

if ($winScroll) {
  sg_add_window_scroll_tags($xml, $winScroll);
}

$projBg = [];
if (!empty($_POST['projectBackground'])) {
  $tmp = json_decode((string)$_POST['projectBackground'], true);
  if (is_array($tmp)) $projBg = $tmp;
}
if ($projBg) {
  sg_add_project_bg_tags($xml, $projBg);
}

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

sg_add_child_compact($el, 'brandCfg', $item['brandCfg'] ?? '', '', true);

    $el->addChild('x', $item['x'] ?? 0);
    $el->addChild('y', $item['y'] ?? 0);
    $el->addChild('w', $item['w'] ?? 'auto');
    $el->addChild('h', $item['h'] ?? 'auto');

    sg_add_child_compact($el, 'bg', $item['bg'] ?? 'transparent', 'transparent');
    sg_add_child_compact($el, 'border', $item['border'] ?? 'none', 'none');
    sg_add_child_compact($el, 'zIndex', $item['zIndex'] ?? '0', '0');
    sg_add_child_compact($el, 'borderRadius', $item['borderRadius'] ?? '0px', '0px');
    sg_add_child_compact($el, 'boxShadow', $item['boxShadow'] ?? 'none', 'none');
    sg_add_child_compact($el, 'opacity', $item['opacity'] ?? '1', '1');
    sg_add_child_compact($el, 'backdropFilter', $item['backdropFilter'] ?? 'none', 'none');
    sg_add_child_compact($el, 'sgLockMove', $item['sgLockMove'] ?? '0', '0');

sg_add_child_compact($el, 'sgToggleTarget',    $item['sgToggleTarget'] ?? '', '', true);
sg_add_child_compact($el, 'sgToggleTrigger',   $item['sgToggleTrigger'] ?? '', '', true);
sg_add_child_compact($el, 'sgToggleArrow',     $item['sgToggleArrow'] ?? '', '');
sg_add_child_compact($el, 'sgToggleInitial',   $item['sgToggleInitial'] ?? '', '', true);
sg_add_child_compact($el, 'sgToggleArrowSide', $item['sgToggleArrowSide'] ?? '', '', true);

    switch ($type) {

      case 'text':
        sg_add_child_compact($el, 'content', $item['content'] ?? '', '', true);

        sg_add_child_compact($el, 'color', $item['color'] ?? 'rgb(0, 0, 0)', 'rgb(0, 0, 0)');
        sg_add_child_compact($el, 'fontSize', $item['fontSize'] ?? '20px', '20px');
        sg_add_child_compact($el, 'fontFamily', $item['fontFamily'] ?? '"Segoe UI", sans-serif', '"Segoe UI", sans-serif');

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
                sg_add_child_compact($el, 'btnHtmlType', $item['btnHtmlType'] ?? 'button', 'button');
        sg_add_child_compact($el, 'btnAriaLabel', $item['btnAriaLabel'] ?? '', '', true);
        sg_add_child_compact($el, 'btnTitle', $item['btnTitle'] ?? '', '', true);
        sg_add_child_compact($el, 'btnLoading', $item['btnLoading'] ?? '0', '0');
        break;
case 'brand':

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
  sg_add_child_compact($el, 'navLayout', $item['navLayout'] ?? 'pills', 'pills');
  sg_add_child_compact($el, 'navHookMode', $item['navHookMode'] ?? 'none', 'none');

  sg_add_child_compact($el, 'navJustify', $item['navJustify'] ?? 'start', 'start');
  sg_add_child_compact($el, 'navVJustify', $item['navVJustify'] ?? 'top', 'top');

  sg_add_child_compact($el, 'navWrap', $item['navWrap'] ?? '0', '0');
  sg_add_child_compact($el, 'navStretch', $item['navStretch'] ?? '0', '0');
  sg_add_child_compact($el, 'navDivider', $item['navDivider'] ?? '0', '0');
  sg_add_child_compact($el, 'navLinkBorderW', $item['navLinkBorderW'] ?? '1', '1');
  sg_add_child_compact($el, 'navLinkBorderColor', $item['navLinkBorderColor'] ?? '#ffffff', '#ffffff');
  sg_add_child_compact($el, 'navLinkShadow', $item['navLinkShadow'] ?? '0', '0');
  sg_add_child_compact($el, 'navName', $item['navName'] ?? '', '', true);
  sg_add_child_compact($el, 'navHtmlId', $item['navHtmlId'] ?? '', '', true);
  sg_add_child_compact($el, 'navHtmlClass', $item['navHtmlClass'] ?? '', '', true);
  sg_add_child_compact($el, 'navBrandText', $item['navBrandText'] ?? '', '', true);
  sg_add_child_compact($el, 'navBrandHref', $item['navBrandHref'] ?? '', '', true);
sg_add_child_compact($el, 'navBgMode', $item['navBgMode'] ?? 'solid', 'solid');
sg_add_child_compact($el, 'navBgSolid', $item['navBgSolid'] ?? '#111827', '#111827');

sg_add_child_compact($el, 'navGradType', $item['navGradType'] ?? 'linear', 'linear');
sg_add_child_compact($el, 'navGradAngle', $item['navGradAngle'] ?? '135', '135');
sg_add_child_compact($el, 'navGradPosX', $item['navGradPosX'] ?? '50', '50');
sg_add_child_compact($el, 'navGradPosY', $item['navGradPosY'] ?? '50', '50');
sg_add_child_compact($el, 'navGradFrom', $item['navGradFrom'] ?? '#0ea5e9', '#0ea5e9');
sg_add_child_compact($el, 'navGradMid', $item['navGradMid'] ?? '#a855f7', '#a855f7');
sg_add_child_compact($el, 'navGradTo', $item['navGradTo'] ?? '#111827', '#111827');
sg_add_child_compact($el, 'navGradUseMid', $item['navGradUseMid'] ?? '0', '0');
sg_add_child_compact($el, 'navGradPreset', $item['navGradPreset'] ?? '', '', true);

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


case 'block':
  sg_add_scroll_block_xml($el, $item['sgScrollBlock'] ?? '');
if (($item['isFooter'] ?? '0') === '1') {
  sg_add_child_compact($el, 'isFooter', '1', '0');
  sg_add_child_compact($el, 'footerDock', $item['footerDock'] ?? 'bottom', 'bottom');
  sg_add_child_compact($el, 'footerMode', $item['footerMode'] ?? 'fixed', 'fixed'); 
  sg_add_child_compact($el, 'footerBottom', $item['footerBottom'] ?? '0', '0');
  sg_add_child_compact($el, 'footerLeft', $item['footerLeft'] ?? '0', '0');
  sg_add_child_compact($el, 'footerBgMode', $item['footerBgMode'] ?? 'solid', 'solid');
  sg_add_child_compact($el, 'footerBgSolid', $item['footerBgSolid'] ?? '#111827', '#111827');
  sg_add_child_compact($el, 'footerGradFrom', $item['footerGradFrom'] ?? '#111827', '#111827');
  sg_add_child_compact($el, 'footerGradTo', $item['footerGradTo'] ?? '#0f172a', '#0f172a');
  sg_add_child_compact($el, 'footerGradAngle', $item['footerGradAngle'] ?? '135', '135');

  sg_add_child_compact($el, 'footerTextColor', $item['footerTextColor'] ?? '#ffffff', '#ffffff');
  sg_add_child_compact($el, 'footerHeight', $item['footerHeight'] ?? '80', '80');
  sg_add_child_compact($el, 'footerPad', $item['footerPad'] ?? '16', '16');
  sg_add_child_compact($el, 'footerRadius', $item['footerRadius'] ?? '0', '0');

  sg_add_child_compact($el, 'footerBorderOn', $item['footerBorderOn'] ?? '0', '0');
  sg_add_child_compact($el, 'footerBorderW', $item['footerBorderW'] ?? '1', '1');
  sg_add_child_compact($el, 'footerBorderColor', $item['footerBorderColor'] ?? '#334155', '#334155');

  sg_add_child_compact($el, 'footerShadowOn', $item['footerShadowOn'] ?? 'off', 'off');
  sg_add_child_compact($el, 'footerShadowX', $item['footerShadowX'] ?? '0', '0');
  sg_add_child_compact($el, 'footerShadowY', $item['footerShadowY'] ?? '12', '12');
  sg_add_child_compact($el, 'footerShadowBlur', $item['footerShadowBlur'] ?? '30', '30');
  sg_add_child_compact($el, 'footerShadowSpread', $item['footerShadowSpread'] ?? '0', '0');
  sg_add_child_compact($el, 'footerShadowColor', $item['footerShadowColor'] ?? '#000000', '#000000');
  sg_add_child_compact($el, 'footerShadowAlpha', $item['footerShadowAlpha'] ?? '18', '18');

  sg_add_child_compact($el, 'footerBlur', $item['footerBlur'] ?? '0', '0');
  sg_add_child_compact($el, 'footerOpacity', $item['footerOpacity'] ?? '100', '100');

}


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
sg_add_child_compact($el, 'passMinLen', $item['passMinLen'] ?? '0', '0');
sg_add_child_compact($el, 'passReveal', $item['passReveal'] ?? '1', '1');
sg_add_child_compact($el, 'passMeter', $item['passMeter'] ?? '1', '1');
sg_add_child_compact($el, 'passAutocomplete', $item['passAutocomplete'] ?? '', '', true);

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
sg_add_child_compact($el, 'formMarkerText',  $item['formMarkerText'] ?? '', '', true);
sg_add_child_compact($el, 'formMarkerStyle', $item['formMarkerStyle'] ?? 'none', 'none');
sg_add_child_compact($el, 'formIcon',     $item['formIcon'] ?? '', '', true);
sg_add_child_compact($el, 'formIconSide', $item['formIconSide'] ?? 'left', 'left');
sg_add_child_compact($el, 'formIconMode', $item['formIconMode'] ?? 'split', 'split');
sg_add_child_compact($el, 'formIconBg',   $item['formIconBg'] ?? '#f1f5f9', '#f1f5f9');
sg_add_child_compact($el, 'formIconColor',$item['formIconColor'] ?? '#0f172a', '#0f172a');
sg_add_child_compact($el, 'formInputStyle',       $item['formInputStyle'] ?? 'box', 'box');
sg_add_child_compact($el, 'formInputBg',          $item['formInputBg'] ?? '#ffffff', '#ffffff');
sg_add_child_compact($el, 'formInputBorder',      $item['formInputBorder'] ?? '#d1d5db', '#d1d5db');
sg_add_child_compact($el, 'formInputBorderStyle', $item['formInputBorderStyle'] ?? 'solid', 'solid');
sg_add_child_compact($el, 'formInputBorderW',     $item['formInputBorderW'] ?? '1', '1');
sg_add_child_compact($el, 'formInputShadow',      $item['formInputShadow'] ?? 'soft', 'soft');

sg_add_child_compact($el, 'formInputPadX',        $item['formInputPadX'] ?? '10', '10');
sg_add_child_compact($el, 'formInputPadY',        $item['formInputPadY'] ?? '9', '9');

sg_add_child_compact($el, 'formPlaceholderColor', $item['formPlaceholderColor'] ?? '#94a3b8', '#94a3b8');
sg_add_child_compact($el, 'formFocusRing',        $item['formFocusRing'] ?? '4', '4');
sg_add_child_compact($el, 'formFocusOpacity',     $item['formFocusOpacity'] ?? '18', '18');
sg_add_child_compact($el, 'formNoBg', $item['formNoBg'] ?? '0', '0');

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

$dom = new DOMDocument('1.0', 'UTF-8');
$dom->preserveWhiteSpace = false;
$dom->formatOutput = true;
$dom->loadXML($xml->asXML());
$dom->save($newXmlFile);

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
    body { margin: 0; padding: 0; height: 100vh; font-family: 'Segoe UI', sans-serif; overflow: auto; background: white; }
    #preview-canvas { position: relative; width: 100%; height: var(--page-h); background: white; }
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
  display: block;
  box-sizing: border-box;
  line-height: 1.2;

  min-width: 60px;
  min-height: 28px;

  overflow: auto;
  resize: both;

  max-width: none;          
  overflow-wrap: anywhere;  
  word-break: break-word;     
}

.type-text:focus{ outline:none; }
.type-text[data-editing="1"]{ cursor:text; }

    .type-block { 
    display: block; 
    overflow: visible; 
    position: absolute; 
}
.type-block.sg-scroll-frame{
  overflow: auto !important;
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
  font-weight: normal;
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
.layer-btn-lock{
  border:1px solid #d1d5db;
  background:#fff;
  border-radius:8px;
  padding:6px 8px;
  cursor:pointer;
  font-size:13px;
  line-height:1;
}
.layer-btn-lock.on{ background:#e2e8f0; border-color:#94a3b8; }
.layer-btn-lock.disabled{ opacity:.45; cursor:not-allowed; }

.layer-item.is-move-locked{ opacity:0.85; }

.canvas-element.sg-move-locked{
  cursor:not-allowed !important;
}
.link{
  color:#156fe5;
  text-decoration:underline;
  cursor:pointer;
}
.link:hover{ opacity:.85; }


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
<button id="open-window-scroll-btn" class="btn" style="background:#0ea5e9; color:white;">
  SCROLL OKNA (WINDOW)
</button>

<button id="open-block-scroll-btn" class="btn" style="background:#0284c7; color:white;">
  SCROLL RAMKI (BLOCK)
</button>


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
<button id="open-project-bg-btn" class="btn" style="background:#334155;color:white;">
  TŁO PROJEKTU
</button>
<button id="add-brand-btn" class="btn" style="background:#7c3aed;color:white;">
  STWÓRZ LOGO
</button>
        <button id="generate-btn" class="btn btn-save">ZAPISZ ZMIANY W XML</button>
<div style="margin-top:10px; border-top:1px solid #e5e7eb; padding-top:10px;">
  <label>Długość strony (px)</label>
  <input type="range" id="page-height" min="800" max="12000" step="100" value="2000">
  <input type="number" id="page-height-num" min="800" max="12000" step="100" value="2000">
</div>

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

<div id="sgPalettePanel" style="margin-top:10px; border-top:1px solid #e5e7eb; padding-top:10px;">
  <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
    <div style="font-size:12px; color:#334155; font-weight:700;">Paleta kolorów (projekt)</div>
    <button id="sg-pal-clear" type="button" class="secondary" style="padding:6px 10px; font-size:12px;">
      Wyczyść
    </button>
  </div>

  <div class="sg-pal-row">
    <input type="color" id="sg-pal-color" value="#156fe5" style="width:58px; padding:0; height:38px;">
    <input type="text" id="sg-pal-name" placeholder="np. Accent (opcjonalnie)" style="flex:1;">
  </div>

  <div class="sg-pal-row">
    <button id="sg-pal-save" type="button" class="btn" style="margin-top:0; background:#0f172a;color:white;">
      Zapisz kolor
    </button>
    <button id="sg-pal-pick" type="button" class="btn" style="margin-top:0; background:#334155;color:white;">
      Pobierz z ekranu
    </button>
  </div>

  <div id="sg-pal-list" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;"></div>

  <div class="sg-pal-help">
    Tip: kliknij dowolne pole koloru w panelach → potem kliknij próbkę w palecie (wstawi do ostatniego pola).<br>
    PPM na próbce usuwa pojedynczy kolor.
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
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e5e7eb;">
  <div style="font-size:11px; color:#64748b; font-weight:700; margin-bottom:6px; text-transform:uppercase;">
    Pole tekstu (rozmiar)
  </div>

  <div style="display:flex; gap:8px; flex-wrap:wrap;">
    <button type="button" class="tool-btn" onclick="sgTextBoxResize(-20,0)">Szer -</button>
    <button type="button" class="tool-btn" onclick="sgTextBoxResize(20,0)">Szer +</button>
    <button type="button" class="tool-btn" onclick="sgTextBoxResize(0,-20)">Wys -</button>
    <button type="button" class="tool-btn" onclick="sgTextBoxResize(0,20)">Wys +</button>

    <span class="tool-sep"></span>

    <button type="button" class="tool-btn" onclick="sgTextBoxAutoHeight()">Auto wysokość</button>
    <button type="button" class="tool-btn" onclick="sgTextBoxFitToFrame()">Dopasuj do ramki</button>
  </div>
</div>

            </div>

            <?php include 'button_manager.php'; ?>
            <?php include 'block_manager.php'; ?>
                        <?php include 'footer_manager.php'; ?>
            <?php include 'image_manager.php'; ?>
            <?php include 'ankieta_manager.php'; ?>
<?php include 'brand.php'; ?>

            <?php include 'slider_manager.php'; ?>
            <?php
require_once __DIR__ . '/sidescroll_menager_window.php';
require_once __DIR__ . '/sidescroll_menager_block.php';

sidescroll_menager_window();
sidescroll_menager_block();
?>
<div id="sgProjectBgPanel" style="display:none; margin-top:12px; padding-top:12px; border-top:1px solid #e5e7eb;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <div style="font-size:12px; color:#334155; font-weight:800;">Tło projektu</div>
    <button type="button" id="close-project-bg-btn" class="tool-btn">Zamknij</button>
  </div>

  <input type="hidden" id="sgProjectBgJson" value='{"mode":"none"}'>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
    <div>
      <label style="margin-top:0;">Tryb</label>
      <select id="proj-bg-mode">
        <option value="none">— brak —</option>
        <option value="solid">Kolor</option>
        <option value="gradient">Gradient</option>
      </select>
    </div>

    <div id="proj-bg-solid-wrap" style="display:none;">
      <label style="margin-top:0;">Kolor</label>
      <input type="color" id="proj-bg-solid" value="#f3f4f6">
    </div>
  </div>

  <div id="proj-bg-grad-wrap" style="display:none; margin-top:10px;">
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div>
        <label style="margin-top:0;">Typ gradientu</label>
        <select id="proj-grad-type">
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
          <option value="conic">Conic</option>
        </select>
      </div>

      <div>
        <label style="margin-top:0;">Preset</label>
        <select id="proj-grad-preset">
          <option value="">— custom —</option>
          <option value="ocean">Ocean</option>
          <option value="sunset">Sunset</option>
          <option value="forest">Forest</option>
          <option value="night">Night</option>
          <option value="candy">Candy</option>
        </select>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:10px;">
      <div>
        <label style="margin-top:0;">Od</label>
        <input type="color" id="proj-grad-from" value="#0ea5e9">
      </div>

      <div>
        <label style="margin-top:0;">Środek</label>
        <input type="color" id="proj-grad-mid" value="#6366f1">
        <label style="margin-top:8px; font-size:11px;">
          <input type="checkbox" id="proj-grad-use-mid"> 3 kolor
        </label>
      </div>

      <div>
        <label style="margin-top:0;">Do</label>
        <input type="color" id="proj-grad-to" value="#111827">
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:10px;">
      <div id="proj-grad-angle-wrap">
        <label style="margin-top:0;">Kąt (deg)</label>
        <input type="number" id="proj-grad-angle" min="0" max="360" step="1" value="180">
      </div>

      <div>
        <label style="margin-top:0;">Center X (%)</label>
        <input type="number" id="proj-grad-posx" min="0" max="100" step="1" value="50">
      </div>

      <div>
        <label style="margin-top:0;">Center Y (%)</label>
        <input type="number" id="proj-grad-posy" min="0" max="100" step="1" value="50">
      </div>
    </div>
  </div>
</div>


      

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
window.activeContainer = activeContainer;

var addMode = null;
var savedRange = null;
var zCounter = 10;


function setAsTarget(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;

  const t = (el.dataset.type || "");
  if (t !== "block" && t !== "button") return;

  activeContainer = el;
  window.activeContainer = activeContainer;

  const display =
    document.getElementById("current-target") ||
    document.getElementById("current-target-display");

  if (display) {
    const label =
      (t === "button") ? "Guzik" :
      (el.dataset.isFooter === "1") ? "Stopka" :
      "Ramka";
    display.innerText = `${label} (${String(id).slice(-4)})`;
  }

  if (typeof refreshLayers === "function") refreshLayers();
}
function resetToCanvas() {
  activeContainer = canvas;
  window.activeContainer = activeContainer;

  const display =
    document.getElementById("current-target") ||
    document.getElementById("current-target-display");

  if (display) display.innerText = "Główny ekran";

  if (typeof refreshLayers === "function") refreshLayers();
}
function toggleTarget(id){
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;
  if (window.activeContainer === el) resetToCanvas();
  else setAsTarget(id);
}
function sgApplyMoveLockStyles(el){
  if (!el) return;
  const locked = (el.dataset.sgLockMove === "1");
  if (locked) {
    el.classList.add("sg-move-locked");
  } else {
    el.classList.remove("sg-move-locked");
  }
}

window.sgToggleLockMove = function(id){
  const el = document.querySelector(`.canvas-element[data-id="${id}"]`);
  if (!el) return;
  if (el.dataset.locked === "1") return;

  el.dataset.sgLockMove = (el.dataset.sgLockMove === "1") ? "0" : "1";
  sgApplyMoveLockStyles(el);
  refreshLayers();
};


    function refreshLayers() {
        layersList.innerHTML = '';
        
        function drawLayerTree(container, level = 0) {
            const elements = Array.from(container.children).filter(el => el.classList.contains('canvas-element'));
            elements.sort((a, b) => parseInt(b.style.zIndex || 0) - parseInt(a.style.zIndex || 0));

            elements.forEach(el => {
                const li = document.createElement('li');
                const isTarget = activeContainer === el;

                const isMoveLocked = (el.dataset.locked === "1" || el.dataset.sgLockMove === "1");
li.className = 'layer-item'
  + (activeElement === el ? ' active' : '')
  + (isTarget ? ' is-target' : '')
  + (isMoveLocked ? ' is-move-locked' : '')
                li.style.marginLeft = (level * 15) + 'px'; 

                const previewColor = el.dataset.type === 'text' ? (el.style.color || '#000000') : (el.style.backgroundColor || '#ffffff');

const isTargetable = (el.dataset.type === "block" || el.dataset.type === "button");

const targetLabel =
  (el.dataset.type === "button") ? "OTWÓRZ GUZIK" :
  (el.dataset.isFooter === "1") ? "OTWÓRZ STOPKĘ" :
  "OTWÓRZ RAMKĘ";

const targetBtn = isTargetable
  ? `<button class="layer-btn-target"
        onclick="event.stopPropagation(); ${isTarget ? "resetToCanvas()" : `setAsTarget('${el.dataset.id}')`}">
        ${isTarget ? "✅ ZAMKNIJ WARSTWĘ" : `🎯 ${targetLabel}`}
     </button>`
  : '';



const domId = (el.dataset.htmlId || '').trim();
const domClass = (el.dataset.htmlClass || '').trim();

const metaTxt = [
  domId ? `#${domId}` : '',
  domClass ? `.${domClass.split(/\s+/).join('.')}` : ''
].filter(Boolean).join(' ');

const editBtn = (el.dataset.type === 'text')
  ? `<button class="layer-btn layer-btn-edit" title="Edytuj tekst"
       onclick="event.stopPropagation(); sgStartTextEdit('${el.dataset.id}')">✎</button>`
  : '';
const baseLocked = (el.dataset.locked === "1");
const moveLocked = (baseLocked || el.dataset.sgLockMove === "1");

const lockBtn = `
  <button class="layer-btn-lock ${moveLocked ? 'on' : ''} ${baseLocked ? 'disabled' : ''}"
    title="${baseLocked ? 'Zablokowane (baza)' : (moveLocked ? 'Odblokuj przesuwanie' : 'Zablokuj przesuwanie')}"
    onclick="event.stopPropagation(); ${baseLocked ? '' : `sgToggleLockMove('${el.dataset.id}')`}">
    ${moveLocked ? '🔒' : '🔓'}
  </button>
`;

                li.innerHTML = `
  <div class="layer-top-row" style="display:flex; justify-content:space-between; align-items:center;">
    <div style="display:flex; align-items:center;">
      <div class="layer-color-preview" style="background-color: ${previewColor}"></div>
      <span>
  ${level > 0 ? '↳ ' : ''}
  ${el.dataset.type === 'text' ? '🔤' : (el.dataset.isFooter === "1" ? '🧷' : '📦')}
  ${
    el.dataset.isFooter === "1"
      ? ("Stopka " + ((el.dataset.footerDock || "bottom") === "top" ? "↑" : "↓"))
      : el.dataset.id.slice(-4)
  }
</span>

    </div>
<div class="layer-controls">
  ${editBtn}
  ${lockBtn}
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
function sg_forceIntoTarget(targetEl) {
  if (!targetEl || targetEl === canvas) return;

  const created =
    window.activeElement ||
    document.querySelector('.canvas-element.active') ||
    null;

  if (!created || created === targetEl) return;

  if (created.parentElement !== targetEl) {
    nestElement(created.dataset.id, targetEl.dataset.id);
  }
  if (targetEl.dataset && targetEl.dataset.isFooter === "1") {
    const pad = 8;

    const curX = parseInt(created.style.left || "0", 10) || 0;
    const curY = parseInt(created.style.top || "0", 10) || 0;

    const maxX = Math.max(pad, targetEl.clientWidth - created.offsetWidth - pad);
    const maxY = Math.max(pad, targetEl.clientHeight - created.offsetHeight - pad);

    const nextX = Math.min(Math.max(curX, pad), maxX);
    const nextY = Math.min(Math.max(curY, pad), maxY);

    created.style.left = nextX + "px";
    created.style.top  = nextY + "px";
  }

  refreshLayers();
}

function createElement(x, y, type) {
  const targetEl = activeContainer;

  if (type === 'button') {
    if (typeof createButtonElement === "function") {
      createButtonElement(x, y);
      sg_forceIntoTarget(targetEl);
    } else alert("Brakuje createButtonElement()");
    addMode = null;
    return;
  }

  if (type === 'nav') {
    if (typeof createNavElement === "function") {
      createNavElement(x, y);
      sg_forceIntoTarget(targetEl);
    } else alert("Brakuje createNavElement()");
    addMode = null;
    return;
  }

  if (type === 'calendar') {
    if (typeof createCalendarElement === "function") {
      createCalendarElement(x, y);
      sg_forceIntoTarget(targetEl);
    } else alert("Brakuje createCalendarElement()");
    addMode = null;
    return;
  }

  if (type === 'block') {
    createBlockElement(x, y);
    sg_forceIntoTarget(targetEl);
    addMode = null;
    return;
  }

  if (type === 'slider') {
    createSliderElement(x, y);
    sg_forceIntoTarget(targetEl);
    addMode = null;
    return;
  }


if (type === 'brand') {
  if (typeof createBrandElement === "function") {
    createBrandElement(x, y);
    sg_forceIntoTarget(targetEl);
  } else alert("Brakuje createBrandElement()");
  addMode = null;
  return;
}


  zCounter++;
  const div = document.createElement('div');
  div.className = 'canvas-element type-' + type;
  div.dataset.id = 'el_' + Date.now();
  div.dataset.type = type;
  div.dataset.sgLockMove = "0";

  div.style.zIndex = zCounter;
  div.spellcheck = false;

    if (type === 'text') {
        div.contentEditable = "false";
        div.dataset.editing = "0";
        div.innerText = "Wpisz tekst...";
        div.style.fontSize = "20px";
        div.style.fontFamily = "'Segoe UI', sans-serif";
          div.style.width  = "220px";
  div.style.height = "90px";
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

  const parentType = String(parent.dataset.type || "");
  const isButton = parentType === "button";
  if (isButton) {
    const isOpen = (window.activeContainer === parent);
    const alreadyInside = (child.parentElement === parent);
    if (!isOpen && !alreadyInside) {
      return;
    }
  }

  const pRect = parent.getBoundingClientRect();
  const cRect = child.getBoundingClientRect();

  child.style.left = (cRect.left - pRect.left) + "px";
  child.style.top  = (cRect.top  - pRect.top)  + "px";

  parent.appendChild(child);
  if (typeof refreshLayers === "function") refreshLayers();
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
  const isBaseLocked = (el?.dataset?.locked === "1");

  if (activeElement && activeElement !== el && activeElement.dataset.type === 'text' && activeElement.dataset.editing === "1") {
    exitTextEdit(activeElement);
  }

  if (activeElement) activeElement.classList.remove('active');

  activeElement = el;
  window.activeElement = el;

  el.classList.add('active');

  hiddenTools.style.display = 'block';
  document.getElementById('delete-element-btn').style.display = isBaseLocked ? 'none' : 'block';


  if (activeElement && activeElement !== el && activeElement.dataset.type === 'text' && activeElement.dataset.editing === "1") {
    exitTextEdit(activeElement);
  }

  if (activeElement) activeElement.classList.remove('active');

  activeElement = el;
  window.activeElement = el;

  el.classList.add('active');

  hiddenTools.style.display = 'block';
  document.getElementById('delete-element-btn').style.display = 'block';

  const type = el.dataset.type;
  const isFooter = (el.dataset.isFooter === "1");

  document.getElementById('text-edit-section').style.display   = (type === 'text') ? 'block' : 'none';
  document.getElementById('image-edit-section').style.display  = (type === 'image') ? 'block' : 'none';
  document.getElementById('form-edit-section').style.display   = (type === 'form') ? 'block' : 'none';
  document.getElementById('slider-edit-section').style.display = (type === 'slider') ? 'block' : 'none';

document.getElementById('block-edit-section').style.display  = (type === 'block') ? 'block' : 'none';
  const footerSec = document.getElementById('footer-edit-section');
  if (footerSec) footerSec.style.display = (type === 'block' && isFooter) ? 'block' : 'none';
  if (type === 'block' && isFooter && typeof syncFooterInputs === "function") {
    syncFooterInputs(el);
  }


  document.getElementById('nav-edit-section').style.display = (type === 'nav') ? 'block' : 'none';
  if (type === 'nav' && typeof syncNavInputs === "function") syncNavInputs(el);

  const calSec = document.getElementById('calendar-edit-section');
  if (calSec) calSec.style.display = (type === 'calendar') ? 'block' : 'none';
  if (type === 'calendar' && typeof syncCalendarInputs === "function") syncCalendarInputs(el);
  const brandSec = document.getElementById('brand-edit-section');
  if (brandSec) brandSec.style.display = (type === 'brand') ? 'block' : 'none';
  if (type === 'brand' && typeof syncBrandInputs === "function") syncBrandInputs(el);

    if (type === 'form') {
    if (typeof syncFormInputs === "function") syncFormInputs(el);

  } else if (type === 'image') {
    if (typeof syncImageInputs === "function") syncImageInputs(el);

  } else if (type === 'block') {
    if (isFooter) {
  if (typeof syncFooterInputs === "function") syncFooterInputs(el);
  if (typeof window.applyFooterStyles === "function") window.applyFooterStyles(el);
  if (typeof syncBlockInputs === "function") syncBlockInputs(el);
} else {
  if (typeof syncBlockInputs === "function") syncBlockInputs(el);
}

  } else if (type === 'text') {
    document.getElementById('prop-size').value = parseInt(el.style.fontSize) || 20;
    document.getElementById('prop-color').value = rgbToHex(el.style.color);
    if (typeof updateTextToolbarState === "function") updateTextToolbarState();

  } else if (type === 'slider') {
    if (typeof syncSliderInputs === "function") syncSliderInputs(el);
  }



  const metaSec = document.getElementById('meta-edit-section');
  if (metaSec) metaSec.style.display = 'block';

  const idInp = document.getElementById('prop-html-id');
  const clsInp = document.getElementById('prop-html-class');

  document.dispatchEvent(new CustomEvent('sg:selected', { detail: { el } }));

  if (idInp) idInp.value = el.dataset.htmlId || "";
  if (clsInp) clsInp.value = el.dataset.htmlClass || "";

  refreshLayers();
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


document.getElementById('add-brand-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const r = canvas.getBoundingClientRect();
  const cx = r.left + r.width * 0.5;
  const cy = r.top  + r.height * 0.20;
  createElement(cx, cy, 'brand');
};

document.getElementById('open-project-bg-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();

  hiddenTools.style.display = 'block';
  const winPanel = document.getElementById('sgWindowScrollPanel');
  if (winPanel) winPanel.style.display = 'none';

  const blockPanel = document.getElementById('sgScrollBlockPanel');
  if (blockPanel) blockPanel.style.display = 'none';

  const bgPanel = document.getElementById('sgProjectBgPanel');
  if (bgPanel) {
    bgPanel.style.display = 'block';
    bgPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.sgProjectBgBindUI?.();
    if (window.sgProjectBgConfig) {
      window.sgProjectBgSyncUI?.(window.sgProjectBgConfig);
    }
  }
};

document.getElementById('close-project-bg-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const bgPanel = document.getElementById('sgProjectBgPanel');
  if (bgPanel) bgPanel.style.display = 'none';
};

document.getElementById('add-form-btn').onclick = () => { addMode = 'form'; }; 
document.getElementById('open-window-scroll-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();

  hiddenTools.style.display = 'block';
  const blockPanel = document.getElementById('sgScrollBlockPanel');
  if (blockPanel) blockPanel.style.display = 'none';

  const panel = document.getElementById('sgWindowScrollPanel');
  if (panel) {
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (window.sgWinScrollLoad) window.sgWinScrollLoad(window.sgWindowScrollConfig);
  }
};


document.getElementById('open-block-scroll-btn').onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  hiddenTools.style.display = 'block';

  if (!activeElement || activeElement.dataset.type !== 'block') {
    alert('Zaznacz ramkę (BLOCK), żeby edytować scroll.');
    return;
  }

  document.dispatchEvent(new CustomEvent('sg:selected', { detail: { el: activeElement } }));

  const panel = document.getElementById('sgScrollBlockPanel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

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
  const targetEl = activeContainer;
  createFormElement(e.clientX, e.clientY);
  sg_forceIntoTarget(targetEl);
  addMode = null;
}else if (addMode) { 
        createElement(e.clientX, e.clientY, addMode); 
        addMode = null; 
    } else if (e.target === canvas) { 
        deselectAll(); 
    } 
};

document.getElementById('delete-element-btn').onclick = () => {
  if (!activeElement) return;
  if (activeElement.dataset.locked === "1") return; 
  activeElement.remove();
  deselectAll();
};


function getElementData(el) {


  const wasActive = el.classList.contains('active');
  if (wasActive) el.classList.remove('active');

  const cs = window.getComputedStyle(el);

  if (wasActive) el.classList.add('active');



  const children = [];
  Array.from(el.children).forEach(child => {
const childData = getElementData(child);
if (childData && childData.id && childData.type) children.push(childData);

  });

  let content = "";
  if (el.dataset.type === "text") {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.sgta-arrow').forEach(n => n.remove()); 
  content = clone.innerHTML;
} else if (el.dataset.type === "image") {
    const img = el.querySelector("img");
    content = img ? (img.getAttribute("src") || "") : "";
  }
 else if (el.dataset.type === "brand") {
  content = el.innerHTML.replace(/"/g, "'");
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
brandCfg: el.dataset.brandCfg || "",

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
    formNoBg: el.dataset.formNoBg || "0",

    label: el.dataset.label || "",
    options: el.dataset.options || "",
    accentColor: el.dataset.accentColor || "#156fe5",
    formHelpText: el.dataset.formHelpText || "",
formPlaceholder: el.dataset.formPlaceholder || "",
formRequired: el.dataset.formRequired || "0",
formInline: el.dataset.formInline || "0",
formName: el.dataset.formName || "",

formRows: el.dataset.formRows || "3",
formMin: el.dataset.formMin || "",
formMax: el.dataset.formMax || "",
formStep: el.dataset.formStep || "",
passMinLen: el.dataset.passMinLen || "0",
passReveal: el.dataset.passReveal || "1",
passMeter: el.dataset.passMeter || "1",
passAutocomplete: el.dataset.passAutocomplete || "",

ratingMin: el.dataset.ratingMin || "1",
ratingMax: el.dataset.ratingMax || "5",
ratingStep: el.dataset.ratingStep || "1",
ratingMinLabel: el.dataset.ratingMinLabel || "",
ratingMaxLabel: el.dataset.ratingMaxLabel || "",

likertMin: el.dataset.likertMin || "1",
likertMax: el.dataset.likertMax || "5",
likertLeft: el.dataset.likertLeft || "",
likertRight: el.dataset.likertRight || "",

formInputRadius: el.dataset.formInputRadius || "10",
formMarkerText: el.dataset.formMarkerText || "",
formMarkerStyle: el.dataset.formMarkerStyle || "none",

formIcon: el.dataset.formIcon || "",
formIconSide: el.dataset.formIconSide || "left",
formIconMode: el.dataset.formIconMode || "split",
formIconBg: el.dataset.formIconBg || "#f1f5f9",
formIconColor: el.dataset.formIconColor || "#0f172a",

formInputStyle: el.dataset.formInputStyle || "box",
formInputBg: el.dataset.formInputBg || "#ffffff",
formInputBorder: el.dataset.formInputBorder || "#d1d5db",
formInputBorderStyle: el.dataset.formInputBorderStyle || "solid",
formInputBorderW: el.dataset.formInputBorderW || "1",
formInputShadow: el.dataset.formInputShadow || "soft",
formInputPadX: el.dataset.formInputPadX || "10",
formInputPadY: el.dataset.formInputPadY || "9",

formPlaceholderColor: el.dataset.formPlaceholderColor || "#94a3b8",
formFocusRing: el.dataset.formFocusRing || "4",
formFocusOpacity: el.dataset.formFocusOpacity || "18",

    sliderLabel: el.dataset.sliderLabel || "",
    sliderUnit: el.dataset.sliderUnit || "",
    sliderMin: el.dataset.sliderMin || "0",
    sliderMax: el.dataset.sliderMax || "100",
    sliderStep: el.dataset.sliderStep || "1",
    sliderValue: el.dataset.sliderValue || "0",
    sliderShowValue: el.dataset.sliderShowValue || "1",
    sliderShowMinMax: el.dataset.sliderShowMinMax || "0",
    sliderPreset: el.dataset.sliderPreset || "soft",
    sgScrollBlock: el.dataset.sgScrollBlock || "",
    sgToggleTarget: el.dataset.sgToggleTarget || "",
sgToggleTrigger: el.dataset.sgToggleTrigger || "",
sgToggleArrow: el.dataset.sgToggleArrow || "",
sgToggleInitial: el.dataset.sgToggleInitial || "",
sgToggleArrowSide: el.dataset.sgToggleArrowSide || "",

    sliderTrack: el.dataset.sliderTrack || "#e2e8f0",
    sliderFill: el.dataset.sliderFill || "#156fe5",
    sliderThumb: el.dataset.sliderThumb || "#156fe5",
    sliderTrackH: el.dataset.sliderTrackH || "8",
    sliderThumbS: el.dataset.sliderThumbS || "18",

    isFooter: el.dataset.isFooter || "0",
footerDock: el.dataset.footerDock || "bottom",
footerMode: el.dataset.footerMode || "fixed",
footerBottom: el.dataset.footerBottom || "0",
footerLeft: el.dataset.footerLeft || "0",
footerBgMode: el.dataset.footerBgMode || "solid",
footerBgSolid: el.dataset.footerBgSolid || "#111827",
footerGradFrom: el.dataset.footerGradFrom || "#111827",
footerGradTo: el.dataset.footerGradTo || "#0f172a",
footerGradAngle: el.dataset.footerGradAngle || "135",

footerTextColor: el.dataset.footerTextColor || "#ffffff",
footerHeight: el.dataset.footerHeight || "80",
footerPad: el.dataset.footerPad || "16",
footerRadius: el.dataset.footerRadius || "0",

footerBorderOn: el.dataset.footerBorderOn || "0",
footerBorderW: el.dataset.footerBorderW || "1",
footerBorderColor: el.dataset.footerBorderColor || "#334155",

footerShadowOn: el.dataset.footerShadowOn || "off",
footerShadowX: el.dataset.footerShadowX || "0",
footerShadowY: el.dataset.footerShadowY || "12",
footerShadowBlur: el.dataset.footerShadowBlur || "30",
footerShadowSpread: el.dataset.footerShadowSpread || "0",
footerShadowColor: el.dataset.footerShadowColor || "#000000",
footerShadowAlpha: el.dataset.footerShadowAlpha || "18",

footerBlur: el.dataset.footerBlur || "0",
footerOpacity: el.dataset.footerOpacity || "100",

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

    navLinkColor: el.dataset.navLinkColor || "#ffffff",
    navHoverBg: el.dataset.navHoverBg || "rgba(255,255,255,0.12)",
    navHoverColor: el.dataset.navHoverColor || "#ffffff",
    navActiveBg: el.dataset.navActiveBg || "rgba(255,255,255,0.18)",
    navActiveColor: el.dataset.navActiveColor || "#ffffff",

    navActiveMode: el.dataset.navActiveMode || "query_page",
    navLayout: el.dataset.navLayout || "pills",
navHookMode: el.dataset.navHookMode || "none",

navJustify: el.dataset.navJustify || "start",
navVJustify: el.dataset.navVJustify || "top",

navWrap: el.dataset.navWrap || "0",
navStretch: el.dataset.navStretch || "0",
navDivider: el.dataset.navDivider || "0",

navLinkBorderW: el.dataset.navLinkBorderW || "1",
navLinkBorderColor: el.dataset.navLinkBorderColor || "#ffffff",
navLinkShadow: el.dataset.navLinkShadow || "soft",

navName: el.dataset.navName || "",
navHtmlId: el.dataset.navHtmlId || "",
navHtmlClass: el.dataset.navHtmlClass || "",

navBrandText: el.dataset.navBrandText || "",
navBrandHref: el.dataset.navBrandHref || "#",
navBgMode: el.dataset.navBgMode || "solid",
navBgSolid: el.dataset.navBgSolid || "#111827",
navGradType: el.dataset.navGradType || "linear",
navGradAngle: el.dataset.navGradAngle || "135",
navGradPosX: el.dataset.navGradPosX || "50",
navGradPosY: el.dataset.navGradPosY || "50",
navGradFrom: el.dataset.navGradFrom || "#0ea5e9",
navGradMid: el.dataset.navGradMid || "#a855f7",
navGradTo: el.dataset.navGradTo || "#111827",
navGradUseMid: el.dataset.navGradUseMid || "0",
navGradPreset: el.dataset.navGradPreset || "",

calYear: el.dataset.calYear || "2026",
calMonth: el.dataset.calMonth || "1",
calWeekStart: el.dataset.calWeekStart || "mon",
calTheme: el.dataset.calTheme || "blue",
calBgA: el.dataset.calBgA || "",
calBgB: el.dataset.calBgB || "",
calAccent: el.dataset.calAccent || "",
btnHtmlType: el.dataset.btnHtmlType || 'button',
btnAriaLabel: el.dataset.btnAriaLabel || '',
btnTitle: el.dataset.btnTitle || '',
btnLoading: el.dataset.btnLoading || '0',
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
        fd.append('pageHeight', String(SG_PAGE_H));
        fd.append('windowScroll', document.getElementById('sgWinScrollJson')?.value || '{}');
fd.append('projectBackground', document.getElementById('sgProjectBgJson')?.value || '{}');
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
  el.style.pointerEvents = "auto";

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
    if (el.dataset.type === "brand") window.updateBrandVisuals?.(el);
    if (el.dataset.type === "form") window.updateFormVisuals?.(el);

    if (el.dataset.type === "nav")    window.updateNavVisuals?.(el);

if (el.dataset.type === "block" && (el.dataset.sgScrollBlock || "").trim() !== "") {
  window.sg_sidescroll_blok?.(el);
}
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

  if (k === "sgScrollBlock") {
    const hasTags = ch.querySelector("enabled, axis, thickness, track, thumb");
    if (hasTags) {
      const get = (tag, def="") => (ch.querySelector(tag)?.textContent || def).trim();
      const asBool = (v, def=false) => {
        const s = String(v ?? "").trim().toLowerCase();
        if (s === "1" || s === "true") return true;
        if (s === "0" || s === "false") return false;
        return def;
      };

      const cfg = {
        enabled: asBool(get("enabled","1"), true),
        axis: get("axis","y"),
        ySide: get("ySide","right"),
        xSide: get("xSide","bottom"),
        thickness: parseInt(get("thickness","10"),10) || 10,
        gap: parseInt(get("gap","6"),10) || 6,
        radius: parseInt(get("radius","10"),10) || 10,
        track: get("track","rgba(148,163,184,.35)"),
        thumb: get("thumb","rgba(15,23,42,.55)"),
        thumbHover: get("thumbHover","rgba(15,23,42,.75)"),
        autoHide: asBool(get("autoHide","1"), true),
        smooth: asBool(get("smooth","1"), true),
        wheel: asBool(get("wheel","1"), true),
        wheelStep: parseInt(get("wheelStep","70"),10) || 70,
        fadeHint: asBool(get("fadeHint","1"), true),
        fadeOpacity: parseFloat(get("fadeOpacity","0.22")) || 0.22
      };

      item.dataset[k] = JSON.stringify(cfg);
      return;
    }
    item.dataset[k] = (ch.textContent || "").trim();
    return;
  }

  item.dataset[k] = (ch.textContent ?? "");
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
  sgApplyMoveLockStyles(el);

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
} else if (item.type === "brand") {
  el.innerHTML = "";
  el.contentEditable = "false";
  window.updateBrandVisuals?.(el);
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

  items.forEach(item => {

    canvas.appendChild(spawnItem(item, origin));
  });
}

function clearChildFromCanvas(){
  document.querySelectorAll('.canvas-element:not([data-origin="base"])').forEach(el => el.remove());
}

async function loadWithBase(childFile){
  clearChildFromCanvas();
  clearBaseFromCanvas();

  const childXml = await fetchXmlFile(childFile);
  const ph = parsePageHeight(childXml);
if (ph) applyPageHeight(ph);

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
  let winCfg = parseWindowScroll(childXml);
if (!winCfg && baseFile) {
  const baseXml2 = await fetchXmlFile(baseFile);
  winCfg = parseWindowScroll(baseXml2);
}

if (!winCfg) {
  winCfg = {
    enabled: true,
    firefoxThin: false,
    width: 12,
    radius: 10,
    track: "rgba(203,213,225,0.25)",
    thumb: "rgba(15,23,42,0.55)",
    thumbHover: "rgba(15,23,42,0.75)"
  };
}

window.sgWindowScrollConfig = winCfg;

const winJson = document.getElementById("sgWinScrollJson");
if (winJson) winJson.value = JSON.stringify(winCfg);
if (window.sgWinScrollLoad) window.sgWinScrollLoad(winCfg);
else if (window.sg_sideblock_window) window.sg_sideblock_window(winCfg);
let bgCfg = window.sgProjectBgParse?.(childXml);

if (!bgCfg && baseFile) {
  const baseXml3 = await fetchXmlFile(baseFile);
  bgCfg = window.sgProjectBgParse?.(baseXml3);
}

if (!bgCfg) bgCfg = window.sgProjectBgDefault?.();

window.sgProjectBgConfig = bgCfg;

const bgJson = document.getElementById("sgProjectBgJson");
if (bgJson) bgJson.value = JSON.stringify(bgCfg);

window.sgProjectBgSyncUI?.(bgCfg);
window.sgProjectBgApply?.(bgCfg);



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

  const isContainer = (x) =>
    x && x !== canvas &&
    x.classList?.contains("canvas-element") &&
    (x.dataset.type === "block" || x.dataset.type === "button");

  if (dir === 1) {
    if (isContainer(activeContainer) && activeContainer !== el) {
      nestElement(el.dataset.id, activeContainer.dataset.id);
      refreshLayers();
      return;
    }
    const siblings = Array.from(el.parentElement.children).filter(s =>
      s !== el &&
      s.classList.contains("canvas-element") &&
      (s.dataset.type === "block" || s.dataset.type === "button")
    );

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
  if (typeof selectElement === 'function') selectElement(el);

  el.dataset.editing = "1";
  el.contentEditable = "true";
  el.style.cursor = "text";
  el.style.userSelect = "text";
  el.focus();

  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function exitTextEdit(el) {
    if (!el || el.dataset.type !== 'text') return;
    el.dataset.editing = "0";
    el.contentEditable = "false";
    el.style.cursor = "move";
    el.style.userSelect = "none";  
}


function setupElementMovement(el, type) {
  if (el.dataset.sgLockMove == null) el.dataset.sgLockMove = "0";

  el.onmousedown = (e) => {
    e.stopPropagation();
    if (el?.dataset?.locked === "1") return;

    if (typeof selectElement === "function") selectElement(el);
if (el.dataset.sgLockMove === "1") {
  sgApplyMoveLockStyles(el);
  return;
}

    if (type === "text" && el.dataset.editing === "1") return;
    if ((type === "block" || type === "button") && e.target !== el) {
      const child = e.target.closest(".canvas-element");
      if (child && child !== el) return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = el.offsetLeft;
    const startTop = el.offsetTop;
    const startParentFrame = (el.parentElement && el.parentElement.closest)
      ? el.parentElement.closest(".type-block, .type-button")
      : null;

    let moved = false;

    document.onmousemove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;

      if (!moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) moved = true;
      if (!moved) return;

      el.style.left = (startLeft + dx) + "px";
      el.style.top  = (startTop + dy) + "px";
      el.style.pointerEvents = "none";

      if (type === "block") window.sg_sidescroll_blok?.(el);
    };

    document.onmouseup = (mu) => {
      document.onmousemove = null;
      document.onmouseup = null;

      el.style.pointerEvents = "auto";

      if (moved) {
        const hit = document.elementFromPoint(mu.clientX, mu.clientY);
        const targetFrame = hit ? hit.closest(".type-block, .type-button") : null;
        if (targetFrame && targetFrame !== el) {
          if (el.parentElement !== targetFrame) {
            nestElement(el.dataset.id, targetFrame.dataset.id);
          }
        } else {
          if (startParentFrame && startParentFrame !== canvas) {
            const r = startParentFrame.getBoundingClientRect();
            const inside =
              mu.clientX >= r.left && mu.clientX <= r.right &&
              mu.clientY >= r.top  && mu.clientY <= r.bottom;

            if (inside) {
              if (el.parentElement !== startParentFrame) {
                nestElement(el.dataset.id, startParentFrame.dataset.id);
              }
            } else {
              if (el.parentElement !== canvas) unNestElement(el);
            }
          } else {
            if (el.parentElement !== canvas) unNestElement(el);
          }
        }
      }


      if (type === "block") window.sg_sidescroll_blok?.(el);
      refreshLayers();
    };
  };
}




var currentFile = <?= json_encode($selected) ?>;
window.sgCurrentFile = currentFile;

window.addEventListener('load', () => loadWithBase(currentFile));
let SG_PAGE_H = 2000;

function applyPageHeight(v){
  SG_PAGE_H = Math.max(800, parseInt(v || "2000", 10) || 2000);
  document.documentElement.style.setProperty('--page-h', SG_PAGE_H + 'px');
  const r = document.getElementById('page-height');
  const n = document.getElementById('page-height-num');
  if (r) r.value = SG_PAGE_H;
  if (n) n.value = SG_PAGE_H;
}

document.getElementById('page-height')?.addEventListener('input', (e)=> applyPageHeight(e.target.value));
document.getElementById('page-height-num')?.addEventListener('input', (e)=> applyPageHeight(e.target.value));
applyPageHeight(2000);



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
function parseWindowScroll(xmlText){
  try{
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const ws = doc.querySelector("customPage > windowScroll");
    if (!ws) return null;

    const hasTags = ws.querySelector("enabled, width, track, thumb");
    if (hasTags) {
      const get = (tag, def="") => (ws.querySelector(tag)?.textContent || def).trim();
      const asBool = (v, def=false) => {
        const s = String(v ?? "").trim().toLowerCase();
        if (s === "1" || s === "true") return true;
        if (s === "0" || s === "false") return false;
        return def;
      };

      return {
        enabled: asBool(get("enabled","1"), true),
        firefoxThin: asBool(get("firefoxThin","0"), false),
        width: parseInt(get("width","12"),10) || 12,
        radius: parseInt(get("radius","10"),10) || 10,
        track: get("track","rgba(203,213,225,0.25)"),
        thumb: get("thumb","rgba(15,23,42,0.55)"),
        thumbHover: get("thumbHover","rgba(15,23,42,0.75)")
      };
    }

    const raw = (ws.textContent || "").trim();
    if (!raw || raw[0] !== "{") return null;
    const cfg = JSON.parse(raw);
    return (cfg && typeof cfg === "object") ? cfg : null;
  }catch(e){
    return null;
  }
}


function parsePageHeight(xmlText){
  try{
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    const n = doc.querySelector("customPage > pageHeight");
    const v = n ? parseInt((n.textContent||"").trim(),10) : 0;
    return (v && v>0) ? v : 0;
  }catch(e){ return 0; }
}
function sg_find_canvas_by_data_id(id) {
  const all = document.querySelectorAll('.canvas-element');
  for (const el of all) {
    if (el.dataset && el.dataset.id === id) return el;
  }
  return null;
}

window.sgStartTextEdit = function (id) {
  const el = sg_find_canvas_by_data_id(id);
  if (!el) return;
  selectElement(el);
  if (el.dataset.type === 'text') enterTextEdit(el);
};

document.addEventListener('mousedown', (e) => {
  const el = activeElement;
  if (!el) return;
  if (el.dataset.type !== 'text') return;
  if (el.dataset.editing !== '1') return;
  if (el.contains(e.target)) return;

  const inUi = e.target.closest('#controls-panel, #layers-panel');
  if (inUi) return;

  exitTextEdit(el);
  selectElement(el);
}, true);

document.addEventListener('keydown', (e) => {
  const el = activeElement;
  if (!el) return;
if (el.dataset.locked === "1" || el.dataset.sgLockMove === "1") return;

  const focused = document.activeElement;
  const tag = focused && focused.tagName ? focused.tagName.toUpperCase() : '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
  if (focused && focused.isContentEditable) return;

  const isText = el.dataset.type === 'text';
  const isEditing = isText && el.dataset.editing === '1';

  if (isEditing) {
    if (e.key === 'Escape') {
      e.preventDefault();
      exitTextEdit(el);
      selectElement(el);
    }
    return;
  }

  if (isText && e.key === 'Enter') {
    e.preventDefault();
    enterTextEdit(el);
    return;
  }

  const step = e.shiftKey ? 10 : 1;
  let dx = 0, dy = 0;

  if (e.key === 'ArrowLeft') dx = -step;
  else if (e.key === 'ArrowRight') dx = step;
  else if (e.key === 'ArrowUp') dy = -step;
  else if (e.key === 'ArrowDown') dy = step;
  else return;

  e.preventDefault();

  const curLeft = parseInt(el.style.left || '0', 10) || 0;
  const curTop = parseInt(el.style.top || '0', 10) || 0;

  el.style.left = (curLeft + dx) + 'px';
  el.style.top = (curTop + dy) + 'px';
});

window.sgTextBoxResize = function(dx, dy){
  const el = activeElement;
  if (!el || el.dataset.type !== "text") return;

  const r = el.getBoundingClientRect();

  const curW = parseInt(el.style.width || r.width, 10) || Math.round(r.width);
  const curH = parseInt(el.style.height || r.height, 10) || Math.round(r.height);

  const nextW = Math.max(60, curW + dx);
  const nextH = Math.max(28, curH + dy);

  el.style.width  = nextW + "px";
  el.style.height = nextH + "px";
};

window.sgTextBoxAutoHeight = function(){
  const el = activeElement;
  if (!el || el.dataset.type !== "text") return;

  el.style.height = "auto";
  const h = Math.max(28, el.scrollHeight + 4);
  el.style.height = h + "px";
};

window.sgTextBoxFitToFrame = function(){
  const el = activeElement;
  if (!el || el.dataset.type !== "text") return;

  const p = el.parentElement;
  if (!p || !p.classList.contains("type-block")) {
    alert("Tekst nie jest w ramce (BLOCK). Najpierw zagnieźdź tekst w ramce.");
    return;
  }

  const w = Math.max(60, p.clientWidth - 10);
  const h = Math.max(28, p.clientHeight - 10);

  el.style.width  = w + "px";
  el.style.height = h + "px";
};

</script>
<script>window.SG_MODE = "builder";</script>
<?php
$__v = function(string $f){
  $p = __DIR__ . DIRECTORY_SEPARATOR . $f;
  return @filemtime($p) ?: time();
};
?>
<script src="sg_blocks.js?v=<?= $__v('sg_blocks.js') ?>"></script>
<script src="sg_slider.js?v=<?= $__v('sg_slider.js') ?>"></script>
<script src="sg_footer.js?v=<?= $__v('sg_footer.js') ?>"></script>
<script src="sg_sideblock_window.js?v=<?= $__v('sg_sideblock_window.js') ?>"></script>
<script src="sg_sidescroll_blok.js?v=<?= $__v('sg_sidescroll_blok.js') ?>"></script>


<script src="font.js?v=<?= $__v('font.js') ?>"></script>

<script src="sg_images.js?v=<?= $__v('sg_images.js') ?>"></script>
<script src="sg_ankieta.js?v=<?= $__v('sg_ankieta.js') ?>"></script>
<script src="sg_button.js?v=<?= $__v('sg_button.js') ?>"></script>
<script src="sg_nav.js?v=<?= $__v('sg_nav.js') ?>"></script>
<script src="sg_calendar.js?v=<?= $__v('sg_calendar.js') ?>"></script>


<script src="sg_toggle.js?v=<?= $__v('sg_toggle.js') ?>"></script>
<script src="sg_copy_paste.js?v=<?= @filemtime(__DIR__ . '/sg_copy_paste.js') ?: time() ?>"></script>

<script src="sg_guides.js?v=<?= $__v('sg_guides.js') ?>"></script>
<script src="sg_project_bg.js?v=<?= $__v('sg_project_bg.js') ?>"></script>
<script src="sg_brand.js?v=<?= $__v('sg_brand.js') ?>"></script>
<script src="sg_palette.js?v=<?= $__v('sg_palette.js') ?>"></script>


</body>
</html>