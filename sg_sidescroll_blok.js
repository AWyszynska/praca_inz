
(() => {
  const STYLE_ID = "sg-scroll-block-style-v3";

  function ensureCss() {
    if (document.getElementById(STYLE_ID)) return;

    const css = `
      .sg-scroll-host{
        position: fixed;
        left: 0; top: 0;
        width: 0; height: 0;
        pointer-events: none;
        overflow: visible;
        z-index: 2147482000;
      }
      .sg-scroll-host .sg-ext-scroll{ pointer-events: auto; }

      .sg-scroll-frame{
        overflow: auto;
        scrollbar-width: none;
      }
      .sg-scroll-frame::-webkit-scrollbar{ width: 0; height: 0; }

      .sg-ext-scroll{
        position: absolute;
        z-index: 9999;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      }

      .sg-ext-scroll input[type="range"]{
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 100%;
        background: transparent;
        margin: 0;
        padding: 0;
        cursor: pointer;
      }

      .sg-ext-scroll input[type="range"]::-webkit-slider-runnable-track{
        height: 100%;
        background: var(--sgTrack, rgba(148,163,184,.35));
        border-radius: var(--sgRadius, 10px);
      }
      .sg-ext-scroll input[type="range"]::-webkit-slider-thumb{
        -webkit-appearance: none;
        appearance: none;
        width: var(--sgThumbSize, 12px);
        height: 100%;
        background: var(--sgThumb, rgba(15,23,42,.55));
        border-radius: var(--sgRadius, 10px);
      }
      .sg-ext-scroll input[type="range"]:hover::-webkit-slider-thumb{
        background: var(--sgThumbHover, rgba(15,23,42,.75));
      }

      .sg-ext-scroll input[type="range"]::-moz-range-track{
        height: 100%;
        background: var(--sgTrack, rgba(148,163,184,.35));
        border-radius: var(--sgRadius, 10px);
      }
      .sg-ext-scroll input[type="range"]::-moz-range-thumb{
        width: var(--sgThumbSize, 12px);
        height: 100%;
        background: var(--sgThumb, rgba(15,23,42,.55));
        border: none;
        border-radius: var(--sgRadius, 10px);
      }
      .sg-ext-scroll input[type="range"]:hover::-moz-range-thumb{
        background: var(--sgThumbHover, rgba(15,23,42,.75));
      }

      .sg-scroll-fade{
        pointer-events: none;
        position: absolute;
        left: 0;
        right: 0;
        height: 24px;
        opacity: 0;
        transition: opacity .15s ease;
      }
      .sg-scroll-fade.top{
        top: 0;
        background: linear-gradient(to bottom, rgba(0,0,0,.18), rgba(0,0,0,0));
      }
      .sg-scroll-fade.bottom{
        bottom: 0;
        background: linear-gradient(to top, rgba(0,0,0,.18), rgba(0,0,0,0));
      }
    `;

    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function safeJsonParse(str) {
    try { return JSON.parse(str); } catch { return null; }
  }

  function normalizeCfg(cfg) {
    const out = Object.assign({
      enabled: true,
      axis: "y",
      ySide: "right",
      xSide: "bottom",
      thickness: 10,
      gap: 6,
      radius: 10,
      thumbSize: 12,
      track: "rgba(148,163,184,.35)",
      thumb: "rgba(15,23,42,.55)",
      thumbHover: "rgba(15,23,42,.75)",
      autoHide: false,    
      smooth: true,        
      wheel: true,
      wheelStep: 70,
      fadeHint: true,
      fadeOpacity: 0.22
    }, cfg || {});

    out.thickness   = clamp(+out.thickness || 10, 6, 28);
    out.gap         = clamp(+out.gap || 6, 0, 24);
    out.radius      = clamp(+out.radius || 10, 0, 999);
    out.thumbSize   = clamp(+out.thumbSize || 12, 8, 40);
    out.wheelStep   = clamp(+out.wheelStep || 70, 5, 400); 
    out.fadeOpacity = clamp(+out.fadeOpacity || 0.22, 0, 1);

    if (!["y","x","xy"].includes(out.axis)) out.axis = "y";
    if (!["left","right"].includes(out.ySide)) out.ySide = "right";
    if (!["bottom","top"].includes(out.xSide)) out.xSide = "bottom";

    out.autoHide = false;
    return out;
  }

  function mkScrollBox(cls) {
    const box = document.createElement("div");
    box.className = `sg-ext-scroll ${cls}`;
    const range = document.createElement("input");
    range.type = "range";
    range.min = "0";
    range.max = "1";
    range.step = "1";
    range.value = "0";
    box.appendChild(range);
    return { box, range };
  }

  function applyVars(targetEl, cfg) {
    targetEl.style.setProperty("--sgTrack", cfg.track);
    targetEl.style.setProperty("--sgThumb", cfg.thumb);
    targetEl.style.setProperty("--sgThumbHover", cfg.thumbHover);
    targetEl.style.setProperty("--sgRadius", cfg.radius + "px");
    targetEl.style.setProperty("--sgThumbSize", cfg.thumbSize + "px");
    targetEl.style.setProperty("--sgFade", String(cfg.fadeOpacity));
  }

  function ensureHost(frameEl) {
    if (frameEl._sgScrollHost && frameEl._sgScrollHost.parentNode) return frameEl._sgScrollHost;
    const host = document.createElement("div");
    host.className = "sg-scroll-host";
    host.dataset.sgExternal = "1";
    document.body.appendChild(host);
    frameEl._sgScrollHost = host;
    return host;
  }

  function attachFadeHints(host, cfg) {
    if (!cfg.fadeHint) return { top: null, bottom: null };

    let topFade = host.querySelector(".sg-scroll-fade.top");
    let bottomFade = host.querySelector(".sg-scroll-fade.bottom");

    if (!topFade) {
      topFade = document.createElement("div");
      topFade.className = "sg-scroll-fade top";
      host.appendChild(topFade);
    }
    if (!bottomFade) {
      bottomFade = document.createElement("div");
      bottomFade.className = "sg-scroll-fade bottom";
      host.appendChild(bottomFade);
    }

    topFade.style.opacity = "0";
    bottomFade.style.opacity = "0";

    return { top: topFade, bottom: bottomFade };
  }

  function updateFade(frameEl, fade, cfg) {
    if (!fade.top || !fade.bottom) return;

    const maxY = Math.max(0, frameEl.scrollHeight - frameEl.clientHeight);
    const y = frameEl.scrollTop;

    const base = (maxY > 0) ? String(cfg.fadeOpacity) : "0";
    fade.top.style.opacity = (y > 2) ? base : "0";
    fade.bottom.style.opacity = (y < maxY - 2) ? base : "0";
  }

  function setBoxGeometry(hostEl, frameEl, cfg, yCtl, xCtl) {
    const t = cfg.thickness;
    const g = cfg.gap;
    const r = frameEl.getBoundingClientRect();

    hostEl.style.left = r.left + "px";
    hostEl.style.top = r.top + "px";
    hostEl.style.width = r.width + "px";
    hostEl.style.height = r.height + "px";

    const outerW = r.width;
    const outerH = r.height;

    if (yCtl) {
      yCtl.box.style.width = t + "px";
      yCtl.box.style.height = outerH + "px";
      yCtl.box.style.top = "0px";
      yCtl.box.style.left = (cfg.ySide === "right" ? (outerW + g) : (-t - g)) + "px";

      const range = yCtl.range;
      range.style.position = "absolute";
      range.style.left = "50%";
      range.style.top = "50%";
      range.style.transform = "translate(-50%,-50%) rotate(-90deg)";
      range.style.transformOrigin = "center";
      range.style.width = outerH + "px";
      range.style.height = t + "px";
    }

    if (xCtl) {
      xCtl.box.style.height = t + "px";
      xCtl.box.style.width = outerW + "px";
      xCtl.box.style.left = "0px";
      xCtl.box.style.top = (cfg.xSide === "bottom" ? (outerH + g) : (-t - g)) + "px";

      const range = xCtl.range;
      range.style.position = "static";
      range.style.transform = "";
      range.style.width = "100%";
      range.style.height = "100%";
    }
  }

  function buildController(frameEl, rawCfg) {
    ensureCss();

    if (frameEl._sgScrollCtl && typeof frameEl._sgScrollCtl.dispose === "function") {
      try { frameEl._sgScrollCtl.dispose(); } catch {}
    }

    const cfg = normalizeCfg(rawCfg);
    if (!cfg.enabled) return null;

    const host = ensureHost(frameEl);
    host.innerHTML = "";

    frameEl.classList.add("sg-scroll-frame");

    const wantY = (cfg.axis === "y" || cfg.axis === "xy");
    const wantX = (cfg.axis === "x" || cfg.axis === "xy");

    const yCtl = wantY ? mkScrollBox("sg-y") : null;
    const xCtl = wantX ? mkScrollBox("sg-x") : null;

    if (yCtl) { applyVars(yCtl.box, cfg); host.appendChild(yCtl.box); }
    if (xCtl) { applyVars(xCtl.box, cfg); host.appendChild(xCtl.box); }

    const fade = attachFadeHints(host, cfg);

    let rafId = 0;
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        refresh();
      });
    };

    function computeRanges() {
      const maxY = Math.max(0, frameEl.scrollHeight - frameEl.clientHeight);
      const maxX = Math.max(0, frameEl.scrollWidth - frameEl.clientWidth);
      return { maxY, maxX };
    }

    function refresh() {
      const { maxY, maxX } = computeRanges();

      setBoxGeometry(host, frameEl, cfg, yCtl, xCtl);

      if (yCtl) {
        const maxUi = Math.max(1, maxY);
        yCtl.range.max = String(maxUi);
        yCtl.range.value = String(clamp(frameEl.scrollTop, 0, maxY));
        yCtl.box.style.display = "";
        yCtl.range.disabled = (maxY <= 0);
      }

      if (xCtl) {
        const maxUi = Math.max(1, maxX);
        xCtl.range.max = String(maxUi);
        xCtl.range.value = String(clamp(frameEl.scrollLeft, 0, maxX));
        xCtl.box.style.display = "";
        xCtl.range.disabled = (maxX <= 0);
      }

      updateFade(frameEl, fade, cfg);
    }
    function setScrollTopImmediate(v) { frameEl.scrollTop = v; }
    function setScrollLeftImmediate(v) { frameEl.scrollLeft = v; }
    function setScrollTopSmooth(v) {
      if (cfg.smooth) frameEl.scrollTo({ top: v, behavior: "smooth" });
      else frameEl.scrollTop = v;
    }
    function setScrollLeftSmooth(v) {
      if (cfg.smooth) frameEl.scrollTo({ left: v, behavior: "smooth" });
      else frameEl.scrollLeft = v;
    }

    const onYInput = () => { if (yCtl) setScrollTopImmediate(+yCtl.range.value || 0); schedule(); };
    const onXInput = () => { if (xCtl) setScrollLeftImmediate(+xCtl.range.value || 0); schedule(); };

    const onYChange = () => { if (yCtl) setScrollTopSmooth(+yCtl.range.value || 0); schedule(); };
    const onXChange = () => { if (xCtl) setScrollLeftSmooth(+xCtl.range.value || 0); schedule(); };

    if (yCtl) {
      yCtl.range.addEventListener("input", onYInput);
      yCtl.range.addEventListener("change", onYChange);
    }
    if (xCtl) {
      xCtl.range.addEventListener("input", onXInput);
      xCtl.range.addEventListener("change", onXChange);
    }

    const onFrameScroll = () => schedule();
    frameEl.addEventListener("scroll", onFrameScroll, { passive: true });

    const onWheel = (e) => {
      if (!cfg.wheel) return;

      if (wantY && Math.abs(e.deltaY) > 0) {
        frameEl.scrollTop += Math.sign(e.deltaY) * cfg.wheelStep;
        e.preventDefault();
      } else if (wantX && Math.abs(e.deltaY) > 0) {
        frameEl.scrollLeft += Math.sign(e.deltaY) * cfg.wheelStep;
        e.preventDefault();
      }
      schedule();
    };
    frameEl.addEventListener("wheel", onWheel, { passive: false });

    const onWinMove = () => schedule();
    window.addEventListener("scroll", onWinMove, true);
    window.addEventListener("resize", onWinMove);

    const ro = new ResizeObserver(() => schedule());
    ro.observe(frameEl);

    const mo = new MutationObserver(() => schedule());
    mo.observe(frameEl, { childList: true, subtree: true });

    refresh();

    function dispose() {
      try { ro.disconnect(); } catch {}
      try { mo.disconnect(); } catch {}

      frameEl.removeEventListener("scroll", onFrameScroll);
      frameEl.removeEventListener("wheel", onWheel);

      window.removeEventListener("scroll", onWinMove, true);
      window.removeEventListener("resize", onWinMove);

      if (yCtl) {
        yCtl.range.removeEventListener("input", onYInput);
        yCtl.range.removeEventListener("change", onYChange);
      }
      if (xCtl) {
        xCtl.range.removeEventListener("input", onXInput);
        xCtl.range.removeEventListener("change", onXChange);
      }

      const h = frameEl._sgScrollHost;
      if (h && h.parentNode) h.parentNode.removeChild(h);
      frameEl._sgScrollHost = null;
      frameEl._sgScrollCtl = null;
    }

    const api = { cfg, refresh, dispose };
    frameEl._sgScrollCtl = api;
    return api;
  }

  window.sg_sidescroll_blok = function(frameEl, cfg) {
    if (!frameEl) return null;

    const fromAttr =
      frameEl.dataset && frameEl.dataset.sgScrollBlock
        ? safeJsonParse(frameEl.dataset.sgScrollBlock)
        : null;

    const finalCfg = cfg || fromAttr || {};
    return buildController(frameEl, finalCfg);
  };
})();
