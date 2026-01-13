(() => {
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function isEditor() {
    return !!document.getElementById("preview-canvas"); 
  }

  function injectCssOnce() {
    if (document.getElementById("sg-sidescroll-css")) return;
    const st = document.createElement("style");
    st.id = "sg-sidescroll-css";
    st.textContent = `
      .sgss-control{ box-sizing:border-box; padding:6px; border-radius:14px; }
      .sgss-track{ position:relative; height:100%; margin:0 auto; background: var(--sgss-track, #e2e8f0); border-radius: var(--sgss-radius, 999px); width: var(--sgss-track-w, 10px); }
      .sgss-thumb{ position:absolute; left:50%; transform:translateX(-50%); width: calc(var(--sgss-track-w, 10px) + 6px); background: var(--sgss-thumb, #64748b); border-radius: var(--sgss-radius, 999px); box-shadow: 0 10px 20px rgba(0,0,0,.18); }
      .sgss-track, .sgss-thumb{ user-select:none; }
    `;
    document.head.appendChild(st);
  }

  function setThumb(el, pct) {
    const track = el.querySelector(".sgss-track");
    const thumb = el.querySelector(".sgss-thumb");
    if (!track || !thumb) return;

    const thumbH = clamp(parseInt(el.dataset.scrollThumbH || "64", 10), 10, 500);
    thumb.style.height = thumbH + "px";

    const trackH = track.clientHeight;
    const maxTop = Math.max(0, trackH - thumbH);
    const top = (pct / 100) * maxTop;
    thumb.style.top = top + "px";
  }

  function updateSideScrollVisuals(el) {
    injectCssOnce();

    const h = clamp(parseInt(el.dataset.scrollHeight || "260", 10), 80, 2000);
    el.style.height = h + "px";
    el.style.width = "28px"; 

    el.style.setProperty("--sgss-track-w", (parseInt(el.dataset.scrollTrackW || "10", 10)) + "px");
    el.style.setProperty("--sgss-track", el.dataset.scrollTrackColor || "#e2e8f0");
    el.style.setProperty("--sgss-thumb", el.dataset.scrollThumbColor || "#64748b");
    el.style.setProperty("--sgss-radius", (parseInt(el.dataset.scrollRadius || "999", 10)) + "px");

    const pe = isEditor() ? "pointer-events:none;" : "pointer-events:auto;";

    el.innerHTML = `
      <div class="sgss-control" style="width:100%; height:100%; ${pe}">
        <div class="sgss-track">
          <div class="sgss-thumb"></div>
        </div>
      </div>
    `;

    const pct = clamp(parseFloat(el.dataset.scrollValue || "0"), 0, 100);
    setThumb(el, pct);
  }

  function ensureActiveSideScroll() {
    try {
      if (typeof activeElement === "undefined") return null;
      if (!activeElement || activeElement.dataset.type !== "sidescroll") return null;
      return activeElement;
    } catch { return null; }
  }

  window.createSideScrollElement = function createSideScrollElement(x, y) {
    if (!isEditor()) return;
    if (typeof activeContainer === "undefined" || typeof canvas === "undefined") return;
    if (typeof setupElementMovement !== "function" || typeof selectElement !== "function") return;

    injectCssOnce();
    zCounter++;

    const div = document.createElement("div");
    div.className = "canvas-element type-sidescroll";
    div.dataset.id = "ss_" + Date.now();
    div.dataset.type = "sidescroll";
    div.style.zIndex = zCounter;
    div.contentEditable = "false";


    div.dataset.scrollTargetMode = "page";    
    div.dataset.scrollTargetId = "";         
    div.dataset.scrollPinMode = "fixed";      
    div.dataset.scrollSide = "right";      
    div.dataset.scrollOffsetTop = "120";
    div.dataset.scrollOffsetSide = "16";
    div.dataset.scrollHeight = "260";
    div.dataset.scrollTrackW = "10";
    div.dataset.scrollThumbH = "64";
    div.dataset.scrollValue = "0";
    div.dataset.scrollTrackColor = "#e2e8f0";
    div.dataset.scrollThumbColor = "#64748b";
    div.dataset.scrollRadius = "999";

    const rect = activeContainer.getBoundingClientRect();
    div.style.left = (x - rect.left) + "px";
    div.style.top = (y - rect.top) + "px";

    updateSideScrollVisuals(div);
    setupElementMovement(div, "sidescroll");
    activeContainer.appendChild(div);
    selectElement(div);
    refreshLayers?.();
    return div;
  };

  window.syncSideScrollInputs = function syncSideScrollInputs(el) {
    if (!el || el.dataset.type !== "sidescroll") return;
    const set = (id, v) => { const n = $(id); if (n) n.value = String(v ?? ""); };

    set("ss-target-mode", el.dataset.scrollTargetMode || "page");
    set("ss-target-id", el.dataset.scrollTargetId || "");
    set("ss-pin-mode", el.dataset.scrollPinMode || "fixed");
    set("ss-side", el.dataset.scrollSide || "right");
    set("ss-top", el.dataset.scrollOffsetTop || "120");
    set("ss-side-off", el.dataset.scrollOffsetSide || "16");
    set("ss-height", el.dataset.scrollHeight || "260");
    set("ss-track-w", el.dataset.scrollTrackW || "10");
    set("ss-thumb-h", el.dataset.scrollThumbH || "64");
    set("ss-value", el.dataset.scrollValue || "0");
    set("ss-track", el.dataset.scrollTrackColor || "#e2e8f0");
    set("ss-thumb", el.dataset.scrollThumbColor || "#64748b");
    set("ss-radius", el.dataset.scrollRadius || "999");
  };

  function bindEditorUI() {
    if (!isEditor()) return;

    $("add-sidescroll-btn")?.addEventListener("click", () => { addMode = "sidescroll"; });

    const map = [
      ["ss-target-mode", "scrollTargetMode"],
      ["ss-target-id", "scrollTargetId"],
      ["ss-pin-mode", "scrollPinMode"],
      ["ss-side", "scrollSide"],
      ["ss-top", "scrollOffsetTop"],
      ["ss-side-off", "scrollOffsetSide"],
      ["ss-height", "scrollHeight"],
      ["ss-track-w", "scrollTrackW"],
      ["ss-thumb-h", "scrollThumbH"],
      ["ss-value", "scrollValue"],
      ["ss-track", "scrollTrackColor"],
      ["ss-thumb", "scrollThumbColor"],
      ["ss-radius", "scrollRadius"],
    ];

    map.forEach(([id, key]) => {
      $(id)?.addEventListener("input", (e) => {
        const el = ensureActiveSideScroll(); if (!el) return;
        el.dataset[key] = e.target.value;
        updateSideScrollVisuals(el);
      });
      $(id)?.addEventListener("change", (e) => {
        const el = ensureActiveSideScroll(); if (!el) return;
        el.dataset[key] = e.target.value;
        updateSideScrollVisuals(el);
      });
    });

    $("ss-pin-page")?.addEventListener("click", () => {
      const el = ensureActiveSideScroll(); if (!el) return;
      el.dataset.scrollTargetMode = "page";
      el.dataset.scrollTargetId = "";
      syncSideScrollInputs(el);
      updateSideScrollVisuals(el);
    });

    $("ss-pin-active")?.addEventListener("click", () => {
      const el = ensureActiveSideScroll(); if (!el) return;

      if (typeof activeContainer === "undefined" || !activeContainer || activeContainer === canvas) {
        alert("Najpierw wybierz ramkę jako cel: kliknij 🎯 przy ramce w panelu warstw.");
        return;
      }
      if (activeContainer.dataset?.type !== "block") {
        alert("Aktywny cel nie jest ramką.");
        return;
      }
      el.dataset.scrollTargetMode = "element";
      el.dataset.scrollTargetId = activeContainer.dataset.id;
      syncSideScrollInputs(el);
      updateSideScrollVisuals(el);
    });
  }

  function cssEscapeSafe(s) {
    if (window.CSS && typeof window.CSS.escape === "function") return CSS.escape(s);
    return String(s).replace(/"/g, '\\"');
  }

  function prepareTransformScrollTarget(target) {
    if (!target || target.__sgssPrepared) return;
    target.__sgssPrepared = true;

    let wrap = target.querySelector(":scope > .sgss-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "sgss-wrap";
      wrap.style.position = "relative";
      wrap.style.width = "100%";
      wrap.style.height = "100%";
      wrap.style.willChange = "transform";

      const kids = Array.from(target.children).filter(ch =>
        ch.classList && ch.classList.contains("page-element") && ch.dataset.type !== "sidescroll"
      );
      kids.forEach(ch => wrap.appendChild(ch));

      target.appendChild(wrap);
      target.style.overflow = "hidden";
    }

    target.__sgssWrap = wrap;
  }

  function getTransformMaxScroll(target) {
    const wrap = target.__sgssWrap;
    if (!wrap) return 0;
    const kids = Array.from(wrap.children).filter(ch => ch.classList && ch.classList.contains("page-element"));
    let maxBottom = 0;
    kids.forEach(ch => {
      maxBottom = Math.max(maxBottom, ch.offsetTop + ch.offsetHeight);
    });
    return Math.max(0, maxBottom - target.clientHeight);
  }

  function applyScroll(controlEl, pct) {
    const mode = controlEl.dataset.scrollTargetMode || "page";

    if (mode === "page") {
      const se = document.scrollingElement || document.documentElement;
      const max = Math.max(0, se.scrollHeight - window.innerHeight);
      se.scrollTop = (pct / 100) * max;
      return;
    }

    const targetId = controlEl.dataset.scrollTargetId || "";
    if (!targetId) return;

    const target = document.querySelector(`[data-id="${cssEscapeSafe(targetId)}"]`);
    if (!target) return;

    prepareTransformScrollTarget(target);
    const maxScroll = getTransformMaxScroll(target);
    const y = (pct / 100) * maxScroll;
    if (target.__sgssWrap) target.__sgssWrap.style.transform = `translateY(${-y}px)`;
  }

  function initRuntime() {
    if (isEditor()) return; 

    injectCssOnce();
    const controls = document.querySelectorAll(".sgss-control-runtime");
    controls.forEach(control => {

      control.style.setProperty("--sgss-track-w", (parseInt(control.dataset.scrollTrackW || "10", 10)) + "px");
      control.style.setProperty("--sgss-track", control.dataset.scrollTrackColor || "#e2e8f0");
      control.style.setProperty("--sgss-thumb", control.dataset.scrollThumbColor || "#64748b");
      control.style.setProperty("--sgss-radius", (parseInt(control.dataset.scrollRadius || "999", 10)) + "px");

      const pct0 = clamp(parseFloat(control.dataset.scrollValue || "0"), 0, 100);
      setThumb(control, pct0);

      const track = control.querySelector(".sgss-track");
      const thumbH = () => clamp(parseInt(control.dataset.scrollThumbH || "64", 10), 10, 500);

      let dragging = false;
      const updateFromClientY = (clientY) => {
        const r = track.getBoundingClientRect();
        const th = thumbH();
        const maxTop = Math.max(0, r.height - th);
        const y = clamp(clientY - r.top - th / 2, 0, maxTop);
        const pct = (maxTop > 0) ? (y / maxTop) * 100 : 0;

        control.dataset.scrollValue = String(pct);
        setThumb(control, pct);
        applyScroll(control, pct);
      };

      track.style.touchAction = "none";
      track.addEventListener("pointerdown", (e) => {
        dragging = true;
        track.setPointerCapture(e.pointerId);
        updateFromClientY(e.clientY);
      });
      track.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        updateFromClientY(e.clientY);
      });
      track.addEventListener("pointerup", () => { dragging = false; });
      track.addEventListener("pointercancel", () => { dragging = false; });

      if ((control.dataset.scrollTargetMode || "page") === "page") {
        window.addEventListener("scroll", () => {
          const se = document.scrollingElement || document.documentElement;
          const max = Math.max(1, se.scrollHeight - window.innerHeight);
          const pct = clamp((se.scrollTop / max) * 100, 0, 100);
          setThumb(control, pct);
        }, { passive: true });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { bindEditorUI(); initRuntime(); });
  } else {
    bindEditorUI(); initRuntime();
  }

  window.updateSideScrollVisuals = updateSideScrollVisuals;
})();
