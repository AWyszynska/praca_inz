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
        display:inline-flex; align-items:center; justify-content:center; gap:8px;
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
        letter-spacing: var(--sgbtn-letter, 0px);
        text-align: var(--sgbtn-align, center);
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

      .sgbtn__icon{ display:inline-flex; align-items:center; justify-content:center; font-size: 1.05em; line-height:1; }
      .sgbtn__text{ display:inline-block; overflow:hidden; text-overflow:ellipsis; }

      .sgbtn--sm{ --sgbtn-pad-y: 8px;  --sgbtn-pad-x: 10px; font-size: 12px; }
      .sgbtn--md{ --sgbtn-pad-y: 10px; --sgbtn-pad-x: 12px; font-size: 13px; }
      .sgbtn--lg{ --sgbtn-pad-y: 12px; --sgbtn-pad-x: 14px; font-size: 14px; }

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

    el.dataset.btnPreset = el.dataset.btnPreset || "primary";
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
    el.dataset.btnWeight = el.dataset.btnWeight || "600";
    el.dataset.btnAlign = el.dataset.btnAlign || "center";
    el.dataset.btnUpper = el.dataset.btnUpper || "0";
    el.dataset.btnLetter = el.dataset.btnLetter || "0";
    el.dataset.btnShadow = el.dataset.btnShadow || "soft";

    el.dataset.btnGradient = el.dataset.btnGradient || "0";
    el.dataset.btnGradFrom = el.dataset.btnGradFrom || el.dataset.btnBg || "#156fe5";
    el.dataset.btnGradTo = el.dataset.btnGradTo || "#22c55e";
    el.dataset.btnGradAngle = el.dataset.btnGradAngle || "135";
    el.dataset.btnTitle = el.dataset.btnTitle || "";
    el.dataset.btnAria = el.dataset.btnAria || "";
    el.dataset.btnType = el.dataset.btnType || "button";
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

  function getHost(el) {
    let host = el.querySelector(":scope > .sgbtn-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "sgbtn-host";
      el.insertBefore(host, el.firstChild);
    }
    return host;
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
      if (pos === "right") { btn.appendChild(t); btn.appendChild(i); }
      else { btn.appendChild(i); btn.appendChild(t); }
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
  btn.style.setProperty('--sgbtn-letter', letter + 'px');

  btn.style.textTransform = (el.dataset.btnUpper === '1') ? 'uppercase' : 'none';
  btn.dataset.grad = (el.dataset.btnGradient === '1') ? '1' : '0';

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

    const b = el.querySelector(".sgbtn-host button.sgbtn");
    if (!b) return;

    p.className = b.className;
    p.style.cssText = b.style.cssText;
    p.innerHTML = b.innerHTML;
    p.disabled = (el.dataset.btnDisabled === "1");
    p.style.pointerEvents = "auto";
    p.style.cursor = "pointer";
  }

  function syncButtonTargetButtons(el) {
    const openBtn = $("btn-open-as-target");
    const closeBtn = $("btn-close-target");
    const state = $("btn-target-state");
    if (!openBtn || !closeBtn) return;

    const isOpen = (typeof window.activeContainer !== "undefined" && window.activeContainer === el);

    openBtn.disabled = false;
    closeBtn.disabled = !isOpen;
    openBtn.textContent = isOpen ? "✅ Guzik jest otwarty" : "🎯 Otwórz (dodawaj do guzika)";

    if (state) state.innerHTML = isOpen
      ? "Dodajesz do: <b>Guzik</b>"
      : "Dodajesz do: <b>Główny ekran</b>";
  }

  window.syncButtonTargetButtons = syncButtonTargetButtons;

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

  window.syncButtonInputs = function (el) {
    if (!el) return;
    ensureButtonDefaults(el);

    const setV = (id, v) => { const x = $(id); if (x) x.value = v; };
    const setC = (id, v) => { const x = $(id); if (x) x.checked = v; };

    setV("btn-text", el.dataset.btnText || "Kliknij");
    setV("btn-icon", el.dataset.btnIcon || "");
    setV("btn-icon-pos", el.dataset.btnIconPos || "left");

    setV("btn-action", el.dataset.btnAction || "none");
    setV("btn-url", el.dataset.btnUrl || "https://");
    setV("btn-target", el.dataset.btnTarget || "_blank");
    setV("btn-scroll-target", el.dataset.btnScrollTargetId || "");
    setV("btn-scroll-offset", el.dataset.btnScrollOffset || "0");

    setV("btn-title", el.dataset.btnTitle || "");
    setV("btn-aria", el.dataset.btnAria || "");
    setV("btn-type", el.dataset.btnType || "button");

    setV("btn-preset", el.dataset.btnPreset || "primary");
    setV("btn-size", el.dataset.btnSize || "md");

    setV("btn-w", parseInt(el.style.width, 10) || 180);
    setV("btn-h", parseInt(el.style.height, 10) || 44);

    setV("btn-radius", el.dataset.btnRadius || "10");
    setV("btn-border-w", el.dataset.btnBorderW || "1");

    setV("btn-weight", el.dataset.btnWeight || "600");
    setV("btn-align", el.dataset.btnAlign || "center");

    setC("btn-upper", el.dataset.btnUpper === "1");
    setV("btn-letter", el.dataset.btnLetter || "0");

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

    setV("btn-name", el.dataset.btnName || "");
    setC("btn-disabled", el.dataset.btnDisabled === "1");

    updateActionVisibility();
    updateGradientVisibility();
    applyButtonVisual(el);
    updatePreview(el);
    syncButtonTargetButtons(el);
  };

  function bind() {
    const ids = [
      "btn-text", "btn-icon", "btn-icon-pos",
      "btn-action", "btn-url", "btn-target", "btn-scroll-target", "btn-scroll-offset",
      "btn-title", "btn-aria", "btn-type",
      "btn-preset", "btn-size", "btn-w", "btn-h", "btn-radius", "btn-border-w",
      "btn-weight", "btn-align", "btn-upper", "btn-letter",
      "btn-bg", "btn-color", "btn-border", "btn-hover-bg", "btn-hover-color", "btn-shadow",
      "btn-gradient", "btn-grad-from", "btn-grad-to", "btn-grad-angle",
      "btn-name", "btn-disabled"
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
      e.dataset.btnUrl = v("btn-url");
      e.dataset.btnTarget = v("btn-target");
      e.dataset.btnScrollTargetId = v("btn-scroll-target");
      e.dataset.btnScrollOffset = v("btn-scroll-offset");

      e.dataset.btnTitle = v("btn-title");
      e.dataset.btnAria = v("btn-aria");
      e.dataset.btnType = v("btn-type");

      e.dataset.btnPreset = v("btn-preset");
      e.dataset.btnSize = v("btn-size");

      e.style.width = (parseInt(v("btn-w"), 10) || 180) + "px";
      e.style.height = (parseInt(v("btn-h"), 10) || 44) + "px";

      e.dataset.btnRadius = v("btn-radius");
      e.dataset.btnBorderW = v("btn-border-w");
      e.dataset.btnWeight = v("btn-weight");
      e.dataset.btnAlign = v("btn-align");
      e.dataset.btnUpper = c("btn-upper") ? "1" : "0";
      e.dataset.btnLetter = v("btn-letter");

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

      e.dataset.btnName = v("btn-name");
      e.dataset.btnDisabled = c("btn-disabled") ? "1" : "0";

      updateActionVisibility();
      updateGradientVisibility();
      applyButtonVisual(e);
      updatePreview(e);

      if (typeof refreshLayers === "function") refreshLayers();
    }

    ids.forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", onChange);
      el.addEventListener("change", onChange);
    });

    const openT = $("btn-open-as-target");
    if (openT && openT.dataset.bound !== "1") {
      openT.dataset.bound = "1";
      openT.addEventListener("click", (ev) => {
        ev.preventDefault();
        const el = window.activeElement;
        if (!el || el.dataset.type !== "button") return;
        if (typeof window.setAsTarget === "function") window.setAsTarget(el.dataset.id);
        syncButtonTargetButtons(el);
      });
    }

    const closeT = $("btn-close-target");
    if (closeT && closeT.dataset.bound !== "1") {
      closeT.dataset.bound = "1";
      closeT.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (typeof window.resetToCanvas === "function") window.resetToCanvas();
        const el = window.activeElement;
        if (el && el.dataset.type === "button") syncButtonTargetButtons(el);
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
