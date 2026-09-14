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

  if ($name === '') {
    return 'generated_page.xml';
  }

  if (!preg_match('/\.(xml|php)$/i', $name)) {
    $name .= '.xml';
  }

  return $name;
}

$requested = isset($_GET['file']) ? (string)$_GET['file'] : '';
if ($requested !== '') {
  $_SESSION['sg_xml_file'] = sg_clean_file_name($requested);
}

$selected = sg_clean_file_name((string)($_SESSION['sg_xml_file'] ?? 'generated_page.xml'));

$legacyXml = __DIR__ . DIRECTORY_SEPARATOR . 'generated_page.xml';
$xmlFile = ($selected === 'generated_page.xml')
  ? $legacyXml
  : ($projectsDir . DIRECTORY_SEPARATOR . $selected);

if (!is_file($xmlFile)) {
  $xmlFile = $legacyXml;
}


$FOOTER_PLUGIN_PART = 'functions';
require_once __DIR__ . '/footer_plugin.php';

function sg_resolve_xml_path(string $fileName, string $projectsDir, string $legacyXml): string {
  $fileName = sg_clean_file_name($fileName);
  if ($fileName === 'generated_page.xml') return $legacyXml;
  return $projectsDir . DIRECTORY_SEPARATOR . $fileName;
}

function sg_load_xml_source(string $entryPath): string {
  if (!is_file($entryPath)) {
    return '';
  }

  $ext = strtolower(pathinfo($entryPath, PATHINFO_EXTENSION));

  if ($ext === 'php') {
    ob_start();
    include $entryPath;
    return ob_get_clean();
  }

  return file_get_contents($entryPath) ?: '';
}
function sg_include_page_runtime_assets(string $selected, string $rootDir): void {
  $pageBase = preg_replace('/\.(xml|php)$/i', '', basename($selected));
  $pageBase = preg_replace('/[^a-zA-Z0-9._-]/', '_', $pageBase);

  if ($pageBase === '') {
    return;
  }

  $projectsDir = $rootDir . DIRECTORY_SEPARATOR . 'projects';

  $addCss = function (string $path, string $url): void {
    if (!is_file($path)) {
      return;
    }

    echo '<link rel="stylesheet" href="' .
      htmlspecialchars($url, ENT_QUOTES) .
      '?v=' . filemtime($path) . '">' . PHP_EOL;
  };

  $addJs = function (string $path, string $url): void {
    if (!is_file($path)) {
      return;
    }

    echo '<script src="' .
      htmlspecialchars($url, ENT_QUOTES) .
      '?v=' . filemtime($path) . '" defer></script>' . PHP_EOL;
  };

  /*
   * UKŁAD 1 — folder strony:
   * projects/main_make_appointment/main_make_appointment.php
   * projects/main_make_appointment/main_make_appointment.css
   * projects/main_make_appointment/main_make_appointment.js
   *
   * Ten wariant zostaje dla appointment.
   */
  $assetDir = $projectsDir . DIRECTORY_SEPARATOR . $pageBase;
  $assetUrl = 'projects/' . $pageBase;

  if (is_dir($assetDir)) {
    $runtimePhp = $assetDir . DIRECTORY_SEPARATOR . $pageBase . '.php';

    if (is_file($runtimePhp)) {
      $SG_PAGE_BASE_DIR = $assetDir;
      $SG_PAGE_BASE_URL = $assetUrl;

      include $runtimePhp;

      /*
       * Ważne:
       * appointment ma własny runtime PHP, który sam ładuje JS/CSS
       * i przekazuje dane z bazy do window.VETMELL_FREE_SLOTS.
       * Dlatego tutaj kończymy.
       */
      return;
    }

    $addCss(
      $assetDir . DIRECTORY_SEPARATOR . $pageBase . '.css',
      $assetUrl . '/' . $pageBase . '.css'
    );

    $addJs(
      $assetDir . DIRECTORY_SEPARATOR . $pageBase . '.js',
      $assetUrl . '/' . $pageBase . '.js'
    );
  }

  /*
   * UKŁAD 2 — pliki bezpośrednio w projects:
   * projects/veterynarze_home.php
   * projects/veterynarze_home.css
   * projects/veterynarze_home.js
   */
  $addCss(
    $projectsDir . DIRECTORY_SEPARATOR . $pageBase . '.css',
    'projects/' . $pageBase . '.css'
  );

  $addJs(
    $projectsDir . DIRECTORY_SEPARATOR . $pageBase . '.js',
    'projects/' . $pageBase . '.js'
  );
}
function sg_load_xml_chain(string $entryPath, string $projectsDir, string $legacyXml, array &$seen = []): array {
  if (!is_file($entryPath)) return [];

  $xmlText = sg_load_xml_source($entryPath);
  if (trim($xmlText) === '') return [];

  $xml = @simplexml_load_string($xmlText);
  if (!$xml) {
    echo '<pre style="color:red;background:#fff;padding:20px;">';
    echo "Błąd parsowania XML z pliku:\n";
    echo htmlspecialchars($entryPath, ENT_QUOTES, 'UTF-8');
    echo "\n\nWygenerowana treść:\n";
    echo htmlspecialchars($xmlText, ENT_QUOTES, 'UTF-8');
    echo '</pre>';
    exit;
  }

  $docs = [];
  $base = trim((string)($xml->extends ?? ''));

  if ($base !== '') {
    $base = sg_clean_file_name($base);
    if (!isset($seen[$base])) {
      $seen[$base] = true;
      $basePath = sg_resolve_xml_path($base, $projectsDir, $legacyXml);
      $docs = array_merge($docs, sg_load_xml_chain($basePath, $projectsDir, $legacyXml, $seen));
    }
  }

  $docs[] = $xml;
  return $docs;
}

function sg_xml_val($el, string $tag, string $default): string {
  if (!isset($el->$tag)) return $default;
  $v = trim((string)$el->$tag);
  return $v !== '' ? $v : $default;
}
function sg_normalize_box_shadow(string $s): string {
  $s = trim($s);
  if ($s === '' || $s === 'none') return $s;

  if (preg_match('/^(rgba?\\([^\\)]+\\)|#[0-9a-fA-F]{3,8})\\s+(.+)$/', $s, $m)) {
    return trim($m[2] . ' ' . $m[1]);
  }
  return $s;
}
function sg_boolish($v): bool {
  $s = strtolower(trim((string)$v));
  return ($s === '1' || $s === 'true' || $s === 'yes' || $s === 'on');
}

