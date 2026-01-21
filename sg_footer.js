(function () {
  function isFooter(el) {
    return !!el && el.dataset && el.dataset.isFooter === "1";
  }

  function normMode(v) {
    v = String(v || "").toLowerCase().trim();
    return v === "page" ? "page" : "fixed";
  }

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

  function applyFooterStyles(el) {
    if (!el) return;

    const dock = (el.dataset.footerDock || "bottom").toLowerCase() === "top" ? "top" : "bottom";
    el.dataset.footerDock = dock;

    if (!el.dataset.footerBottom) el.dataset.footerBottom = "0";
    if (!el.dataset.footerLeft) el.dataset.footerLeft = "0";
    if (!el.dataset.footerMode) el.dataset.footerMode = "fixed";

    const mode = normMode(el.dataset.footerMode);
    el.dataset.footerMode = mode;

    const off = parseInt(el.dataset.footerBottom || "0", 10) || 0;
    const left = parseInt(el.dataset.footerLeft || "0", 10) || 0;
    el.style.left = left + "px";
    el.style.right = "0px";
    el.style.width = `calc(100% - ${left}px)`;
    el.style.bottom = "";
    el.style.top = "";

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
    const dockSel = document.getElementById("footer-dock");
    const modeSel = document.getElementById("footer-mode");
    const offInp = document.getElementById("footer-offset");
    const leftInp = document.getElementById("footer-left");
    if (!dockSel || !modeSel || !offInp || !leftInp) return;

    dockSel.value = el.dataset.footerDock || "bottom";
    modeSel.value = normMode(el.dataset.footerMode || "fixed");
    offInp.value = parseInt(el.dataset.footerBottom || "0", 10) || 0;
    leftInp.value = parseInt(el.dataset.footerLeft || "0", 10) || 0;
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
    return document.querySelector(
      `.canvas-element[data-is-footer="1"][data-footer-dock="${dock}"]`
    );
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

    div.style.zIndex = window.zCounter;
    div.style.height = "80px";
    div.style.background = "#111827";
    div.style.backgroundColor = "#111827";
    div.style.color = "#ffffff";
    div.style.border = "none";
    div.style.boxSizing = "border-box";

    div.innerHTML = `<div style="padding:16px; font-weight:600;">
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

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      createFooter(dock);
    });
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

    const old = document.getElementById("add-footer-btn");
    if (old && !old.dataset.footerBound) {
      old.dataset.footerBound = "1";
      old.addEventListener("click", (e) => {
        e.preventDefault();
        createFooter("bottom");
      });
    }

    bindPageHeightListeners();
    hookSelectElement();
    hookGetElementData();
    hookTargetChange();

    let tries = 0;
    const t = setInterval(() => {
      tries++;

      hookSelectElement();
      hookGetElementData();

      if (
        window.selectElement?.__footerHooked &&
        window.getElementData?.__footerHooked &&
        window.__footerTargetHooked
      ) {
        clearInterval(t);
      }

      if (tries >= 100) clearInterval(t);
    }, 100);

    const openBtn = document.getElementById("footer-open-as-target");
    if (openBtn && openBtn.dataset.bound !== "1") {
      openBtn.dataset.bound = "1";
      openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const el = window.activeElement;
        if (el && isFooter(el) && typeof window.setAsTarget === "function") {
          window.setAsTarget(el.dataset.id);
        }
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooterUI);
  } else {
    initFooterUI();
  }

  document.addEventListener("input", (e) => {
    const el = window.activeElement;
    if (!isFooter(el)) return;

    if (e.target.id === "footer-dock") {
      el.dataset.footerDock = e.target.value;
      applyFooterStyles(el);
    }
    if (e.target.id === "footer-mode") {
      el.dataset.footerMode = normMode(e.target.value);
      applyFooterStyles(el);
    }
    if (e.target.id === "footer-offset") {
      el.dataset.footerBottom = String(parseInt(e.target.value || "0", 10) || 0);
      applyFooterStyles(el);
    }
    if (e.target.id === "footer-left") {
      el.dataset.footerLeft = String(parseInt(e.target.value || "0", 10) || 0);
      applyFooterStyles(el);
    }
  });

  function hookSelectElement() {
    if (typeof window.selectElement !== "function") return;
    if (window.selectElement.__footerHooked) return;

    const origSelect = window.selectElement;
    window.selectElement = function (el) {
      const r = origSelect(el);

      if (isFooter(el)) {
        showFooterPanel(true);
        syncFooterInputs(el);
        applyFooterStyles(el);
        syncFooterTargetButtons(el);
      } else {
        showFooterPanel(false);
      }

      return r;
    };

    window.selectElement.__footerHooked = true;
  }

  function hookGetElementData() {
    if (typeof window.getElementData !== "function") return;
    if (window.getElementData.__footerHooked) return;

    const origGet = window.getElementData;
    window.getElementData = function (el) {
      const data = origGet(el);
      if (isFooter(el)) {
        data.isFooter = "1";
        data.footerDock = el.dataset.footerDock || "bottom";
        data.footerMode = normMode(el.dataset.footerMode || "fixed");
        data.footerBottom = el.dataset.footerBottom || "0";
        data.footerLeft = el.dataset.footerLeft || "0";
      } else {
        data.isFooter = data.isFooter || "0";
      }
      return data;
    };

    window.getElementData.__footerHooked = true;
  }

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
