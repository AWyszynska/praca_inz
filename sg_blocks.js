(() => {
  const $ = (id) => document.getElementById(id);

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function hexToRgb(hex) {
    if (!hex) return { r: 0, g: 0, b: 0 };
    const h = hex.replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbaFromHex(hex, alpha01) {
    const { r, g, b } = hexToRgb(hex);
    const a = clamp(alpha01, 0, 1);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function getActive() {
    try { return (typeof activeElement !== "undefined") ? activeElement : null; }
    catch { return null; }
  }

  function ensureActiveBlock() {
    const el = getActive();
    if (!el || el.dataset.type !== "block") return null;
    return el;
  }

  function setVal(id, v) { const el = $(id); if (el) el.value = v; }
  function getVal(id, fallback = "") { const el = $(id); return el ? el.value : fallback; }

function buildGradientCss(kind, angle, xPct, yPct, c1, cMid, useMid, c2) {
  const a = clamp(parseInt(angle || "0", 10), 0, 360);
  const x = clamp(parseInt(xPct || "50", 10), 0, 100);
  const y = clamp(parseInt(yPct || "50", 10), 0, 100);

  const stops = useMid ? `${c1}, ${cMid}, ${c2}` : `${c1}, ${c2}`;

  if (kind === "radial") return `radial-gradient(circle at ${x}% ${y}%, ${stops})`;
  if (kind === "conic")  return `conic-gradient(from ${a}deg at ${x}% ${y}%, ${stops})`;
  return `linear-gradient(${a}deg, ${stops})`;
}

function applyBorder(el) {
  const bw = parseInt(getVal("prop-border-width", "0"), 10);
  const bs = getVal("prop-border-style", "solid");
  const mode = getVal("block-border-mode", "solid");

  el.style.borderImage = "";
  el.style.backgroundImage = "";

  if (bs === "none" || bw <= 0) {
    el.style.border = "none";
    el.style.backgroundClip = "";
    el.style.backgroundOrigin = "";
    return;
  }

  if (mode !== "gradient") {
    const bc = getVal("prop-border-color", "#000000");
    el.style.borderStyle = bs;
    el.style.borderWidth = bw + "px";
    el.style.borderColor = bc;
    el.style.backgroundClip = "";
    el.style.backgroundOrigin = "";
    return;
  }

  const gType = getVal("block-border-grad-type", "linear");
  const angle = getVal("block-border-grad-angle", "135");
  const x = getVal("block-border-grad-x", "50");
  const y = getVal("block-border-grad-y", "50");
  const c1 = getVal("block-border-grad-1", "#60a5fa");
  const c2 = getVal("block-border-grad-2", "#a78bfa");
  const useMid = !!$("block-border-grad-mid-enable")?.checked;
  const cMid = getVal("block-border-grad-mid", "#ffffff");

  const borderGrad = buildGradientCss(gType, angle, x, y, c1, cMid, useMid, c2);

  el.style.borderStyle = "solid";
  el.style.borderWidth = bw + "px";
  el.style.borderColor = "transparent";

  const innerLayer = el.style.background || el.style.backgroundColor || "#ffffff";
  el.style.backgroundImage = `${innerLayer}, ${borderGrad}`;
  el.style.backgroundOrigin = "border-box";
  el.style.backgroundClip = "padding-box, border-box";
}



  function applyRadius(el) {
    const r = parseInt(getVal("prop-radius", "0"), 10);
    el.style.borderRadius = clamp(r, 0, 999) + "px";
  }

  function applyOpacity(el) {
    const p = parseInt(getVal("prop-opacity", "100"), 10);
    el.style.opacity = clamp(p, 0, 100) / 100;
  }

function applyBackdropBlur(el) {
  const v = parseInt(getVal("block-backdrop-blur", "0"), 10);
  const val = v > 0 ? `blur(${v}px)` : "none";
  el.style.backdropFilter = val;
  el.style.webkitBackdropFilter = val; 
}


function applyBackground(el) {
  const mode = getVal("block-bg-mode", "solid");

  if (mode === "gradient") {
    const gType = getVal("block-bg-grad-type", "linear");

    const angle = parseInt(getVal("block-bg-grad-angle", "135"), 10);
    const posX  = parseInt(getVal("block-bg-grad-posx", "50"), 10);
    const posY  = parseInt(getVal("block-bg-grad-posy", "50"), 10);

const cFrom = getVal("block-bg-grad-from", "#ffffff");
const cMid  = getVal("block-bg-grad-mid", "#a78bfa");
const cTo   = getVal("block-bg-grad-to", "#c7d2fe");

    const useMid = document.getElementById("block-bg-grad-use-mid")?.checked ? true : false;

    const a = clamp(isNaN(angle) ? 0 : angle, 0, 360);
    const x = clamp(isNaN(posX)  ? 50 : posX,  0, 100);
    const y = clamp(isNaN(posY)  ? 50 : posY,  0, 100);

    let css = "";

    if (useMid) {
      if (gType === "radial") css = `radial-gradient(circle at ${x}% ${y}%, ${cFrom}, ${cMid}, ${cTo})`;
      else if (gType === "conic") css = `conic-gradient(from ${a}deg at ${x}% ${y}%, ${cFrom}, ${cMid}, ${cTo})`;
      else css = `linear-gradient(${a}deg, ${cFrom}, ${cMid}, ${cTo})`;
    } else {
      if (gType === "radial") css = `radial-gradient(circle at ${x}% ${y}%, ${cFrom}, ${cTo})`;
      else if (gType === "conic") css = `conic-gradient(from ${a}deg at ${x}% ${y}%, ${cFrom}, ${cTo})`;
      else css = `linear-gradient(${a}deg, ${cFrom}, ${cTo})`;
    }

    el.style.background = css;
    el.style.backgroundColor = cFrom;
    return;
  }

  const col = getVal("prop-bg-color", "#ffffff");
  el.style.background = col;
  el.style.backgroundColor = col;
}


  function applyShadow(el) {
    const enabled = getVal("block-shadow-enable", "on");
    if (enabled === "off") {
      el.style.boxShadow = "none";
      return;
    }

    const x = parseInt(getVal("block-shadow-x", "0"), 10);
    const y = parseInt(getVal("block-shadow-y", "12"), 10);
    const blur = parseInt(getVal("block-shadow-blur", "30"), 10);
    const spread = parseInt(getVal("block-shadow-spread", "0"), 10);
    const color = getVal("block-shadow-color", "#000000");
    const alphaPct = parseInt(getVal("block-shadow-alpha", "12"), 10);
    const a01 = clamp(alphaPct, 0, 100) / 100;

    el.style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${rgbaFromHex(color, a01)}`;
  }

  function updatePremiumVisibility() {
    const mode = getVal("block-bg-mode", "solid");
    const solid = $("block-bg-solid-controls");
    const grad = $("block-bg-gradient-controls");
    if (solid && grad) {
      solid.style.display = (mode === "solid") ? "block" : "none";
      grad.style.display = (mode === "gradient") ? "block" : "none";
    }

    const sh = getVal("block-shadow-enable", "on");
    const shc = $("block-shadow-controls");
    if (shc) shc.style.display = (sh === "on") ? "block" : "none";
    const bMode = getVal("block-border-mode", "solid");
const bSolid = $("block-border-solid-controls");
const bGrad = $("block-border-gradient-controls");
if (bSolid && bGrad) {
  bSolid.style.display = (bMode === "solid") ? "block" : "none";
  bGrad.style.display = (bMode === "gradient") ? "block" : "none";
}

const midBox = $("block-border-grad-mid-controls");
if (midBox) {
  const on = !!$("block-border-grad-mid-enable")?.checked;
  midBox.style.display = on ? "block" : "none";
}
const gType = getVal("block-bg-grad-type", "linear");
const angWrap = $("block-bg-grad-angle-wrap");
if (angWrap) angWrap.style.display = (gType === "radial") ? "none" : "block";
  }

  function applyAll(el) {
    applyRadius(el);
    applyOpacity(el);
    applyBackground(el);
    applyBorder(el);
    applyShadow(el);
    applyBackdropBlur(el);
    if (typeof refreshLayers === "function") refreshLayers();
  }

  window.createBlockElement = function createBlockElement(x, y) {
    if (typeof activeContainer === "undefined" || typeof canvas === "undefined") {
      console.error("[sg_blocks] Brak globalnych: activeContainer/canvas");
      return;
    }

    zCounter++;

    const div = document.createElement("div");
    div.className = "canvas-element type-block";
    div.dataset.id = "blk_" + Date.now();
    div.dataset.type = "block";
    div.dataset.blockUi = "bg,border,radius,shadow,blur,opacity";

    div.style.zIndex = zCounter;



    div.style.width = "260px";
    div.style.height = "140px";
    div.style.border = "1px solid #e2e8f0";
    div.style.borderRadius = "16px";
    div.style.boxShadow = "0px 12px 30px 0px rgba(0,0,0,0.12)";
    div.style.background = "#ffffff";
    div.style.backgroundColor = "#ffffff";
    div.style.opacity = "1";
    div.style.backdropFilter = "none";

    div.contentEditable = "false";
    div.spellcheck = false;

    const rect = activeContainer.getBoundingClientRect();
    div.style.left = (x - rect.left) + "px";
    div.style.top  = (y - rect.top) + "px";

    if (typeof setupElementMovement === "function") setupElementMovement(div, "block");

    activeContainer.appendChild(div);
    if (typeof selectElement === "function") selectElement(div);
    if (typeof refreshLayers === "function") refreshLayers();
    return div;
  };

  window.syncBlockInputs = function syncBlockInputs(el) {
    if (!el || el.dataset.type !== "block") return;

    setVal("prop-width", parseInt(el.style.width) || 260);
    setVal("prop-height", parseInt(el.style.height) || 140);
    setVal("prop-radius", parseInt(el.style.borderRadius) || 0);
    setVal("prop-opacity", Math.round((parseFloat(el.style.opacity || "1") * 100)));

    setVal("prop-border-width", parseInt(el.style.borderWidth) || 0);
    const bcRaw = (el.style.borderColor || "");
if (bcRaw.includes("transparent")) {
  setVal("prop-border-color", "#000000");
} else {
  setVal("prop-border-color", (typeof rgbToHex === "function") ? rgbToHex(bcRaw) : "#000000");
}

    setVal("prop-border-style", el.style.borderStyle || "solid");
const clip = (el.style.backgroundClip || "");
const transparentBorder = (el.style.borderColor || "").includes("transparent");
const isBorderGradient = clip.includes("border-box") && transparentBorder;



setVal("block-border-mode", isBorderGradient ? "gradient" : "solid");

    const bg = el.style.background || el.style.backgroundColor || "#ffffff";
    const isGrad = typeof bg === "string" && bg.includes("gradient");
    setVal("block-bg-mode", isGrad ? "gradient" : "solid");
    if (!isGrad) setVal("prop-bg-color", (typeof rgbToHex === "function") ? rgbToHex(el.style.backgroundColor) : "#ffffff");

    setVal("block-shadow-enable", (el.style.boxShadow && el.style.boxShadow !== "none") ? "on" : "off");

    const bf = el.style.backdropFilter || "none";
    const m = bf.match(/blur\((\d+)px\)/);
    setVal("block-backdrop-blur", m ? parseInt(m[1], 10) : 0);

    updatePremiumVisibility();
  };

  function bindBlockUI() {
    $("add-block-btn")?.addEventListener("click", () => { addMode = "block"; });
    $("prop-width")?.addEventListener("input", (e) => {
      const el = ensureActiveBlock(); if (!el) return;
      el.style.width = (parseInt(e.target.value || "0", 10) || 0) + "px";
      refreshLayers?.();
    });

    $("prop-height")?.addEventListener("input", (e) => {
      const el = ensureActiveBlock(); if (!el) return;
      el.style.height = (parseInt(e.target.value || "0", 10) || 0) + "px";
      refreshLayers?.();
    });

    $("prop-radius")?.addEventListener("input", () => {
      const el = ensureActiveBlock(); if (!el) return;
      applyRadius(el); refreshLayers?.();
    });

    $("prop-opacity")?.addEventListener("input", () => {
      const el = ensureActiveBlock(); if (!el) return;
      applyOpacity(el); refreshLayers?.();
    });
    $("block-bg-mode")?.addEventListener("change", () => {
      updatePremiumVisibility();
      const el = ensureActiveBlock(); if (!el) return;
      applyBackground(el); refreshLayers?.();
    });

    $("prop-bg-color")?.addEventListener("input", () => {
      const el = ensureActiveBlock(); if (!el) return;
      applyBackground(el); refreshLayers?.();
    });

    [
  "block-bg-grad-type",
  "block-bg-grad-angle",
  "block-bg-grad-from",
  "block-bg-grad-mid",
  "block-bg-grad-to",
  "block-bg-grad-posx",
  "block-bg-grad-posy"
].forEach(id => {
  $(id)?.addEventListener("input", () => {
    const el = ensureActiveBlock(); if (!el) return;
    updatePremiumVisibility();
    applyBackground(el); refreshLayers?.();
  });
  $(id)?.addEventListener("change", () => {
    const el = ensureActiveBlock(); if (!el) return;
    updatePremiumVisibility();
    applyBackground(el); refreshLayers?.();
  });
});

$("block-bg-grad-use-mid")?.addEventListener("change", () => {
  const el = ensureActiveBlock(); if (!el) return;
  applyBackground(el); refreshLayers?.();
});

    ["prop-border-width", "prop-border-color", "prop-border-style"].forEach(id => {
      $(id)?.addEventListener("input", () => {
        const el = ensureActiveBlock(); if (!el) return;
        applyBorder(el); refreshLayers?.();
      });
      $(id)?.addEventListener("change", () => {
        const el = ensureActiveBlock(); if (!el) return;
        applyBorder(el); refreshLayers?.();
      });
    });

    $("block-shadow-enable")?.addEventListener("change", () => {
      updatePremiumVisibility();
      const el = ensureActiveBlock(); if (!el) return;
      applyShadow(el); refreshLayers?.();
    });

    ["block-shadow-x","block-shadow-y","block-shadow-blur","block-shadow-spread","block-shadow-color","block-shadow-alpha"].forEach(id => {
      $(id)?.addEventListener("input", () => {
        const el = ensureActiveBlock(); if (!el) return;
        applyShadow(el); refreshLayers?.();
      });
      $(id)?.addEventListener("change", () => {
        const el = ensureActiveBlock(); if (!el) return;
        applyShadow(el); refreshLayers?.();
      });
    });
$("block-border-mode")?.addEventListener("change", () => {
  updatePremiumVisibility();
  const el = ensureActiveBlock(); if (!el) return;
  applyBorder(el); refreshLayers?.();
});

["block-border-grad-type","block-border-grad-angle","block-border-grad-x","block-border-grad-y",
 "block-border-grad-1","block-border-grad-2","block-border-grad-mid"].forEach(id => {
  $(id)?.addEventListener("input", () => {
    const el = ensureActiveBlock(); if (!el) return;
    applyBorder(el); refreshLayers?.();
  });
  $(id)?.addEventListener("change", () => {
    const el = ensureActiveBlock(); if (!el) return;
    applyBorder(el); refreshLayers?.();
  });
});

$("block-border-grad-mid-enable")?.addEventListener("change", () => {
  updatePremiumVisibility();
  const el = ensureActiveBlock(); if (!el) return;
  applyBorder(el); refreshLayers?.();
});

    $("block-backdrop-blur")?.addEventListener("input", () => {
      const el = ensureActiveBlock(); if (!el) return;
      applyBackdropBlur(el); refreshLayers?.();
    });

    updatePremiumVisibility();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindBlockUI);
  } else {
    bindBlockUI();
  }
})();