function sg_parse_scroll_block_node($node): ?array {
  if (!$node) return null;

  if (isset($node->enabled) || isset($node->axis) || isset($node->track)) {
    return [
      'enabled'     => sg_boolish($node->enabled ?? '1'),
      'axis'        => (string)($node->axis ?? 'y'),
      'ySide'       => (string)($node->ySide ?? 'right'),
      'xSide'       => (string)($node->xSide ?? 'bottom'),
      'thickness'   => (int)($node->thickness ?? 10),
      'gap'         => (int)($node->gap ?? 6),
      'radius'      => (int)($node->radius ?? 10),
      'track'       => (string)($node->track ?? 'rgba(148,163,184,.35)'),
      'thumb'       => (string)($node->thumb ?? 'rgba(15,23,42,.55)'),
      'thumbHover'  => (string)($node->thumbHover ?? 'rgba(15,23,42,.75)'),
      'autoHide'    => sg_boolish($node->autoHide ?? '1'),
      'smooth'      => sg_boolish($node->smooth ?? '1'),
      'wheel'       => sg_boolish($node->wheel ?? '1'),
      'wheelStep'   => (int)($node->wheelStep ?? 70),
      'fadeHint'    => sg_boolish($node->fadeHint ?? '1'),
      'fadeOpacity' => (float)($node->fadeOpacity ?? 0.22),
    ];
  }

  $raw = trim((string)$node);
  if ($raw !== '' && $raw[0] === '{') {
    $decoded = html_entity_decode($raw, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $tmp = json_decode($decoded, true);
    if (is_array($tmp)) return $tmp;
  }

  return null;
}

function renderElement($el, string $parentType = '') {
    $type = (string)$el['type'];
$isFooter = function_exists('sg_footer_is_footer') && sg_footer_is_footer($el);
$dock = $isFooter && function_exists('sg_footer_dock')
  ? sg_footer_dock($el)
  : (string)($el->footerDock ?? 'bottom');
$layoutCss = "";



    $borderRadius = (string)($el->borderRadius ?? '0px');
    $boxShadow    = (string)($el->boxShadow ?? 'none');
    $opacity      = (string)($el->opacity ?? '1');
    $backdrop     = (string)($el->backdropFilter ?? 'none');

    $bg = (string)($el->bg ?? 'transparent');

    $padding = (string)($el->padding ?? '0px');

$pos = $isFooter
  ? (function_exists('sg_footer_style_prefix') ? sg_footer_style_prefix($el) : "position:fixed; left:0; right:0;")
  : ("position: absolute; " .
     "left: " . (int)$el->x . "px; " .
     "top: " . (int)$el->y . "px; " .
     "width: {$el->w}; " .
     "height: {$el->h}; ");

if ($isFooter) {
  $dock = ((string)($el->footerDock ?? 'bottom') === 'top') ? 'top' : 'bottom';
  $off  = (int)($el->footerBottom ?? 0);
  $left = (int)($el->footerLeft ?? 0);

  $mode = (string)($el->footerMode ?? 'fixed');
  $mode = ($mode === 'page') ? 'page' : 'fixed';

  if ($mode === 'fixed') {
    $pos = "position:fixed; left:{$left}px; right:0px; width:calc(100% - {$left}px); height: {$el->h}; ";
    $pos .= ($dock === 'top') ? "top:{$off}px; " : "bottom:{$off}px; ";
  } else {
    $hNum = (int)filter_var((string)$el->h, FILTER_SANITIZE_NUMBER_INT);
    if ($hNum <= 0) $hNum = 80;

    $pos = "position:absolute; left:{$left}px; right:0px; width:calc(100% - {$left}px); height: {$el->h}; ";
    if ($dock === 'top') {
      $pos .= "top:{$off}px; ";
    } else {
      $top = max(0, (int)$GLOBALS['pageH'] - $hNum - $off);
      $pos .= "top:{$top}px; ";
    }

  }
  $footerFlex = (string)($el->footerFlex ?? '1');
  $footerFlex = ($footerFlex === '0') ? '0' : '1';

  if ($footerFlex === '1') {
    $allowedJustify = ['flex-start','center','flex-end','space-between','space-around','space-evenly'];
    $allowedAlign   = ['stretch','flex-start','center','flex-end','baseline'];

    $justify = strtolower(trim((string)($el->footerJustify ?? 'space-between')));
    if (!in_array($justify, $allowedJustify, true)) $justify = 'space-between';

    $align = strtolower(trim((string)($el->footerAlign ?? 'center')));
    if (!in_array($align, $allowedAlign, true)) $align = 'center';

    $wrap = ((string)($el->footerWrap ?? '1') === '0') ? 'nowrap' : 'wrap';

    $gap = (int)($el->footerGap ?? 12);
    if ($gap < 0) $gap = 0;
    if ($gap > 200) $gap = 200;

    $layoutCss .= " display:flex; justify-content: {$justify}; align-items: {$align}; flex-wrap: {$wrap}; gap: {$gap}px;";

  } else {
    $layoutCss .= " display:block;";

  }
} else {
  $pos = "position:absolute; left:" . (int)$el->x . "px; top:" . (int)$el->y . "px; width:{$el->w}; height:{$el->h}; ";
}
$ws = ($type === 'text') ? 'pre-wrap' : 'normal';

  $defBg = 'transparent';
  $defBorder = 'none';
  $defRadius = '0px';
  $defShadow = 'none';
  $defColor = '#000000';
  $defFontSize = '20px';
if ($type === 'nav') {
    $navBgMode = strtolower(trim((string)($el->navBgMode ?? 'solid')));
    $navBgSolid = (string)($el->navBgSolid ?? '#111827');
    $navGradType = strtolower(trim((string)($el->navGradType ?? 'linear')));
    $navGradAngle = (int)($el->navGradAngle ?? 135);
    $navGradPosX = (int)($el->navGradPosX ?? 50);
    $navGradPosY = (int)($el->navGradPosY ?? 50);
    $navGradFrom = (string)($el->navGradFrom ?? '#0ea5e9');
    $navGradMid  = (string)($el->navGradMid  ?? '#a855f7');
    $navGradTo   = (string)($el->navGradTo   ?? '#111827');
    $navGradUseMid = ((string)($el->navGradUseMid ?? '0') === '1');

    $navBgCss = $navBgSolid;
    if ($navBgMode === 'gradient') {
        $stops = $navGradUseMid ? "{$navGradFrom}, {$navGradMid}, {$navGradTo}" : "{$navGradFrom}, {$navGradTo}";
        if ($navGradType === 'radial') {
            $navBgCss = "radial-gradient(circle at {$navGradPosX}% {$navGradPosY}%, {$stops})";
        } elseif ($navGradType === 'conic') {
            $navBgCss = "conic-gradient(from {$navGradAngle}deg at {$navGradPosX}% {$navGradPosY}%, {$stops})";
        } else {
            $navBgCss = "linear-gradient({$navGradAngle}deg, {$stops})";
        }
    }
    $defBg = $navBgCss;
    $defBorder = '1px solid rgba(255,255,255,0.08)';
    $defRadius = '0px';
    $defShadow = '0 10px 24px rgba(0,0,0,0.18)';
    $defColor = '#ffffff';
    $defFontSize = '20px';
    $fontFamily = "'Segoe UI', sans-serif";
}

  if ($type === 'form') {
    $defBg = 'rgb(255, 255, 255)';
    $defBorder = '1px solid rgb(226, 232, 240)';
    $defRadius = '14px';
    $defShadow = 'rgba(0, 0, 0, 0.1) 0px 10px 24px 0px';
    $defColor = 'rgb(15, 23, 42)';
    $defFontSize = '16px';
  }

  if ($type === 'block') {
  $defBg = 'rgb(255, 255, 255)';
  $defBorder = '1px solid rgb(226, 232, 240)';
  $defRadius = '16px';
  $defShadow = 'none';
}
if ($isFooter) {
  $defBorder = 'none';
  $defRadius = '0px';
  $defShadow = 'none';
}
  $bg           = sg_xml_val($el, 'bg', $defBg);
  $borderRadius = sg_xml_val($el, 'borderRadius', $defRadius);
  $boxShadow    = sg_xml_val($el, 'boxShadow', $defShadow);
  $boxShadow = sg_normalize_box_shadow($boxShadow);
  $padding      = sg_xml_val($el, 'padding', '0px');

  $opacity      = sg_xml_val($el, 'opacity', '1');
  $backdrop     = sg_xml_val($el, 'backdropFilter', 'none');

  $color = sg_xml_val($el, 'color', $defColor);
$fontSize = sg_xml_val($el, 'fontSize', $defFontSize);  
$border = sg_xml_val($el, 'border', $defBorder);
$zIndex   = sg_xml_val($el, 'zIndex', '0');
if ($type === 'block') {
  $bbMode = strtolower(trim((string)($el->blockBorderMode ?? '')));   
  if ($bbMode === 'gradient') {
    $bw = (int)($el->blockBorderW ?? 2);
    if ($bw < 0) $bw = 0;
    if ($bw > 30) $bw = 30;

    $gType  = strtolower(trim((string)($el->blockBorderGradType ?? 'linear'))); // linear/radial/conic
    $angle  = (int)($el->blockBorderGradAngle ?? 135);
    $posX   = (int)($el->blockBorderGradX ?? 50);
    $posY   = (int)($el->blockBorderGradY ?? 50);

    $c1     = (string)($el->blockBorderGrad1 ?? '#60a5fa');
    $c2     = (string)($el->blockBorderGrad2 ?? '#a78bfa');
    $useMid = ((string)($el->blockBorderGradMidEnable ?? '0') === '1');
    $cm     = (string)($el->blockBorderGradMid ?? '#ffffff');

    $stops = $useMid ? "{$c1}, {$cm}, {$c2}" : "{$c1}, {$c2}";

    if ($gType === 'radial') {
      $grad = "radial-gradient(circle at {$posX}% {$posY}%, {$stops})";
    } elseif ($gType === 'conic') {
      $grad = "conic-gradient(from {$angle}deg at {$posX}% {$posY}%, {$stops})";
    } else {
      $grad = "linear-gradient({$angle}deg, {$stops})";
    }

    $border = "{$bw}px solid transparent";
    $bg = "{$bg} padding-box, {$grad} border-box";
  }
}
$toggleAttr = "";
$toggleTarget = trim((string)($el->sgToggleTarget ?? ''));
if ($toggleTarget !== '') {
  $toggleAttr .= " data-sg-toggle-target=\"" . htmlspecialchars($toggleTarget, ENT_QUOTES) . "\"";

  $trig = trim((string)($el->sgToggleTrigger ?? ''));
  if ($trig !== '') $toggleAttr .= " data-sg-toggle-trigger=\"" . htmlspecialchars($trig, ENT_QUOTES) . "\"";

  $arrow = trim((string)($el->sgToggleArrow ?? ''));
  if ($arrow !== '') $toggleAttr .= " data-sg-toggle-arrow=\"" . htmlspecialchars($arrow, ENT_QUOTES) . "\"";

  $init = trim((string)($el->sgToggleInitial ?? ''));
  if ($init !== '') $toggleAttr .= " data-sg-toggle-initial=\"" . htmlspecialchars($init, ENT_QUOTES) . "\"";

  $side = trim((string)($el->sgToggleArrowSide ?? ''));
  if ($side !== '') $toggleAttr .= " data-sg-toggle-arrow-side=\"" . htmlspecialchars($side, ENT_QUOTES) . "\"";

  $toggleFile = trim((string)($el->sgToggleFile ?? ''));
  if ($toggleFile !== '') $toggleAttr .= " data-sg-toggle-file=\"" . htmlspecialchars($toggleFile, ENT_QUOTES) . "\"";

  $beforeState = trim((string)($el->sgToggleBeforeState ?? ''));
  if ($beforeState !== '') {
    $toggleAttr .= " data-sg-toggle-before-state=\"" . htmlspecialchars($beforeState, ENT_QUOTES) . "\"";
  }

  $afterState = trim((string)($el->sgToggleAfterState ?? ''));
  if ($afterState !== '') {
    $toggleAttr .= " data-sg-toggle-after-state=\"" . htmlspecialchars($afterState, ENT_QUOTES) . "\"";
  }
}

$hasBlockScroll = false;
$scrollCfg = null;

if ($type === 'block' && isset($el->sgScrollBlock)) {
  $scrollCfg = sg_parse_scroll_block_node($el->sgScrollBlock);
  $hasBlockScroll = is_array($scrollCfg) && (!isset($scrollCfg['enabled']) || $scrollCfg['enabled']);
}


$overflowCss = $hasBlockScroll ? 'auto' : 'visible';
$fontFamily = sg_xml_val($el, 'fontFamily', "'Segoe UI', sans-serif");
$fontWeight = sg_xml_val($el, 'fontWeight', '400');
$fontStyle  = sg_xml_val($el, 'fontStyle', 'normal');
$textDecoration = sg_xml_val($el, 'textDecoration', 'none');
$textAlign = sg_xml_val($el, 'textAlign', 'left');
$lineHeight = sg_xml_val($el, 'lineHeight', 'normal');
$letterSpacing = sg_xml_val($el, 'letterSpacing', 'normal');
$textTransform = sg_xml_val($el, 'textTransform', 'none');

$style =
  $pos .
  "color: {$color}; " .
  "background: {$bg}; " .
  "font-size: {$fontSize}; " .
  "font-family: {$fontFamily}; " .
  "font-weight: {$fontWeight}; " .
  "font-style: {$fontStyle}; " .
  "text-decoration: {$textDecoration}; " .
  "text-align: {$textAlign}; " .
  "line-height: {$lineHeight}; " .
  "letter-spacing: {$letterSpacing}; " .
  "text-transform: {$textTransform}; " .
  "border: {$border}; " .
  "z-index: {$zIndex}; " .
  "border-radius: {$borderRadius}; " .
  "box-shadow: {$boxShadow}; " .
  "opacity: {$opacity}; " .
  "backdrop-filter: {$backdrop}; " .
  "box-sizing: border-box; " .
  "white-space: {$ws}; " .
  "overflow: {$overflowCss}; " .
  "padding: {$padding};";
$style .= $layoutCss;

$footerMode = $isFooter ? (string)($el->footerMode ?? 'fixed') : '';
$footerMode = ($footerMode === 'page') ? 'page' : 'fixed';

$footerAttr = "";
if ($isFooter) {
  $footerAttr .= " data-is-footer='1'";  
  $footerAttr .= " data-footer='1'";
  $footerAttr .= " data-footer-dock='".htmlspecialchars($dock, ENT_QUOTES)."'";
  $footerAttr .= " data-footer-mode='".htmlspecialchars($footerMode, ENT_QUOTES)."'";


  $footerAttr .= " data-footer-bg-mode='".htmlspecialchars((string)($el->footerBgMode ?? 'solid'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-bg-solid='".htmlspecialchars((string)($el->footerBgSolid ?? '#111827'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-grad-from='".htmlspecialchars((string)($el->footerGradFrom ?? '#111827'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-grad-to='".htmlspecialchars((string)($el->footerGradTo ?? '#0f172a'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-grad-angle='".htmlspecialchars((string)($el->footerGradAngle ?? '135'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-text-color='".htmlspecialchars((string)($el->footerTextColor ?? '#ffffff'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-height='".htmlspecialchars((string)($el->footerHeight ?? '80'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-pad='".htmlspecialchars((string)($el->footerPad ?? '16'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-radius='".htmlspecialchars((string)($el->footerRadius ?? '0'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-border-on='".htmlspecialchars((string)($el->footerBorderOn ?? '0'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-border-w='".htmlspecialchars((string)($el->footerBorderW ?? '1'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-border-color='".htmlspecialchars((string)($el->footerBorderColor ?? '#334155'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-shadow-on='".htmlspecialchars((string)($el->footerShadowOn ?? 'off'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-shadow-x='".htmlspecialchars((string)($el->footerShadowX ?? '0'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-shadow-y='".htmlspecialchars((string)($el->footerShadowY ?? '12'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-shadow-blur='".htmlspecialchars((string)($el->footerShadowBlur ?? '30'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-shadow-spread='".htmlspecialchars((string)($el->footerShadowSpread ?? '0'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-shadow-color='".htmlspecialchars((string)($el->footerShadowColor ?? '#000000'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-shadow-alpha='".htmlspecialchars((string)($el->footerShadowAlpha ?? '18'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-blur='".htmlspecialchars((string)($el->footerBlur ?? '0'), ENT_QUOTES)."'";
  $footerAttr .= " data-footer-opacity='".htmlspecialchars((string)($el->footerOpacity ?? '100'), ENT_QUOTES)."'";
}


if ($type === 'button') {
  $style .= "background: transparent; border: none; padding: 0; white-space: normal;";
}

$htmlId = trim((string)($el->htmlId ?? ''));
$htmlClass = trim((string)($el->htmlClass ?? ''));

$idAttr = ($htmlId !== '') ? " id='".htmlspecialchars($htmlId, ENT_QUOTES)."'" : "";
$classAttr = "page-element" . ($htmlClass !== '' ? " " . htmlspecialchars($htmlClass, ENT_QUOTES) : "");

$formAttr = "";
if ($type === 'form') {
  $formAttr =
    " data-font-size='".htmlspecialchars((string)($el->fontSize ?? ''), ENT_QUOTES)."'".
    " data-form-type='".htmlspecialchars((string)($el->formType ?? 'text'), ENT_QUOTES)."'".
    " data-label='".htmlspecialchars((string)($el->label ?? ''), ENT_QUOTES)."'".
    " data-form-type='".htmlspecialchars((string)($el->formType ?? 'text'), ENT_QUOTES)."'".
    " data-label='".htmlspecialchars((string)($el->label ?? ''), ENT_QUOTES)."'".
    " data-form-help-text='".htmlspecialchars((string)($el->formHelpText ?? ''), ENT_QUOTES)."'".
    " data-form-placeholder='".htmlspecialchars((string)($el->formPlaceholder ?? ''), ENT_QUOTES)."'".
    " data-form-required='".htmlspecialchars((string)($el->formRequired ?? '0'), ENT_QUOTES)."'".
    " data-form-inline='".htmlspecialchars((string)($el->formInline ?? '0'), ENT_QUOTES)."'".
    " data-form-name='".htmlspecialchars((string)($el->formName ?? ''), ENT_QUOTES)."'".
    " data-accent-color='".htmlspecialchars((string)($el->accentColor ?? '#156fe5'), ENT_QUOTES)."'".
    " data-form-input-radius='".htmlspecialchars((string)($el->formInputRadius ?? '10'), ENT_QUOTES)."'".
    " data-options='".htmlspecialchars((string)($el->options ?? ''), ENT_QUOTES)."'".
    " data-form-rows='".htmlspecialchars((string)($el->formRows ?? '3'), ENT_QUOTES)."'".
    " data-form-min='".htmlspecialchars((string)($el->formMin ?? ''), ENT_QUOTES)."'".
    " data-form-max='".htmlspecialchars((string)($el->formMax ?? ''), ENT_QUOTES)."'".
    " data-form-step='".htmlspecialchars((string)($el->formStep ?? ''), ENT_QUOTES)."'".
        " data-pass-min-len='".htmlspecialchars((string)($el->passMinLen ?? '0'), ENT_QUOTES)."'".
    " data-pass-reveal='".htmlspecialchars((string)($el->passReveal ?? '1'), ENT_QUOTES)."'".
    " data-pass-meter='".htmlspecialchars((string)($el->passMeter ?? '1'), ENT_QUOTES)."'".
    " data-pass-autocomplete='".htmlspecialchars((string)($el->passAutocomplete ?? ''), ENT_QUOTES)."'".

    " data-rating-min='".htmlspecialchars((string)($el->ratingMin ?? '1'), ENT_QUOTES)."'".
    " data-rating-max='".htmlspecialchars((string)($el->ratingMax ?? '5'), ENT_QUOTES)."'".
    " data-rating-step='".htmlspecialchars((string)($el->ratingStep ?? '1'), ENT_QUOTES)."'".
    " data-rating-min-label='".htmlspecialchars((string)($el->ratingMinLabel ?? ''), ENT_QUOTES)."'".
    " data-rating-max-label='".htmlspecialchars((string)($el->ratingMaxLabel ?? ''), ENT_QUOTES)."'".
    " data-likert-min='".htmlspecialchars((string)($el->likertMin ?? '1'), ENT_QUOTES)."'".
    " data-likert-max='".htmlspecialchars((string)($el->likertMax ?? '5'), ENT_QUOTES)."'".
    " data-likert-left='".htmlspecialchars((string)($el->likertLeft ?? ''), ENT_QUOTES)."'".
    " data-likert-right='".htmlspecialchars((string)($el->likertRight ?? ''), ENT_QUOTES)."'". 
" data-form-marker-text='".htmlspecialchars((string)($el->formMarkerText ?? ''), ENT_QUOTES)."'" .
" data-form-marker-style='".htmlspecialchars((string)($el->formMarkerStyle ?? 'none'), ENT_QUOTES)."'" .
" data-form-icon='".htmlspecialchars((string)($el->formIcon ?? ''), ENT_QUOTES)."'" .
" data-form-icon-side='".htmlspecialchars((string)($el->formIconSide ?? 'left'), ENT_QUOTES)."'" .
" data-form-icon-mode='".htmlspecialchars((string)($el->formIconMode ?? 'split'), ENT_QUOTES)."'" .
" data-form-icon-bg='".htmlspecialchars((string)($el->formIconBg ?? '#f1f5f9'), ENT_QUOTES)."'" .
" data-form-icon-color='".htmlspecialchars((string)($el->formIconColor ?? '#0f172a'), ENT_QUOTES)."'" .
" data-form-input-style='".htmlspecialchars((string)($el->formInputStyle ?? 'box'), ENT_QUOTES)."'" .
" data-form-input-bg='".htmlspecialchars((string)($el->formInputBg ?? '#ffffff'), ENT_QUOTES)."'" .
" data-form-input-border='".htmlspecialchars((string)($el->formInputBorder ?? '#d1d5db'), ENT_QUOTES)."'" .
" data-form-input-border-style='".htmlspecialchars((string)($el->formInputBorderStyle ?? 'solid'), ENT_QUOTES)."'" .
" data-form-input-border-w='".htmlspecialchars((string)($el->formInputBorderW ?? '1'), ENT_QUOTES)."'" .
" data-form-input-shadow='".htmlspecialchars((string)($el->formInputShadow ?? 'soft'), ENT_QUOTES)."'" .
" data-form-input-pad-x='".htmlspecialchars((string)($el->formInputPadX ?? '10'), ENT_QUOTES)."'" .
" data-form-input-pad-y='".htmlspecialchars((string)($el->formInputPadY ?? '9'), ENT_QUOTES)."'" .
" data-form-input-height='".htmlspecialchars((string)($el->formInputHeight ?? '38'), ENT_QUOTES)."'" .
" data-form-placeholder-color='".htmlspecialchars((string)($el->formPlaceholderColor ?? '#94a3b8'), ENT_QUOTES)."'" .
" data-form-focus-ring='".htmlspecialchars((string)($el->formFocusRing ?? '4'), ENT_QUOTES)."'" .
" data-form-focus-opacity='".htmlspecialchars((string)($el->formFocusOpacity ?? '18'), ENT_QUOTES)."'".
" data-form-no-bg='".htmlspecialchars((string)($el->formNoBg ?? '0'), ENT_QUOTES)."'".
" data-form-inner-pad='".htmlspecialchars((string)($el->formInnerPad ?? '6'), ENT_QUOTES)."'".
" data-form-field-gap='".htmlspecialchars((string)($el->formFieldGap ?? '6'), ENT_QUOTES)."'".
" data-form-auto-height='".htmlspecialchars((string)($el->formAutoHeight ?? '0'), ENT_QUOTES)."'".
" data-form-min-height='".htmlspecialchars((string)($el->formMinHeight ?? ''), ENT_QUOTES)."'";

}
$scrollAttr = "";
if ($type === 'block' && isset($el->sgScrollBlock)) {
  $cfg = sg_parse_scroll_block_node($el->sgScrollBlock);
  if (is_array($cfg) && (!isset($cfg['enabled']) || $cfg['enabled'])) {
    $json = json_encode($cfg, JSON_UNESCAPED_UNICODE);
    $scrollAttr = " data-sg-scroll-block=\"" . htmlspecialchars($json, ENT_QUOTES) . "\"";
  }
}
$brandAttr = "";
if ($type === 'brand') {
  $cfg = trim((string)($el->brandCfg ?? ''));
  if ($cfg !== '') {
    $brandAttr = " data-brand-cfg=\"" . htmlspecialchars($cfg, ENT_QUOTES) . "\"";
  }
}

echo "<div{$idAttr} class='{$classAttr}' data-id='".htmlspecialchars((string)$el['id'], ENT_QUOTES)."' data-type='".htmlspecialchars($type, ENT_QUOTES)."'{$footerAttr}{$formAttr}{$scrollAttr}{$toggleAttr}{$brandAttr} style=\"".htmlspecialchars($style, ENT_QUOTES)."\">";



    if ($type == 'image') {
  $src = html_entity_decode((string)$el->content);

  $fit = (string)($el->imgFit ?? 'cover');
  $posX = (string)($el->imgPosX ?? '50');
  $posY = (string)($el->imgPosY ?? '50');

  $rot = (float)($el->imgRotate ?? 0);
  $scale = (float)($el->imgScale ?? 1);

  $flipX = ((string)($el->imgFlipX ?? '0') === '1') ? -1 : 1;
  $flipY = ((string)($el->imgFlipY ?? '0') === '1') ? -1 : 1;

  $blur = (int)($el->imgBlur ?? 0);
  $gray = (int)($el->imgGray ?? 0);
  $sep  = (int)($el->imgSepia ?? 0);
  $bri  = (int)($el->imgBrightness ?? 100);
  $con  = (int)($el->imgContrast ?? 100);
  $sat  = (int)($el->imgSaturate ?? 100);

  $filter = "grayscale({$gray}%) sepia({$sep}%) blur({$blur}px) brightness({$bri}%) contrast({$con}%) saturate({$sat}%)";
  $transform = "rotate({$rot}deg) scale(" . ($flipX*$scale) . "," . ($flipY*$scale) . ")";

  echo "<div style='width:100%;height:100%;overflow:hidden;border-radius:inherit;'>";
  echo "<img src='".htmlspecialchars($src, ENT_QUOTES)."' style='width:100%;height:100%;display:block;"
    . "object-fit:".htmlspecialchars($fit, ENT_QUOTES).";"
    . "object-position:".htmlspecialchars($posX, ENT_QUOTES)."% ".htmlspecialchars($posY, ENT_QUOTES)."%;"
    . "filter:".htmlspecialchars($filter, ENT_QUOTES).";"
    . "transform:".htmlspecialchars($transform, ENT_QUOTES).";"
    . "transform-origin:center;"
    . "'>";
  echo "</div>";
}

elseif ($type == 'form') {
    echo "<div class='sg-form-inner' style='width:100%;height:100%;'></div>";
}
elseif ($type == 'button') {
  $text   = (string)($el->btnText ?? 'Kliknij');
$action = (string)($el->btnAction ?? 'none');
$url = trim((string)($el->btnUrl ?? ''));
if ($url === 'https://' || $url === 'http://') $url = '';
$target = (string)($el->btnTarget ?? '_blank');


  $scrollTarget = trim((string)($el->btnScrollTargetId ?? ''));
  $scrollOffset = (int)($el->btnScrollOffset ?? 0);
  $size   = (string)($el->btnSize ?? 'md');

  $icon   = (string)($el->btnIcon ?? '');
  $iconPos= (string)($el->btnIconPos ?? 'left');

  $bg    = (string)($el->btnBg ?? '#156fe5');
  $color = (string)($el->btnColor ?? '#ffffff');
  $borderColor = (string)($el->btnBorderColor ?? $bg);
  $hoverBg = (string)($el->btnHoverBg ?? '#0f5bd1');
  $hoverColor = (string)($el->btnHoverColor ?? '#ffffff');

  $radius = max(0, min(30, (int)($el->btnRadius ?? 10)));
  $borderW= max(0, min(8, (int)($el->btnBorderW ?? 1)));
  $weight = (string)($el->btnWeight ?? '700');
  $align  = (string)($el->btnAlign ?? 'center');
    $clickEffect = (string)($el->btnClickEffect ?? 'none');
  $fontSize = (int)($el->btnFontSize ?? 13);
if ($fontSize < 8) $fontSize = 8;
if ($fontSize > 72) $fontSize = 72;
$justify = 'center';
if ($align === 'left') $justify = 'flex-start';
elseif ($align === 'right') $justify = 'flex-end';
elseif ($align === 'justify') $justify = 'space-between';
  $letter = (float)($el->btnLetter ?? 0);
$fontFamily = (string)($el->btnFontFamily ?? "'Segoe UI', system-ui, -apple-system, sans-serif");
$fontStyle = (string)($el->btnFontStyle ?? 'normal');
$textDecoration = (string)($el->btnTextDecoration ?? 'none');
  $shadow = (string)($el->btnShadow ?? 'soft');
  $disabled = ((string)($el->btnDisabled ?? '0') === '1');

  $gradOn = ((string)($el->btnGradient ?? '0') === '1');
  $gFrom  = (string)($el->btnGradFrom ?? $bg);
  $gTo    = (string)($el->btnGradTo ?? $bg);
  $gAng   = (int)($el->btnGradAngle ?? 135);

  $bgStr = $gradOn ? "linear-gradient({$gAng}deg, {$gFrom}, {$gTo})" : $bg;
  $hoverStr = $gradOn ? "linear-gradient({$gAng}deg, {$hoverBg}, {$gTo})" : $hoverBg;

  $shadowCss = 'none';
  if ($shadow === 'soft')   $shadowCss = '0 10px 22px rgba(2,6,23,.12)';
  if ($shadow === 'strong') $shadowCss = '0 18px 44px rgba(2,6,23,.22)';

  $disabledAttr = $disabled ? " disabled aria-disabled='true'" : "";

  $iconHtml = '';
  if (trim($icon) !== '') {
    $iconHtml = "<span class='sgbtn__icon' aria-hidden='true'>".htmlspecialchars($icon)."</span>";
  }

  $inner = $iconPos === 'right'
    ? "<span class='sgbtn__text'>".htmlspecialchars($text)."</span>{$iconHtml}"
    : "{$iconHtml}<span class='sgbtn__text'>".htmlspecialchars($text)."</span>";

echo "<button type='button' class='sgbtn sgbtn--".htmlspecialchars($size, ENT_QUOTES)."'"
  . " data-action='".htmlspecialchars($action, ENT_QUOTES)."'"
  . " data-url='".htmlspecialchars($url, ENT_QUOTES)."'"
  . " data-target='".htmlspecialchars($target, ENT_QUOTES)."'"
  . " data-scroll-target='".htmlspecialchars($scrollTarget, ENT_QUOTES)."'"
  . " data-scroll-offset='".(int)$scrollOffset."'"
  . " data-click-effect='".htmlspecialchars($clickEffect, ENT_QUOTES)."'"
  . $disabledAttr
  . " style=\""
      . "--sgbtn-bg:".htmlspecialchars($bgStr, ENT_QUOTES).";"
      . "--sgbtn-color:".htmlspecialchars($color, ENT_QUOTES).";"
      . "--sgbtn-border:".htmlspecialchars($borderColor, ENT_QUOTES).";"
      . "--sgbtn-hover-bg:".htmlspecialchars($hoverStr, ENT_QUOTES).";"
      . "--sgbtn-hover-color:".htmlspecialchars($hoverColor, ENT_QUOTES).";"
      . "--sgbtn-radius:{$radius}px;"
      . "--sgbtn-shadow:".htmlspecialchars($shadowCss, ENT_QUOTES).";"
      . "--sgbtn-border-w:{$borderW}px;"
      . "--sgbtn-letter:{$letter}px;"
      . "--sgbtn-justify:{$justify};"
      . "--sgbtn-font-size:{$fontSize}px;"
      . "--sgbtn-font-family:".htmlspecialchars($fontFamily, ENT_QUOTES).";"
      . "--sgbtn-font-style:".htmlspecialchars($fontStyle, ENT_QUOTES).";"
      . "--sgbtn-text-decoration:".htmlspecialchars($textDecoration, ENT_QUOTES).";"
      . "--sgbtn-weight:".htmlspecialchars($weight, ENT_QUOTES).";"
      . "text-align:".htmlspecialchars($align, ENT_QUOTES).";"
  . "\">{$inner}</button>";
}
elseif ($type == 'nav') {

  $rawItems   = trim((string)($el->navItems ?? ''));
  $rawContent = trim((string)($el->content ?? ''));

  if ($rawItems === '' && $rawContent !== '') {
    echo html_entity_decode($rawContent);
  } else {

  $lines = preg_split("/\r\n|\n|\r/", (string)($el->navItems ?? ''));
  $items = [];
  foreach ($lines as $ln) {
    $ln = trim($ln);
    if ($ln === '') continue;
    $parts = explode('|', $ln);
    $label = trim($parts[0] ?? 'Link');
    $href  = trim($parts[1] ?? '#');
    $key   = trim($parts[2] ?? '');

    if ($key === '') {
      $key = $href !== '' ? $href : $label;
    }

    $items[] = ['label'=>$label, 'href'=>$href, 'key'=>$key];
  }
  if (!$items) $items = [['label'=>'Home','href'=>'?page=home','key'=>'home']];

  $idSafe = preg_replace('/[^a-zA-Z0-9_-]/', '_', (string)$el['id']);
  $cls = "sgnav_" . $idSafe;

  $orientation = (string)($el->navOrientation ?? 'horizontal'); 
  $align = (string)($el->navAlign ?? 'left'); 

$gap = (int)($el->navGap ?? 10);

$divider = ((string)($el->navDivider ?? '0') === '1');
$gapForFlex = $gap; 


  $pad = (int)($el->navPad ?? 10);

  $lpX = (int)($el->navLinkPadX ?? 12);
  $lpY = (int)($el->navLinkPadY ?? 8);
  $lr  = (int)($el->navLinkRadius ?? 8);
  $underline = ((string)($el->navUnderline ?? '0') === '1');

  $linkColor  = (string)($el->navLinkColor ?? '#ffffff');
  $hoverBg    = (string)($el->navHoverBg ?? 'rgba(255,255,255,0.12)');
  $hoverColor = (string)($el->navHoverColor ?? '#ffffff');
  $activeBg   = (string)($el->navActiveBg ?? 'rgba(255,255,255,0.18)');
  $activeColor= (string)($el->navActiveColor ?? '#ffffff');

  $activeMode = (string)($el->navActiveMode ?? 'query_page'); 
  $layout   = (string)($el->navLayout ?? 'pills');    
  $hookMode = (string)($el->navHookMode ?? 'none');   
  $wrap     = ((string)($el->navWrap ?? '0') === '1');
  $stretch  = ((string)($el->navStretch ?? '0') === '1');
$fillX = ((string)($el->navFillX ?? '0') === '1');

$divText  = trim((string)($el->navDividerText ?? '|'));
$divSize  = (int)($el->navDividerSize ?? 14);
$divColor = (string)($el->navDividerColor ?? '#ffffff');

if ($divSize < 6) $divSize = 6;
if ($divSize > 80) $divSize = 80;

$dividerIsHtml = ($divText !== '' && $divText[0] === '<');
$dividerInner  = $dividerIsHtml ? $divText : htmlspecialchars($divText, ENT_QUOTES);

$sepStyle =
  "display:inline-flex;align-items:center;justify-content:center;" .
  "font-size:{$divSize}px;color:" . htmlspecialchars($divColor, ENT_QUOTES) . ";" .
  "opacity:.9;user-select:none;pointer-events:none;line-height:1;";

$justifyMode = strtolower(trim((string)($el->navJustify ?? '')));

if ($orientation !== 'vertical') {
  if ($justifyMode === '' || $justifyMode === 'start') {
    if ($align === 'center') $justifyMode = 'center';
    else if ($align === 'right') $justifyMode = 'end';
    else $justifyMode = 'start';
  }
}

 
  $vJustifyMode = (string)($el->navVJustify ?? 'top');   

  $linkBorderW = (int)($el->navLinkBorderW ?? 1);
  $linkBorderColor = (string)($el->navLinkBorderColor ?? 'rgba(255,255,255,0.10)');
$shadowRaw = strtolower(trim((string)($el->navLinkShadow ?? 'soft')));
$navBgMode  = (string)($el->navBgMode ?? 'solid');
$navBgSolid = (string)($el->navBgSolid ?? '#111827');

$navGradType   = (string)($el->navGradType ?? 'linear');
$navGradAngle  = (int)($el->navGradAngle ?? 135);
$navGradPosX   = (int)($el->navGradPosX ?? 50);
$navGradPosY   = (int)($el->navGradPosY ?? 50);
$navGradFrom   = (string)($el->navGradFrom ?? '#0ea5e9');
$navGradMid    = (string)($el->navGradMid ?? '#a855f7');
$navGradTo     = (string)($el->navGradTo ?? '#111827');
$navGradUseMid = ((string)($el->navGradUseMid ?? '0') === '1');
$navBgCss = $navBgSolid;

if ($navBgMode === 'gradient') {
  $stops = $navGradUseMid
    ? "{$navGradFrom}, {$navGradMid}, {$navGradTo}"
    : "{$navGradFrom}, {$navGradTo}";

  if ($navGradType === 'radial') {
    $navBgCss = "radial-gradient(circle at {$navGradPosX}% {$navGradPosY}%, {$stops})";
  } elseif ($navGradType === 'conic') {
    $navBgCss = "conic-gradient(from {$navGradAngle}deg at {$navGradPosX}% {$navGradPosY}%, {$stops})";
  } else {
    $navBgCss = "linear-gradient({$navGradAngle}deg, {$stops})";
  }
}

if ($shadowRaw === '0' || $shadowRaw === 'false' || $shadowRaw === 'none' || $shadowRaw === 'off') {
  $linkShadow = 'none';
} elseif ($shadowRaw === 'strong') {
  $linkShadow = '0 12px 28px rgba(0,0,0,0.18)';
} else { 
  $linkShadow = '0 6px 14px rgba(0,0,0,0.10)';
}


  $navName = trim((string)($el->navName ?? ''));
  $navHtmlId = trim((string)($el->navHtmlId ?? ''));
  $navHtmlClass = trim((string)($el->navHtmlClass ?? ''));

  $brandText = trim((string)($el->navBrandText ?? ''));
  $brandHref = trim((string)($el->navBrandHref ?? '#'));

  $flexDir = ($orientation === 'vertical') ? 'column' : 'row';

  $justifyMap = [
    'start' => 'flex-start',
    'center' => 'center',
    'end' => 'flex-end',
    'between' => 'space-between',
    'around' => 'space-around',
    'evenly' => 'space-evenly',
  ];
  $vJustifyMap = [
    'top' => 'flex-start',
    'center' => 'center',
    'bottom' => 'flex-end',
    'between' => 'space-between',
  ];

  $justify = ($orientation === 'vertical')
    ? ($vJustifyMap[$vJustifyMode] ?? 'flex-start')
    : ($justifyMap[$justifyMode] ?? 'flex-start');

  $alignItems = 'center';
  if ($orientation === 'vertical') {
    if ($align === 'center') $alignItems = 'center';
    else if ($align === 'right') $alignItems = 'flex-end';
    else $alignItems = 'flex-start';
  }

  $wrapCss = ($wrap && $orientation !== 'vertical') ? 'wrap' : 'nowrap';
  $linkFlex = $stretch ? '1 1 0' : '0 0 auto';

  $navIdAttr = $navHtmlId !== '' ? " id='".htmlspecialchars($navHtmlId, ENT_QUOTES)."'" : "";
  $navNameAttr = $navName !== '' ? " data-nav-name='".htmlspecialchars($navName, ENT_QUOTES)."'" : "";
  $extraClass = $navHtmlClass !== '' ? " ".htmlspecialchars($navHtmlClass, ENT_QUOTES) : "";


  $layoutCss = "";
  if ($layout === 'underline') {
    $layoutCss = "
      .{$cls} .sgnav__links a{ background:transparent; border-color:transparent; box-shadow:none; border-radius:10px; }
      .{$cls} .sgnav__links a:hover{ background:transparent; }
      .{$cls} .sgnav__links a.active{ background:transparent; }
      .{$cls} .sgnav__links a .sgnav__u{ display:block; height:2px; margin-top:6px; border-radius:999px; background:transparent; }
      .{$cls} .sgnav__links a.active .sgnav__u{ background:".htmlspecialchars($activeColor, ENT_QUOTES)."; opacity:.9; }
    ";
  } else if ($layout === 'tabs') {
    $layoutCss = "
      .{$cls} .sgnav__links a{ background:transparent; box-shadow:none; border-color:rgba(255,255,255,0.14); }
      .{$cls} .sgnav__links a.active{ background:".htmlspecialchars($activeBg, ENT_QUOTES)."; }
    ";
  } else if ($layout === 'sidebar') {
    $layoutCss = "
      .{$cls}{ align-items:stretch; }
      .{$cls} .sgnav__links{ width:100%; }
      .{$cls} .sgnav__links a{ width:100%; justify-content:flex-start; }
    ";
  }
$needsFullWidth = $stretch || $fillX || in_array($justify, ['space-between','space-around','space-evenly'], true);
$linksWidth = $needsFullWidth ? '100%' : 'max-content';


$linksMargin = '0';
if (!$needsFullWidth && $orientation !== 'vertical') {
  if ($justify === 'center') $linksMargin = '0 auto';
  else if ($justify === 'flex-end') $linksMargin = '0 0 0 auto';
  else $linksMargin = '0 auto 0 0'; 
}

$linksHeight = ($orientation === 'vertical') ? '100%' : 'auto';

  echo "<style>
    .{$cls}{
      width:100%; height:100%;
      box-sizing:border-box;
      padding:{$pad}px;
      display:flex;
      flex-direction:{$flexDir};
      gap:{$gap}px;
      align-items:".($orientation==='vertical' ? $alignItems : "center").";
    }
    .{$cls} .sgnav__brand{
      display:flex; align-items:center;
      font-weight:700;
      text-decoration:none;
      color:".htmlspecialchars($linkColor, ENT_QUOTES).";
      padding:{$lpY}px {$lpX}px;
      border-radius:{$lr}px;
      border:1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.06);
      box-shadow: 0 10px 22px rgba(0,0,0,0.12);
      white-space:nowrap;
    }
    .{$cls} .sgnav__links{
  display:flex;
  flex-direction:{$flexDir};
  flex-wrap:{$wrapCss};
  justify-content:{$justify};
  align-items:".($orientation==='vertical' ? $alignItems : "center").";
  gap:{$gapForFlex}px;


  width: {$linksWidth};
  height: {$linksHeight};
  margin: {$linksMargin};
}


    .{$cls} .sgnav__links a,
    .{$cls} .sgnav__links a:visited{
      font: inherit;
      line-height: 1;
      margin: 0;
      box-sizing:border-box;

      display:inline-flex;
      align-items:center;
      justify-content:center;

      padding:{$lpY}px {$lpX}px;
      border-radius:{$lr}px;

      color:".htmlspecialchars($linkColor, ENT_QUOTES).";
      text-decoration:".($underline ? "underline" : "none").";
      background:transparent;

      white-space:nowrap;
      border:{$linkBorderW}px solid ".htmlspecialchars($linkBorderColor, ENT_QUOTES).";
      box-shadow: {$linkShadow};
      transition:background .15s ease, color .15s ease, transform .12s ease;
      flex: {$linkFlex};
    }
    .{$cls} .sgnav__links a:hover{
      background:".htmlspecialchars($hoverBg, ENT_QUOTES).";
      color:".htmlspecialchars($hoverColor, ENT_QUOTES).";
      transform:translateY(-1px);
    }
    .{$cls} .sgnav__links a.active{
      background:".htmlspecialchars($activeBg, ENT_QUOTES).";
      color:".htmlspecialchars($activeColor, ENT_QUOTES).";
    }


    {$layoutCss}
  </style>";

  echo "<nav{$navIdAttr} class='{$cls} sgnav sgnav--".htmlspecialchars($layout, ENT_QUOTES).$extraClass."' data-hook-mode='".htmlspecialchars($hookMode, ENT_QUOTES)."' data-active-mode='".htmlspecialchars($activeMode, ENT_QUOTES)."'{$navNameAttr}>";

  if ($brandText !== '') {
    echo "<a class='sgnav__brand' href='".htmlspecialchars($brandHref, ENT_QUOTES)."'>".htmlspecialchars($brandText)."</a>";
  }

echo "<div class='sgnav__links'>";

if ($divider && $dividerIsHtml) {
  echo "<style>.{$cls} .sgnav__sep img{height:{$divSize}px;width:auto;display:block;}</style>";
}

foreach ($items as $i => $it) {
  if ($divider && $i > 0) {
    echo "<span class='sgnav__sep' aria-hidden='true' style=\"{$sepStyle}\">{$dividerInner}</span>";
  }

  $k = htmlspecialchars($it['key'], ENT_QUOTES);
  echo "<a href='".htmlspecialchars($it['href'], ENT_QUOTES)."' data-key='{$k}'>"
    . htmlspecialchars($it['label'])
    . ($layout === 'underline' ? "<span class='sgnav__u'></span>" : "")
    . "</a>";
}

echo "</div></nav>";


  echo "<script>(function(){
    try{
      var nav = document.querySelector('nav.{$cls}');
      if(!nav) return;

      var hookMode = nav.getAttribute('data-hook-mode') || 'none';
      var mode = nav.getAttribute('data-active-mode') || 'none';
      var navName = nav.getAttribute('data-nav-name') || '';

      function clearActive(){
        nav.querySelectorAll('a').forEach(function(a){ a.classList.remove('active'); });
      }

      function setActive(){
        clearActive();
        if(mode==='query_page'){
          var sp=new URLSearchParams(location.search||'');
          var page=sp.get('page')||'';
          if(!page) return;
          nav.querySelectorAll('a').forEach(function(a){
            var h=(a.getAttribute('href')||'');
            var m=h.match(/[?&]page=([^&]+)/i);
            if(m && m[1]===page) a.classList.add('active');
          });
        }else if(mode==='url'){
          var cur=location.pathname+location.search;
          nav.querySelectorAll('a').forEach(function(a){
            var h=a.getAttribute('href')||'';
            if(h && (h===cur || cur.indexOf(h)!==-1)) a.classList.add('active');
          });
        }
      }

      setActive();

      nav.addEventListener('click', function(e){
        var a = e.target.closest('a');
        if(!a) return;

        if(hookMode === 'event'){
          e.preventDefault();
          var detail = {
            navName: navName,
            key: a.getAttribute('data-key') || '',
            href: a.getAttribute('href') || '',
            label: (a.textContent||'').trim(),
            el: nav
          };
          window.dispatchEvent(new CustomEvent('sg:navigate', { detail: detail }));
        }
      }, true);

    }catch(e){}
  })();</script>";
}

}
elseif ($type == 'calendar') {
  $y  = (int)($el->calYear ?? date('Y'));
  $m  = (int)($el->calMonth ?? date('n'));
  $ws = (string)($el->calWeekStart ?? 'mon'); 
  $th = (string)($el->calTheme ?? 'blue');
$bgA = (string)($el->calBgA ?? '');
$bgB = (string)($el->calBgB ?? '');
$acc = (string)($el->calAccent ?? '');

$rad = (string)($el->calRadius ?? '30');
$pad = (string)($el->calOuterPad ?? '22');
$gap = (string)($el->calGap ?? '10');
$cr  = (string)($el->calCellRadius ?? '16');

$ms  = (string)($el->calMonthSize ?? '34');
$ds  = (string)($el->calDaySize ?? '18');
$wsz = (string)($el->calWeekSize ?? '14');
$nsz = (string)($el->calNavSize ?? '44');

$so  = (string)($el->calShowOutside ?? '1');
$st  = (string)($el->calShowToday ?? '1');
$uv  = (string)($el->calUseVisits ?? '0');
  $eid = (string)$el['id'];

  echo "<div class='sg-calendar-runtime'
    data-type='calendar'
    data-id='".htmlspecialchars($eid, ENT_QUOTES)."'
    data-cal-year='{$y}'
    data-cal-month='{$m}'
    data-cal-week-start='".htmlspecialchars($ws, ENT_QUOTES)."'
    data-cal-theme='".htmlspecialchars($th, ENT_QUOTES)."'
    data-cal-bg-a='".htmlspecialchars($bgA, ENT_QUOTES)."'
data-cal-bg-b='".htmlspecialchars($bgB, ENT_QUOTES)."'
data-cal-accent='".htmlspecialchars($acc, ENT_QUOTES)."'

data-cal-radius='".htmlspecialchars($rad, ENT_QUOTES)."'
data-cal-outer-pad='".htmlspecialchars($pad, ENT_QUOTES)."'
data-cal-gap='".htmlspecialchars($gap, ENT_QUOTES)."'
data-cal-cell-radius='".htmlspecialchars($cr, ENT_QUOTES)."'

data-cal-month-size='".htmlspecialchars($ms, ENT_QUOTES)."'
data-cal-day-size='".htmlspecialchars($ds, ENT_QUOTES)."'
data-cal-week-size='".htmlspecialchars($wsz, ENT_QUOTES)."'
data-cal-nav-size='".htmlspecialchars($nsz, ENT_QUOTES)."'

data-cal-show-outside='".htmlspecialchars($so, ENT_QUOTES)."'
data-cal-show-today='".htmlspecialchars($st, ENT_QUOTES)."'
data-cal-use-visits='".htmlspecialchars($uv, ENT_QUOTES)."'
    style='width:100%; height:100%;'></div>";
}



    elseif ($type == 'slider') {
  $min = (string)($el->sliderMin ?? '0');
  $max = (string)($el->sliderMax ?? '100');
  $step = (string)($el->sliderStep ?? '1');
  $val = (string)($el->sliderValue ?? '50');
  $label = (string)($el->sliderLabel ?? 'Zsuwak');
  $unit = (string)($el->sliderUnit ?? '');
  $showVal = ((string)($el->sliderShowValue ?? '1') === '1');
  $showMM = ((string)($el->sliderShowMinMax ?? '0') === '1');

  $track = (string)($el->sliderTrack ?? '#e2e8f0');
  $fill = (string)($el->sliderFill ?? '#156fe5');
  $thumb = (string)($el->sliderThumb ?? $fill);
  $trackH = (string)($el->sliderTrackH ?? '8');
  $thumbS = (string)($el->sliderThumbS ?? '18');
$minF = floatval($min);
$maxF = floatval($max);
$valF = floatval($val);
$pct  = ($maxF > $minF) ? (($valF - $minF) / ($maxF - $minF)) * 100.0 : 0;
$pct  = max(0, min(100, $pct));
$unitJs = json_encode($unit, JSON_UNESCAPED_UNICODE);

 
echo "<div class='sg-slider-inner' style=\"--sg-track:{$track};--sg-fill:{$fill};--sg-thumb:{$thumb};--sg-track-h:{$trackH}px;--sg-thumb-s:{$thumbS}px;--sg-pct:{$pct};\">";
  echo "<div class='sg-slider-top'><div class='sg-slider-label'>".htmlspecialchars($label)."</div>";
  if ($showVal) echo "<div class='sg-slider-value'><span class='sg-val'>".htmlspecialchars($val.$unit)."</span></div>";
  echo "</div>";

  echo "<input class='sg-range' type='range' min='{$min}' max='{$max}' step='{$step}' value='{$val}' ";
  echo "oninput=\"const root=this.closest('.sg-slider-inner'); const mi=+this.min, ma=+this.max; const pct=((this.value-mi)/(ma-mi))*100; root.style.setProperty('--sg-pct',pct); const sv=root.querySelector('.sg-val'); if(sv) sv.textContent=this.value+{$unitJs};\"";

  echo " />";

  if ($showMM) echo "<div class='sg-slider-minmax'><span>{$min}</span><span>{$max}</span></div>";
  echo "</div>";
}



    else {
        echo html_entity_decode((string)$el->content);
    }

    if (isset($el->children->element)) {
        foreach ($el->children->element as $child) { renderElement($child, $type); }
    }

    echo "</div>";
}
function sg_collect_elements($node, array &$out): void {
  if (!$node) return;


  if (isset($node->element)) {
    foreach ($node->element as $el) {
      $out[] = $el;
      if (isset($el->children)) sg_collect_elements($el->children, $out);
    }
    return;
  }
  if (isset($node->element)) {
    foreach ($node->element as $el) {
      $out[] = $el;
      if (isset($el->children)) sg_collect_elements($el->children, $out);
    }
  }
}

