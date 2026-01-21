(function () {
  function isFooter(el) {
    return !!el && el.dataset && el.dataset.isFooter === "1";
  }

  function normMode(v) {
    v = String(v || "").toLowerCase().trim();
    return v === "page" ? "page" : "fixed";
  }

  function clamp(n, a, b){ n = parseFloat(n||0); return Math.max(a, Math.min(b, n)); }

  function getPageHeightPx() {
    const num = document.getElementById("page-height-num");
    const rng = document.getElementById("page-height");
    const v = parseInt((num && num.value) || (rng && rng.value) || "0", 10) || 0;
    if (v > 0) return v;

    if (window.canvas) {
      return Math.max(window.canvas.scrollHeight || 0, window.canvas.clientHeight || 0);
    }
    return 0;
  }

  function ensureDefaults(el){
    if (!el.dataset.footerDock) el.dataset.footerDock = "bottom";
    if (!el.dataset.footerMode) el.dataset.footerMode = "fixed";
    if (!el.dataset.footerBottom) el.dataset.footerBottom = "0";
    if (!el.dataset.footerLeft) el.dataset.footerLeft = "0";
    if (!el.dataset.footerBgMode) el.dataset.footerBgMode = "solid";
    if (!el.dataset.footerBgSolid) el.dataset.footerBgSolid = "#111827";
    if (!el.dataset.footerGradFrom) el.dataset.footerGradFrom = "#111827";
    if (!el.dataset.footerGradTo) el.dataset.footerGradTo = "#0f172a";
    if (!el.dataset.footerGradAngle) el.dataset.footerGradAngle = "135";

    if (!el.dataset.footerTextColor) el.dataset.footerTextColor = "#ffffff";
    if (!el.dataset.footerHeight) el.dataset.footerHeight = "80";
    if (!el.dataset.footerPad) el.dataset.footerPad = "16";
    if (!el.dataset.footerRadius) el.dataset.footerRadius = "0";

    if (!el.dataset.footerBorderOn) el.dataset.footerBorderOn = "0";
    if (!el.dataset.footerBorderW) el.dataset.footerBorderW = "1";
    if (!el.dataset.footerBorderColor) el.dataset.footerBorderColor = "#334155";

    if (!el.dataset.footerShadowOn) el.dataset.footerShadowOn = "off";
    if (!el.dataset.footerShadowX) el.dataset.footerShadowX = "0";
    if (!el.dataset.footerShadowY) el.dataset.footerShadowY = "12";
    if (!el.dataset.footerShadowBlur) el.dataset.footerShadowBlur = "30";
    if (!el.dataset.footerShadowSpread) el.dataset.footerShadowSpread = "0";
    if (!el.dataset.footerShadowColor) el.dataset.footerShadowColor = "#000000";
    if (!el.dataset.footerShadowAlpha) el.dataset.footerShadowAlpha = "18";

    if (!el.dataset.footerBlur) el.dataset.footerBlur = "0";
    if (!el.dataset.footerOpacity) el.dataset.footerOpacity = "100";
  }

  function footerInner(el){
    return el.querySelector(".footer-inner") || el.firstElementChild || null;
  }

  function applyFooterVisuals(el){
    if (!el) return;
    ensureDefaults(el);
    const h = clamp(el.dataset.footerHeight, 20, 600);
    el.style.height = h + "px";
    const mode = (el.dataset.footerBgMode || "solid").toLowerCase();
    if (mode === "gradient") {
      const ang = clamp(el.dataset.footerGradAngle, 0, 360);
      const a = el.dataset.footerGradFrom || "#111827";
      const b = el.dataset.footerGradTo || "#0f172a";
      el.style.background = `linear-gradient(${ang}deg, ${a}, ${b})`;
    } else {
      el.style.background = (el.dataset.footerBgSolid || "#111827");
    }
    el.style.color = el.dataset.footerTextColor || "#ffffff";
    const pad = clamp(el.dataset.footerPad, 0, 80);
    const inner = footerInner(el);
    if (inner) inner.style.padding = pad + "px";
    el.style.borderRadius = clamp(el.dataset.footerRadius, 0, 80) + "px";
    const borderOn = (el.dataset.footerBorderOn === "1");
    if (borderOn) {
      const bw = clamp(el.dataset.footerBorderW, 0, 20);
      const bc = el.dataset.footerBorderColor || "#334155";
      el.style.border = `${bw}px solid ${bc}`;
    } else {
      el.style.border = "none";
    }
    const shOn = (el.dataset.footerShadowOn || "off") === "on";
    if (shOn) {
      const x = clamp(el.dataset.footerShadowX, -200, 200);
      const y = clamp(el.dataset.footerShadowY, -200, 200);
      const blur = clamp(el.dataset.footerShadowBlur, 0, 300);
      const spread = clamp(el.dataset.footerShadowSpread, -200, 200);
      const col = el.dataset.footerShadowColor || "#000000";
      const a = clamp(el.dataset.footerShadowAlpha, 0, 100) / 100;
      el.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px rgba(0,0,0,${a})`;
    } else {
      el.style.boxShadow = "none";
    }
    const blur = clamp(el.dataset.footerBlur, 0, 30);
    el.style.backdropFilter = blur > 0 ? `blur(${blur}px)` : "none";
    const op = clamp(el.dataset.footerOpacity, 0, 100) / 100;
    el.style.opacity = String(op);
  }

  function applyFooterStyles(el) {
    if (!el) return;
    ensureDefaults(el);

    const dock = (el.dataset.footerDock || "bottom").toLowerCase() === "top" ? "top" : "bottom";
    el.dataset.footerDock = dock;

    const mode = normMode(el.dataset.footerMode);
    el.dataset.footerMode = mode;

    const off = parseInt(el.dataset.footerBottom || "0", 10) || 0;
    const left = parseInt(el.dataset.footerLeft || "0", 10) || 0;

    el.style.left = left + "px";
    el.style.right = "0px";
    el.style.width = `calc(100% - ${left}px)`;
    el.style.bottom = "";
    el.style.top = "";
    applyFooterVisuals(el);

    if (mode === "fixed") {
      el.style.position = "fixed";
      if (dock === "top") el.style.top = off + "px";
      else el.style.bottom = off + "px";
      return;
    }

    el.style.position = "absolute";
    const pageH = getPageHeightPx();
    const h = Math.max(0, el.offsetHeight || parseInt((el.style.height || "0").replace("px", ""), 10) || 0);

    if (dock === "top") {
      el.style.top = off + "px";
      return;
    }
    const topPx = Math.max(0, pageH - h - off);
    el.style.top = topPx + "px";
  }

  function syncFooterInputs(el) {
    ensureDefaults(el);

    const setVal = (id, v) => { const n = document.getElementById(id); if (n) n.value = String(v ?? ""); };
    const setChk = (id, v) => { const n = document.getElementById(id); if (n) n.checked = !!v; };
    const setDisp = (id, show) => { const n = document.getElementById(id); if (n) n.style.display = show ? "block" : "none"; };

    setVal("footer-dock", el.dataset.footerDock || "bottom");
    setVal("footer-mode", normMode(el.dataset.footerMode || "fixed"));
    setVal("footer-offset", parseInt(el.dataset.footerBottom || "0", 10) || 0);
    setVal("footer-left", parseInt(el.dataset.footerLeft || "0", 10) || 0);

    setVal("footer-bg-mode", el.dataset.footerBgMode || "solid");
    setVal("footer-bg-solid", el.dataset.footerBgSolid || "#111827");
    setVal("footer-grad-from", el.dataset.footerGradFrom || "#111827");
    setVal("footer-grad-to", el.dataset.footerGradTo || "#0f172a");
    setVal("footer-grad-angle", el.dataset.footerGradAngle || "135");

    setVal("footer-text-color", el.dataset.footerTextColor || "#ffffff");
    setVal("footer-height", el.dataset.footerHeight || "80");
    setVal("footer-pad", el.dataset.footerPad || "16");
    setVal("footer-radius", el.dataset.footerRadius || "0");

    const bOn = (el.dataset.footerBorderOn === "1");
    setChk("footer-border-on", bOn);
    setVal("footer-border-w", el.dataset.footerBorderW || "1");
    setVal("footer-border-color", el.dataset.footerBorderColor || "#334155");
    setDisp("footer-border-wrap", bOn);

    setVal("footer-shadow-on", el.dataset.footerShadowOn || "off");
    const shOn = (el.dataset.footerShadowOn === "on");
    setDisp("footer-shadow-wrap", shOn);
    setVal("footer-shadow-x", el.dataset.footerShadowX || "0");
    setVal("footer-shadow-y", el.dataset.footerShadowY || "12");
    setVal("footer-shadow-blur", el.dataset.footerShadowBlur || "30");
    setVal("footer-shadow-spread", el.dataset.footerShadowSpread || "0");
    setVal("footer-shadow-color", el.dataset.footerShadowColor || "#000000");
    setVal("footer-shadow-alpha", el.dataset.footerShadowAlpha || "18");

    setVal("footer-blur", el.dataset.footerBlur || "0");
    setVal("footer-opacity", el.dataset.footerOpacity || "100");

    const bgMode = (el.dataset.footerBgMode || "solid") === "gradient";
    setDisp("footer-bg-solid-wrap", !bgMode);
    setDisp("footer-bg-grad-wrap", bgMode);
  }

  function showFooterPanel(show) {
    const sec = document.getElementById("footer-edit-section");
    if (sec) sec.style.display = show ? "block" : "none";
  }

  function syncFooterTargetButtons(el) {
    const openBtn = document.getElementById("footer-open-as-target");
    const closeBtn = document.getElementById("footer-close-target");
    if (!openBtn || !closeBtn) return;

    const isOpen = (typeof window.activeContainer !== "undefined" && window.activeContainer === el);
    openBtn.disabled = false;
    closeBtn.disabled = !isOpen;

    openBtn.textContent = isOpen ? "✅ Stopka jest otwarta" : "🎯 Otwórz (dodawaj do stopki)";
  }

  function findFooter(dock) {
    if (dock === "bottom") {
      return document.querySelector(
        `.canvas-element[data-is-footer="1"][data-footer-dock="bottom"],
         .canvas-element[data-is-footer="1"]:not([data-footer-dock])`
      );
    }
    return document.querySelector(`.canvas-element[data-is-footer="1"][data-footer-dock="${dock}"]`);
  }

  function createFooter(dock) {
    const existing = findFooter(dock);
    if (existing) {
      if (typeof window.selectElement === "function") window.selectElement(existing);
      return existing;
    }

    if (!window.canvas) return null;
    window.zCounter = (window.zCounter || 10) + 1;

    const div = document.createElement("div");
    div.className = "canvas-element type-block";
    div.dataset.id = "footer_" + Date.now();
    div.dataset.type = "block";

    div.dataset.isFooter = "1";
    div.dataset.footerDock = dock;
    div.dataset.footerMode = "fixed";
    div.dataset.footerBottom = "0";
    div.dataset.footerLeft = "0";
    div.dataset.footerBgMode = "solid";
    div.dataset.footerBgSolid = "#111827";
    div.dataset.footerGradFrom = "#111827";
    div.dataset.footerGradTo = "#0f172a";
    div.dataset.footerGradAngle = "135";
    div.dataset.footerTextColor = "#ffffff";
    div.dataset.footerHeight = "80";
    div.dataset.footerPad = "16";
    div.dataset.footerRadius = "0";
    div.dataset.footerBorderOn = "0";
    div.dataset.footerBorderW = "1";
    div.dataset.footerBorderColor = "#334155";
    div.dataset.footerShadowOn = "off";
    div.dataset.footerShadowX = "0";
    div.dataset.footerShadowY = "12";
    div.dataset.footerShadowBlur = "30";
    div.dataset.footerShadowSpread = "0";
    div.dataset.footerShadowColor = "#000000";
    div.dataset.footerShadowAlpha = "18";
    div.dataset.footerBlur = "0";
    div.dataset.footerOpacity = "100";

    div.style.zIndex = window.zCounter;
    div.style.boxSizing = "border-box";

    div.innerHTML = `<div class="footer-inner" style="font-weight:600;">
      Stopka (${dock === "top" ? "góra" : "dół"}) - kliknij aby edytować
    </div>`;

    applyFooterStyles(div);

    if (typeof window.setupElementMovement === "function") window.setupElementMovement(div, "block");
    window.canvas.appendChild(div);

    if (typeof window.selectElement === "function") window.selectElement(div);
    if (typeof window.refreshLayers === "function") {
      window.refreshLayers();
      requestAnimationFrame(() => window.refreshLayers());
    }
    return div;
  }

  function bindBtn(id, dock) {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (btn.dataset.footerBound === "1") return;
    btn.dataset.footerBound = "1";
    btn.addEventListener("click", (e) => { e.preventDefault(); createFooter(dock); });
  }

  function reflowPageFooters() {
    document.querySelectorAll('.canvas-element[data-is-footer="1"]').forEach((el) => {
      if (isFooter(el) && normMode(el.dataset.footerMode) === "page") applyFooterStyles(el);
    });
  }

  function bindPageHeightListeners() {
    const a = document.getElementById("page-height");
    const b = document.getElementById("page-height-num");
    [a, b].forEach((inp) => {
      if (!inp) return;
      if (inp.dataset.footerPhBound === "1") return;
      inp.dataset.footerPhBound = "1";
      inp.addEventListener("input", () => reflowPageFooters());
      inp.addEventListener("change", () => reflowPageFooters());
    });
  }

  function initFooterUI() {
    bindBtn("add-footer-bottom-btn", "bottom");
    bindBtn("add-footer-top-btn", "top");
    bindPageHeightListeners();
    hookTargetChange();

    const openBtn = document.getElementById("footer-open-as-target");
    if (openBtn && openBtn.dataset.bound !== "1") {
      openBtn.dataset.bound = "1";
      openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const el = window.activeElement;
        if (el && isFooter(el) && typeof window.setAsTarget === "function") window.setAsTarget(el.dataset.id);
      });
    }

    const closeBtn = document.getElementById("footer-close-target");
    if (closeBtn && closeBtn.dataset.bound !== "1") {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window.resetToCanvas === "function") window.resetToCanvas();
      });
    }
  }
  document.addEventListener('sg:selected', (ev) => {
    const el = ev?.detail?.el;
    if (!el) return;
    if (isFooter(el)) {
      showFooterPanel(true);
      syncFooterInputs(el);
      applyFooterStyles(el);
      syncFooterTargetButtons(el);
    } else {
      showFooterPanel(false);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooterUI);
  } else {
    initFooterUI();
  }
  document.addEventListener("input", (e) => {
    const el = window.activeElement;
    if (!isFooter(el)) return;

    const id = e.target.id;
    if (id === "footer-dock") { el.dataset.footerDock = e.target.value; applyFooterStyles(el); }
    if (id === "footer-mode") { el.dataset.footerMode = normMode(e.target.value); applyFooterStyles(el); }
    if (id === "footer-offset") { el.dataset.footerBottom = String(parseInt(e.target.value || "0", 10) || 0); applyFooterStyles(el); }
    if (id === "footer-left") { el.dataset.footerLeft = String(parseInt(e.target.value || "0", 10) || 0); applyFooterStyles(el); }
    if (id === "footer-bg-mode") {
      el.dataset.footerBgMode = e.target.value;
      syncFooterInputs(el);
      applyFooterStyles(el);
    }
    if (id === "footer-bg-solid") { el.dataset.footerBgSolid = e.target.value; applyFooterStyles(el); }
    if (id === "footer-grad-from") { el.dataset.footerGradFrom = e.target.value; applyFooterStyles(el); }
    if (id === "footer-grad-to") { el.dataset.footerGradTo = e.target.value; applyFooterStyles(el); }
    if (id === "footer-grad-angle") { el.dataset.footerGradAngle = String(parseInt(e.target.value || "135",10) || 135); applyFooterStyles(el); }

    if (id === "footer-text-color") { el.dataset.footerTextColor = e.target.value; applyFooterStyles(el); }
    if (id === "footer-height") { el.dataset.footerHeight = String(parseInt(e.target.value || "80",10) || 80); applyFooterStyles(el); }
    if (id === "footer-pad") { el.dataset.footerPad = String(parseInt(e.target.value || "16",10) || 16); applyFooterStyles(el); }
    if (id === "footer-radius") { el.dataset.footerRadius = String(parseInt(e.target.value || "0",10) || 0); applyFooterStyles(el); }

    if (id === "footer-border-on") {
      el.dataset.footerBorderOn = e.target.checked ? "1" : "0";
      syncFooterInputs(el);
      applyFooterStyles(el);
    }
    if (id === "footer-border-w") { el.dataset.footerBorderW = String(parseInt(e.target.value || "1",10) || 1); applyFooterStyles(el); }
    if (id === "footer-border-color") { el.dataset.footerBorderColor = e.target.value; applyFooterStyles(el); }

    if (id === "footer-shadow-on") { el.dataset.footerShadowOn = e.target.value; syncFooterInputs(el); applyFooterStyles(el); }
    if (id === "footer-shadow-x") { el.dataset.footerShadowX = String(parseInt(e.target.value || "0",10) || 0); applyFooterStyles(el); }
    if (id === "footer-shadow-y") { el.dataset.footerShadowY = String(parseInt(e.target.value || "12",10) || 12); applyFooterStyles(el); }
    if (id === "footer-shadow-blur") { el.dataset.footerShadowBlur = String(parseInt(e.target.value || "30",10) || 30); applyFooterStyles(el); }
    if (id === "footer-shadow-spread") { el.dataset.footerShadowSpread = String(parseInt(e.target.value || "0",10) || 0); applyFooterStyles(el); }
    if (id === "footer-shadow-color") { el.dataset.footerShadowColor = e.target.value; applyFooterStyles(el); }
    if (id === "footer-shadow-alpha") { el.dataset.footerShadowAlpha = String(parseInt(e.target.value || "18",10) || 18); applyFooterStyles(el); }

    if (id === "footer-blur") { el.dataset.footerBlur = String(parseInt(e.target.value || "0",10) || 0); applyFooterStyles(el); }
    if (id === "footer-opacity") { el.dataset.footerOpacity = String(parseInt(e.target.value || "100",10) || 100); applyFooterStyles(el); }
  });

  function hookTargetChange() {
    if (typeof window.setAsTarget === "function" && !window.setAsTarget.__footerUiHooked) {
      const orig = window.setAsTarget;
      window.setAsTarget = function (id) {
        const r = orig(id);
        const ae = window.activeElement;
        if (ae && isFooter(ae)) syncFooterTargetButtons(ae);
        const fb = findFooter("bottom"); if (fb) syncFooterTargetButtons(fb);
        const ft = findFooter("top"); if (ft) syncFooterTargetButtons(ft);
        return r;
      };
      window.setAsTarget.__footerUiHooked = true;
    }

    if (typeof window.resetToCanvas === "function" && !window.resetToCanvas.__footerUiHooked) {
      const origR = window.resetToCanvas;
      window.resetToCanvas = function () {
        const r = origR();
        const ae = window.activeElement;
        if (ae && isFooter(ae)) syncFooterTargetButtons(ae);
        const fb = findFooter("bottom"); if (fb) syncFooterTargetButtons(fb);
        const ft = findFooter("top"); if (ft) syncFooterTargetButtons(ft);
        return r;
      };
      window.resetToCanvas.__footerUiHooked = true;
    }
    window.__footerTargetHooked = true;
  }


  window.applyFooterStyles = applyFooterStyles;
})();
