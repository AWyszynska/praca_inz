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

  function hexToRgba(color, alpha) {
    const c = String(color || "").trim();
    if (!c) return `rgba(255,255,255,${alpha})`;

    const m3 = c.match(/^#([0-9a-f]{3})$/i);
    if (m3) {
      const r = parseInt(m3[1][0] + m3[1][0], 16);
      const g = parseInt(m3[1][1] + m3[1][1], 16);
      const b = parseInt(m3[1][2] + m3[1][2], 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    const m6 = c.match(/^#([0-9a-f]{6})$/i);
    if (m6) {
      const r = parseInt(m6[1].slice(0, 2), 16);
      const g = parseInt(m6[1].slice(2, 4), 16);
      const b = parseInt(m6[1].slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return c;
  }

  function linkShadowCss(name) {
    return (name === "none") ? "none" : "0 6px 14px rgba(0,0,0,0.10)";
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
      return {
        label,
        href,
        key: key || pageKey,
        pageKey,
      };
    });

    return items.length ? items : [
      { label: "Strona główna", href: "?page=home", key: "home", pageKey: "home" },
      { label: "O nas", href: "?page=about", key: "about", pageKey: "about" },
      { label: "Kontakt", href: "?page=kontakt", key: "kontakt", pageKey: "kontakt" },
    ];
  }

  function guessPageKey(href) {
    const m = String(href ?? "").match(/[?&]page=([^&]+)/i);
    return m ? m[1] : "";
  }

  function isNav(el) {
    return !!el && el.dataset && el.dataset.type === "nav";
  }

  function ensureDefaults(el) {
    if (!isNav(el)) return;

    if (el.dataset.navItems === undefined) {
      el.dataset.navItems =
        "Strona główna|?page=home\nO nas|?page=about\nUsługi|?page=uslugi\nKontakt|?page=kontakt";
    }

    if (!el.dataset.navOrientation) el.dataset.navOrientation = "horizontal"; 
    if (!el.dataset.navAlign) el.dataset.navAlign = "left"; 

    if (!el.dataset.navJustify) el.dataset.navJustify = "start";
    if (!el.dataset.navVJustify) el.dataset.navVJustify = "top";
    if (el.dataset.navName === undefined) el.dataset.navName = "";

    if (!el.dataset.navLayout) el.dataset.navLayout = "pills";
    if (!el.dataset.navHookMode) el.dataset.navHookMode = "none";

    if (el.dataset.navWrap === undefined) el.dataset.navWrap = "0";
    if (el.dataset.navStretch === undefined) el.dataset.navStretch = "0";
    if (el.dataset.navDivider === undefined) el.dataset.navDivider = "0";
    if (!el.dataset.navGap) el.dataset.navGap = "10";
    if (!el.dataset.navPad) el.dataset.navPad = "10";

    if (!el.dataset.navLinkPadX) el.dataset.navLinkPadX = "12";
    if (!el.dataset.navLinkPadY) el.dataset.navLinkPadY = "8";
    if (!el.dataset.navLinkRadius) el.dataset.navLinkRadius = "8";
    if (el.dataset.navUnderline === undefined) el.dataset.navUnderline = "0";

    if (!el.dataset.navLinkBorderW) el.dataset.navLinkBorderW = "1";
    if (!el.dataset.navLinkBorderColor) el.dataset.navLinkBorderColor = "#ffffff";
    if (!el.dataset.navLinkShadow) el.dataset.navLinkShadow = "soft";

    if (!el.dataset.navLinkColor) el.dataset.navLinkColor = "#ffffff";
    if (!el.dataset.navHoverBg) el.dataset.navHoverBg = "rgba(255,255,255,0.12)";
    if (!el.dataset.navHoverColor) el.dataset.navHoverColor = "#ffffff";
    if (!el.dataset.navActiveBg) el.dataset.navActiveBg = "rgba(255,255,255,0.18)";
    if (!el.dataset.navActiveColor) el.dataset.navActiveColor = "#ffffff";

    if (!el.dataset.navActiveMode) el.dataset.navActiveMode = "query_page"; 

    if (!el.dataset.navHtmlId) el.dataset.navHtmlId = "";
    if (!el.dataset.navHtmlClass) el.dataset.navHtmlClass = "";
    if (!el.dataset.navBrandText) el.dataset.navBrandText = "";
    if (!el.dataset.navBrandHref) el.dataset.navBrandHref = "#";
    if (!el.style.width) el.style.width = "680px";
    if (!el.style.height) el.style.height = "56px";
    if (!el.style.backgroundColor) el.style.backgroundColor = "#111827";
    if (!el.style.border || el.style.border === "none") el.style.border = "1px solid rgba(255,255,255,0.08)";
    if (!el.style.borderRadius) el.style.borderRadius = "12px";
    if (!el.style.boxShadow || el.style.boxShadow === "none") el.style.boxShadow = "0 10px 24px rgba(0,0,0,0.18)";
    if (!el.style.color) el.style.color = "#ffffff";
    if (!el.style.fontSize) el.style.fontSize = "15px";
    if (!el.style.fontFamily) el.style.fontFamily = "'Segoe UI', sans-serif";
  }

  function getCfg(el) {
    ensureDefaults(el);

    const layout = el.dataset.navLayout || "pills";
    const hookMode = el.dataset.navHookMode || "none";

    const orientation = el.dataset.navOrientation || "horizontal";
    const align = el.dataset.navAlign || "left";
    const justify = el.dataset.navJustify || "start";
    const vJustify = el.dataset.navVJustify || "top";
    const navName = (el.dataset.navName || "").trim();
    const wrap = (el.dataset.navWrap === "1");
    const stretch = (el.dataset.navStretch === "1");
    const divider = (el.dataset.navDivider === "1");
    const gap = clamp(parseInt(el.dataset.navGap || "10", 10) || 10, 0, 80);
    const pad = clamp(parseInt(el.dataset.navPad || "10", 10) || 10, 0, 80);

    const linkPadX = clamp(parseInt(el.dataset.navLinkPadX || "12", 10) || 12, 0, 80);
    const linkPadY = clamp(parseInt(el.dataset.navLinkPadY || "8", 10) || 8, 0, 80);
    const linkRadius = clamp(parseInt(el.dataset.navLinkRadius || "8", 10) || 8, 0, 40);

    const linkBorderW = clamp(parseInt(el.dataset.navLinkBorderW || "1", 10) || 1, 0, 10);
    const linkBorderColor = el.dataset.navLinkBorderColor || "#ffffff";
    const linkBorderCss = (linkBorderW === 0) ? "none" : `${linkBorderW}px solid ${hexToRgba(linkBorderColor, 0.12)}`;
    const linkShadow = el.dataset.navLinkShadow || "soft";

    const underline = (el.dataset.navUnderline === "1");

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
    return "flex-start"; 
  }

  function buildLinksHtml(cfg) {
    const parts = [];

    if (cfg.brandText) {
      parts.push(
        `<a class="sgnav__brand" href="${escapeAttr(cfg.brandHref || "#")}" data-key="brand" data-page="">${escapeHtml(cfg.brandText)}</a>`
      );
      if (cfg.divider && cfg.items.length) parts.push(`<span class="sgnav__div" aria-hidden="true"></span>`);
    }

    cfg.items.forEach((it, idx) => {
      const key = (it.key || it.pageKey || "").trim();
      const dp = it.pageKey ? ` data-page="${escapeAttr(it.pageKey)}"` : "";
      const dk = key ? ` data-key="${escapeAttr(key)}"` : "";
      parts.push(`<a class="sgnav__link" href="${escapeAttr(it.href)}"${dp}${dk}>${escapeHtml(it.label)}</a>`);
      if (cfg.divider && idx < cfg.items.length - 1) parts.push(`<span class="sgnav__div" aria-hidden="true"></span>`);
    });

    return parts.join("");
  }

function buildEditorMarkup(el) {
  const cfg = getCfg(el);
  const idSafe = String(el.dataset.id || "nav").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cls = `sgnav_${idSafe}__editor`;

  const flexDir = (cfg.orientation === "vertical") ? "column" : "row";
  const justify = (cfg.orientation === "vertical") ? vJustifyFromMode(cfg.vJustify) : justifyFromMode(cfg.justify);
  const alignItems = (cfg.orientation === "vertical") ? alignItemsFromAlign(cfg.align) : "center";

  const wrap = (cfg.orientation === "horizontal" && cfg.wrap) ? "wrap" : "nowrap";
  const deco = cfg.underline ? "underline" : "none";

  const dividerSize = Math.max(6, Math.round(cfg.gap / 2));
  const linksHtml = buildLinksHtml(cfg);

  return `
<style>
  .${cls}{
    width:100%;
    height:100%;
    box-sizing:border-box;
    padding:${cfg.pad}px;
    display:flex;
    flex-direction:${flexDir};
    justify-content:${justify};
    align-items:${alignItems};
    flex-wrap:${wrap};
    gap:${cfg.gap}px;
    pointer-events:none;
  }

  .${cls} .sgnav__div{
    flex:0 0 auto;
    width:${cfg.orientation === "vertical" ? "100%" : "1px"};
    height:${cfg.orientation === "vertical" ? "1px" : `${dividerSize}px`};
    background:rgba(255,255,255,0.18);
    opacity:0.6;
  }

  .${cls} a,
  .${cls} a:visited{
    font:inherit;
    line-height:1;
    margin:0;
    box-sizing:border-box;
    position:relative;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:${cfg.linkPadY}px ${cfg.linkPadX}px;
    color:${escapeAttr(cfg.linkColor)};
    text-decoration:${deco};
    background:transparent;
    white-space:nowrap;
    user-select:none;
    transition:background .15s ease, color .15s ease, transform .12s ease, border-color .15s ease;
  }

  .${cls} a.sgnav__link{${cfg.stretch ? "flex:1 1 0;" : ""}}

  .${cls}[data-layout="pills"] a{
    border:${escapeAttr(cfg.linkBorderCss)};
    border-radius:${cfg.linkRadius}px;
    box-shadow:${escapeAttr(linkShadowCss(cfg.linkShadow))};
  }

  .${cls}[data-layout="tabs"] a,
  .${cls}[data-layout="underline"] a{
    border:none;
    box-shadow:none;
    border-bottom:2px solid transparent;
    border-radius:${cfg.layout === "tabs" ? "10px 10px 0 0" : "0"};
    text-decoration:none;
  }

  .${cls}[data-layout="sidebar"]{
    align-items:stretch;
  }
  .${cls}[data-layout="sidebar"] a{
    justify-content:flex-start;
    width:100%;
    border:none;
    box-shadow:none;
    border-radius:10px;
    text-decoration:none;
  }
  .${cls}[data-layout="sidebar"] a::before{
    content:"";
    position:absolute;
    left:0;
    top:8px;
    bottom:8px;
    width:3px;
    border-radius:999px;
    background:transparent;
  }

  .${cls} a:hover{
    background:${escapeAttr(cfg.hoverBg)};
    color:${escapeAttr(cfg.hoverColor)};
    transform:translateY(-1px);
  }
  .${cls}[data-layout="tabs"] a:hover,
  .${cls}[data-layout="underline"] a:hover,
  .${cls}[data-layout="sidebar"] a:hover{
    transform:none;
  }

  .${cls} a.active{
    background:${escapeAttr(cfg.activeBg)};
    color:${escapeAttr(cfg.activeColor)};
  }
  .${cls}[data-layout="tabs"] a.active,
  .${cls}[data-layout="underline"] a.active{
    border-bottom-color:${escapeAttr(cfg.activeColor)};
  }
  .${cls}[data-layout="sidebar"] a.active::before{
    background:${escapeAttr(cfg.activeColor)};
  }
</style>
<nav class="${cls}" data-layout="${escapeAttr(cfg.layout)}" data-orientation="${escapeAttr(cfg.orientation)}" data-active-mode="${escapeAttr(cfg.activeMode)}">${linksHtml}</nav>
  `.trim();
}
  function buildRuntimeMarkup(el) {
    const cfg = getCfg(el);
    const idSafe = String(el.dataset.id || "nav").replace(/[^a-zA-Z0-9_-]/g, "");
    const navClass = `sgnav-${idSafe}`;

    const flexDir = (cfg.orientation === "vertical") ? "column" : "row";
    const justify = (cfg.orientation === "vertical") ? vJustifyFromMode(cfg.vJustify) : justifyFromMode(cfg.justify);
    const alignItems = (cfg.orientation === "vertical") ? alignItemsFromAlign(cfg.align) : "center";
    const wrap = (cfg.orientation === "horizontal" && cfg.wrap) ? "wrap" : "nowrap";
    const deco = cfg.underline ? "underline" : "none";

    const dividerSize = Math.max(6, Math.round(cfg.gap / 2));
    const linksHtml = buildLinksHtml(cfg);

    const htmlId = cfg.htmlId ? ` id="${escapeAttr(cfg.htmlId)}"` : "";
    const extraClass = cfg.htmlClass ? ` ${escapeAttr(cfg.htmlClass)}` : "";
    const navNameAttr = cfg.navName ? ` data-nav-name="${escapeAttr(cfg.navName)}"` : "";

    const js = `
(function(){
  try{
    var root = document.querySelector('.${navClass}');
    if(!root) return;
    var mode = root.getAttribute('data-active-mode') || 'none';
    var hookMode = root.getAttribute('data-hook-mode') || 'none';

    function allLinks(){ return root.querySelectorAll('a.sgnav__link, a.sgnav__brand'); }
    function clearActive(){ allLinks().forEach(function(a){ a.classList.remove('active'); }); }

    function setActiveByPage(){
      var sp = new URLSearchParams(window.location.search || '');
      var page = sp.get('page') || '';
      if(!page) return;
      allLinks().forEach(function(a){
        var p = a.getAttribute('data-page') || '';
        if(p && p === page) a.classList.add('active');
      });
    }

    function setActiveByUrl(){
      var cur = window.location.pathname + window.location.search;
      allLinks().forEach(function(a){
        var href = a.getAttribute('href') || '';
        if(href === cur || (href && cur.indexOf(href) !== -1)) a.classList.add('active');
      });
    }

    if(mode === 'query_page') { clearActive(); setActiveByPage(); }
    else if(mode === 'url') { clearActive(); setActiveByUrl(); }

    if(hookMode === 'event'){
      root.addEventListener('click', function(ev){
        var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
        if(!a || !root.contains(a)) return;
        ev.preventDefault();
        var detail = {
          key: a.getAttribute('data-key') || '',
          href: a.getAttribute('href') || '',
          label: (a.textContent || '').trim(),
          navName: root.getAttribute('data-nav-name') || '',
        };
        root.dispatchEvent(new CustomEvent('sg:navigate', { detail: detail, bubbles: true }));
      }, true);
    }
  }catch(e){}
})();`.trim();

    return `
<style>
  .${navClass}{
    width:100%;
    height:100%;
    box-sizing:border-box;
    padding:${cfg.pad}px;
    display:flex;
    flex-direction:${flexDir};
    justify-content:${justify};
    align-items:${alignItems};
    flex-wrap:${wrap};
    gap:${cfg.gap}px;
  }

  .${navClass} .sgnav__div{
    flex:0 0 auto;
    width:${cfg.orientation === "vertical" ? "100%" : "1px"};
    height:${cfg.orientation === "vertical" ? "1px" : `${dividerSize}px`};
    background:${hexToRgba(cfg.activeColor, 0.18)};
    opacity:0.6;
  }

  .${navClass} a,
  .${navClass} a:visited{
    font:inherit;
    line-height:1;
    margin:0;
    box-sizing:border-box;
    position:relative;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:${cfg.linkPadY}px ${cfg.linkPadX}px;
    color:${cfg.linkColor};
    text-decoration:${deco};
    background:transparent;
    white-space:nowrap;
    user-select:none;
    transition:background .15s ease, color .15s ease, transform .12s ease, border-color .15s ease;
  }

  .${navClass} a.sgnav__link{${cfg.stretch ? "flex:1 1 0;" : ""}}

  .${navClass}[data-layout="pills"] a{
    border:${cfg.linkBorderCss};
    border-radius:${cfg.linkRadius}px;
    box-shadow:${linkShadowCss(cfg.linkShadow)};
  }

  .${navClass}[data-layout="tabs"] a,
  .${navClass}[data-layout="underline"] a{
    border:none;
    box-shadow:none;
    border-bottom:2px solid transparent;
    border-radius:${cfg.layout === "tabs" ? "10px 10px 0 0" : "0"};
    text-decoration:none;
  }

  .${navClass}[data-layout="sidebar"]{ align-items:stretch; }
  .${navClass}[data-layout="sidebar"] a{
    justify-content:flex-start;
    width:100%;
    border:none;
    box-shadow:none;
    border-radius:10px;
    text-decoration:none;
  }
  .${navClass}[data-layout="sidebar"] a::before{
    content:"";
    position:absolute;
    left:0;
    top:8px;
    bottom:8px;
    width:3px;
    border-radius:999px;
    background:transparent;
  }

  .${navClass} a:hover{ background:${cfg.hoverBg}; color:${cfg.hoverColor}; transform:translateY(-1px); }
  .${navClass}[data-layout="tabs"] a:hover,
  .${navClass}[data-layout="underline"] a:hover,
  .${navClass}[data-layout="sidebar"] a:hover{ transform:none; }

  .${navClass} a.active{ background:${cfg.activeBg}; color:${cfg.activeColor}; }
  .${navClass}[data-layout="tabs"] a.active,
  .${navClass}[data-layout="underline"] a.active{ border-bottom-color:${cfg.activeColor}; }
  .${navClass}[data-layout="sidebar"] a.active::before{ background:${cfg.activeColor}; }
</style>
<nav${htmlId} class="${navClass}${extraClass}" data-layout="${escapeAttr(cfg.layout)}" data-orientation="${escapeAttr(cfg.orientation)}" data-hook-mode="${escapeAttr(cfg.hookMode)}"${navNameAttr} data-active-mode="${escapeAttr(cfg.activeMode)}">
  ${linksHtml}
</nav>
<script>${js}</script>
    `.trim();
  }

  function updateNavVisuals(el) {
    if (!isNav(el)) return;
    ensureDefaults(el);
    el.contentEditable = "false";
    el.innerHTML = buildEditorMarkup(el);
    const panelPrev = $("nav-panel-preview");
    if (panelPrev) panelPrev.innerHTML = buildEditorMarkup(el);
  }

  window.updateNavVisuals = updateNavVisuals;

  window.createNavElement = function createNavElement(clientX, clientY) {
    if (!inEditor()) return;
    if (!window.canvas) return;
    if (typeof window.zCounter === "undefined") window.zCounter = 1;

    const host = (typeof window.activeContainer !== "undefined" && window.activeContainer) ? window.activeContainer : canvas;
    const rect = host.getBoundingClientRect();

    const lx = Number.isFinite(clientX) ? (clientX - rect.left) : pointer.x;
    const ly = Number.isFinite(clientY) ? (clientY - rect.top) : pointer.y;

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

    navEl.onclick = (ev) => { ev.stopPropagation(); window.selectElement?.(navEl); };
    window.selectElement?.(navEl);
    window.refreshLayers?.();

    return navEl;
  };

  window.syncNavInputs = function syncNavInputs(el) {
    if (!isNav(el)) return;
    ensureDefaults(el);

    const cfg = getCfg(el);

    const setVal = (id, v) => { const n = $(id); if (n) n.value = String(v ?? ""); };
    const setChk = (id, v) => { const n = $(id); if (n) n.checked = !!v; };

    setVal("nav-items", el.dataset.navItems || "");
    setVal("nav-layout", cfg.layout);
    setVal("nav-hook-mode", cfg.hookMode);

    setVal("nav-orientation", cfg.orientation);
    setVal("nav-align", cfg.align);
    setVal("nav-justify", cfg.justify);
    setVal("nav-v-justify", cfg.vJustify);
    setVal("nav-name", cfg.navName);
    setChk("nav-wrap", cfg.wrap);
    setChk("nav-stretch", cfg.stretch);
    setChk("nav-divider", cfg.divider);
    setVal("nav-gap", cfg.gap);
    setVal("nav-pad", cfg.pad);

    setVal("nav-link-pad-x", cfg.linkPadX);
    setVal("nav-link-pad-y", cfg.linkPadY);
    setVal("nav-link-radius", cfg.linkRadius);

    setVal("nav-link-border-w", (cfg.linkBorderCss === "none") ? 0 : (parseInt(el.dataset.navLinkBorderW || "1", 10) || 1));
    const borderColor = (typeof window.rgbToHex === "function")
      ? (rgbToHex(el.dataset.navLinkBorderColor || "#ffffff") || "#ffffff")
      : (String(el.dataset.navLinkBorderColor || "#ffffff").startsWith("#") ? el.dataset.navLinkBorderColor : "#ffffff");
    setVal("nav-link-border-color", borderColor);
    setVal("nav-link-shadow", cfg.linkShadow);

    setChk("nav-underline", cfg.underline);

    setVal("nav-link-color", cfg.linkColor);
    setVal("nav-hover-bg", cfg.hoverBg);
    setVal("nav-hover-color", cfg.hoverColor);
    setVal("nav-active-bg", cfg.activeBg);
    setVal("nav-active-color", cfg.activeColor);

    setVal("nav-active-mode", cfg.activeMode);

    setVal("nav-html-id", cfg.htmlId);
    setVal("nav-html-class", cfg.htmlClass);
    setVal("nav-brand-text", cfg.brandText);
    setVal("nav-brand-href", cfg.brandHref);

    setVal("nav-w", parseInt(el.style.width) || 680);
    setVal("nav-h", parseInt(el.style.height) || 56);

    setVal("nav-bg", (typeof rgbToHex === "function") ? rgbToHex(el.style.backgroundColor) : "#111827");
    const border = el.style.border || "";
    const bw = (border.match(/(\d+)px/) || [])[1] || "1";
    setVal("nav-border-w", bw);
    const bs = (el.style.boxShadow || "none").toLowerCase();
    const shadowPreset =
      bs === "none" ? "none"
      : (bs.includes("44px") || bs.includes("0.22")) ? "strong"
      : "soft";
    setVal("nav-shadow", shadowPreset);

    setVal("nav-radius", parseInt(el.style.borderRadius) || 12);

    updateNavVisuals(el);
  };

  function applyShadow(el, preset) {
    if (preset === "none") el.style.boxShadow = "none";
    else if (preset === "strong") el.style.boxShadow = "0 18px 44px rgba(2,6,23,.22)";
    else el.style.boxShadow = "0 10px 24px rgba(2,6,23,.14)";
  }

  function bindNavUI() {
    const bindOnce = (id, ev, fn) => {
      const n = $(id);
      if (!n) return;
      const key = `__sgNavBound_${ev}`;
      if (n.dataset[key] === "1") return;
      n.dataset[key] = "1";
      n.addEventListener(ev, fn);
    };

    const activeNav = () => (window.activeElement && isNav(window.activeElement)) ? window.activeElement : null;
    const map = [
      ["nav-layout", "navLayout"],
      ["nav-hook-mode", "navHookMode"],
      ["nav-justify", "navJustify"],
      ["nav-v-justify", "navVJustify"],
      ["nav-name", "navName"],
      ["nav-items", "navItems"],
      ["nav-orientation", "navOrientation"],
      ["nav-align", "navAlign"],
      ["nav-gap", "navGap"],
      ["nav-pad", "navPad"],
      ["nav-link-pad-x", "navLinkPadX"],
      ["nav-link-pad-y", "navLinkPadY"],
      ["nav-link-radius", "navLinkRadius"],
      ["nav-link-color", "navLinkColor"],
      ["nav-hover-bg", "navHoverBg"],
      ["nav-hover-color", "navHoverColor"],
      ["nav-active-bg", "navActiveBg"],
      ["nav-active-color", "navActiveColor"],
      ["nav-active-mode", "navActiveMode"],
      ["nav-link-border-w", "navLinkBorderW"],
      ["nav-link-border-color", "navLinkBorderColor"],
      ["nav-link-shadow", "navLinkShadow"],
      ["nav-html-id", "navHtmlId"],
      ["nav-html-class", "navHtmlClass"],
      ["nav-brand-text", "navBrandText"],
      ["nav-brand-href", "navBrandHref"],
    ];

    map.forEach(([id, key]) => {
      bindOnce(id, "input", (e) => {
        const el = activeNav(); if (!el) return;
        el.dataset[key] = e.target.value;
        updateNavVisuals(el);
        window.refreshLayers?.();
      });
      bindOnce(id, "change", (e) => {
        const el = activeNav(); if (!el) return;
        el.dataset[key] = e.target.value;
        updateNavVisuals(el);
        window.refreshLayers?.();
      });
    });



    bindOnce("nav-wrap", "change", (e) => {
      const el = activeNav(); if (!el) return;
      el.dataset.navWrap = e.target.checked ? "1" : "0";
      updateNavVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("nav-stretch", "change", (e) => {
      const el = activeNav(); if (!el) return;
      el.dataset.navStretch = e.target.checked ? "1" : "0";
      updateNavVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("nav-divider", "change", (e) => {
      const el = activeNav(); if (!el) return;
      el.dataset.navDivider = e.target.checked ? "1" : "0";
      updateNavVisuals(el);
      window.refreshLayers?.();
    });
    bindOnce("nav-underline", "change", (e) => {
      const el = activeNav(); if (!el) return;
      el.dataset.navUnderline = e.target.checked ? "1" : "0";
      updateNavVisuals(el);
      window.refreshLayers?.();
    });
    bindOnce("nav-w", "input", (e) => {
      const el = activeNav(); if (!el) return;
      el.style.width = (parseInt(e.target.value || "680", 10) || 680) + "px";
      updateNavVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("nav-h", "input", (e) => {
      const el = activeNav(); if (!el) return;
      el.style.height = (parseInt(e.target.value || "56", 10) || 56) + "px";
      updateNavVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("nav-bg", "input", (e) => {
      const el = activeNav(); if (!el) return;
      el.style.backgroundColor = e.target.value;
      updateNavVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("nav-border-w", "input", (e) => {
      const el = activeNav(); if (!el) return;
      const bw = clamp(parseInt(e.target.value || "1", 10) || 1, 0, 10);
      el.style.border = (bw === 0) ? "none" : `${bw}px solid rgba(255,255,255,0.08)`;
      updateNavVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("nav-radius", "input", (e) => {
      const el = activeNav(); if (!el) return;
      el.style.borderRadius = clamp(parseInt(e.target.value || "12", 10) || 12, 0, 40) + "px";
      updateNavVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("nav-shadow", "change", (e) => {
      const el = activeNav(); if (!el) return;
      applyShadow(el, e.target.value);
      updateNavVisuals(el);
      window.refreshLayers?.();
    });
    bindOnce("nav-preset-dark", "click", () => {
      const el = activeNav(); if (!el) return;
      el.style.backgroundColor = "#111827";
      el.style.border = "1px solid rgba(255,255,255,0.08)";
      el.style.color = "#ffffff";

      el.dataset.navLinkColor = "#ffffff";
      el.dataset.navHoverBg = "rgba(255,255,255,0.12)";
      el.dataset.navHoverColor = "#ffffff";
      el.dataset.navActiveBg = "rgba(255,255,255,0.18)";
      el.dataset.navActiveColor = "#ffffff";

      updateNavVisuals(el);
      window.syncNavInputs?.(el);
      window.refreshLayers?.();
    });

    bindOnce("nav-preset-light", "click", () => {
      const el = activeNav(); if (!el) return;
      el.style.backgroundColor = "#ffffff";
      el.style.border = "1px solid #e2e8f0";
      el.style.color = "#0f172a";

      el.dataset.navLinkColor = "#0f172a";
      el.dataset.navHoverBg = "#f1f5f9";
      el.dataset.navHoverColor = "#0f172a";
      el.dataset.navActiveBg = "#e2e8f0";
      el.dataset.navActiveColor = "#0f172a";

      updateNavVisuals(el);
      window.syncNavInputs?.(el);
      window.refreshLayers?.();
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