function sg_guess_page_height(array $xmlDocs): int {
  $els = [];
  foreach ($xmlDocs as $doc) sg_collect_elements($doc, $els);

  $maxBottom = 0;
  $pageFooterNeed = 0; 

  foreach ($els as $el) {
    $type = (string)($el['type'] ?? '');
    $isFooter = function_exists('sg_footer_is_footer') && sg_footer_is_footer($el);


    $hNum = (int)filter_var((string)($el->h ?? '0'), FILTER_SANITIZE_NUMBER_INT);
    if ($hNum < 0) $hNum = 0;
    if ($isFooter) {
      $mode = (string)($el->footerMode ?? 'fixed');
      $mode = ($mode === 'page') ? 'page' : 'fixed';
      $dock = ((string)($el->footerDock ?? 'bottom') === 'top') ? 'top' : 'bottom';
      $off  = (int)($el->footerBottom ?? 0);
      if ($mode === 'page' && $dock === 'bottom') {
        $pageFooterNeed = max($pageFooterNeed, $hNum + max(0, $off));
      }
      continue;
    }

    $y = (int)($el->y ?? 0);
    $bottom = $y + $hNum;
    if ($bottom > $maxBottom) $maxBottom = $bottom;
  }

  return max($maxBottom + $pageFooterNeed, 0);
}

