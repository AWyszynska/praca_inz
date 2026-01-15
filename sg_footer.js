(function () {
  function isFooter(el) {
    return !!el && el.dataset && el.dataset.isFooter === "1";
  }

  function applyFooterStyles(el) {
    if (!el) return;
    const dock = el.dataset.footerDock || "bottom";
    const off = parseInt(el.dataset.footerBottom || "0", 10) || 0;
    const left = parseInt(el.dataset.footerLeft || "0", 10) || 0;
    el.style.position = "fixed";
    el.style.left = left + "px";
    el.style.right = "0px";
    el.style.width = `calc(100% - ${left}px)`;

    el.style.top = "";
    el.style.bottom = "";
    if (dock === "top") el.style.top = off + "px";
    else el.style.bottom = off + "px";
  }

  function syncFooterInputs(el) {
    const dockSel = document.getElementById("footer-dock");
    const offInp = document.getElementById("footer-offset");
    const leftInp = document.getElementById("footer-left");
    if (!dockSel || !offInp || !leftInp) return;

    dockSel.value = el.dataset.footerDock || "bottom";
    offInp.value = parseInt(el.dataset.footerBottom || "0", 10) || 0;
    leftInp.value = parseInt(el.dataset.footerLeft || "0", 10) || 0;
  }

  function showFooterPanel(show) {
    const sec = document.getElementById("footer-edit-section");
    if (sec) sec.style.display = show ? "block" : "none";
  }

function findFooter(dock) {
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
  hookSetAsTarget();
  hookSelectElement();
  hookGetElementData();
  let tries = 0;
  const t = setInterval(() => {
    tries++;

    hookSetAsTarget();
    hookSelectElement();
    hookGetElementData();
    if (
      window.setAsTarget?.__footerHooked &&
      window.selectElement?.__footerHooked &&
      window.getElementData?.__footerHooked
    ) {
      clearInterval(t);
    }
    if (tries >= 100) clearInterval(t);
  }, 100);
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
    if (e.target.id === "footer-offset") {
      el.dataset.footerBottom = String(parseInt(e.target.value || "0", 10) || 0);
      applyFooterStyles(el);
    }
    if (e.target.id === "footer-left") {
      el.dataset.footerLeft = String(parseInt(e.target.value || "0", 10) || 0);
      applyFooterStyles(el);
    }
  });
  function hookSetAsTarget() {
    if (typeof window.setAsTarget !== "function") return;
    if (window.setAsTarget.__footerHooked) return;

    const orig = window.setAsTarget;
    window.setAsTarget = function (id) {
      const el = document.querySelector(`[data-id="${id}"]`);
      if (el && el.dataset?.isFooter === "1") {
        if (typeof window.selectElement === "function") window.selectElement(el);
        if (typeof window.refreshLayers === "function") window.refreshLayers();
        return;
      }
      return orig(id);
    };

    window.setAsTarget.__footerHooked = true;
  }


function hookSelectElement() {
  if (typeof window.selectElement !== "function") return;
  if (window.selectElement.__footerHooked) return;

  const origSelect = window.selectElement;
  window.selectElement = function (el) {
    origSelect(el);
    if (isFooter(el)) {
      showFooterPanel(true);
      syncFooterInputs(el);
      applyFooterStyles(el);
    } else {
      showFooterPanel(false);
    }
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
      data.footerBottom = el.dataset.footerBottom || "0";
      data.footerLeft = el.dataset.footerLeft || "0";
    } else {
      data.isFooter = data.isFooter || "0";
    }
    return data;
  };

  window.getElementData.__footerHooked = true;
}

  window.applyFooterStyles = applyFooterStyles;
})();
