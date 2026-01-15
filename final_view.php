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



function renderElement($el) {
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
    $lineHeight     = (string)($el->lineHeight ?? '1.2');
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
  $dock = (string)($el->footerDock ?? 'bottom');
  $off  = (int)($el->footerBottom ?? 0);
  $left = (int)($el->footerLeft ?? 0);

  $pos = "position:fixed; left:{$left}px; right:0px; width:calc(100% - {$left}px); height: {$el->h}; ";
  $pos .= ($dock === 'top') ? "top:{$off}px; " : "bottom:{$off}px; ";
} else {
  $pos = "position:absolute; left:" . (int)$el->x . "px; top:" . (int)$el->y . "px; width:{$el->w}; height:{$el->h}; ";
}
$ws = ($type === 'text') ? 'pre-wrap' : 'normal';

$style =
  $pos .
  "color: {$el->color}; " .
  "background: {$bg}; " .
  "font-size: {$el->fontSize}; " .
  "font-family: {$fontFamily}; " .
  "font-weight: {$fontWeight}; " .
  "font-style: {$fontStyle}; " .
  "text-decoration: {$textDecoration}; " .
  "text-align: {$textAlign}; " .
  "line-height: {$lineHeight}; " .
  "letter-spacing: {$letterSpacing}; " .
  "text-transform: {$textTransform}; " .
  "border: {$el->border}; " .
  "z-index: {$el->zIndex}; " .
  "border-radius: {$borderRadius}; " .
  "box-shadow: {$boxShadow}; " .
  "opacity: {$opacity}; " .
  "backdrop-filter: {$backdrop}; " .
  "box-sizing: border-box; " .
  "white-space: {$ws}; " .
  "overflow: visible; " .
  "padding: {$padding};";


$footerAttr = $isFooter
  ? " data-footer='1' data-footer-dock='".htmlspecialchars($dock, ENT_QUOTES)."' "
  : "";

if ($type === 'button') {
  $style .= "background: transparent; border: none; padding: 0; white-space: normal;";
}

