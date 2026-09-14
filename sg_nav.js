(() => {
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const inEditor = () => !!document.getElementById("preview-canvas");

  const pointer = { x: 160, y: 120 };
  function updatePointer(e) {
    if (!window.canvas) return;
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  }
  document.addEventListener("mousemove", updatePointer, true);
  document.addEventListener("mousedown", updatePointer, true);

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }
  function escapeAttr(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function guessPageKey(href) {
    const m = String(href ?? "").match(/[?&]page=([^&]+)/i);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function parseItems(raw) {
    const lines = String(raw ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const items = lines.map((line) => {
      const parts = line.split("|");
      const label = (parts[0] ?? "").trim() || "Link";
      const href = (parts[1] ?? "").trim() || "#";
      const key = (parts[2] ?? "").trim();
      const pageKey = guessPageKey(href);
      return { label, href, key, pageKey };
    });

    return items.length
      ? items
      : [
          { label: "Strona główna", href: "?page=home", key: "home", pageKey: "home" },
          { label: "O nas", href: "?page=about", key: "about", pageKey: "about" },
          { label: "Usługi", href: "?page=uslugi", key: "uslugi", pageKey: "uslugi" },
          { label: "Kontakt", href: "?page=kontakt", key: "kontakt", pageKey: "kontakt" },
        ];
  }

  function isNav(el) {
    return !!el && el.dataset && el.dataset.type === "nav";
  }

  function linkShadowCss(name) {
    if (name === "strong") return "0 12px 28px rgba(0,0,0,0.18)";
    if (name === "none") return "none";
    return "0 6px 14px rgba(0,0,0,0.10)";
  }

  function containerShadowCss(name) {
    if (name === "strong") return "0 12px 28px rgba(0,0,0,0.18)";
    if (name === "none") return "none";
    return "0 10px 24px rgba(0,0,0,0.18)";
  }

  const gradPresets = {
    ocean:       { type: "linear", angle: 135, from: "#0ea5e9", mid: "#2563eb", to: "#111827", useMid: 1, posX: 50, posY: 50 },
    sunset:      { type: "linear", angle: 120, from: "#fb7185", mid: "#f59e0b", to: "#7c3aed", useMid: 1, posX: 50, posY: 50 },
    purple_night:{ type: "linear", angle: 135, from: "#a855f7", mid: "#1d4ed8", to: "#0b1020", useMid: 1, posX: 50, posY: 50 },
    candy:       { type: "linear", angle: 90,  from: "#22c55e", mid: "#a855f7", to: "#fb7185", useMid: 1, posX: 50, posY: 50 },
    forest:      { type: "linear", angle: 135, from: "#16a34a", mid: "#065f46", to: "#0b1020", useMid: 1, posX: 50, posY: 50 },
    neon_blue:   { type: "linear", angle: 135, from: "#06b6d4", mid: "#3b82f6", to: "#0b1020", useMid: 1, posX: 50, posY: 50 },
    gold_warm:   { type: "linear", angle: 135, from: "#f59e0b", mid: "#ef4444", to: "#7c3aed", useMid: 1, posX: 50, posY: 50 },
    cherry:      { type: "linear", angle: 140, from: "#ef4444", mid: "#fb7185", to: "#111827", useMid: 1, posX: 50, posY: 50 },
    steel:       { type: "linear", angle: 135, from: "#94a3b8", mid: "#475569", to: "#0f172a", useMid: 1, posX: 50, posY: 50 },
    frost:       { type: "linear", angle: 135, from: "#e2e8f0", mid: "#38bdf8", to: "#0f172a", useMid: 1, posX: 50, posY: 50 },
    aurora:      { type: "conic",  angle: 180, from: "#22c55e", mid: "#06b6d4", to: "#a855f7", useMid: 1, posX: 50, posY: 50 },
    lava:        { type: "radial", angle: 0,   from: "#f97316", mid: "#ef4444", to: "#111827", useMid: 1, posX: 40, posY: 35 },
    mint:        { type: "linear", angle: 120, from: "#34d399", mid: "#06b6d4", to: "#0f172a", useMid: 1, posX: 50, posY: 50 },
    space:       { type: "radial", angle: 0,   from: "#60a5fa", mid: "#a855f7", to: "#0b1020", useMid: 1, posX: 35, posY: 35 },
    peach:       { type: "linear", angle: 120, from: "#fdba74", mid: "#fb7185", to: "#7c3aed", useMid: 1, posX: 50, posY: 50 },

    midnight:    { type: "linear", angle: 135, from: "#0b1020", mid: "#1d4ed8", to: "#111827", useMid: 1, posX: 50, posY: 50 },
    rose:        { type: "linear", angle: 125, from: "#fb7185", mid: "#f43f5e", to: "#7c3aed", useMid: 1, posX: 50, posY: 50 },
    mango:       { type: "linear", angle: 120, from: "#fbbf24", mid: "#fb7185", to: "#ef4444", useMid: 1, posX: 50, posY: 50 },
    deepsea:     { type: "radial", angle: 0,   from: "#0ea5e9", mid: "#1e40af", to: "#020617", useMid: 1, posX: 40, posY: 35 },
    horizon:     { type: "linear", angle: 90,  from: "#38bdf8", mid: "#22c55e", to: "#f59e0b", useMid: 1, posX: 50, posY: 50 },
    electric:    { type: "conic",  angle: 210, from: "#06b6d4", mid: "#a855f7", to: "#f59e0b", useMid: 1, posX: 50, posY: 50 },
    lime:        { type: "linear", angle: 135, from: "#84cc16", mid: "#22c55e", to: "#06b6d4", useMid: 1, posX: 50, posY: 50 },
    royal:       { type: "linear", angle: 140, from: "#1d4ed8", mid: "#7c3aed", to: "#0f172a", useMid: 1, posX: 50, posY: 50 },
  };

  function makeGradientCss(cfg) {
    const from = cfg.gradFrom || "#0ea5e9";
    const mid = cfg.gradMid || "#a855f7";
    const to = cfg.gradTo || "#111827";
    const useMid = cfg.gradUseMid === 1;

    const angle = clamp(parseInt(cfg.gradAngle || 0, 10) || 0, 0, 360);
    const posX = clamp(parseInt(cfg.gradPosX || 50, 10) || 50, 0, 100);
    const posY = clamp(parseInt(cfg.gradPosY || 50, 10) || 50, 0, 100);

    const colors = useMid ? `${from}, ${mid}, ${to}` : `${from}, ${to}`;

    if (cfg.gradType === "radial") {
      return `radial-gradient(circle at ${posX}% ${posY}%, ${colors})`;
    }
    if (cfg.gradType === "conic") {
      return `conic-gradient(from ${angle}deg at ${posX}% ${posY}%, ${colors})`;
    }
    return `linear-gradient(${angle}deg, ${colors})`;
  }

  function applyBackground(el) {
    if (!isNav(el)) return;

    const mode = el.dataset.navBgMode || "solid";
if (mode === "gradient") {
  const styleHasGrad = (el.style.background || "").toLowerCase().includes("gradient(");
  const hasGradData = !!(el.dataset.navGradFrom || el.dataset.navGradTo || el.dataset.navGradMid);
  if (styleHasGrad && !hasGradData) return;

  const cfg = {
    gradType: el.dataset.navGradType || "linear",
    gradAngle: el.dataset.navGradAngle || "135",
    gradPosX: el.dataset.navGradPosX || "50",
    gradPosY: el.dataset.navGradPosY || "50",
    gradFrom: el.dataset.navGradFrom || "#0ea5e9",
    gradMid: el.dataset.navGradMid || "#a855f7",
    gradTo: el.dataset.navGradTo || "#111827",
    gradUseMid: el.dataset.navGradUseMid === "1" ? 1 : 0,
  };

  el.style.background = makeGradientCss(cfg);
  el.style.backgroundColor = cfg.gradTo || "#111827";
  return;
}
 else {
      const solid = (el.dataset.navBgSolid || "#111827").trim() || "#111827";
      el.style.background = "none";
      el.style.backgroundColor = solid;
    }
  }

  function ensureDefaults(el) {
    if (!isNav(el)) return;

    if (el.dataset.navItems === undefined) {
      el.dataset.navItems =
        "Strona główna|?page=home|home\nO nas|?page=about|about\nUsługi|?page=uslugi|uslugi\nKontakt|?page=kontakt|kontakt";
    }

    if (!el.dataset.navLayout) el.dataset.navLayout = "pills";
    if (!el.dataset.navHookMode) el.dataset.navHookMode = "none";

    if (!el.dataset.navOrientation) el.dataset.navOrientation = "horizontal";
    if (!el.dataset.navAlign) el.dataset.navAlign = "left";

    if (!el.dataset.navJustify) el.dataset.navJustify = "start";
    if (!el.dataset.navVJustify) el.dataset.navVJustify = "top";
if (el.dataset.navFillX == null) el.dataset.navFillX = "0";
if (el.dataset.navFillY == null) el.dataset.navFillY = "0";

    if (!el.dataset.navWrap) el.dataset.navWrap = "0";
    if (!el.dataset.navStretch) el.dataset.navStretch = "0";
    if (!el.dataset.navDivider) el.dataset.navDivider = "0";

    if (!el.dataset.navGap) el.dataset.navGap = "10";
    if (!el.dataset.navPad) el.dataset.navPad = "10";

    if (!el.dataset.navLinkPadX) el.dataset.navLinkPadX = "12";
    if (!el.dataset.navLinkPadY) el.dataset.navLinkPadY = "8";
    if (!el.dataset.navLinkRadius) el.dataset.navLinkRadius = "8";
    if (el.dataset.navUnderline === undefined) el.dataset.navUnderline = "0";

    if (!el.dataset.navLinkBorderW) el.dataset.navLinkBorderW = "1";
    if (!el.dataset.navLinkBorderColor) el.dataset.navLinkBorderColor = "rgba(255,255,255,0.10)";

    if (!el.dataset.navLinkShadow) el.dataset.navLinkShadow = "soft";

    if (!el.dataset.navLinkColor) el.dataset.navLinkColor = "#ffffff";
    if (!el.dataset.navHoverBg) el.dataset.navHoverBg = "rgba(255,255,255,0.12)";
    if (!el.dataset.navHoverColor) el.dataset.navHoverColor = "#ffffff";
    if (!el.dataset.navActiveBg) el.dataset.navActiveBg = "rgba(255,255,255,0.18)";
    if (!el.dataset.navActiveColor) el.dataset.navActiveColor = "#ffffff";

    if (!el.dataset.navActiveMode) el.dataset.navActiveMode = "query_page";

    if (el.dataset.navBgMode === undefined) {
  const bgStr = (el.style.background || "").toLowerCase();
  el.dataset.navBgMode = bgStr.includes("gradient(") ? "gradient" : "solid";
}
const hadGradData =
  (el.dataset.navGradFrom !== undefined) ||
  (el.dataset.navGradMid  !== undefined) ||
  (el.dataset.navGradTo   !== undefined);

if (el.dataset.navBgMode === undefined) {
  const bgStr = (el.style.background || "").toLowerCase();
  el.dataset.navBgMode = bgStr.includes("gradient(") ? "gradient" : "solid";
}
if (!el.dataset.navBgSolid) el.dataset.navBgSolid = "#111827";

    if (!el.dataset.navBgSolid) el.dataset.navBgSolid = "#111827";
if (el.dataset.navBgMode === "gradient" || hadGradData) {
  if (!el.dataset.navGradType) el.dataset.navGradType = "linear";
  if (!el.dataset.navGradAngle) el.dataset.navGradAngle = "135";
  if (!el.dataset.navGradPosX) el.dataset.navGradPosX = "50";
  if (!el.dataset.navGradPosY) el.dataset.navGradPosY = "50";
  if (!el.dataset.navGradFrom) el.dataset.navGradFrom = "#0ea5e9";
  if (!el.dataset.navGradMid) el.dataset.navGradMid = "#a855f7";
  if (!el.dataset.navGradTo) el.dataset.navGradTo = "#111827";
  if (el.dataset.navGradUseMid === undefined) el.dataset.navGradUseMid = "1";
  if (el.dataset.navGradPreset === undefined) el.dataset.navGradPreset = "";
}

    if (!el.dataset.navName) el.dataset.navName = "";
    if (el.dataset.navHtmlId === undefined) el.dataset.navHtmlId = "";
    if (el.dataset.navHtmlClass === undefined) el.dataset.navHtmlClass = "";
    if (el.dataset.navBrandText === undefined) el.dataset.navBrandText = "";
    if (el.dataset.navBrandHref === undefined) el.dataset.navBrandHref = "#";

    if (!el.style.width) el.style.width = "680px";
    if (!el.style.height) el.style.height = "56px";
    if (!el.style.border || el.style.border === "none") el.style.border = "1px solid rgba(255,255,255,0.08)";
    if (!el.style.borderRadius) el.style.borderRadius = "12px";
    if (!el.style.boxShadow || el.style.boxShadow === "none") el.style.boxShadow = "0 10px 24px rgba(0,0,0,0.18)";
    if (!el.style.color) el.style.color = "#ffffff";
    if (!el.style.fontSize) el.style.fontSize = "20px";
    if (!el.style.fontFamily) el.style.fontFamily = "'Segoe UI', sans-serif";
    if (!el.dataset.navDividerText)  el.dataset.navDividerText  = "|";
    if (!el.dataset.navDividerSize)  el.dataset.navDividerSize  = "14";
    if (!el.dataset.navDividerColor) el.dataset.navDividerColor = "#ffffff";

 
  }

  function getCfg(el) {
    ensureDefaults(el);

    const layout = el.dataset.navLayout || "pills";
    const hookMode = el.dataset.navHookMode || "none";

    const orientation = el.dataset.navOrientation || "horizontal";
    const align = el.dataset.navAlign || "left";

    const justify = el.dataset.navJustify || "start";
    const vJustify = el.dataset.navVJustify || "top";

    const wrap = el.dataset.navWrap === "1";
    const stretch = el.dataset.navStretch === "1";
    const divider = el.dataset.navDivider === "1";

    const gap = clamp(parseInt(el.dataset.navGap || "10", 10) || 10, 0, 80);
    const pad = clamp(parseInt(el.dataset.navPad || "10", 10) || 10, 0, 80);

    const linkPadX = clamp(parseInt(el.dataset.navLinkPadX || "12", 10) || 12, 0, 80);
    const linkPadY = clamp(parseInt(el.dataset.navLinkPadY || "8", 10) || 8, 0, 80);
    const linkRadius = clamp(parseInt(el.dataset.navLinkRadius || "8", 10) || 8, 0, 40);

    const underline = el.dataset.navUnderline === "1";

    const linkBorderW = clamp(parseInt(el.dataset.navLinkBorderW || "1", 10) || 1, 0, 8);
    const linkBorderColor = (el.dataset.navLinkBorderColor || "rgba(255,255,255,0.10)").trim() || "rgba(255,255,255,0.10)";

    const linkBorderCss = `${linkBorderW}px solid ${linkBorderColor}`;

    const linkShadow = el.dataset.navLinkShadow || "soft";

    const linkColor = el.dataset.navLinkColor || "#ffffff";
    const hoverBg = el.dataset.navHoverBg || "rgba(255,255,255,0.12)";
    const hoverColor = el.dataset.navHoverColor || "#ffffff";
    const activeBg = el.dataset.navActiveBg || "rgba(255,255,255,0.18)";
    const activeColor = el.dataset.navActiveColor || "#ffffff";

    const activeMode = el.dataset.navActiveMode || "query_page";

    const htmlId = (el.dataset.navHtmlId || "").trim();
    const htmlClass = (el.dataset.navHtmlClass || "").trim();
    const brandText = (el.dataset.navBrandText || "").trim();
    const brandHref = (el.dataset.navBrandHref || "#").trim() || "#";
    const navName = (el.dataset.navName || "").trim();

    const bgMode = el.dataset.navBgMode || "solid";
    const bgSolid = el.dataset.navBgSolid || "#111827";

    const gradType = el.dataset.navGradType || "linear";
    const gradAngle = el.dataset.navGradAngle || "135";
    const gradPosX = el.dataset.navGradPosX || "50";
    const gradPosY = el.dataset.navGradPosY || "50";
    const gradFrom = el.dataset.navGradFrom || "#0ea5e9";
    const gradMid = el.dataset.navGradMid || "#a855f7";
    const gradTo = el.dataset.navGradTo || "#111827";
    const gradUseMid = el.dataset.navGradUseMid === "1" ? 1 : 0;
    const gradPreset = el.dataset.navGradPreset || "";

    const items = parseItems(el.dataset.navItems);

    return {
      layout,
      hookMode,
      orientation,
      align,
      justify,
      vJustify,
      navName,
      wrap,
      stretch,
      divider,
      gap,
      fillX: el.dataset.navFillX === "1",
      fillY: el.dataset.navFillY === "1",

      pad,
      linkPadX,
      linkPadY,
      linkRadius,
      linkBorderCss,
      linkShadow,
      underline,
      linkColor,
      hoverBg,
      hoverColor,
      activeBg,
      activeColor,
      activeMode,
      htmlId,
      htmlClass,
      brandText,
      brandHref,
      items,

      bgMode,
      bgSolid,
      gradType,
      gradAngle,
      gradPosX,
      gradPosY,
      gradFrom,
      gradMid,
      gradTo,
      gradUseMid,
      gradPreset,
      dividerText:  String(el.dataset.navDividerText || "|"),
      dividerSize:  parseInt(el.dataset.navDividerSize || "14", 10) || 14,
      dividerColor: String(el.dataset.navDividerColor || "#ffffff"),

    };
  }

  function alignItemsFromAlign(align) {
    if (align === "center") return "center";
    if (align === "right") return "flex-end";
    return "flex-start";
  }
  function justifyFromMode(mode) {
    if (mode === "center") return "center";
    if (mode === "end") return "flex-end";
    if (mode === "between") return "space-between";
    if (mode === "around") return "space-around";
    if (mode === "evenly") return "space-evenly";
    return "flex-start";
  }
  function vJustifyFromMode(mode) {
if (mode === "center") return "center";
if (mode === "bottom") return "flex-end";
if (mode === "between") return "space-between";
return "flex-start";

  }

    function buildLinksHtml(items, cfg){
    const safe = (s) => String(s ?? "");
    const esc = (s) => safe(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));

    const dividerOn = !!cfg.divider;
    const rawDiv = safe(cfg.dividerText || "|").trim();
    const divSize = parseInt(cfg.dividerSize || 14, 10) || 14;
    const divColor = safe(cfg.dividerColor || "#ffffff");

    // jeśli zaczyna się od "<" traktujemy jako mini-HTML (np. <img ...>)
    const dividerIsHtml = rawDiv.startsWith("<");
    const dividerInner = dividerIsHtml ? rawDiv : esc(rawDiv);

    // styl separatora
    const sepStyle =
      `display:inline-flex;align-items:center;justify-content:center;` +
      `font-size:${divSize}px;color:${divColor};opacity:.9;` +
      `user-select:none;pointer-events:none;line-height:1;`;

    // dla <img> ustaw wysokość po rozmiarze
    const sepImgFix = dividerIsHtml
      ? `<style>.sgnav__sep img{height:${divSize}px;width:auto;display:block;}</style>`
      : "";

    let out = sepImgFix;

    items.forEach((it, i) => {
      if (!it) return;

      // separator pomiędzy (nie przed pierwszym)
      if (dividerOn && i > 0) {
        out += `<span class="sgnav__sep" aria-hidden="true" style="${sepStyle}">${dividerInner}</span>`;
      }

      const txt = esc(it.label || "Link");
      const href = safe(it.href || "#");
      const key = esc(it.key || "");

      const dataKey  = key ? ` data-key="${key}"` : "";
      const dataPage = it.pageKey ? ` data-page="${esc(it.pageKey)}"` : "";

      out += `<a href="${href.replaceAll('"','&quot;')}"${dataPage}${dataKey}>${txt}<span class="sgnav__u"></span></a>`;
    });

    return out;
  }


  function computeNavBgCss(cfg) {
    return cfg.bgMode === "gradient" ? makeGradientCss(cfg) : (cfg.bgSolid || "#111827");
  }

  function buildMarkup(el, previewMode) {
    const cfg = getCfg(el);
    const idSafe = String(el.dataset.id || "nav").replace(/[^a-zA-Z0-9_-]/g, "_");
    const navClass = `sgnav_${idSafe}__rt`;

    const bgCss = computeNavBgCss(cfg);

    const flexDir = cfg.orientation === "vertical" ? "column" : "row";
    const justify = (() => {
  if (cfg.orientation === "vertical") return vJustifyFromMode(cfg.vJustify);

  const j = String(cfg.justify || "start").toLowerCase();
  if (j === "start" || j === "flex-start") {
    const a = String(cfg.align || "left").toLowerCase();
    if (a === "center") return "center";
    if (a === "right") return "flex-end";
    return "flex-start"; 
  }

  return justifyFromMode(j);
})();


    const alignItems =
      cfg.orientation === "vertical" ? alignItemsFromAlign(cfg.align) : "center";

    const linkDeco = cfg.underline ? "underline" : "none";
    const wrapCss = (cfg.wrap && cfg.orientation !== "vertical") ? "wrap" : "nowrap";

const dividerCss = cfg.divider

  ? (cfg.orientation === "vertical"
      ? `.${navClass} .sgnav__links a + a{ border-top:1px solid rgba(255,255,255,0.10); }`
      : `.${navClass} .sgnav__links a + a{ border-left:1px solid rgba(255,255,255,0.10); }`)
  : "";
let layoutCss = "";

if (cfg.layout === "underline") {
  layoutCss = `
.${navClass} .sgnav__links a{ background:transparent; border-color:transparent; box-shadow:none; border-radius:10px; }
.${navClass} .sgnav__links a:hover{ background:transparent; }
.${navClass} .sgnav__links a.active{ background:transparent; }
.${navClass} .sgnav__links a .sgnav__u{ display:block; height:2px; margin-top:6px; border-radius:999px; background:transparent; }
.${navClass} .sgnav__links a.active .sgnav__u{ background:${cfg.activeColor}; opacity:.9; }
`;
} else if (cfg.layout === "tabs") {
  layoutCss = `
.${navClass} .sgnav__links a{ background:transparent; box-shadow:none; border-color:rgba(255,255,255,0.14); }
.${navClass} .sgnav__links a.active{ background:${cfg.activeBg}; }
`;
} else if (cfg.layout === "sidebar") {
  layoutCss = `
.${navClass}{ align-items:stretch; }
.${navClass} .sgnav__links{ width:100%; }
.${navClass} .sgnav__links a{ width:100%; justify-content:flex-start; }
`;
}

    const extraClass = cfg.htmlClass ? ` ${escapeAttr(cfg.htmlClass)}` : "";
    const htmlId = cfg.htmlId ? ` id="${escapeAttr(cfg.htmlId)}"` : "";
    const navNameAttr = cfg.navName ? ` data-nav-name="${escapeAttr(cfg.navName)}"` : "";

    const linksHtml = buildLinksHtml(cfg.items, cfg);

    const stopDrag = previewMode ? "" : `
      (function(){
        try{
          var root = document.querySelector('.${navClass}');
          if(!root) return;
          root.addEventListener('pointerdown', function(ev){ ev.stopPropagation(); }, true);
          root.addEventListener('mousedown', function(ev){ ev.stopPropagation(); }, true);
        }catch(e){}
      })();
    `.trim();

    const runtime = `
(function(){
  try{
    var root = document.querySelector('.${navClass}');
    if(!root) return;

    var hookMode = root.getAttribute('data-hook-mode') || 'none';
    var activeMode = root.getAttribute('data-active-mode') || 'none';
    var links = root.querySelectorAll('a');

    function clearActive(){
      links.forEach(function(a){ a.classList.remove('active'); });
    }

    function setActiveByPage(){
      var sp = new URLSearchParams(window.location.search || '');
      var page = sp.get('page') || '';
      if(!page) return;
      links.forEach(function(a){
        var p = a.getAttribute('data-page') || '';
        if(p && p === page) a.classList.add('active');
      });
    }

    function setActiveByUrl(){
      var cur = window.location.pathname + window.location.search;
      links.forEach(function(a){
        var href = a.getAttribute('href') || '';
        if(href === cur || (href && cur.indexOf(href) !== -1)) a.classList.add('active');
      });
    }

    function setActiveByClick(a){
      clearActive();
      a.classList.add('active');
    }

    if(activeMode === 'query_page') setActiveByPage();
    else if(activeMode === 'url') setActiveByUrl();

    if(root.getAttribute('data-preview') === '1'){
      root.addEventListener('click', function(ev){
        var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
        if(!a) return;
        ev.preventDefault();
        ev.stopPropagation();

        setActiveByClick(a);

        var key = a.getAttribute('data-key') || '';
        var href = a.getAttribute('href') || '';
        var page = a.getAttribute('data-page') || '';
        var navName = root.getAttribute('data-nav-name') || '';

        var status = document.getElementById('nav-preview-status');
        if(status){
          status.innerHTML =
            'Klik: <b>' + (key || a.textContent || 'link') + '</b> | href: <b>' + href + '</b>' +
            (page ? (' | page: <b>' + page + '</b>') : '') +
            (navName ? (' | navName: <b>' + navName + '</b>') : '');
        }

        if(hookMode === 'event'){
          document.dispatchEvent(new CustomEvent('sg:navigate', {
            detail: { key: key, href: href, page: page, navName: navName }
          }));
        }
      }, true);

      return;
    }

    if(hookMode === 'event'){
      root.addEventListener('click', function(ev){
        var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
        if(!a) return;
        var key = a.getAttribute('data-key') || '';
        var href = a.getAttribute('href') || '';
        var page = a.getAttribute('data-page') || '';
        var navName = root.getAttribute('data-nav-name') || '';

        document.dispatchEvent(new CustomEvent('sg:navigate', {
          detail: { key: key, href: href, page: page, navName: navName }
        }));
      }, true);
    }
  }catch(e){}
})();`.trim();

    const pointerEvents = previewMode ? "auto" : (inEditor() ? "none" : "auto");

const brandHtml = cfg.brandText
  ? `<a class="sgnav__brand" href="${escapeAttr(cfg.brandHref || "#")}" data-key="brand" data-page="">${escapeHtml(cfg.brandText)}</a>`
  : "";

    return `
<style>
.${navClass}{
  width:100%;
  height:100%;
  box-sizing:border-box;
  padding:${cfg.pad}px;

display:flex;
flex-direction:${flexDir};
gap:${cfg.gap}px;
align-items:${cfg.orientation === "vertical" ? alignItems : "center"};


  background:transparent;
  border:0;
  border-radius:0;
  box-shadow:none;

  color:inherit;
  font:inherit;

  pointer-events:${pointerEvents};
}





  .${navClass} .sgnav__links a,
.${navClass} .sgnav__links a:visited{
    font:inherit;
    line-height:1;
    margin:0;
    color:${cfg.linkColor};
    text-decoration:${cfg.underline ? "underline" : "none"};
    background:transparent;
box-sizing:border-box;
    display:inline-flex;
    align-items:center;
    justify-content:center;

    padding:${cfg.linkPadY}px ${cfg.linkPadX}px;
    border-radius:${cfg.linkRadius}px;
    border:${cfg.linkBorderCss};
    box-shadow:${linkShadowCss(cfg.linkShadow)};

    white-space:nowrap;
    user-select:none;

   transition:background .15s ease, color .15s ease, transform .12s ease;

    ${cfg.stretch ? "flex:1 1 0;" : "flex:0 0 auto;"}
  }


  .${navClass} .sgnav__links a:hover{
    background:${cfg.hoverBg};
    color:${cfg.hoverColor};
    transform:translateY(-1px);
  }

  .${navClass} .sgnav__links a.active{ background:${cfg.activeBg}; color:${cfg.activeColor}; }



  .${navClass} .sgnav__links{
  display:flex;
  flex-direction:${flexDir};
  flex-wrap:${wrapCss};
  justify-content:${justify};
  align-items:${cfg.orientation === "vertical" ? alignItems : "center"};
  gap:${cfg.gap}px;
  width:100%;
  height:100%;

}
  ${dividerCss}
.${navClass} .sgnav__brand{
  display:flex; align-items:center;
  font-weight:700;
  text-decoration:none;
  color:${cfg.linkColor};
  padding:${cfg.linkPadY}px ${cfg.linkPadX}px;
  border-radius:${cfg.linkRadius}px;
  border:1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
  box-shadow: 0 10px 22px rgba(0,0,0,0.12);
  white-space:nowrap;
}
${layoutCss}
</style>

<nav${htmlId}
  class="${navClass} sgnav sgnav--${escapeAttr(cfg.layout)}${extraClass}"

  data-layout="${escapeAttr(cfg.layout)}"
  data-orientation="${escapeAttr(cfg.orientation)}"
  data-hook-mode="${escapeAttr(cfg.hookMode)}"
  data-active-mode="${escapeAttr(cfg.activeMode)}"
  data-preview="${previewMode ? "1" : "0"}"
  ${navNameAttr}
>
  ${brandHtml}
  <div class="sgnav__links">
    ${linksHtml}
  </div>
</nav>



<script>
${stopDrag}
${runtime}
</script>
    `.trim();
  }
function applyFillMode(el, cfg){
  // X
  if (cfg.fillX) {
    if (el.dataset.navPrevLeft == null)  el.dataset.navPrevLeft  = el.style.left  || "";
    if (el.dataset.navPrevWidth == null) el.dataset.navPrevWidth = el.style.width || "";
    el.style.left = "0px";
    el.style.width = "100%";
  } else {
    if (el.dataset.navPrevLeft != null)  el.style.left  = el.dataset.navPrevLeft;
    if (el.dataset.navPrevWidth != null) el.style.width = el.dataset.navPrevWidth;
    delete el.dataset.navPrevLeft;
    delete el.dataset.navPrevWidth;
  }

  // Y
  if (cfg.fillY) {
    if (el.dataset.navPrevTop == null)    el.dataset.navPrevTop    = el.style.top    || "";
    if (el.dataset.navPrevHeight == null) el.dataset.navPrevHeight = el.style.height || "";
    el.style.top = "0px";
    el.style.height = "100%";
  } else {
    if (el.dataset.navPrevTop != null)    el.style.top    = el.dataset.navPrevTop;
    if (el.dataset.navPrevHeight != null) el.style.height = el.dataset.navPrevHeight;
    delete el.dataset.navPrevTop;
    delete el.dataset.navPrevHeight;
  }
}

function updateNavVisuals(el) {
  if (!isNav(el)) return;
  ensureDefaults(el);

  const cfg = getCfg(el); 

  applyBackground(el);

  el.contentEditable = "false";
  el.innerHTML = buildMarkup(el, false);

  const panelPrev = $("nav-panel-preview");
  if (panelPrev) panelPrev.innerHTML = buildMarkup(el, true);

  applyFillMode(el, cfg);   
}

  window.updateNavVisuals = updateNavVisuals;

  window.createNavElement = function createNavElement(clientX, clientY) {
    if (!inEditor()) return;
    if (!window.canvas) return;
    if (typeof window.zCounter === "undefined") window.zCounter = 1;

    const host =
      typeof window.activeContainer !== "undefined" && window.activeContainer
        ? window.activeContainer
        : canvas;

    const rect = host.getBoundingClientRect();

    const lx = Number.isFinite(clientX) ? clientX - rect.left : pointer.x;
    const ly = Number.isFinite(clientY) ? clientY - rect.top : pointer.y;

    const navEl = document.createElement("div");
    navEl.className = "canvas-element type-nav";
    navEl.dataset.type = "nav";
    navEl.dataset.id = "nav_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
    navEl.style.zIndex = String(++window.zCounter);
    navEl.style.left = Math.max(0, Math.round(lx - 340)) + "px";
    navEl.style.top = Math.max(0, Math.round(ly - 28)) + "px";

    ensureDefaults(navEl);
    updateNavVisuals(navEl);

    host.appendChild(navEl);

    if (typeof window.setupElementMovement === "function") window.setupElementMovement(navEl, "nav");

    navEl.onclick = (ev) => {
      ev.stopPropagation();
      window.selectElement?.(navEl);
    };

    window.selectElement?.(navEl);
    window.refreshLayers?.();

    return navEl;
  };

  function setUiVisibility() {
    const mode = ($("nav-bg-mode")?.value || "solid").toLowerCase();
    const solidWrap = $("nav-bg-solid-wrap");
    const gradWrap = $("nav-bg-grad-wrap");

    if (solidWrap) solidWrap.style.display = mode === "solid" ? "block" : "none";
    if (gradWrap) gradWrap.style.display = mode === "gradient" ? "block" : "none";
  }

  window.syncNavInputs = function syncNavInputs(el) {
    if (!isNav(el)) return;
    ensureDefaults(el);
    const cfg = getCfg(el);

    const toHexColor = (val, fallback) => {
      const raw = String(val ?? "").trim();
      const fbRaw = String(fallback ?? "#ffffff").trim();
      const fb = /^#[0-9a-f]{6}$/i.test(fbRaw) ? fbRaw : "#ffffff";

      const pad2 = (n) => n.toString(16).padStart(2, "0");
      const clamp255 = (n) => Math.max(0, Math.min(255, n | 0));

      if (!raw) return fb;

      if (/^#[0-9a-f]{3}$/i.test(raw)) {
        const r = raw[1], g = raw[2], b = raw[3];
        return ("#" + r + r + g + g + b + b).toLowerCase();
      }
      if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
      if (/^#[0-9a-f]{8}$/i.test(raw)) return raw.slice(0, 7).toLowerCase();

      const m = raw.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)$/i);
      if (m) {
        const r = clamp255(parseInt(m[1], 10));
        const g = clamp255(parseInt(m[2], 10));
        const b = clamp255(parseInt(m[3], 10));
        return "#" + pad2(r) + pad2(g) + pad2(b);
      }

      return fb;
    };

    const setVal = (id, v) => {
      const n = $(id);
      if (!n) return;

      if (String(n.type || "").toLowerCase() === "color") {
        const current = String(n.value || "").trim();
        const safeFallback = /^#[0-9a-f]{6}$/i.test(current) ? current : "#ffffff";
        n.value = toHexColor(v, safeFallback);
        return;
      }

      n.value = String(v ?? "");
    };
    const setChk = (id, v) => { const n = $(id); if (n) n.checked = !!v; };

    setVal("nav-items", el.dataset.navItems || "");

    setVal("nav-layout", cfg.layout);
    setVal("nav-orientation", cfg.orientation);
    setVal("nav-align", cfg.align);

    setVal("nav-hook-mode", cfg.hookMode);
    setVal("nav-name", cfg.navName);

    setVal("nav-html-id", cfg.htmlId);
    setVal("nav-html-class", cfg.htmlClass);
    setVal("nav-brand-text", cfg.brandText);
    setVal("nav-brand-href", cfg.brandHref);

    setVal("nav-justify", cfg.justify);
    setVal("nav-v-justify", cfg.vJustify);

    setChk("nav-wrap", cfg.wrap);
    setChk("nav-stretch", cfg.stretch);
    setChk("nav-divider", cfg.divider);

const divWrap = document.getElementById("nav-divider-wrap");
if (divWrap) divWrap.style.display = cfg.divider ? "block" : "none";

setVal("nav-divider-text", el.dataset.navDividerText || "|");
setVal("nav-divider-size", String(parseInt(el.dataset.navDividerSize || "14", 10) || 14));
setVal("nav-divider-color", el.dataset.navDividerColor || "#ffffff");


    setVal("nav-active-mode", cfg.activeMode);
    setChk("nav-underline", cfg.underline);
setChk("nav-fill-x", cfg.fillX);
setChk("nav-fill-y", cfg.fillY);

    setVal("nav-gap", cfg.gap);
    setVal("nav-pad", cfg.pad);

    setVal("nav-w", parseInt(el.style.width || "680", 10) || 680);
    setVal("nav-h", parseInt(el.style.height || "56", 10) || 56);

    {
  const br = String(el.style.borderRadius || "").trim(); // np. "0px"
  let radius = parseInt(br, 10);
  if (Number.isNaN(radius)) radius = 12;
  setVal("nav-radius", radius);
}


    const borderW = parseInt(String(el.style.border || "").match(/(\d+)px/)?.[1] || "1", 10) || 1;
    setVal("nav-border-w", borderW);

    const borderColor = String(el.style.border || "").match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/)?.[1] || "#ffffff";
    setVal("nav-border-color", borderColor);

    const shadowName = (el.style.boxShadow || "").includes("rgba") ? (el.style.boxShadow.includes("36px") ? "strong" : "soft") : "none";
    setVal("nav-shadow", shadowName);

    setVal("nav-text-color", el.style.color || "#ffffff");
    {
  const raw = (el.style.fontSize || el.dataset.fontSize || "20px");
  let n = parseInt(raw, 10);
  if (Number.isNaN(n)) n = 20;
  setVal("nav-font-size", n);
}


    setVal("nav-link-pad-x", cfg.linkPadX);
    setVal("nav-link-pad-y", cfg.linkPadY);
    setVal("nav-link-radius", cfg.linkRadius);

    setVal("nav-link-border-w", parseInt(el.dataset.navLinkBorderW || "1", 10) || 1);
    setVal("nav-link-border-color", el.dataset.navLinkBorderColor || "#ffffff");
    setVal("nav-link-shadow", cfg.linkShadow);

    setVal("nav-link-color", cfg.linkColor);
    setVal("nav-hover-bg", cfg.hoverBg);
    setVal("nav-hover-color", cfg.hoverColor);
    setVal("nav-active-bg", cfg.activeBg);
    setVal("nav-active-color", cfg.activeColor);

    setVal("nav-bg-mode", cfg.bgMode);
    setVal("nav-bg-solid", cfg.bgSolid);

    setVal("nav-grad-type", cfg.gradType);
    setVal("nav-grad-angle", cfg.gradAngle);
    setVal("nav-grad-pos-x", cfg.gradPosX);
    setVal("nav-grad-pos-y", cfg.gradPosY);
    setVal("nav-grad-from", cfg.gradFrom);
    setVal("nav-grad-mid", cfg.gradMid);
    setVal("nav-grad-to", cfg.gradTo);
    setChk("nav-grad-use-mid", cfg.gradUseMid === 1);
    setVal("nav-grad-preset", cfg.gradPreset);

    setUiVisibility();
    updateNavVisuals(el);
  };

  function bindNavUI() {
    const applyIfActive = (fn) => {
      const el = window.activeElement;
      if (!el || !isNav(el)) return;
      fn(el);
      updateNavVisuals(el);
      window.refreshLayers?.();
    };

    const bindVal = (id, cb) => {
      const n = $(id);
      if (!n) return;
      n.addEventListener("input", () => applyIfActive(cb));
      n.addEventListener("change", () => applyIfActive(cb));
    };

    const bindChk = (id, cb) => {
      const n = $(id);
      if (!n) return;
      n.addEventListener("change", () => applyIfActive(cb));
    };

    bindVal("nav-items", (el) => { el.dataset.navItems = $("nav-items").value || ""; });

    bindVal("nav-layout", (el) => { el.dataset.navLayout = $("nav-layout").value || "pills"; });
    bindVal("nav-orientation", (el) => { el.dataset.navOrientation = $("nav-orientation").value || "horizontal"; });
    bindVal("nav-align", (el) => {
  const val = $("nav-align").value || "left";
  el.dataset.navAlign = val;
  const ori = (el.dataset.navOrientation || "horizontal").toLowerCase();
  if (ori !== "vertical") {
    const hasJustify = !!(el.dataset.navJustify && String(el.dataset.navJustify).trim() !== "");
    const curJustify = String(el.dataset.navJustify || "start");
    if (!hasJustify || curJustify === "start") {
      el.dataset.navJustify =
        val === "center" ? "center" :
        val === "right" ? "end" :
        "start";

      const justifySelect = document.getElementById("nav-justify");
      if (justifySelect) justifySelect.value = el.dataset.navJustify;
    }
  }
});


    bindVal("nav-hook-mode", (el) => { el.dataset.navHookMode = $("nav-hook-mode").value || "none"; });
    bindVal("nav-name", (el) => { el.dataset.navName = $("nav-name").value || ""; });

    bindVal("nav-html-id", (el) => { el.dataset.navHtmlId = $("nav-html-id").value || ""; });
    bindVal("nav-html-class", (el) => { el.dataset.navHtmlClass = $("nav-html-class").value || ""; });

    bindVal("nav-brand-text", (el) => { el.dataset.navBrandText = $("nav-brand-text").value || ""; });
    bindVal("nav-brand-href", (el) => { el.dataset.navBrandHref = $("nav-brand-href").value || "#"; });

    bindVal("nav-justify", (el) => { el.dataset.navJustify = $("nav-justify").value || "start"; });
    bindVal("nav-v-justify", (el) => { el.dataset.navVJustify = $("nav-v-justify").value || "top"; });

    bindChk("nav-wrap", (el) => { el.dataset.navWrap = $("nav-wrap").checked ? "1" : "0"; });
    bindChk("nav-stretch", (el) => { el.dataset.navStretch = $("nav-stretch").checked ? "1" : "0"; });
    bindChk("nav-divider", (el) => {
  el.dataset.navDivider = $("nav-divider").checked ? "1" : "0";

  // pokaż/ukryj UI separatora
  const wrap = document.getElementById("nav-divider-wrap");
  if (wrap) wrap.style.display = (el.dataset.navDivider === "1") ? "block" : "none";
});

// pola separatora (tekst / rozmiar / kolor)
bindVal("nav-divider-text", (el) => { el.dataset.navDividerText = $("nav-divider-text").value || "|"; });
bindVal("nav-divider-size", (el) => { el.dataset.navDividerSize = String(parseInt($("nav-divider-size").value || "14", 10) || 14); });
bindVal("nav-divider-color", (el) => { el.dataset.navDividerColor = $("nav-divider-color").value || "#ffffff"; });



    bindVal("nav-active-mode", (el) => { el.dataset.navActiveMode = $("nav-active-mode").value || "query_page"; });
    bindChk("nav-underline", (el) => { el.dataset.navUnderline = $("nav-underline").checked ? "1" : "0"; });

    bindVal("nav-gap", (el) => { el.dataset.navGap = String(parseInt($("nav-gap").value || "10", 10) || 10); });
    bindVal("nav-pad", (el) => { el.dataset.navPad = String(parseInt($("nav-pad").value || "10", 10) || 10); });
bindChk("nav-fill-x", (el) => { el.dataset.navFillX = $("nav-fill-x").checked ? "1" : "0"; });
bindChk("nav-fill-y", (el) => { el.dataset.navFillY = $("nav-fill-y").checked ? "1" : "0"; });

    bindVal("nav-w", (el) => { el.style.width = (parseInt($("nav-w").value || "680", 10) || 680) + "px"; });
    bindVal("nav-h", (el) => { el.style.height = (parseInt($("nav-h").value || "56", 10) || 56) + "px"; });

    bindVal("nav-radius", (el) => {
  const raw = $("nav-radius") ? $("nav-radius").value : "";
  let radius = parseInt(raw, 10);

  if (Number.isNaN(radius)) radius = 12;
  radius = clamp(radius, 0, 80);

  el.style.borderRadius = radius + "px";
});


    bindVal("nav-border-w", (el) => {
      const w = clamp(parseInt($("nav-border-w").value || "1", 10) || 1, 0, 12);
      const col = ($("nav-border-color").value || "#ffffff").trim() || "#ffffff";
      el.style.border = `${w}px solid ${col}`;
    });
    bindVal("nav-border-color", (el) => {
      const w = clamp(parseInt($("nav-border-w").value || "1", 10) || 1, 0, 12);
      const col = ($("nav-border-color").value || "#ffffff").trim() || "#ffffff";
      el.style.border = `${w}px solid ${col}`;
    });

    bindVal("nav-shadow", (el) => { el.style.boxShadow = containerShadowCss($("nav-shadow").value || "soft"); });

    bindVal("nav-text-color", (el) => { el.style.color = $("nav-text-color").value || "#ffffff"; });
    bindVal("nav-font-size", (el) => {
  const raw = $("nav-font-size") ? $("nav-font-size").value : "";
  let n = parseInt(raw, 10);

  if (Number.isNaN(n)) n = 20;
  n = clamp(n, 8, 120);

  const cssVal = n + "px";
  el.style.fontSize = cssVal;
  el.dataset.fontSize = cssVal; 
});


    bindVal("nav-link-pad-x", (el) => { el.dataset.navLinkPadX = String(parseInt($("nav-link-pad-x").value || "12", 10) || 12); });
    bindVal("nav-link-pad-y", (el) => { el.dataset.navLinkPadY = String(parseInt($("nav-link-pad-y").value || "8", 10) || 8); });
    bindVal("nav-link-radius", (el) => { el.dataset.navLinkRadius = String(parseInt($("nav-link-radius").value || "8", 10) || 8); });

    bindVal("nav-link-border-w", (el) => { el.dataset.navLinkBorderW = String(parseInt($("nav-link-border-w").value || "1", 10) || 1); });
    bindVal("nav-link-border-color", (el) => { el.dataset.navLinkBorderColor = $("nav-link-border-color").value || "#ffffff"; });

    bindVal("nav-link-shadow", (el) => { el.dataset.navLinkShadow = $("nav-link-shadow").value || "soft"; });

    bindVal("nav-link-color", (el) => { el.dataset.navLinkColor = $("nav-link-color").value || "#ffffff"; });
    bindVal("nav-hover-bg", (el) => { el.dataset.navHoverBg = $("nav-hover-bg").value || "rgba(255,255,255,0.12)"; });
    bindVal("nav-hover-color", (el) => { el.dataset.navHoverColor = $("nav-hover-color").value || "#ffffff"; });
    bindVal("nav-active-bg", (el) => { el.dataset.navActiveBg = $("nav-active-bg").value || "rgba(255,255,255,0.18)"; });
    bindVal("nav-active-color", (el) => { el.dataset.navActiveColor = $("nav-active-color").value || "#ffffff"; });
    bindVal("nav-bg-mode", (el) => {
      el.dataset.navBgMode = ($("nav-bg-mode").value || "solid").toLowerCase();
      setUiVisibility();
      applyBackground(el);
    });

    bindVal("nav-bg-solid", (el) => {
      el.dataset.navBgSolid = $("nav-bg-solid").value || "#111827";
      applyBackground(el);
    });

    bindVal("nav-grad-type", (el) => { el.dataset.navGradType = $("nav-grad-type").value || "linear"; applyBackground(el); });
    bindVal("nav-grad-angle", (el) => { el.dataset.navGradAngle = $("nav-grad-angle").value || "135"; applyBackground(el); });
    bindVal("nav-grad-pos-x", (el) => { el.dataset.navGradPosX = $("nav-grad-pos-x").value || "50"; applyBackground(el); });
    bindVal("nav-grad-pos-y", (el) => { el.dataset.navGradPosY = $("nav-grad-pos-y").value || "50"; applyBackground(el); });

    bindVal("nav-grad-from", (el) => { el.dataset.navGradFrom = $("nav-grad-from").value || "#0ea5e9"; applyBackground(el); });
    bindVal("nav-grad-mid", (el) => { el.dataset.navGradMid = $("nav-grad-mid").value || "#a855f7"; applyBackground(el); });
    bindVal("nav-grad-to", (el) => { el.dataset.navGradTo = $("nav-grad-to").value || "#111827"; applyBackground(el); });

    bindChk("nav-grad-use-mid", (el) => {
      el.dataset.navGradUseMid = $("nav-grad-use-mid").checked ? "1" : "0";
      applyBackground(el);
    });

    bindVal("nav-grad-preset", (el) => {
      const key = ($("nav-grad-preset").value || "").trim();
      el.dataset.navGradPreset = key;

      if (key && gradPresets[key]) {
        const p = gradPresets[key];
        el.dataset.navBgMode = "gradient";
        el.dataset.navGradType = p.type;
        el.dataset.navGradAngle = String(p.angle);
        el.dataset.navGradPosX = String(p.posX);
        el.dataset.navGradPosY = String(p.posY);
        el.dataset.navGradFrom = p.from;
        el.dataset.navGradMid = p.mid;
        el.dataset.navGradTo = p.to;
        el.dataset.navGradUseMid = p.useMid ? "1" : "0";
        window.syncNavInputs?.(el);
      } else {
        setUiVisibility();
        applyBackground(el);
      }
    });

    const swap13 = $("nav-grad-swap");
    if (swap13) swap13.onclick = () => applyIfActive((el) => {
      const a = el.dataset.navGradFrom || "#0ea5e9";
      const c = el.dataset.navGradTo || "#111827";
      el.dataset.navGradFrom = c;
      el.dataset.navGradTo = a;
      window.syncNavInputs?.(el);
    });

    const swap12 = $("nav-grad-swap-12");
    if (swap12) swap12.onclick = () => applyIfActive((el) => {
      const a = el.dataset.navGradFrom || "#0ea5e9";
      const b = el.dataset.navGradMid || "#a855f7";
      el.dataset.navGradFrom = b;
      el.dataset.navGradMid = a;
      window.syncNavInputs?.(el);
    });

    const swap23 = $("nav-grad-swap-23");
    if (swap23) swap23.onclick = () => applyIfActive((el) => {
      const b = el.dataset.navGradMid || "#a855f7";
      const c = el.dataset.navGradTo || "#111827";
      el.dataset.navGradMid = c;
      el.dataset.navGradTo = b;
      window.syncNavInputs?.(el);
    });

    const randomBtn = $("nav-grad-random");
    if (randomBtn) randomBtn.onclick = () => applyIfActive((el) => {
      const keys = Object.keys(gradPresets || {}).filter(Boolean);
      if (!keys.length) return;
      const pick = keys[Math.floor(Math.random() * keys.length)];
      const p = gradPresets[pick];

      el.dataset.navGradPreset = pick;
      el.dataset.navBgMode = "gradient";
      el.dataset.navGradType = p.type;
      el.dataset.navGradAngle = String(p.angle);
      el.dataset.navGradPosX = String(p.posX);
      el.dataset.navGradPosY = String(p.posY);
      el.dataset.navGradFrom = p.from;
      el.dataset.navGradMid = p.mid;
      el.dataset.navGradTo = p.to;
      el.dataset.navGradUseMid = p.useMid ? "1" : "0";

      window.syncNavInputs?.(el);
    });

  }

  function hookSelectElement() {
    if (typeof window.selectElement !== "function") return;
    if (window.selectElement.__sgNavHooked) return;

    const orig = window.selectElement;
    window.selectElement = function (el) {
      orig(el);

      const sec = $("nav-edit-section");
      if (!sec) return;

      if (isNav(el)) {
        sec.style.display = "block";
        window.syncNavInputs?.(el);
      } else {
        sec.style.display = "none";
      }
    };

    window.selectElement.__sgNavHooked = true;
  }

  function hookGetElementData() {
    if (typeof window.getElementData !== "function") return;
    if (window.getElementData.__sgNavHooked) return;

    const orig = window.getElementData;
    window.getElementData = function (el) {
      const data = orig(el);

      if (isNav(el)) {
        ensureDefaults(el);
        const cfg = getCfg(el);

        data.content = "";
        data.navItems = el.dataset.navItems || "";

        data.navOrientation = cfg.orientation;
        data.navAlign = cfg.align;
        data.navGap = String(cfg.gap);
        data.navPad = String(cfg.pad);

        data.navLinkPadX = String(cfg.linkPadX);
        data.navLinkPadY = String(cfg.linkPadY);
        data.navLinkRadius = String(cfg.linkRadius);
        data.navUnderline = cfg.underline ? "1" : "0";

        data.navLinkColor = cfg.linkColor;
        data.navHoverBg = cfg.hoverBg;
        data.navHoverColor = cfg.hoverColor;
        data.navActiveBg = cfg.activeBg;
        data.navActiveColor = cfg.activeColor;

        data.navActiveMode = cfg.activeMode;

        data.navLayout = cfg.layout;
        data.navHookMode = cfg.hookMode;
        data.navWrap = cfg.wrap ? "1" : "0";
        data.navStretch = cfg.stretch ? "1" : "0";
        data.navDivider = cfg.divider ? "1" : "0";

        data.navLinkBorderW = String(parseInt(el.dataset.navLinkBorderW || "1", 10) || 1);
        data.navLinkBorderColor = el.dataset.navLinkBorderColor || "#ffffff";
        data.navLinkShadow = cfg.linkShadow;

        data.navHtmlId = cfg.htmlId;
        data.navHtmlClass = cfg.htmlClass;
        data.navBrandText = cfg.brandText;
        data.navBrandHref = cfg.brandHref;
        data.navJustify = cfg.justify;
        data.navVJustify = cfg.vJustify;
        data.navName = cfg.navName;
        data.navBgMode = cfg.bgMode;
        data.navBgSolid = cfg.bgSolid;

        data.navGradType = cfg.gradType;
        data.navGradAngle = String(cfg.gradAngle);
        data.navGradPosX = String(cfg.gradPosX);
        data.navGradPosY = String(cfg.gradPosY);
        data.navGradFrom = cfg.gradFrom;
        data.navGradMid = cfg.gradMid;
        data.navGradTo = cfg.gradTo;
        data.navGradUseMid = cfg.gradUseMid ? "1" : "0";
        data.navGradPreset = cfg.gradPreset;
        data.navDividerText  = el.dataset.navDividerText  || "|";
        data.navDividerSize  = el.dataset.navDividerSize  || "14";
        data.navDividerColor = el.dataset.navDividerColor || "#ffffff";

      }

      return data;
    };

    window.getElementData.__sgNavHooked = true;
  }

  function init() {
    bindNavUI();
    hookSelectElement();
    hookGetElementData();

    let tries = 0;
    const t = setInterval(() => {
      tries++;
      hookSelectElement();
      hookGetElementData();
      if (window.selectElement?.__sgNavHooked && window.getElementData?.__sgNavHooked) clearInterval(t);
      if (tries >= 80) clearInterval(t);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
