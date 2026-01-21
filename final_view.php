<?php
session_start();

$projectsDir = __DIR__ . DIRECTORY_SEPARATOR . 'projects';

function sg_clean_file_name(string $name): string {
  $name = trim($name);
  $name = basename($name);
  $name = preg_replace('/[^a-zA-Z0-9._-]/', '_', $name);
  if ($name === '') $name = 'generated_page.xml';
  if (!preg_match('/\.xml$/i', $name)) $name .= '.xml';
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
  : (__DIR__ . DIRECTORY_SEPARATOR . 'projects' . DIRECTORY_SEPARATOR . $selected);


$FOOTER_PLUGIN_PART = 'functions';
require_once __DIR__ . '/footer_plugin.php';

function sg_resolve_xml_path(string $fileName, string $projectsDir, string $legacyXml): string {
  $fileName = sg_clean_file_name($fileName);
  if ($fileName === 'generated_page.xml') return $legacyXml;
  return $projectsDir . DIRECTORY_SEPARATOR . $fileName;
}

function sg_load_xml_chain(string $entryPath, string $projectsDir, string $legacyXml, array &$seen = []): array {
  if (!is_file($entryPath)) return [];
  $xml = @simplexml_load_file($entryPath);
  if (!$xml) return [];

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




    $borderRadius = (string)($el->borderRadius ?? '0px');
    $boxShadow    = (string)($el->boxShadow ?? 'none');
    $opacity      = (string)($el->opacity ?? '1');
    $backdrop     = (string)($el->backdropFilter ?? 'none');

    $bg = (string)($el->bg ?? 'transparent');

    $fontFamily     = (string)($el->fontFamily ?? "'Segoe UI', sans-serif");
    $fontWeight     = (string)($el->fontWeight ?? '400');
    $fontStyle      = (string)($el->fontStyle ?? 'normal');
    $textDecoration = (string)($el->textDecoration ?? 'none');
    $textAlign      = (string)($el->textAlign ?? 'left');
$lineHeight = (string)($el->lineHeight ?? '1.2');
    $letterSpacing  = (string)($el->letterSpacing ?? 'normal');
    $textTransform  = (string)($el->textTransform ?? 'none');

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
    $defShadow = 'rgba(0, 0, 0, 0.12) 0px 12px 30px 0px';
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
}

$hasBlockScroll = false;
$scrollCfg = null;

if ($type === 'block' && isset($el->sgScrollBlock)) {
  $scrollCfg = sg_parse_scroll_block_node($el->sgScrollBlock);
  $hasBlockScroll = is_array($scrollCfg) && (!isset($scrollCfg['enabled']) || $scrollCfg['enabled']);
}


$overflowCss = $hasBlockScroll ? 'auto' : 'visible';

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

$footerMode = $isFooter ? (string)($el->footerMode ?? 'fixed') : '';
$footerMode = ($footerMode === 'page') ? 'page' : 'fixed';

$footerAttr = $isFooter
  ? " data-footer='1' data-footer-dock='".htmlspecialchars($dock, ENT_QUOTES)."' data-footer-mode='".htmlspecialchars($footerMode, ENT_QUOTES)."' "
  : "";

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
" data-form-placeholder-color='".htmlspecialchars((string)($el->formPlaceholderColor ?? '#94a3b8'), ENT_QUOTES)."'" .
" data-form-focus-ring='".htmlspecialchars((string)($el->formFocusRing ?? '4'), ENT_QUOTES)."'" .
" data-form-focus-opacity='".htmlspecialchars((string)($el->formFocusOpacity ?? '18'), ENT_QUOTES)."'";

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

  echo "<div style='width:100%;height:100%;overflow:hidden;'>";
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

  $preset = (string)($el->btnPreset ?? 'primary');
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

  $upper  = ((string)($el->btnUpper ?? '0') === '1');
  $letter = (float)($el->btnLetter ?? 0);

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
$btnTitle = trim((string)($el->btnTitle ?? ''));
$btnAria  = trim((string)($el->btnAria ?? ($el->btnAriaLabel ?? '')));
$btnType  = strtolower(trim((string)($el->btnType ?? ($el->btnHtmlType ?? 'button'))));
$btnName  = trim((string)($el->btnName ?? ''));

$typeSafe = in_array($btnType, ['button','submit','reset'], true) ? $btnType : 'button';

$titleAttr = ($btnTitle !== '') ? " title='".htmlspecialchars($btnTitle, ENT_QUOTES)."'" : "";
$ariaAttr  = ($btnAria  !== '') ? " aria-label='".htmlspecialchars($btnAria, ENT_QUOTES)."'" : "";
$nameAttr  = ($btnName  !== '') ? " name='".htmlspecialchars($btnName, ENT_QUOTES)."'" : "";


echo "<button type='".htmlspecialchars($typeSafe, ENT_QUOTES)."' class='sgbtn sgbtn--".htmlspecialchars($preset, ENT_QUOTES)." sgbtn--".htmlspecialchars($size, ENT_QUOTES)."'"
  . " data-action='".htmlspecialchars($action, ENT_QUOTES)."'"
  . " data-url='".htmlspecialchars($url, ENT_QUOTES)."'"
  . " data-target='".htmlspecialchars($target, ENT_QUOTES)."'"
  . " data-scroll-target='".htmlspecialchars($scrollTarget, ENT_QUOTES)."'"
  . " data-scroll-offset='".(int)$scrollOffset."'"
  . $titleAttr . $ariaAttr . $nameAttr
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
      . "text-transform:".($upper ? "uppercase" : "none").";"
      . "text-align:".htmlspecialchars($align, ENT_QUOTES).";"
      . "font-weight:".htmlspecialchars($weight, ENT_QUOTES).";"
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
  $divider  = ((string)($el->navDivider ?? '0') === '1');

  $justifyMode  = (string)($el->navJustify ?? 'start');  
  $vJustifyMode = (string)($el->navVJustify ?? 'top');   

  $linkBorderW = (int)($el->navLinkBorderW ?? 1);
  $linkBorderColor = (string)($el->navLinkBorderColor ?? 'rgba(255,255,255,0.10)');
$shadowRaw = strtolower(trim((string)($el->navLinkShadow ?? 'soft')));

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

  $dividerRule = '';
  if ($divider) {
    if ($orientation === 'vertical') {
      $dividerRule = ".{$cls} .sgnav__links a + a{ border-top:1px solid rgba(255,255,255,0.10); }";
    } else {
      $dividerRule = ".{$cls} .sgnav__links a + a{ border-left:1px solid rgba(255,255,255,0.10); }";
    }
  }

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
      gap:{$gap}px;
      width:100%;
      height:100%;
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

    {$dividerRule}
    {$layoutCss}
  </style>";

  echo "<nav{$navIdAttr} class='{$cls} sgnav sgnav--".htmlspecialchars($layout, ENT_QUOTES).$extraClass."' data-hook-mode='".htmlspecialchars($hookMode, ENT_QUOTES)."' data-active-mode='".htmlspecialchars($activeMode, ENT_QUOTES)."'{$navNameAttr}>";

  if ($brandText !== '') {
    echo "<a class='sgnav__brand' href='".htmlspecialchars($brandHref, ENT_QUOTES)."'>".htmlspecialchars($brandText)."</a>";
  }

  echo "<div class='sgnav__links'>";
  foreach ($items as $it) {
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

$seen = [];
$xmlDocs = sg_load_xml_chain($xmlFile, $projectsDir, $legacyXml, $seen);

?>
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>WIDOK FINALNY</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: white;
      min-height: 100vh;
      position: relative;
      font-family: 'Segoe UI', Tahoma, sans-serif;
    }

.page-element[data-type="form"] div,
.page-element[data-type="form"] p{
  margin: 0 !important;
  padding: 0 !important;
  line-height: inherit;
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
  justify-content:center;
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

.sgbtn--sm{ padding:8px 10px; font-size:12px; }
.sgbtn--md{ padding:10px 12px; font-size:13px; }
.sgbtn--lg{ padding:12px 14px; font-size:15px; }

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
</style>

  <?php
$pageH = 0;
foreach ($xmlDocs as $doc) {
  $v = trim((string)($doc->pageHeight ?? ''));
  if ($v !== '' && ctype_digit($v)) $pageH = (int)$v;
}
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
  if ($raw !== '' && substr($raw, 0, 1) === '{') {
    $decoded = html_entity_decode($raw, ENT_QUOTES | ENT_XML1, 'UTF-8');
    $tmp = json_decode($decoded, true);
    if (is_array($tmp)) $projBg = $tmp;
  }
}

if (!$projBg) $projBg = ['mode' => 'none'];


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


</head>
<body>
  <script>
window.sgProjectBgConfig = <?= json_encode($projBg, JSON_UNESCAPED_UNICODE) ?>;
</script>
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
document.addEventListener('DOMContentLoaded', () => {
  const footers = Array.from(document.querySelectorAll('[data-footer="1"][data-footer-mode="fixed"]'));


  let padTop = 0;
  let padBottom = 0;

  footers.forEach(f => {
    const st = getComputedStyle(f);
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
if (!sc) return;

if (padTop) sc.style.paddingTop = padTop + 'px';
if (padBottom) sc.style.paddingBottom = padBottom + 'px';

});


document.addEventListener('DOMContentLoaded', () => {
  const winCfg = <?= json_encode($winCfg, JSON_UNESCAPED_UNICODE) ?>;

  if (window.sg_sideblock_window) {
    window.sg_sideblock_window(winCfg, "#sg-scroll");
  }

  document.querySelectorAll('.page-element[data-type="block"][data-sg-scroll-block]')
    .forEach((el) => window.sg_sidescroll_blok?.(el));

  document.querySelectorAll('.page-element[data-type="brand"]').forEach(el => {
    window.updateBrandVisuals?.(el);
  });
});


</script>
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

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.sgbtn');
    if (!btn) return;
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;

    ripple(btn, e);

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
<script src="sg_calendar.js?v=<?= $__v('sg_calendar.js') ?>"></script>
<script src="sg_toggle.js?v=<?= $__v('sg_toggle.js') ?>"></script>
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
<script>window.SG_MODE='final';</script>
<script src="sg_ankieta.js?v=<?= $vAnk ?>"></script>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const forced = <?= (int)$pageH ?>;

if (forced > 0) {
  const spacer = document.getElementById('sg-scroll-spacer');
  if (!spacer) return;
  spacer.style.height = forced + 'px';
  return;
}
const sc = document.getElementById('sg-scroll');
if (!sc) return;
const spacer = document.getElementById('sg-scroll-spacer');
if (!spacer) return;

  let maxBottom = 0;
  document.querySelectorAll('.page-element').forEach(el => {
    const st = getComputedStyle(el);
    if (st.position === 'fixed') return;
    const bottom = el.offsetTop + el.offsetHeight;
    if (bottom > maxBottom) maxBottom = bottom;
  });
  spacer.style.height = (maxBottom + 80) + 'px';
});

</script>



</body>

</html>