echo "<div class='page-element' data-id='".htmlspecialchars((string)$el['id'], ENT_QUOTES)."' data-type='".htmlspecialchars($type, ENT_QUOTES)."'{$footerAttr} style='{$style}'>";




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
    $fType     = (string)($el->formType ?? 'text');
    $label     = (string)($el->label ?? '');
    $help      = (string)($el->formHelpText ?? '');
    $placeholder = (string)($el->formPlaceholder ?? '');
    $requiredFlag = ((string)($el->formRequired ?? '0') === '1');
    $inlineFlag   = ((string)($el->formInline ?? '0') === '1');
    $name     = trim((string)($el->formName ?? ''));
    if ($name === '') $name = 'form_' . (string)$el['id'];

    $accent    = (string)($el->accentColor ?? '#156fe5');
    $fontColor = (string)($el->color ?? '#0f172a');

    $radius = (int)($el->formInputRadius ?? 10);
    $radius = max(0, min(30, $radius));

    $optsRaw = (string)($el->options ?? '');
    $options = preg_split("/\r\n|\n|\r|,/", $optsRaw);
    $options = array_values(array_filter(array_map('trim', $options), fn($v) => $v !== ''));

    $requiredAttr = $requiredFlag ? 'required' : '';
    $mark = $requiredFlag ? "<span style='color:#ef4444; font-weight:800;'>*</span>" : "";

    $base = "width:100%; font-family:inherit; font-size:inherit; color:{$fontColor}; padding:9px 10px; border:1px solid #d1d5db; border-radius:{$radius}px; box-sizing:border-box; outline:none;";

    echo "<div style='padding:12px; box-sizing:border-box; width:100%; height:100%;'>";

    if ($label !== '') {
        echo "<div style='font-weight:700; font-size:14px; color:{$fontColor}; display:flex; gap:6px; align-items:baseline;'>"
            . htmlspecialchars($label) . $mark . "</div>";
    }
    if ($help !== '') {
        echo "<div style='font-size:12px; color:#64748b; margin-top:4px; line-height:1.35;'>"
            . htmlspecialchars($help) . "</div>";
    }

    $mt = ($label !== '' || $help !== '') ? "margin-top:10px;" : "";
    echo "<div style='{$mt}'>";

    if (in_array($fType, ['text','email','number','date'], true)) {
        $typeAttr = ($fType === 'text') ? 'text' : $fType;

        $min = (string)($el->formMin ?? '');
        $max = (string)($el->formMax ?? '');
        $step = (string)($el->formStep ?? '');

        $minAttr  = ($fType === 'number' && $min !== '') ? " min='".htmlspecialchars($min, ENT_QUOTES)."'" : "";
        $maxAttr  = ($fType === 'number' && $max !== '') ? " max='".htmlspecialchars($max, ENT_QUOTES)."'" : "";
        $stepAttr = ($fType === 'number' && $step !== '') ? " step='".htmlspecialchars($step, ENT_QUOTES)."'" : "";

        $ph = $placeholder ?: "Wpisz odpowiedź...";
        echo "<input type='{$typeAttr}' name='".htmlspecialchars($name, ENT_QUOTES)."' {$requiredAttr} "
            . "placeholder='".htmlspecialchars($ph, ENT_QUOTES)."' style='{$base}'{$minAttr}{$maxAttr}{$stepAttr}>";
    }
    elseif ($fType === 'textarea') {
        $rows = (int)($el->formRows ?? 3);
        $rows = max(1, min(20, $rows));
        $ph = $placeholder ?: "Wpisz odpowiedź...";
        echo "<textarea name='".htmlspecialchars($name, ENT_QUOTES)."' {$requiredAttr} rows='{$rows}' "
            . "placeholder='".htmlspecialchars($ph, ENT_QUOTES)."' style='{$base} resize:vertical;'></textarea>";
    }
    elseif ($fType === 'select') {
        if (!$options) $options = ['Opcja 1', 'Opcja 2'];
        echo "<select name='".htmlspecialchars($name, ENT_QUOTES)."' {$requiredAttr} style='{$base}'>";
        foreach ($options as $o) echo "<option>" . htmlspecialchars($o) . "</option>";
        echo "</select>";
    }
    elseif ($fType === 'radio' || $fType === 'checkbox') {
        if (!$options) $options = ['Opcja 1', 'Opcja 2'];
        $wrapStyle = $inlineFlag
            ? "display:flex; flex-wrap:wrap; gap:10px;"
            : "display:flex; flex-direction:column; gap:6px;";

        echo "<div style='{$wrapStyle}'>";
        foreach ($options as $i => $o) {
            $id = htmlspecialchars($name . '_' . $i, ENT_QUOTES);
            $typeAttr = $fType;
            $req = ($requiredFlag && $typeAttr === 'radio') ? 'required' : '';
            $nameAttr = htmlspecialchars($name, ENT_QUOTES) . ($typeAttr === 'checkbox' ? '[]' : '');

            echo "<label for='{$id}' style='display:flex; align-items:center; gap:8px; cursor:pointer;'>";
            echo "<input id='{$id}' type='{$typeAttr}' name='{$nameAttr}' value='".htmlspecialchars($o, ENT_QUOTES)."' {$req} "
                . "style='accent-color:{$accent}; width:14px; height:14px; margin:0;'>";
            echo "<span>" . htmlspecialchars($o) . "</span>";
            echo "</label>";
        }
        echo "</div>";
    }
    elseif ($fType === 'yesno') {
        echo "<div style='display:flex; gap:14px; align-items:center;'>";
        foreach (['Tak','Nie'] as $i => $o) {
            $id = htmlspecialchars($name . '_yn_' . $i, ENT_QUOTES);
            echo "<label for='{$id}' style='display:flex; align-items:center; gap:8px; cursor:pointer;'>";
            echo "<input id='{$id}' type='radio' name='".htmlspecialchars($name, ENT_QUOTES)."' value='".htmlspecialchars($o, ENT_QUOTES)."' {$requiredAttr} "
                . "style='accent-color:{$accent}; width:14px; height:14px; margin:0;'>";
            echo "<span>" . htmlspecialchars($o) . "</span>";
            echo "</label>";
        }
        echo "</div>";
    }
    elseif ($fType === 'rating') {
        $min = (int)($el->ratingMin ?? 1);
        $max = (int)($el->ratingMax ?? 5);
        $step = (int)($el->ratingStep ?? 1); $step = max(1, $step);
        $left = (string)($el->ratingMinLabel ?? '');
        $right = (string)($el->ratingMaxLabel ?? '');

        echo "<div style='display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;'>";
        echo "<div style='font-size:12px; color:#64748b; min-width:60px;'>" . htmlspecialchars($left) . "</div>";
        echo "<div style='display:flex; gap:12px; flex-wrap:wrap; justify-content:center;'>";

        $i = 0;
        for ($v = $min; $v <= $max; $v += $step) {
            $id = htmlspecialchars($name . '_r_' . $i, ENT_QUOTES);
            echo "<label for='{$id}' style='display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;'>";
            echo "<input id='{$id}' type='radio' name='".htmlspecialchars($name, ENT_QUOTES)."' value='{$v}' {$requiredAttr} "
                . "style='accent-color:{$accent}; width:14px; height:14px; margin:0;'>";
            echo "<span style='font-size:11px; color:#64748b;'>" . $v . "</span>";
            echo "</label>";
            $i++;
        }
        echo "</div>";
        echo "<div style='font-size:12px; color:#64748b; min-width:60px; text-align:right;'>" . htmlspecialchars($right) . "</div>";
        echo "</div>";
    }
    elseif ($fType === 'likert') {
        $min = (int)($el->likertMin ?? 1);
        $max = (int)($el->likertMax ?? 5);
        $left = (string)($el->likertLeft ?? '');
        $right = (string)($el->likertRight ?? '');

        echo "<div style='display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;'>";
        echo "<div style='font-size:12px; color:#64748b; width:80px;'>" . htmlspecialchars($left) . "</div>";
        echo "<div style='display:flex; gap:12px; justify-content:center; flex-wrap:wrap;'>";

        for ($v = $min; $v <= $max; $v++) {
            $id = htmlspecialchars($name . '_l_' . $v, ENT_QUOTES);
            echo "<label for='{$id}' style='display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;'>";
            echo "<input id='{$id}' type='radio' name='".htmlspecialchars($name, ENT_QUOTES)."' value='{$v}' {$requiredAttr} "
                . "style='accent-color:{$accent}; width:14px; height:14px; margin:0;'>";
            echo "<span style='font-size:11px; color:#64748b;'>" . $v . "</span>";
            echo "</label>";
        }
        echo "</div>";
        echo "<div style='font-size:12px; color:#64748b; width:80px; text-align:right;'>" . htmlspecialchars($right) . "</div>";
        echo "</div>";
    }

    else {
        $ph = $placeholder ?: "Wpisz odpowiedź...";
        echo "<input type='text' name='".htmlspecialchars($name, ENT_QUOTES)."' {$requiredAttr} placeholder='".htmlspecialchars($ph, ENT_QUOTES)."' style='{$base}'>";
    }

    echo "</div></div>";
}
elseif ($type == 'button') {
  $text   = (string)($el->btnText ?? 'Kliknij');
$action = (string)($el->btnAction ?? 'link');
$url    = (string)($el->btnUrl ?? 'https://');
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

  echo "<button type='button' class='sgbtn sgbtn--".htmlspecialchars($preset, ENT_QUOTES)." sgbtn--".htmlspecialchars($size, ENT_QUOTES)."'"
    . " data-action='".htmlspecialchars($action, ENT_QUOTES)."'"
    . " data-url='".htmlspecialchars($url, ENT_QUOTES)."'"
    . " data-target='".htmlspecialchars($target, ENT_QUOTES)."'"
    . " data-scroll-target='".htmlspecialchars($scrollTarget, ENT_QUOTES)."'"
    . " data-scroll-offset='".(int)$scrollOffset."'"
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
      $parts = explode('|', $ln, 2);
      $label = trim($parts[0] ?? 'Link');
      $href  = trim($parts[1] ?? '#');
      $items[] = ['label'=>$label, 'href'=>$href];
    }
    if (!$items) $items = [['label'=>'Home','href'=>'?page=home']];

    $idSafe = preg_replace('/[^a-zA-Z0-9_-]/', '_', (string)$el['id']);
    $cls = "sgnav_" . $idSafe;

    $orientation = (string)($el->navOrientation ?? 'horizontal');
    $align = (string)($el->navAlign ?? 'left');
    $gap = (int)($el->navGap ?? 10);
    $pad = (int)($el->navPad ?? 10);

    $lpX = (int)($el->navLinkPadX ?? 12);
    $lpY = (int)($el->navLinkPadY ?? 8);
    $lr  = (int)($el->navLinkRadius ?? 8);
    $underline = ((string)($el->navUnderline ?? '0') === '1') ? 'underline' : 'none';

    $linkColor = (string)($el->navLinkColor ?? '#ffffff');
    $hoverBg = (string)($el->navHoverBg ?? 'rgba(255,255,255,0.12)');
    $hoverColor = (string)($el->navHoverColor ?? '#ffffff');
    $activeBg = (string)($el->navActiveBg ?? 'rgba(255,255,255,0.18)');
    $activeColor = (string)($el->navActiveColor ?? '#ffffff');

    $activeMode = (string)($el->navActiveMode ?? 'query_page');

    $flexDir = ($orientation === 'vertical') ? 'column' : 'row';
    $justify = ($align === 'center') ? 'center' : (($align === 'right') ? 'flex-end' : 'flex-start');
    $alignItems = ($orientation === 'vertical') ? $justify : 'center';

    echo "<style>
      .{$cls}{
        width:100%; height:100%;
        box-sizing:border-box;
        padding:{$pad}px;
        display:flex;
        flex-direction:{$flexDir};
        justify-content:{$justify};
        align-items:{$alignItems};
        gap:{$gap}px;
      }
      .{$cls} a,
      .{$cls} a:visited{
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
        text-decoration:{$underline};
        background:transparent;
        white-space:nowrap;
        border:1px solid rgba(255,255,255,0.08);
        box-shadow:0 6px 14px rgba(0,0,0,0.10);
        transition:background .15s ease, color .15s ease, transform .12s ease;
      }
      .{$cls} a:hover{
        background:".htmlspecialchars($hoverBg, ENT_QUOTES).";
        color:".htmlspecialchars($hoverColor, ENT_QUOTES).";
        transform:translateY(-1px);
      }
      .{$cls} a.active{
        background:".htmlspecialchars($activeBg, ENT_QUOTES).";
        color:".htmlspecialchars($activeColor, ENT_QUOTES).";
      }
    </style>";

    echo "<nav class='{$cls}' data-active-mode='".htmlspecialchars($activeMode, ENT_QUOTES)."'>";
    foreach ($items as $it) {
      echo "<a href='".htmlspecialchars($it['href'], ENT_QUOTES)."'>".htmlspecialchars($it['label'])."</a>";
    }
    echo "</nav>";

    echo "<script>(function(){
      try{
        var nav=document.querySelector('nav.{$cls}'); if(!nav) return;
        var mode=nav.getAttribute('data-active-mode')||'none';
        var links=nav.querySelectorAll('a');
        links.forEach(a=>a.classList.remove('active'));
        if(mode==='query_page'){
          var sp=new URLSearchParams(location.search||'');
          var page=sp.get('page')||'';
          if(!page) return;
          links.forEach(function(a){
            var m=(a.getAttribute('href')||'').match(/[?&]page=([^&]+)/i);
            if(m && m[1]===page) a.classList.add('active');
          });
        }else if(mode==='url'){
          var cur=location.pathname+location.search;
          links.forEach(function(a){
            var h=a.getAttribute('href')||'';
            if(h && (h===cur || cur.indexOf(h)!==-1)) a.classList.add('active');
          });
        }
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
elseif ($type == 'sidescroll') {
  $mode = (string)($el->scrollTargetMode ?? 'page');
  $tid  = (string)($el->scrollTargetId ?? '');
  $pin  = (string)($el->scrollPinMode ?? 'fixed');
  $side = (string)($el->scrollSide ?? 'right');
  $top  = (int)($el->scrollOffsetTop ?? 120);
  $off  = (int)($el->scrollOffsetSide ?? 16);

$hRaw = (string)($el->scrollHeight ?? '260');
$h = ctype_digit($hRaw) ? ($hRaw.'px') : $hRaw;

  $trackW = (string)($el->scrollTrackW ?? '10');
  $thumbH = (string)($el->scrollThumbH ?? '64');
  $val = (string)($el->scrollValue ?? '0');
  $tcol = (string)($el->scrollTrackColor ?? '#e2e8f0');
  $thcol = (string)($el->scrollThumbColor ?? '#64748b');
  $rad = (string)($el->scrollRadius ?? '999');

  
  echo "<div class='sgss-control-runtime'
    data-scroll-target-mode='".htmlspecialchars($mode, ENT_QUOTES)."'
    data-scroll-target-id='".htmlspecialchars($tid, ENT_QUOTES)."'
    data-scroll-pin-mode='".htmlspecialchars($pin, ENT_QUOTES)."'
    data-scroll-side='".htmlspecialchars($side, ENT_QUOTES)."'
    data-scroll-offset-top='{$top}'
    data-scroll-offset-side='{$off}'
    data-scroll-height='".htmlspecialchars($h, ENT_QUOTES)."'
    data-scroll-track-w='".htmlspecialchars($trackW, ENT_QUOTES)."'
    data-scroll-thumb-h='".htmlspecialchars($thumbH, ENT_QUOTES)."'
    data-scroll-value='".htmlspecialchars($val, ENT_QUOTES)."'
    data-scroll-track-color='".htmlspecialchars($tcol, ENT_QUOTES)."'
    data-scroll-thumb-color='".htmlspecialchars($thcol, ENT_QUOTES)."'
    data-scroll-radius='".htmlspecialchars($rad, ENT_QUOTES)."'
    style=\"position:".($pin==='fixed'?'fixed':'absolute')."; top:{$top}px; {$side}:{$off}px; height:{$h}; width:28px; pointer-events:auto;\">
      <div class='sgss-control' style='width:100%; height:100%;'>
        <div class='sgss-track'><div class='sgss-thumb'></div></div>
      </div>
  </div>";
}

    else {
        echo html_entity_decode((string)$el->content);
    }

    if (isset($el->children->element)) {
        foreach ($el->children->element as $child) { renderElement($child); }
    }

    echo "</div>";
}

