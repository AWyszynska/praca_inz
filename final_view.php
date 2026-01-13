<?php
$xmlFile = 'generated_page.xml';

function renderElement($el) {
    $type = (string)$el['type'];

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

    $style = "position: absolute; " .
             "left: " . (int)$el->x . "px; " .
             "top: " . (int)$el->y . "px; " .
             "width: {$el->w}; " .
             "height: {$el->h}; " .
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
             "white-space: pre-wrap; " .
             "overflow: visible; " .
             "padding: {$padding};";

    echo "<div class='page-element' data-id='".htmlspecialchars((string)$el['id'], ENT_QUOTES)."' data-type='".htmlspecialchars($type, ENT_QUOTES)."' style='{$style}'>";


    if ($type == 'image') {

        echo "<img src='" . html_entity_decode((string)$el->content) . "' style='width:100%; height:100%; object-fit: cover; display:block;'>";
    }
    elseif ($type == 'form') {
        $fType     = (string)$el->formType;
        $label     = (string)$el->label;
        $options   = explode(',', (string)$el->options);
        $accent    = (string)$el->accentColor;
        $fontColor = (string)$el->color;

        if (!empty($label)) {
            $labelStyle = ($fType === 'text') ? "margin-bottom:3px;" : "font-weight:bold; margin-bottom:5px;";
            echo "<div style='{$labelStyle} font-size:inherit; color:{$fontColor};'>".htmlspecialchars($label)."</div>";
        }

        if ($fType === 'text') {
            echo "<input type='text' placeholder='Wpisz odpowiedź...' style='width: 180px; font-family: inherit; font-size:inherit; color:{$fontColor}; padding:4px; border:1px solid #ccc; border-radius:4px; display:block; outline:none; box-sizing: border-box;'>";
        } else {
            $inputType = ($fType === 'checkbox') ? 'checkbox' : 'radio';
            foreach ($options as $opt) {
                if (trim($opt) === "") continue;
                echo "<div style='margin-bottom:2px;'>";
                echo "<label style='font-size:inherit; font-family: inherit; color:{$fontColor}; cursor:pointer; display:flex; align-items:center; gap:5px;'>";
                echo "<input type='{$inputType}' name='form_{$el['id']}' style='accent-color:{$accent}; margin: 0; width: 13px; height: 13px;'> ";
                echo "<span>" . htmlspecialchars(trim($opt)) . "</span>";
                echo "</label></div>";
            }
        }
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

<script src="sg_sidescroll.js?v=1"></script>


</body>
</html>
