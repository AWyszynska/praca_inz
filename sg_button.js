(function () {
  const STYLE_ID = "sgbtn-style-runtime";

  const $ = (id) => document.getElementById(id);

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      .sgbtn-host{
        position:absolute; inset:0;
        pointer-events:none;
        z-index:0;
      }

      .sgbtn{
        width:100%; height:100%;
        display:inline-flex; align-items:center; justify-content: var(--sgbtn-justify, center); gap:8px;
        box-sizing:border-box;
        border: var(--sgbtn-border-w, 1px) solid var(--sgbtn-border, #156fe5);
        background: var(--sgbtn-bg, #156fe5);
        color: var(--sgbtn-color, #fff);
        border-radius: var(--sgbtn-radius, 10px);
        box-shadow: var(--sgbtn-shadow, 0 10px 20px rgba(2,6,23,.12));
        cursor:pointer;
        user-select:none;
        padding: var(--sgbtn-pad-y, 10px) var(--sgbtn-pad-x, 12px);
        font-weight: var(--sgbtn-weight, 600);
font-family: var(--sgbtn-font-family, 'Segoe UI', system-ui, -apple-system, sans-serif);
font-style: var(--sgbtn-font-style, normal);
text-decoration: var(--sgbtn-text-decoration, none);
letter-spacing: var(--sgbtn-letter, 0px);
text-align: var(--sgbtn-align, center);
font-size: var(--sgbtn-font-size, 13px);
        line-height: 1.1;
        white-space: nowrap;
        transition: transform .08s ease, background-color .15s ease, color .15s ease,
                    box-shadow .15s ease, border-color .15s ease, opacity .15s ease;
        position:relative;
        overflow:hidden;
      }
      .sgbtn:hover{ background: var(--sgbtn-hover-bg, #0f5bd1); color: var(--sgbtn-hover-color, #fff); }
      .sgbtn:active{ transform: translateY(1px); }
      .sgbtn:focus-visible{ outline: 3px solid rgba(59,130,246,.35); outline-offset:2px; }
      .sgbtn[disabled], .sgbtn[aria-disabled="true"]{ opacity:.55; cursor:not-allowed; pointer-events:none; box-shadow:none; }

.sgbtn__icon{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size: 1.05em;
  line-height:1;
  font-weight: inherit;
  font-style: inherit;
  text-decoration: inherit;
}

.sgbtn__text{
  display:inline-block;
  overflow:hidden;
  text-overflow:ellipsis;
  font-weight: inherit;
  font-style: inherit;
  text-decoration: inherit;
}

      .sgbtn--sm{ --sgbtn-pad-y: 8px;  --sgbtn-pad-x: 10px; }
.sgbtn--md{ --sgbtn-pad-y: 10px; --sgbtn-pad-x: 12px; }
.sgbtn--lg{ --sgbtn-pad-y: 12px; --sgbtn-pad-x: 14px; }

      @media (prefers-reduced-motion: reduce){
        .sgbtn{ transition:none; }
        .sgbtn:active{ transform:none; }
      }

      .sgbtn[data-grad="1"]::before{
        content:"";
        position:absolute; inset:0;
        background: linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.22) 50%, rgba(255,255,255,0) 100%);
        transform: translateX(-120%);
        transition: transform .55s ease;
        pointer-events:none;
      }
      .sgbtn[data-grad="1"]:hover::before{ transform: translateX(120%); }
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
        0%{ box-shadow: var(--sgbtn-shadow, 0 10px 20px rgba(2,6,23,.12)); }
        50%{ box-shadow: 0 0 0 6px rgba(255,255,255,.18), 0 0 18px rgba(255,255,255,.28), var(--sgbtn-shadow, 0 10px 20px rgba(2,6,23,.12)); }
        100%{ box-shadow: var(--sgbtn-shadow, 0 10px 20px rgba(2,6,23,.12)); }
      }
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
      @keyframes sgbtnShake{
        0%{ transform: translateX(0); }
        20%{ transform: translateX(-3px); }
        40%{ transform: translateX(3px); }
        60%{ transform: translateX(-2px); }
        80%{ transform: translateX(2px); }
        100%{ transform: translateX(0); }
      }
    `;
    document.head.appendChild(s);
  }

  function clamp(n, a, b) {
    n = parseFloat(n);
    if (isNaN(n)) n = a;
    return Math.max(a, Math.min(b, n));
  }

  function ensureButtonDefaults(el) {
    el.dataset.btnText = el.dataset.btnText || "Kliknij";
    el.dataset.btnAction = el.dataset.btnAction || "none";

    el.dataset.btnUrl = el.dataset.btnUrl || "https://";
    el.dataset.btnTarget = el.dataset.btnTarget || "_blank";
    el.dataset.btnScrollTargetId = el.dataset.btnScrollTargetId || "";
    el.dataset.btnScrollOffset = el.dataset.btnScrollOffset || "0";
    el.dataset.btnSize = el.dataset.btnSize || "md";
    el.dataset.btnIcon = el.dataset.btnIcon || "";
    el.dataset.btnIconPos = el.dataset.btnIconPos || "left";

    el.dataset.btnBg = el.dataset.btnBg || "#156fe5";
    el.dataset.btnColor = el.dataset.btnColor || "#ffffff";
    el.dataset.btnBorderColor = el.dataset.btnBorderColor || "#156fe5";
    el.dataset.btnHoverBg = el.dataset.btnHoverBg || "#0f5bd1";
    el.dataset.btnHoverColor = el.dataset.btnHoverColor || "#ffffff";

    el.dataset.btnRadius = el.dataset.btnRadius || "10";
    el.dataset.btnBorderW = el.dataset.btnBorderW || "1";
        el.dataset.btnClickEffect = el.dataset.btnClickEffect || "none";
el.dataset.btnWeight = el.dataset.btnWeight || "600";
el.dataset.btnAlign = el.dataset.btnAlign || "center";
el.dataset.btnFontSize = el.dataset.btnFontSize || "13";
el.dataset.btnLetter = el.dataset.btnLetter || "0";
el.dataset.btnShadow = el.dataset.btnShadow || "soft";

el.dataset.btnFontFamily = el.dataset.btnFontFamily || "'Segoe UI', system-ui, -apple-system, sans-serif";
el.dataset.btnFontStyle = el.dataset.btnFontStyle || "normal";
el.dataset.btnTextDecoration = el.dataset.btnTextDecoration || "none";

    el.dataset.btnGradient = el.dataset.btnGradient || "0";
    el.dataset.btnGradFrom = el.dataset.btnGradFrom || el.dataset.btnBg || "#156fe5";
    el.dataset.btnGradTo = el.dataset.btnGradTo || "#22c55e";
    el.dataset.btnGradAngle = el.dataset.btnGradAngle || "135";

    if (!el.dataset.htmlId) el.dataset.htmlId = "sgbtn_" + (el.dataset.id || Date.now());
    if (!el.dataset.htmlClass) el.dataset.htmlClass = "sgbtn-wrap";
  }

  function getShadowCss(name) {
    if (name === "strong") return "0 18px 40px rgba(2,6,23,.22)";
    if (name === "none") return "none";
    return "0 10px 20px rgba(2,6,23,.12)";
  }

  function computeBg(el, mode) {
    const grad = el.dataset.btnGradient === "1";
    if (!grad) return mode === "hover" ? (el.dataset.btnHoverBg || el.dataset.btnBg) : (el.dataset.btnBg || "#156fe5");

    const ang = clamp(el.dataset.btnGradAngle || 135, 0, 360);
    const a = mode === "hover"
      ? (el.dataset.btnHoverBg || el.dataset.btnGradFrom || el.dataset.btnBg)
      : (el.dataset.btnGradFrom || el.dataset.btnBg);

    const b = el.dataset.btnGradTo || "#22c55e";
    return `linear-gradient(${ang}deg, ${a}, ${b})`;
  }


function buildButtonContent(btn, el) {
  const text = el.dataset.btnText || "Kliknij";
  const icon = (el.dataset.btnIcon || "").trim();
  const pos = el.dataset.btnIconPos || "left";

  btn.innerHTML = "";

  const t = document.createElement("span");
  t.className = "sgbtn__text";
  t.textContent = text;

  if (icon) {
    const i = document.createElement("span");
    i.className = "sgbtn__icon";
    i.textContent = icon;

    if (pos === "right") {
      btn.appendChild(t);
      btn.appendChild(i);
    } else {
      btn.appendChild(i);
      btn.appendChild(t);
    }
  } else {
    btn.appendChild(t);
  }
}

function applyButtonVisual(el){
  injectStyle();
  ensureButtonDefaults(el);
  let wrap = el.querySelector(':scope > .sgbtn-wrap');
  if (!wrap){
    wrap = document.createElement('div');
    wrap.className = 'sgbtn-wrap';
    wrap.style.position = 'absolute';
    wrap.style.inset = '0';
    wrap.style.pointerEvents = 'auto';               
wrap.style.background = 'rgba(0,0,0,0.001)';  
    wrap.style.zIndex = '0';
    el.prepend(wrap);
  }

  let btn = wrap.querySelector('button.sgbtn');
  if (!btn){
    btn = document.createElement('button');
    btn.className = 'sgbtn';
    wrap.appendChild(btn);
  }
  const isBuilder = !!document.getElementById('preview-canvas') || (window.SG_MODE === 'builder');
  btn.style.pointerEvents = isBuilder ? 'none' : 'auto';

  const htmlType = String(el.dataset.btnHtmlType || 'button').toLowerCase();
  btn.type = ['button','submit','reset'].includes(htmlType) ? htmlType : 'button';

  const ariaLabel = String(el.dataset.btnAriaLabel || '').trim();
  if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
  else btn.removeAttribute('aria-label');

  const size = el.dataset.btnSize || 'md';
  const isLoading = (el.dataset.btnLoading === '1');
  const isDisabled = (el.dataset.btnDisabled === '1') || isLoading;

  btn.className = `sgbtn sgbtn--${size}` + (isLoading ? ' sgbtn--loading' : '');
  btn.disabled = isDisabled;
  btn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');

  const bg = computeBg(el, 'base');
  const hoverBg = computeBg(el, 'hover');

  const borderW = clamp(el.dataset.btnBorderW || 1, 0, 6);
  const radius  = clamp(el.dataset.btnRadius || 10, 0, 30);
  const letter  = clamp(el.dataset.btnLetter || 0, 0, 6);
  const fontSize = clamp(el.dataset.btnFontSize || 13, 8, 72);
  btn.style.setProperty('--sgbtn-bg', bg);
  btn.style.setProperty('--sgbtn-color', el.dataset.btnColor || '#fff');
  btn.style.setProperty('--sgbtn-border', el.dataset.btnBorderColor || '#156fe5');
  btn.style.setProperty('--sgbtn-hover-bg', hoverBg);
  btn.style.setProperty('--sgbtn-hover-color', el.dataset.btnHoverColor || '#fff');
  btn.style.setProperty('--sgbtn-radius', radius + 'px');
  btn.style.setProperty('--sgbtn-border-w', borderW + 'px');
  btn.style.setProperty('--sgbtn-shadow', getShadowCss(el.dataset.btnShadow || 'soft'));
  btn.style.setProperty('--sgbtn-weight', el.dataset.btnWeight || '600');
  btn.style.setProperty('--sgbtn-align', el.dataset.btnAlign || 'center');
  btn.style.setProperty('--sgbtn-font-size', fontSize + 'px');
  const align = el.dataset.btnAlign || 'center';
let justify = 'center';

if (align === 'left') justify = 'flex-start';
else if (align === 'right') justify = 'flex-end';
else if (align === 'justify') justify = 'space-between';

btn.style.setProperty('--sgbtn-justify', justify);
  btn.style.setProperty('--sgbtn-letter', letter + 'px');
  btn.style.setProperty('--sgbtn-font-family', el.dataset.btnFontFamily || "'Segoe UI', system-ui, -apple-system, sans-serif");
btn.style.setProperty('--sgbtn-font-style', el.dataset.btnFontStyle || 'normal');
btn.style.setProperty('--sgbtn-text-decoration', el.dataset.btnTextDecoration || 'none');
btn.style.textTransform = 'none';

  btn.dataset.grad = (el.dataset.btnGradient === '1') ? '1' : '0';
  btn.dataset.clickEffect = el.dataset.btnClickEffect || 'none';
  buildButtonContent(btn, el);
  if (!el.style.width) el.style.width = '180px';
  if (!el.style.height) el.style.height = '44px';

  Array.from(el.children).forEach(ch => {
    if (ch === wrap) return;
    if (!ch.style.zIndex) ch.style.zIndex = '2';
  });
}


  function updateActionVisibility() {
    const a = $("btn-action");
    const linkWrap = $("btn-link-wrap");
    const scrollWrap = $("btn-scroll-wrap");
    if (!a || !linkWrap || !scrollWrap) return;

    if (a.value === "link") {
      linkWrap.style.display = "block";
      scrollWrap.style.display = "none";
    } else if (a.value === "scroll") {
      linkWrap.style.display = "none";
      scrollWrap.style.display = "block";
    } else {
      linkWrap.style.display = "none";
      scrollWrap.style.display = "none";
    }
  }

  function updateGradientVisibility() {
    const cb = $("btn-gradient");
    const wrap = $("btn-gradient-wrap");
    if (!cb || !wrap) return;
    wrap.style.display = cb.checked ? "grid" : "none";
  }

  function updatePreview(el) {
    const p = $("btn-preview");
    if (!p || !el) return;

    const b = el.querySelector(".sgbtn-wrap button.sgbtn");
    if (!b) return;

    p.className = b.className;
    p.style.cssText = b.style.cssText;
    p.innerHTML = b.innerHTML;
    p.disabled = (el.dataset.btnDisabled === "1");
    p.style.pointerEvents = "auto";
    p.style.cursor = "pointer";
  }
  function playButtonEffect(btn, effect) {
    if (!btn) return;
    effect = String(effect || "none");

    btn.classList.remove(
      "fx-scale-click",
      "fx-bounce-click",
      "fx-pulse-click",
      "fx-glow-click",
      "fx-shake-click"
    );

    void btn.offsetWidth;

    if (effect === "scale" || effect === "scale-ripple") {
      btn.classList.add("fx-scale-click");
      setTimeout(() => btn.classList.remove("fx-scale-click"), 120);
    }

    if (effect === "bounce") {
      btn.classList.add("fx-bounce-click");
      setTimeout(() => btn.classList.remove("fx-bounce-click"), 420);
    }

    if (effect === "pulse") {
      btn.classList.add("fx-pulse-click");
      setTimeout(() => btn.classList.remove("fx-pulse-click"), 380);
    }

    if (effect === "glow") {
      btn.classList.add("fx-glow-click");
      setTimeout(() => btn.classList.remove("fx-glow-click"), 470);
    }

    if (effect === "shake") {
      btn.classList.add("fx-shake-click");
      setTimeout(() => btn.classList.remove("fx-shake-click"), 380);
    }

    if (effect === "ripple" || effect === "scale-ripple") {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.2;
      const r = document.createElement("span");
      r.className = "sgbtn__ripple";
      r.style.position = "absolute";
      r.style.width = size + "px";
      r.style.height = size + "px";
      r.style.left = (rect.width / 2 - size / 2) + "px";
      r.style.top = (rect.height / 2 - size / 2) + "px";
      r.style.borderRadius = "999px";
      r.style.background = "rgba(255,255,255,.28)";
      r.style.transform = "scale(0)";
      r.style.opacity = "1";
      r.style.pointerEvents = "none";
      r.style.animation = "sgbtnRipple .55s ease-out";
      btn.appendChild(r);
      r.addEventListener("animationend", () => r.remove(), { once: true });
    }
  }

  window.createButtonElement = function (x, y) {
    injectStyle();
    if (typeof zCounter !== "undefined") zCounter++;

    const div = document.createElement("div");
    div.className = "canvas-element type-button";
    div.dataset.id = "el_" + Date.now();
    div.dataset.type = "button";
    div.style.zIndex = (typeof zCounter !== "undefined") ? zCounter : 10;

    ensureButtonDefaults(div);

    const parent = (typeof activeContainer !== "undefined" && activeContainer)
      ? activeContainer
      : document.getElementById("preview-canvas");

    const rect = parent.getBoundingClientRect();
    div.style.left = (x - rect.left) + "px";
    div.style.top = (y - rect.top) + "px";
    div.style.width = "180px";
    div.style.height = "44px";

    applyButtonVisual(div);

    if (typeof setupElementMovement === "function") setupElementMovement(div, "button");
    parent.appendChild(div);

    if (typeof selectElement === "function") selectElement(div);
    if (typeof refreshLayers === "function") refreshLayers();
  };
function setToolActive(id, on) {
  const btn = $(id);
  if (btn) btn.classList.toggle("active", !!on);
}
  window.syncButtonInputs = function (el) {
    if (!el) return;
    ensureButtonDefaults(el);

    const setV = (id, v) => { const x = $(id); if (x) x.value = v; };
    const setC = (id, v) => { const x = $(id); if (x) x.checked = v; };

    setV("btn-text", el.dataset.btnText || "Kliknij");
    setV("btn-icon", el.dataset.btnIcon || "");
    setV("btn-icon-pos", el.dataset.btnIconPos || "left");

    setV("btn-action", el.dataset.btnAction || "none");
    setV("btn-click-effect", el.dataset.btnClickEffect || "none");
    setV("btn-url", el.dataset.btnUrl || "https://");
    setV("btn-target", el.dataset.btnTarget || "_blank");
    setV("btn-scroll-target", el.dataset.btnScrollTargetId || "");
    setV("btn-scroll-offset", el.dataset.btnScrollOffset || "0");


    setV("btn-size", el.dataset.btnSize || "md");

    setV("btn-w", parseInt(el.style.width, 10) || 180);
    setV("btn-h", parseInt(el.style.height, 10) || 44);

    setV("btn-radius", el.dataset.btnRadius || "10");
    setV("btn-border-w", el.dataset.btnBorderW || "1");

    setV("btn-weight", el.dataset.btnWeight || "600");
    setV("btn-align", el.dataset.btnAlign || "center");
    setV("btn-letter", el.dataset.btnLetter || "0");
    setV("btn-font-family", el.dataset.btnFontFamily || "'Segoe UI', system-ui, -apple-system, sans-serif");
    setV("btn-bg", el.dataset.btnBg || "#156fe5");
    setV("btn-color", el.dataset.btnColor || "#ffffff");
    setV("btn-border", el.dataset.btnBorderColor || "#156fe5");
    setV("btn-hover-bg", el.dataset.btnHoverBg || "#0f5bd1");
    setV("btn-hover-color", el.dataset.btnHoverColor || "#ffffff");
    setV("btn-shadow", el.dataset.btnShadow || "soft");

    setC("btn-gradient", el.dataset.btnGradient === "1");
    setV("btn-grad-from", el.dataset.btnGradFrom || (el.dataset.btnBg || "#156fe5"));
    setV("btn-grad-to", el.dataset.btnGradTo || "#22c55e");
    setV("btn-grad-angle", el.dataset.btnGradAngle || "135");

    setC("btn-disabled", el.dataset.btnDisabled === "1");

    updateActionVisibility();
    updateGradientVisibility();
    applyButtonVisual(el);
    updatePreview(el);
    setToolActive("btn-tool-bold", parseInt(el.dataset.btnWeight || "600", 10) >= 700);
setToolActive("btn-tool-italic", el.dataset.btnFontStyle === "italic");
setToolActive("btn-tool-underline", (el.dataset.btnTextDecoration || "").includes("underline"));
setToolActive("btn-tool-strike", (el.dataset.btnTextDecoration || "").includes("line-through"));

setToolActive("btn-tool-align-left", el.dataset.btnAlign === "left");
setToolActive("btn-tool-align-center", el.dataset.btnAlign === "center");
setToolActive("btn-tool-align-right", el.dataset.btnAlign === "right");
setToolActive("btn-tool-align-justify", el.dataset.btnAlign === "justify");
setV("btn-font-size", el.dataset.btnFontSize || "13");
  };

  function bind() {
    const ids = [
      "btn-text", "btn-icon", "btn-icon-pos",
      "btn-action", "btn-click-effect", "btn-url", "btn-target", "btn-scroll-target", "btn-scroll-offset",
       "btn-size", "btn-w", "btn-h", "btn-radius", "btn-border-w",
      "btn-weight","btn-font-size", "btn-align", "btn-letter",
      "btn-font-family",
      "btn-bg", "btn-color", "btn-border", "btn-hover-bg", "btn-hover-color", "btn-shadow",
      "btn-gradient", "btn-grad-from", "btn-grad-to", "btn-grad-angle",
       "btn-disabled"
    ];

    function onChange() {
      const e = window.activeElement;
      if (!e || e.dataset.type !== "button") return;

      const v = (id) => ($(id)?.value ?? "");
      const c = (id) => ($(id)?.checked ?? false);
      e.dataset.btnText = v("btn-text");
      e.dataset.btnIcon = v("btn-icon");
      e.dataset.btnIconPos = v("btn-icon-pos");
e.dataset.btnAction = v("btn-action");
      e.dataset.btnClickEffect = v("btn-click-effect");
      e.dataset.btnUrl = v("btn-url");
      e.dataset.btnTarget = v("btn-target");
      e.dataset.btnScrollTargetId = v("btn-scroll-target");
      e.dataset.btnScrollOffset = v("btn-scroll-offset");


      e.dataset.btnSize = v("btn-size");

      e.style.width = (parseInt(v("btn-w"), 10) || 180) + "px";
      e.style.height = (parseInt(v("btn-h"), 10) || 44) + "px";

      e.dataset.btnRadius = v("btn-radius");
      e.dataset.btnBorderW = v("btn-border-w");
      e.dataset.btnWeight = v("btn-weight");
      e.dataset.btnAlign = v("btn-align");
      e.dataset.btnFontSize = v("btn-font-size");
      e.dataset.btnLetter = v("btn-letter");
e.dataset.btnFontFamily = v("btn-font-family");
      e.dataset.btnBg = v("btn-bg");
      e.dataset.btnColor = v("btn-color");
      e.dataset.btnBorderColor = v("btn-border");
      e.dataset.btnHoverBg = v("btn-hover-bg");
      e.dataset.btnHoverColor = v("btn-hover-color");
      e.dataset.btnShadow = v("btn-shadow");

      e.dataset.btnGradient = c("btn-gradient") ? "1" : "0";
      e.dataset.btnGradFrom = v("btn-grad-from");
      e.dataset.btnGradTo = v("btn-grad-to");
      e.dataset.btnGradAngle = v("btn-grad-angle");
      e.dataset.btnDisabled = c("btn-disabled") ? "1" : "0";

      updateActionVisibility();
      updateGradientVisibility();
      applyButtonVisual(e);
      updatePreview(e);

      if (typeof refreshLayers === "function") refreshLayers();
    }
function getActiveButton() {
  const e = window.activeElement;
  if (!e || e.dataset.type !== "button") return null;
  return e;
}

function refreshButtonEditor() {
  const e = getActiveButton();
  if (!e) return;
  applyButtonVisual(e);
  updatePreview(e);
  if (typeof refreshLayers === "function") refreshLayers();
}

const btnBold = $("btn-tool-bold");
if (btnBold) {
  btnBold.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;

    const current = parseInt(e.dataset.btnWeight || "600", 10) || 600;
    e.dataset.btnWeight = current >= 700 ? "600" : "700";

    window.syncButtonInputs(e);
    refreshButtonEditor();
  });
}

const btnItalic = $("btn-tool-italic");
if (btnItalic) {
  btnItalic.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;
    e.dataset.btnFontStyle = (e.dataset.btnFontStyle === "italic") ? "normal" : "italic";
window.syncButtonInputs(e);
refreshButtonEditor();
  });
}

const btnUnderline = $("btn-tool-underline");
if (btnUnderline) {
  btnUnderline.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;
    const cur = e.dataset.btnTextDecoration || "none";
    e.dataset.btnTextDecoration = cur === "underline" ? "none" : "underline";
    window.syncButtonInputs(e);
    refreshButtonEditor();
  });
}

const btnStrike = $("btn-tool-strike");
if (btnStrike) {
  btnStrike.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;
    const cur = e.dataset.btnTextDecoration || "none";
    e.dataset.btnTextDecoration = cur === "line-through" ? "none" : "line-through";
    window.syncButtonInputs(e);
    refreshButtonEditor();
  });
}

const btnAlignLeft = $("btn-tool-align-left");
if (btnAlignLeft) {
  btnAlignLeft.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;
    e.dataset.btnAlign = "left";
    window.syncButtonInputs(e);
    refreshButtonEditor();
  });
}

const btnAlignCenter = $("btn-tool-align-center");
if (btnAlignCenter) {
  btnAlignCenter.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;
    e.dataset.btnAlign = "center";
    window.syncButtonInputs(e);
    refreshButtonEditor();
  });
}

const btnAlignRight = $("btn-tool-align-right");
if (btnAlignRight) {
  btnAlignRight.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;
    e.dataset.btnAlign = "right";
    window.syncButtonInputs(e);
    refreshButtonEditor();
  });
}

const btnAlignJustify = $("btn-tool-align-justify");
if (btnAlignJustify) {
  btnAlignJustify.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;
    e.dataset.btnAlign = "justify";
    window.syncButtonInputs(e);
    refreshButtonEditor();
  });
}

const btnClear = $("btn-tool-clear-format");
if (btnClear) {
  btnClear.addEventListener("click", () => {
    const e = getActiveButton();
    if (!e) return;

    e.dataset.btnWeight = "600";
    e.dataset.btnAlign = "center";
    e.dataset.btnLetter = "0";
    e.dataset.btnFontFamily = "'Segoe UI', system-ui, -apple-system, sans-serif";
    e.dataset.btnFontStyle = "normal";
    e.dataset.btnTextDecoration = "none";

    window.syncButtonInputs(e);
    refreshButtonEditor();
  });
}
    ids.forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", onChange);
      el.addEventListener("change", onChange);
    });
    const btnPreview = $("btn-preview");
    if (btnPreview) {
      btnPreview.addEventListener("click", () => {
        const e = getActiveButton();
        if (!e) return;
        playButtonEffect(btnPreview, e.dataset.btnClickEffect || "none");
      });
    }


    updateActionVisibility();
    updateGradientVisibility();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  window.updateButtonVisuals = function (el) {
    applyButtonVisual(el);
  };
})();