$xml = file_exists($xmlFile) ? simplexml_load_file($xmlFile) : null;
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
    .page-element div, .page-element p { margin: 0 !important; padding: 0 !important; }
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
  user-select:none;
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

/* rozmiary */
.sgbtn--sm{ padding:8px 10px; font-size:12px; }
.sgbtn--md{ padding:10px 12px; font-size:13px; }
.sgbtn--lg{ padding:12px 14px; font-size:15px; }

/* ripple */
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

  </style>
</head>
<body>
<?php
if ($xml && (isset($xml->element) || count($xml->element) > 0)) {
  foreach ($xml->element as $el) { renderElement($el); }
}
?>

<script>
document.addEventListener('DOMContentLoaded', () => {
  let maxBottom = 0;

  document.querySelectorAll('.page-element').forEach(el => {
    const st = getComputedStyle(el);
    if (st.position === 'fixed') return;               
    if (el.dataset.type === 'sidescroll') return;      

    const bottom = el.offsetTop + el.offsetHeight;
    if (bottom > maxBottom) maxBottom = bottom;
  });

  document.body.style.minHeight = (maxBottom + 80) + 'px';
});
</script>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const footers = Array.from(document.querySelectorAll('[data-footer="1"]'));

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

  if (padTop) document.body.style.paddingTop = padTop + 'px';
  if (padBottom) document.body.style.paddingBottom = padBottom + 'px';
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
      if (!url) return;

      if (target === '_blank') window.open(url, '_blank', 'noopener,noreferrer');
      else window.location.href = url;
      return;
    }

    if (action === 'scroll') {
      const target = (btn.dataset.scrollTarget || '').trim();
      const offset = parseInt(btn.dataset.scrollOffset || '0', 10) || 0;

      const el = resolveTarget(target);
      if (!el) return;

      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });

      setTimeout(() => flash(el), 350);
      return;
    }
  });
})();
</script>
<script src="sg_calendar.js?v=1"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sg-calendar-runtime[data-type="calendar"]').forEach((el) => {
    if (window.updateCalendarVisuals) window.updateCalendarVisuals(el);
  });
});
</script>




<script src="sg_sidescroll.js?v=1"></script>
<script src="sg_footer.js?v=2"></script>


</body>
</html>