$seen = [];
$xmlDocs = sg_load_xml_chain($xmlFile, $projectsDir, $legacyXml, $seen);

if (!headers_sent()) {
  header('Content-Type: text/html; charset=utf-8');
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <script>window.SG_MODE='final';</script>
  <title>WIDOK FINALNY</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: white;
      min-height: 100vh;
      position: relative;
      font-family: 'Segoe UI', sans-serif;
    }

.page-element[data-type="form"] p{
  margin: 0 !important;
  line-height: inherit;
}

.page-element[data-type="form"] div{
  line-height: inherit;
}
.page-element[data-type="form"]{
  overflow: visible !important;
}

.page-element[data-type="form"] .sg-form-inner{
  overflow: visible !important;
}
    .page-element[data-type="text"] p{ margin:0 !important; line-height:inherit; }
.page-element[data-type="text"] div{ line-height:inherit; }
    input, select, textarea, button, label, span { font-family: inherit; font-size: inherit; color: inherit; }
    input[type="text"] { box-sizing: border-box; }
    .sg-slider-inner{ box-sizing:border-box; width:100%; height:100%; padding:10px; display:flex; flex-direction:column; gap:8px; }
.sg-slider-top{ display:flex; justify-content:space-between; align-items:center; gap:10px; }
.sg-slider-label{ font-weight:600; font-size:13px; color:inherit; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sg-slider-value{ font-weight:600; font-size:12px; color:#64748b; flex-shrink:0; }
.sg-slider-minmax{ display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; margin-top:-2px; }

input.sg-range{
  -webkit-appearance:none;
  appearance:none;
  width:100%;
  height: var(--sg-track-h, 8px);
  border-radius: 999px;
  outline:none;
  background: linear-gradient(to right,
    var(--sg-fill, #156fe5) 0%,
    var(--sg-fill, #156fe5) calc(var(--sg-pct, 50) * 1%),
    var(--sg-track, #e2e8f0) calc(var(--sg-pct, 50) * 1%),
    var(--sg-track, #e2e8f0) 100%
  );
}
input.sg-range::-webkit-slider-thumb{
  -webkit-appearance:none;
  appearance:none;
  width: var(--sg-thumb-s, 18px);
  height: var(--sg-thumb-s, 18px);
  border-radius: 999px;
  background: var(--sg-thumb, #156fe5);
  border: 2px solid rgba(255,255,255,0.95);
  box-shadow: 0 6px 14px rgba(0,0,0,.16);
}
input.sg-range::-webkit-slider-runnable-track{ height: var(--sg-track-h, 8px); border-radius: 999px; }

input.sg-range::-moz-range-track{ height: var(--sg-track-h, 8px); border-radius: 999px; background: var(--sg-track, #e2e8f0); }
input.sg-range::-moz-range-progress{ height: var(--sg-track-h, 8px); border-radius: 999px; background: var(--sg-fill, #156fe5); }
input.sg-range::-moz-range-thumb{
  width: var(--sg-thumb-s, 18px); height: var(--sg-thumb-s, 18px);
  border-radius: 999px; background: var(--sg-thumb, #156fe5);
  border: 2px solid rgba(255,255,255,0.95);
  box-shadow: 0 6px 14px rgba(0,0,0,.16);
}

.sgbtn[disabled], .sgbtn[aria-disabled="true"]{
  opacity:.55;
  cursor:not-allowed;
  pointer-events:none;
  box-shadow:none;
}
.sgbtn{
  width:100%;
  height:100%;
  display:inline-flex;
  align-items:center;
  justify-content: var(--sgbtn-justify, center);
  gap:10px;

  position:relative;
  overflow:hidden;

  border: var(--sgbtn-border-w, 1px) solid var(--sgbtn-border, #156fe5);
  background: var(--sgbtn-bg, #156fe5);
  color: var(--sgbtn-color, #fff);
  border-radius: var(--sgbtn-radius, 12px);
  box-shadow: var(--sgbtn-shadow, 0 10px 22px rgba(2,6,23,.12));

  cursor:pointer;

  box-sizing:border-box;
font-family: var(--sgbtn-font-family, 'Segoe UI', system-ui, -apple-system, sans-serif);
font-style: var(--sgbtn-font-style, normal);
text-decoration: var(--sgbtn-text-decoration, none);
font-size: var(--sgbtn-font-size, 13px);
font-weight: var(--sgbtn-weight, 600);
  letter-spacing: var(--sgbtn-letter, 0px);
  line-height: 1.1;
  white-space: normal;

  transition: transform .10s ease, background-color .18s ease, color .18s ease,
              box-shadow .18s ease, border-color .18s ease, opacity .18s ease;
}

.sgbtn:hover{
  background: var(--sgbtn-hover-bg, #0f5bd1);
  color: var(--sgbtn-hover-color, #fff);
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(2,6,23,.18);
}

.sgbtn:active{ transform: translateY(0px) scale(0.99); }

.sgbtn:focus-visible{
  outline: 3px solid rgba(59,130,246,.35);
  outline-offset: 2px;
}

.sgbtn__icon{ font-size: 1.1em; line-height:1; }
.sgbtn__text{ display:inline-block; }

.sgbtn--sm{ padding:8px 10px; }
.sgbtn--md{ padding:10px 12px; }
.sgbtn--lg{ padding:12px 14px; }

.sgbtn__ripple{
  position:absolute;
  border-radius:999px;
  background: rgba(255,255,255,.32);
  transform: scale(0);
  opacity: 1;
  pointer-events:none;
  animation: sgbtnRipple .55s ease-out;
}
@keyframes sgbtnRipple{
  to{ transform: scale(1); opacity:0; }
}
.sgbtn.fx-scale-click{ transform: scale(.96) !important; }
.sgbtn.fx-bounce-click{ animation: sgbtnBounce .38s ease; }
.sgbtn.fx-pulse-click{ animation: sgbtnPulse .35s ease; }
.sgbtn.fx-glow-click{ animation: sgbtnGlow .45s ease; }
.sgbtn.fx-shake-click{ animation: sgbtnShake .35s ease; }

@keyframes sgbtnBounce{
  0%{ transform: scale(1); }
  35%{ transform: scale(.93); }
  65%{ transform: scale(1.03); }
  100%{ transform: scale(1); }
}

@keyframes sgbtnPulse{
  0%{ transform: scale(1); }
  50%{ transform: scale(1.06); }
  100%{ transform: scale(1); }
}

@keyframes sgbtnGlow{
  0%{ box-shadow: var(--sgbtn-shadow, 0 10px 22px rgba(2,6,23,.12)); }
  50%{ box-shadow: 0 0 0 6px rgba(255,255,255,.18), 0 0 18px rgba(255,255,255,.28), var(--sgbtn-shadow, 0 10px 22px rgba(2,6,23,.12)); }
  100%{ box-shadow: var(--sgbtn-shadow, 0 10px 22px rgba(2,6,23,.12)); }
}

@keyframes sgbtnShake{
  0%{ transform: translateX(0); }
  20%{ transform: translateX(-3px); }
  40%{ transform: translateX(3px); }
  60%{ transform: translateX(-2px); }
  80%{ transform: translateX(2px); }
  100%{ transform: translateX(0); }
}
.sg-scroll-flash{
  outline: 3px solid rgba(59,130,246,.35);
  outline-offset: 6px;
  border-radius: 14px;
  transition: outline .25s ease;
}

@media (prefers-reduced-motion: reduce){
  .sgbtn, .sgbtn__ripple{ animation:none !important; transition:none !important; }
}


html, body{
  height: 100%;
  overflow: hidden; 
}


#sg-scroll{
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative; 
}
.link{
  color:#156fe5;
  text-decoration:underline;
  cursor:pointer;
}
.link:hover{ opacity:.85; }
.page-element[data-type="text"]{
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  box-sizing: border-box;
   overflow: visible; 
}

</style>

  <?php
$pageH = 0;
foreach ($xmlDocs as $doc) {
  $v = trim((string)($doc->pageHeight ?? ''));
  if ($v !== '' && ctype_digit($v)) $pageH = (int)$v;
}

if ($pageH <= 0) {
  $pageH = sg_guess_page_height($xmlDocs);
}

$GLOBALS['pageH'] = $pageH; 


$projBg = null;

foreach ($xmlDocs as $doc) {
  if (!isset($doc->projectBackground)) continue;

  $pb = $doc->projectBackground;

  if (isset($pb->mode) || isset($pb->solid) || isset($pb->gradType)) {
    $projBg = [
      'mode' => (string)($pb->mode ?? 'none'),
      'solid' => (string)($pb->solid ?? '#f3f4f6'),

      'gradType' => (string)($pb->gradType ?? 'linear'),
      'gradAngle' => (int)($pb->gradAngle ?? 180),

      'gradFrom' => (string)($pb->gradFrom ?? '#0ea5e9'),
      'gradMid'  => (string)($pb->gradMid  ?? '#6366f1'),
      'gradTo'   => (string)($pb->gradTo   ?? '#111827'),
      'gradUseMid' => sg_boolish($pb->gradUseMid ?? '0') ? '1' : '0',

      'gradPosX' => (int)($pb->gradPosX ?? 50),
      'gradPosY' => (int)($pb->gradPosY ?? 50),

      'gradPreset' => (string)($pb->gradPreset ?? ''),
    ];
    continue;
  }

  $raw = trim((string)$pb);
  if ($raw !== '' && $raw[0] === '{') {
    $decoded = html_entity_decode($raw, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $tmp = json_decode($decoded, true);
    if (is_array($tmp)) $projBg = $tmp;
  }
}

if (!$projBg) $projBg = ['mode' => 'none'];

$winCfg = null;

foreach ($xmlDocs as $doc) {
  if (!isset($doc->windowScroll)) continue;

  $ws = $doc->windowScroll;



  if (isset($ws->enabled) || isset($ws->width) || isset($ws->track)) {
    $enabledRaw = strtolower(trim((string)($ws->enabled ?? '1')));
    $thinRaw    = strtolower(trim((string)($ws->firefoxThin ?? '0')));

    $winCfg = [
      'enabled'     => ($enabledRaw === '1' || $enabledRaw === 'true'),
      'firefoxThin' => ($thinRaw === '1' || $thinRaw === 'true'),
      'width'       => (int)($ws->width ?? 12),
      'radius'      => (int)($ws->radius ?? 10),
      'track'       => (string)($ws->track ?? 'rgba(203,213,225,0.25)'),
      'thumb'       => (string)($ws->thumb ?? 'rgba(15,23,42,0.55)'),
      'thumbHover'  => (string)($ws->thumbHover ?? 'rgba(15,23,42,0.75)'),
    ];

    continue; 
  }
  $raw = trim((string)$ws);
  if ($raw !== '' && substr($raw, 0, 1) === '{') {
    $decoded = html_entity_decode($raw, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $tmp = json_decode($decoded, true);
    if (is_array($tmp)) $winCfg = $tmp;
  }
}

if (!$winCfg) {
  $winCfg = [
    'enabled' => true,
    'firefoxThin' => false,
    'width' => 12,
    'radius' => 10,
    'track' => 'rgba(203,213,225,0.25)',
    'thumb' => 'rgba(15,23,42,0.55)',
    'thumbHover' => 'rgba(15,23,42,0.75)',
  ];
}
?>


<script>
window.sgProjectBgConfig = <?= json_encode($projBg, JSON_UNESCAPED_UNICODE) ?>;
</script>

<?php sg_include_page_runtime_assets($selected, __DIR__); ?>

</head>
<body>
  <div id="sg-scroll">
    <?php
    foreach ($xmlDocs as $doc) {
      if (isset($doc->element)) {
        foreach ($doc->element as $el) renderElement($el);
      }
    }
    ?>
    <div id="sg-scroll-spacer" style="height:1px;"></div>
  </div>


<script>
(function(){
  const cssEsc = (s) => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');

  function resolveTarget(t){
    if(!t) return null;
    t = String(t).trim();
    if(!t) return null;

    if (t.startsWith('#')) return document.querySelector(t) || document.getElementById(t.slice(1));

    const byDataId = document.querySelector('.page-element[data-id="'+ cssEsc(t) +'"]');
    if (byDataId) return byDataId;

    return document.getElementById(t);
  }

  function ripple(btn, ev){
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.25;
    const r = document.createElement('span');
    r.className = 'sgbtn__ripple';
    r.style.width = r.style.height = size + 'px';
    r.style.left = (ev.clientX - rect.left - size/2) + 'px';
    r.style.top  = (ev.clientY - rect.top  - size/2) + 'px';
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once:true });
  }

  function flash(el){
    el.classList.add('sg-scroll-flash');
    setTimeout(() => el.classList.remove('sg-scroll-flash'), 1200);
  }
  function playEffect(btn, effect, ev){
    effect = String(effect || 'none');

    btn.classList.remove(
      'fx-scale-click',
      'fx-bounce-click',
      'fx-pulse-click',
      'fx-glow-click',
      'fx-shake-click'
    );

    void btn.offsetWidth;

    if (effect === 'scale' || effect === 'scale-ripple') {
      btn.classList.add('fx-scale-click');
      setTimeout(() => btn.classList.remove('fx-scale-click'), 120);
    }

    if (effect === 'bounce') {
      btn.classList.add('fx-bounce-click');
      setTimeout(() => btn.classList.remove('fx-bounce-click'), 420);
    }

    if (effect === 'pulse') {
      btn.classList.add('fx-pulse-click');
      setTimeout(() => btn.classList.remove('fx-pulse-click'), 380);
    }

    if (effect === 'glow') {
      btn.classList.add('fx-glow-click');
      setTimeout(() => btn.classList.remove('fx-glow-click'), 470);
    }

    if (effect === 'shake') {
      btn.classList.add('fx-shake-click');
      setTimeout(() => btn.classList.remove('fx-shake-click'), 380);
    }

    if (effect === 'ripple' || effect === 'scale-ripple') {
      ripple(btn, ev);
    }
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.sgbtn');
    if (!btn) return;
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
const toggleController = btn.closest('[data-sg-toggle-target]');
const toggleTrigger = toggleController?.dataset?.sgToggleTrigger || '';

if (toggleController && toggleTrigger === 'self') {
  playEffect(btn, btn.dataset.clickEffect || 'none', e);
  return;
}
const clickEffect = btn.dataset.clickEffect || 'none';
playEffect(btn, clickEffect, e);

    const action = btn.dataset.action || 'none';

if (action === 'link') {
  const url = (btn.dataset.url || '').trim();
  const target = (btn.dataset.target || '_self').trim();
  if (!url || url === 'https://' || url === 'http://') return;

  if (target === '_blank') window.open(url, '_blank', 'noopener,noreferrer');
  else window.location.href = url;
  return;
}


    if (action === 'scroll') {
      const target = (btn.dataset.scrollTarget || '').trim();
      const offset = parseInt(btn.dataset.scrollOffset || '0', 10) || 0;

      const el = resolveTarget(target);
      if (!el) return;

const sc = document.getElementById('sg-scroll');

if (sc) {
  const scRect = sc.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const y = (elRect.top - scRect.top) + sc.scrollTop - offset;
  sc.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
} else {
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}


      setTimeout(() => flash(el), 350);
      return;
    }
  });
})();
</script>





<?php
$__v = function(string $f){
  $p = __DIR__ . DIRECTORY_SEPARATOR . $f;
  return @filemtime($p) ?: time();
};
?>
<script src="sg_sideblock_window.js?v=<?= $__v('sg_sideblock_window.js') ?>"></script>
<script src="sg_sidescroll_blok.js?v=<?= $__v('sg_sidescroll_blok.js') ?>"></script>

<script src="sg_footer.js?v=<?= $__v('sg_footer.js') ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('[data-is-footer="1"],[data-footer="1"]').forEach(el => {
    const mode = (el.getAttribute('data-footer-mode') || el.dataset.footerMode || 'fixed').toLowerCase();
    if (mode === 'page') return;          
    window.applyFooterStyles?.(el);
  });

  const footers = Array.from(document.querySelectorAll('[data-is-footer="1"],[data-footer="1"]'));
  let padTop = 0, padBottom = 0;

  footers.forEach(f => {
    const st = getComputedStyle(f);
    if (st.position !== 'fixed') return;

    const h = f.getBoundingClientRect().height;
    const dock = f.getAttribute('data-footer-dock') || 'bottom';

    if (dock === 'top') {
      const t = parseFloat(st.top) || 0;
      padTop = Math.max(padTop, h + t);
    } else {
      const b = parseFloat(st.bottom) || 0;
      padBottom = Math.max(padBottom, h + b);
    }
  });

  const sc = document.getElementById('sg-scroll');
  if (sc) {
    if (padTop) sc.style.paddingTop = padTop + 'px';
    if (padBottom) sc.style.paddingBottom = padBottom + 'px';
  }

  const winCfg = <?= json_encode($winCfg, JSON_UNESCAPED_UNICODE) ?>;

  if (window.sg_sideblock_window) {
    window.sg_sideblock_window(winCfg, "#sg-scroll");
  }

  document.querySelectorAll('.page-element[data-type="block"][data-sg-scroll-block]')
    .forEach(el => window.sg_sidescroll_blok?.(el));

  document.querySelectorAll('.page-element[data-type="brand"]')
    .forEach(el => window.updateBrandVisuals?.(el));

  document.querySelectorAll('.page-element[data-type="form"]')
    .forEach(el => window.updateFormVisuals?.(el));


});
</script>


<script src="sg_calendar.js?v=<?= $__v('sg_calendar.js') ?>"></script>
<script src="sg_button.js?v=<?= $__v('sg_button.js') ?>"></script>


<script src="sg_toggle.js?v=<?= $__v('sg_toggle.js') ?>"></script>
<script>
(function () {
  function textOf(parent, tag) {
    const n = parent ? parent.querySelector(tag) : null;
    return n ? (n.textContent || '').trim() : '';
  }

  function parseElementState(elNode) {
    const id = elNode.getAttribute('id') || '';
    if (!id) return null;

    const removed = elNode.getAttribute('removed') === '1';

    const out = {
      removed: removed ? '1' : '0',
      type: elNode.getAttribute('type') || '',
      tagName: elNode.getAttribute('tagName') || '',
      parentId: elNode.getAttribute('parentId') || '',
      className: elNode.getAttribute('className') || '',
      style: textOf(elNode, 'style'),
      attrs: {},
      innerHTML: textOf(elNode, 'innerHTML')
    };

    const attrsNode = elNode.querySelector(':scope > attrs');
    if (attrsNode) {
      attrsNode.querySelectorAll(':scope > attr').forEach(attrNode => {
        const name = attrNode.getAttribute('name') || '';
        if (!name) return;
        out.attrs[name] = attrNode.textContent || '';
      });
    }

    return { id, state: out };
  }

  function parseSnapshot(sectionNode) {
    const snapshot = {
      pageHeight: textOf(sectionNode, 'pageHeight') || null,
      elements: {}
    };

    if (!sectionNode) return snapshot;

    sectionNode.querySelectorAll(':scope > element').forEach(elNode => {
      const parsed = parseElementState(elNode);
      if (!parsed) return;
      snapshot.elements[parsed.id] = parsed.state;
    });

    return snapshot;
  }

  async function loadToggleDiffForController(ctrlEl) {
    if (!ctrlEl) return;
    if (ctrlEl.dataset.sgToggleLoaded === '1') return;

    const toggleFile = (ctrlEl.dataset.sgToggleFile || '').trim();
    if (!toggleFile) {
      ctrlEl.dataset.sgToggleLoaded = '1';
      return;
    }

    const url = 'super_generator.php?action=read_toggle_diff&toggleFile=' + encodeURIComponent(toggleFile);
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) {
      console.warn('[sg_toggle] Nie udało się pobrać toggle diff:', toggleFile);
      return;
    }

    const xmlText = await res.text();
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');

    if (doc.querySelector('parsererror')) {
      console.warn('[sg_toggle] Błędny XML toggle:', toggleFile);
      return;
    }

    const beforeNode = doc.querySelector('toggleDiff > before');
    const afterNode  = doc.querySelector('toggleDiff > after');

    const beforeSnap = parseSnapshot(beforeNode);
    const afterSnap  = parseSnapshot(afterNode);

    ctrlEl.dataset.sgToggleBeforeState = JSON.stringify(beforeSnap);
    ctrlEl.dataset.sgToggleAfterState  = JSON.stringify(afterSnap);

    if (!ctrlEl.dataset.sgToggleState && ctrlEl.dataset.sgToggleInitial) {
      ctrlEl.dataset.sgToggleState = ctrlEl.dataset.sgToggleInitial;
    }

    ctrlEl.dataset.sgToggleLoaded = '1';
  }

  async function bootToggleDiffs() {
    const controllers = Array.from(document.querySelectorAll('[data-sg-toggle-target][data-sg-toggle-file]'));
    await Promise.all(controllers.map(loadToggleDiffForController));

    if (window.sgToggle?.rescan) {
      window.sgToggle.rescan();
    }
  }

  window.sgToggleEnsureLoaded = loadToggleDiffForController;
  window.sgToggleReadyPromise = bootToggleDiffs();

if (document.readyState === 'loading') {
  window.sgToggleReadyPromise = new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => {
      bootToggleDiffs().then(resolve);
    }, { once: true });
  });
} else {
  window.sgToggleReadyPromise = bootToggleDiffs();
}
})();
</script>
<script>
(function(){

function applyPageHeight(nextHeight) {
    const spacer = document.getElementById('sg-scroll-spacer');
    if (!spacer) return;

    const safeHeight = Math.max(1, parseInt(nextHeight || '0', 10) || 0);
    if (safeHeight > 0) {
      spacer.style.height = safeHeight + 'px';
    }
  }

  window.applyPageHeight = applyPageHeight;

  function updateScrollSpacer() {
    const sc = document.getElementById('sg-scroll');
    const spacer = document.getElementById('sg-scroll-spacer');
    if (!sc || !spacer) return;

    let maxBottom = 0;

    document.querySelectorAll('.page-element').forEach(el => {
      const style = getComputedStyle(el);

      if (style.position === 'fixed') return;
      if (el.classList.contains('sg-toggle-hidden')) return;
      if (style.display === 'none') return;

      const bottom = el.offsetTop + el.offsetHeight;
      if (bottom > maxBottom) maxBottom = bottom;
    });

    const forced = <?= (int)$pageH ?>;
    spacer.style.height = Math.max(forced, maxBottom, 1) + 'px';
  }
  window.sgEnsurePageFitsElement = function(el, extraSpace = 80) {
    const sc = document.getElementById('sg-scroll');
    const spacer = document.getElementById('sg-scroll-spacer');
    if (!sc || !spacer || !el) return;

    const scRect = sc.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const bottomInsideScroll = (elRect.bottom - scRect.top) + sc.scrollTop + extraSpace;
    const currentSpacer = parseInt(spacer.style.height || '0', 10) || 0;

    if (bottomInsideScroll > currentSpacer) {
      spacer.style.height = Math.ceil(bottomInsideScroll) + 'px';
    }
  };

window.sgResizeBlockToVisibleChildren = function(blockEl, extraPadding = 20) {
  if (!blockEl) return;
  if (blockEl.getAttribute('data-type') !== 'block') return;
  if (blockEl.getAttribute('data-is-footer') === '1') return;

  const children = Array.from(blockEl.children).filter(child => {
    return child.classList && child.classList.contains('page-element');
  });

  // Jeśli block nie ma dzieci, nie ruszamy wysokości z XML
  if (!children.length) {
    window.sgEnsurePageFitsElement(blockEl, 120);
    updateScrollSpacer();
    return;
  }

  let maxBottom = 0;
  let visibleCount = 0;

  children.forEach(child => {
    const style = getComputedStyle(child);
    const hidden =
      child.classList.contains('sg-toggle-hidden') ||
      style.display === 'none';

    if (hidden) return;

    visibleCount++;

    const top = child.offsetTop || 0;
    const height = child.offsetHeight || 0;
    const bottom = top + height;

    if (bottom > maxBottom) maxBottom = bottom;
  });

  if (!visibleCount) {
    window.sgEnsurePageFitsElement(blockEl, 120);
    updateScrollSpacer();
    return;
  }

  const nextHeight = Math.max(40, maxBottom + extraPadding);
  blockEl.style.height = nextHeight + 'px';

  window.sgEnsurePageFitsElement(blockEl, 120);
  updateScrollSpacer();
};

  window.sgRefreshFinalLayout = updateScrollSpacer;

  document.addEventListener('DOMContentLoaded', () => {
    updateScrollSpacer();



    updateScrollSpacer();
  });
})();
</script>
<script src="sg_project_bg.js?v=<?= $__v('sg_project_bg.js') ?>"></script>
<script src="sg_brand.js?v=<?= $__v('sg_brand.js') ?>"></script>
<style>
  .sg-form-inner input:focus,
  .sg-form-inner select:focus,
  .sg-form-inner textarea:focus{
    border-color: var(--sg-accent, #156fe5);
    box-shadow: 0 0 0 4px rgba(21,111,229,0.18);
    outline:none;
  }
</style>


<?php $vAnk = @filemtime(__DIR__ . '/sg_ankieta.js') ?: time(); ?>

<script src="sg_ankieta.js?v=<?= $vAnk ?>"></script>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const forced = <?= (int)$pageH ?>;
  const spacer = document.getElementById('sg-scroll-spacer');
  if (!spacer) return;

  if (forced > 0) {
    spacer.style.height = forced + 'px';
  }

  if (typeof window.sgRefreshFinalLayout === 'function') {
    window.sgRefreshFinalLayout();
  }
});
</script>


</body>

</html>
