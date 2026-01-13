<?php
$newXmlFile = 'generated_page.xml';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'upload_image') {
    header('Content-Type: application/json; charset=utf-8');

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['ok' => false, 'error' => 'Błąd uploadu lub brak pliku']);
        exit;
    }

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif'
    ];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $_FILES['image']['tmp_name']);
    finfo_close($finfo);

    if (!isset($allowed[$mime])) {
        echo json_encode(['ok' => false, 'error' => 'Nieobsługiwany format obrazu']);
        exit;
    }

    $uploadDirFs = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
    if (!is_dir($uploadDirFs)) {
        mkdir($uploadDirFs, 0777, true);
    }

    $ext  = $allowed[$mime];
    $name = 'img_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;

    $destFs  = $uploadDirFs . DIRECTORY_SEPARATOR . $name;
    $destUrl = 'uploads/' . $name;

    if (!move_uploaded_file($_FILES['image']['tmp_name'], $destFs)) {
        echo json_encode(['ok' => false, 'error' => 'Nie udało się zapisać pliku na serwerze']);
        exit;
    }

    echo json_encode(['ok' => true, 'url' => $destUrl]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'generate_xml') {
    $elements = json_decode($_POST['elements'], true);
    $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><customPage></customPage>');
    $xml->addChild('generatedAt', date('Y-m-d H:i:s'));
    
    if (!empty($elements)) {
        function saveRecursive($items, $xmlNode) {
            foreach ($items as $item) {
                $el = $xmlNode->addChild('element');
                $el->addAttribute('id', $item['id']);
                $el->addAttribute('type', $item['type']);
                $el->addChild('x', $item['x']);
                $el->addChild('y', $item['y']);
                $el->addChild('w', $item['w']);
                $el->addChild('h', $item['h']);
                $el->addChild('content', htmlspecialchars($item['content']));
                $el->addChild('color', $item['color']);
                $el->addChild('bg', $item['bg']);
                $el->addChild('fontSize', $item['fontSize']);
                $el->addChild('fontFamily', $item['fontFamily']); 
                $el->addChild('fontWeight', $item['fontWeight'] ?? '400');
                $el->addChild('fontStyle', $item['fontStyle'] ?? 'normal');
                $el->addChild('textDecoration', $item['textDecoration'] ?? 'none');
                $el->addChild('textAlign', $item['textAlign'] ?? 'left');
                $el->addChild('lineHeight', $item['lineHeight'] ?? '1.2');
                $el->addChild('letterSpacing', $item['letterSpacing'] ?? 'normal');
                $el->addChild('textTransform', $item['textTransform'] ?? 'none');
                $el->addChild('padding', $item['padding'] ?? '0px');
                $el->addChild('border', $item['border']);
                $el->addChild('zIndex', $item['zIndex']);
                $el->addChild('borderRadius', $item['borderRadius'] ?? '0px');
                $el->addChild('boxShadow', $item['boxShadow'] ?? 'none');
                $el->addChild('opacity', $item['opacity'] ?? '1');
                $el->addChild('backdropFilter', $item['backdropFilter'] ?? 'none');
                $el->addChild('formType', $item['formType'] ?? '');
                $el->addChild('label', $item['label'] ?? '');
                $el->addChild('options', $item['options'] ?? '');
                $el->addChild('accentColor', $item['accentColor'] ?? '');
                $el->addChild('sliderLabel', $item['sliderLabel'] ?? '');
                $el->addChild('sliderUnit', $item['sliderUnit'] ?? '');
                $el->addChild('sliderMin', $item['sliderMin'] ?? '0');
                $el->addChild('sliderMax', $item['sliderMax'] ?? '100');
                $el->addChild('sliderStep', $item['sliderStep'] ?? '1');
                $el->addChild('sliderValue', $item['sliderValue'] ?? '50');
                $el->addChild('sliderShowValue', $item['sliderShowValue'] ?? '1');
                $el->addChild('sliderShowMinMax', $item['sliderShowMinMax'] ?? '0');
                $el->addChild('sliderPreset', $item['sliderPreset'] ?? 'soft');
                $el->addChild('sliderTrack', $item['sliderTrack'] ?? '#e2e8f0');
                $el->addChild('sliderFill', $item['sliderFill'] ?? '#156fe5');
                $el->addChild('sliderThumb', $item['sliderThumb'] ?? '#156fe5');
                $el->addChild('sliderTrackH', $item['sliderTrackH'] ?? '8');
                $el->addChild('sliderThumbS', $item['sliderThumbS'] ?? '18');
                $el->addChild('scrollTargetMode', $item['scrollTargetMode'] ?? 'page');
                $el->addChild('scrollTargetId', $item['scrollTargetId'] ?? '');
                $el->addChild('scrollPinMode', $item['scrollPinMode'] ?? 'fixed');
                $el->addChild('scrollSide', $item['scrollSide'] ?? 'right');
                $el->addChild('scrollOffsetTop', $item['scrollOffsetTop'] ?? '120');
                $el->addChild('scrollOffsetSide', $item['scrollOffsetSide'] ?? '16');
                $el->addChild('scrollHeight', $item['scrollHeight'] ?? '260');
                $el->addChild('scrollTrackW', $item['scrollTrackW'] ?? '10');
                $el->addChild('scrollThumbH', $item['scrollThumbH'] ?? '64');
                $el->addChild('scrollValue', $item['scrollValue'] ?? '0');
                $el->addChild('scrollTrackColor', $item['scrollTrackColor'] ?? '#e2e8f0');
                $el->addChild('scrollThumbColor', $item['scrollThumbColor'] ?? '#64748b');
                $el->addChild('scrollRadius', $item['scrollRadius'] ?? '999');

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
    .canvas-element.active { outline: 2px dashed #156fe5 !important; background: rgba(21, 111, 229, 0.05); }
    
    .type-text { white-space: pre-wrap; display: inline-block; width: fit-content; line-height: 1.2; min-width: 10px; vertical-align: top; }
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

        <button id="generate-btn" class="btn btn-save">ZAPISZ ZMIANY W XML</button>

        <div id="hidden-tools" style="margin-top:15px; border-top: 2px solid #f1f5f9;">
            <div id="text-edit-section" style="display:none;">
                <label>Kolor czcionki:</label>
                <input type="color" id="prop-color">
                <label>Rozmiar (px):</label>
                <input type="number" id="prop-size" value="20">
                <?php include 'font_manager.php'; ?>
            </div>
            <?php include 'block_manager.php'; ?>
            <?php include 'image_manager.php'; ?>
            <?php include 'ankieta.php'; ?>
            <?php include 'slider_manager.php'; ?>
            <?php include 'sidescroll_manager.php'; ?>


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
    if (el && el.dataset.type === 'block') {
        if (activeContainer === el) {
            resetToCanvas();
        } else {
            activeContainer = el;
            const display = document.getElementById('current-target-display');
            if(display) display.innerText = "Ramka (" + id.slice(-4) + ")";

            if (activeElement && activeElement !== el) {
                if (confirm("Czy przenieść zaznaczony element do tej ramki?")) {
                    nestElement(activeElement.dataset.id, el.dataset.id);
                }
            }
        }
        refreshLayers();
    }
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

                const targetBtn = el.dataset.type === 'block' ? 
                    `<button class="layer-btn-target" onclick="event.stopPropagation(); setAsTarget('${el.dataset.id}')">🎯 OTWÓRZ TĄ WARSTWĘ</button>` : '';

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


    if (type === 'form') {
        document.getElementById('form-type-select').value = el.dataset.formType || "text";
        document.getElementById('form-label-text').value = el.dataset.label || "";
        document.getElementById('form-options-list').value = el.dataset.options || "";
        document.getElementById('form-font-size').value = parseInt(el.style.fontSize) || 16;
        document.getElementById('form-options-container').style.display = (el.dataset.formType === 'text') ? 'none' : 'block';
    } else if (type === 'image') {
        document.getElementById('img-width').value = parseInt(el.style.width) || 200;
        document.getElementById('img-height').value = parseInt(el.style.height) || 0;
        document.getElementById('img-radius').value = parseInt(el.style.borderRadius) || 0;
        document.getElementById('img-opacity').value = (parseFloat(el.style.opacity) || 1) * 100;
    } else if (type === 'block') {
    if (typeof syncBlockInputs === "function") syncBlockInputs(el);
    } else if (type === 'text') {
        document.getElementById('prop-size').value = parseInt(el.style.fontSize) || 20;
        document.getElementById('prop-color').value = rgbToHex(el.style.color);
        if (typeof updateTextToolbarState === "function") updateTextToolbarState();

    }
     else if (type === 'slider') {
  if (typeof syncSliderInputs === "function") syncSliderInputs(el);
}

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

document.getElementById('add-form-btn').onclick = () => { addMode = 'form'; }; 
document.getElementById('add-sidescroll-btn').onclick = () => { addMode = 'sidescroll'; };

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
  const cs = window.getComputedStyle(el);

  const children = [];
  Array.from(el.children).forEach(child => {
    if (child.classList.contains('canvas-element')) children.push(getElementData(child));
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
    children: children
  };
}


    document.getElementById('generate-btn').onclick = () => {
        const elementsData = [];
        Array.from(canvas.children).forEach(el => { if(el.classList.contains('canvas-element')) elementsData.push(getElementData(el)); });
        const fd = new FormData();
        fd.append('action', 'generate_xml');
        fd.append('elements', JSON.stringify(elementsData));
        fetch('super_generator.php', { method: 'POST', body: fd }).then(res => res.text()).then(data => alert(data));
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
        if(!rgb || rgb.startsWith('#')) return rgb || "#ffffff";
        const vals = rgb.match(/\d+/g);
        return "#" + vals.slice(0,3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
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

document.getElementById('add-image-btn').onclick = () => document.getElementById('image-upload-input').click();

document.getElementById('image-upload-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('action', 'upload_image');
    fd.append('image', file);

    const res = await fetch('super_generator.php', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.ok) {
        createImageElement(data.url); 
    } else {
        alert(data.error || 'Błąd uploadu');
    }

    e.target.value = ""; 
};


function createImageElement(src) {
    zCounter++;
    const div = document.createElement('div');
    div.className = 'canvas-element type-image';
    div.dataset.id = 'img_' + Date.now();
    div.dataset.type = 'image';
    div.style.zIndex = zCounter;

    const img = document.createElement('img');
    img.src = src;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.display = "block";
    img.style.pointerEvents = "none";
    div.appendChild(img);

    div.style.width = "200px";
    div.style.height = "auto";

    div.style.left = "100px";
    div.style.top = "100px";

    setupElementMovement(div, 'image');

    activeContainer.appendChild(div);
    selectElement(div);
    refreshLayers();
}

document.getElementById('img-width').oninput = (e) => { if(activeElement) activeElement.style.width = e.target.value + 'px'; };
document.getElementById('img-height').oninput = (e) => { if(activeElement) activeElement.style.height = e.target.value + 'px'; };
document.getElementById('img-radius').oninput = (e) => { if(activeElement) activeElement.style.borderRadius = e.target.value + 'px'; };
document.getElementById('img-shadow').oninput = (e) => { if(activeElement) activeElement.style.boxShadow = `0 0 ${e.target.value}px rgba(0,0,0,0.5)`; };
document.getElementById('img-opacity').oninput = (e) => { if(activeElement) activeElement.style.opacity = e.target.value / 100; };
document.getElementById('img-border-width').oninput = (e) => { if(activeElement) activeElement.style.borderWidth = e.target.value + 'px'; activeElement.style.borderStyle = "solid"; };
document.getElementById('img-border-color').oninput = (e) => { if(activeElement) activeElement.style.borderColor = e.target.value; };

function createFormElement(x, y) {
    zCounter++;
    const div = document.createElement('div');
    div.className = 'canvas-element type-form';
    div.dataset.id = 'form_' + Date.now();
    div.dataset.type = 'form';
    div.dataset.formType = 'text';
    div.dataset.label = "";
    div.dataset.options = "";

    div.dataset.accentColor = "#156fe5";
    div.style.fontSize = "16px";
    div.style.zIndex = zCounter;

    const rect = activeContainer.getBoundingClientRect();
    div.style.left = (x - rect.left) + 'px';
    div.style.top  = (y - rect.top) + 'px';
    div.style.padding = "5px";

    updateFormVisuals(div);

    setupElementMovement(div, 'form');

    activeContainer.appendChild(div);
    selectElement(div);
    refreshLayers();
}


function updateFormVisuals(el) {
    const type = el.dataset.formType;
    const label = el.dataset.label || "";
    const fontSize = el.style.fontSize || "16px";
    const accentColor = el.dataset.accentColor || "#156fe5";
    const fontColor = el.style.color || "#000000"; 

    let html = "";
    if (label !== "") {
        const labelStyle = (type === 'text') ? "margin-bottom:3px;" : "font-weight:bold; margin-bottom:5px;";
        html += `<div style="${labelStyle} font-size:${fontSize}; color:${fontColor};">${label}</div>`;
    }

    if (type === 'text') {
        html += `<input type="text" placeholder="Wpisz odpowiedź..." style="width:180px; font-size:${fontSize}; color:${fontColor}; padding:4px; border:1px solid #ccc; border-radius:4px; pointer-events:none;">`;
    } else {
        const inputType = (type === 'checkbox') ? 'checkbox' : 'radio';
        const options = (el.dataset.options || "").split(',').filter(o => o.trim() !== "");
        html += options.map(opt => `
            <div style="margin-bottom:2px;">
                <label style="font-size:${fontSize}; color:${fontColor}; display:flex; align-items:center; gap:5px; cursor:pointer;">
                    <input type="${inputType}" style="accent-color:${accentColor}; margin:0; width:13px; height:13px;"> 
                    <span>${opt.trim()}</span>
                </label>
            </div>`).join('');
    }
    el.innerHTML = html;
}

document.getElementById('form-type-select').onchange = (e) => {
    if (activeElement && activeElement.dataset.type === 'form') {
        activeElement.dataset.formType = e.target.value;
        document.getElementById('form-options-container').style.display = (e.target.value === 'text') ? 'none' : 'block';
        updateFormVisuals(activeElement);
    }
};
document.getElementById('form-label-text').oninput = (e) => {
    if (activeElement) {
        activeElement.dataset.label = e.target.value;
        updateFormVisuals(activeElement);
    }
};
document.getElementById('form-options-list').oninput = (e) => {
    if (activeElement) {
        activeElement.dataset.options = e.target.value;
        updateFormVisuals(activeElement);
    }
};
document.getElementById('form-font-size').oninput = (e) => {
    if (activeElement) {
        activeElement.style.fontSize = e.target.value + 'px';
        updateFormVisuals(activeElement);
    }
};
document.getElementById('form-accent-color').oninput = (e) => {
    if (activeElement) {
        activeElement.dataset.accentColor = e.target.value;
        updateFormVisuals(activeElement);
    }
};
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
</script>
<script src="sg_blocks.js?v=2"></script>
<script src="sg_slider.js?v=1"></script>
<script src="sg_sidescroll.js?v=1"></script>

<script src="font.js"></script>
</body>
</html>