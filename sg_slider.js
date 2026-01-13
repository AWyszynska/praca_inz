(() => {
  const $ = (id) => document.getElementById(id);

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function getActive() {
    try { return (typeof activeElement !== "undefined") ? activeElement : null; }
    catch { return null; }
  }

  function ensureActiveSlider() {
    const el = getActive();
    if (!el || el.dataset.type !== "slider") return null;
    return el;
  }

  function asNum(v, fallback) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function injectBaseCssOnce() {
    if (document.getElementById("sg-slider-css")) return;
    const st = document.createElement("style");
    st.id = "sg-slider-css";
    st.textContent = `
      .sg-slider-inner{ box-sizing:border-box; width:100%; height:100%; padding:10px; display:flex; flex-direction:column; gap:8px; }
      .sg-slider-top{ display:flex; justify-content:space-between; align-items:center; gap:10px; }
      .sg-slider-label{ font-weight:600; font-size:13px; color:inherit; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .sg-slider-value{ font-weight:600; font-size:12px; color:#64748b; flex-shrink:0; }
      .sg-slider-minmax{ display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; margin-top:-2px; }

      input.sg-range{
        -webkit-appearance:none;
        appearance:none;
        width:100%;
        height: var(--sg-track-h, 8px);
        border-radius: var(--sg-track-r, 999px);
        outline:none;
        background: linear-gradient(to right,
          var(--sg-fill, #156fe5) 0%,
          var(--sg-fill, #156fe5) calc(var(--sg-pct, 50) * 1%),
          var(--sg-track, #e2e8f0) calc(var(--sg-pct, 50) * 1%),
          var(--sg-track, #e2e8f0) 100%
        );
        cursor: default;
      }
      input.sg-range:disabled{ opacity: 1; }

      input.sg-range::-webkit-slider-thumb{
        -webkit-appearance:none;
        appearance:none;
        width: var(--sg-thumb-s, 18px);
        height: var(--sg-thumb-s, 18px);
        border-radius: 999px;
        background: var(--sg-thumb, #156fe5);
        border: 2px solid rgba(255,255,255,0.95);
        box-shadow: var(--sg-thumb-shadow, 0 6px 14px rgba(0,0,0,.16));
      }
      input.sg-range::-webkit-slider-runnable-track{
        height: var(--sg-track-h, 8px);
        border-radius: var(--sg-track-r, 999px);
      }

      input.sg-range::-moz-range-track{
        height: var(--sg-track-h, 8px);
        border-radius: var(--sg-track-r, 999px);
        background: var(--sg-track, #e2e8f0);
      }
      input.sg-range::-moz-range-progress{
        height: var(--sg-track-h, 8px);
        border-radius: var(--sg-track-r, 999px);
        background: var(--sg-fill, #156fe5);
      }
      input.sg-range::-moz-range-thumb{
        width: var(--sg-thumb-s, 18px);
        height: var(--sg-thumb-s, 18px);
        border-radius: 999px;
        background: var(--sg-thumb, #156fe5);
        border: 2px solid rgba(255,255,255,0.95);
        box-shadow: var(--sg-thumb-shadow, 0 6px 14px rgba(0,0,0,.16));
      }
    `;
    document.head.appendChild(st);
  }

  function computePct(min, max, value) {
    const span = (max - min);
    if (span <= 0) return 0;
    return clamp(((value - min) / span) * 100, 0, 100);
  }

  function getSliderCfg(el) {
    const min = asNum(el.dataset.sliderMin, 0);
    const max = asNum(el.dataset.sliderMax, 100);
    const step = asNum(el.dataset.sliderStep, 1);
    const value = asNum(el.dataset.sliderValue, clamp(50, min, max));
    const label = el.dataset.sliderLabel || "Zsuwak";
    const unit = el.dataset.sliderUnit || "";
    const showValue = (el.dataset.sliderShowValue ?? "1") === "1";
    const showMinMax = (el.dataset.sliderShowMinMax ?? "0") === "1";
    const preset = el.dataset.sliderPreset || "soft";

    const track = el.dataset.sliderTrack || "#e2e8f0";
    const fill = el.dataset.sliderFill || "#156fe5";
    const thumb = el.dataset.sliderThumb || fill;
    const trackH = asNum(el.dataset.sliderTrackH, 8);
    const thumbS = asNum(el.dataset.sliderThumbS, 18);

    return { min, max, step, value, label, unit, showValue, showMinMax, preset, track, fill, thumb, trackH, thumbS };
  }

  function applyPreset(el, name) {
    if (name === "minimal") {
      el.style.backgroundColor = "transparent";
      el.style.border = "none";
      el.style.boxShadow = "none";
      el.style.borderRadius = "12px";
      el.dataset.sliderTrack = "#e5e7eb";
      el.dataset.sliderFill = "#111827";
      el.dataset.sliderThumb = "#111827";
      el.dataset.sliderTrackH = "6";
      el.dataset.sliderThumbS = "16";
    } else if (name === "soft") {
      el.style.backgroundColor = "#ffffff";
      el.style.border = "1px solid #e2e8f0";
      el.style.boxShadow = "0px 10px 24px 0px rgba(0,0,0,0.10)";
      el.style.borderRadius = "14px";
      el.dataset.sliderTrack = "#e2e8f0";
      el.dataset.sliderFill = "#156fe5";
      el.dataset.sliderThumb = "#156fe5";
      el.dataset.sliderTrackH = "8";
      el.dataset.sliderThumbS = "18";
    } else if (name === "neon") {
      el.style.backgroundColor = "#0b1220";
      el.style.border = "1px solid #334155";
      el.style.boxShadow = "0px 0px 40px 0px rgba(96,165,250,0.35)";
      el.style.borderRadius = "16px";
      el.style.color = "#e2e8f0";
      el.dataset.sliderTrack = "#1f2937";
      el.dataset.sliderFill = "#60a5fa";
      el.dataset.sliderThumb = "#60a5fa";
      el.dataset.sliderTrackH = "8";
      el.dataset.sliderThumbS = "18";
    } else if (name === "glass") {
      el.style.backgroundColor = "rgba(255,255,255,0.85)";
      el.style.border = "1px solid rgba(255,255,255,0.9)";
      el.style.boxShadow = "0px 12px 30px 0px rgba(0,0,0,0.14)";
      el.style.backdropFilter = "blur(12px)";
      el.style.borderRadius = "16px";
      el.dataset.sliderTrack = "#e2e8f0";
      el.dataset.sliderFill = "#0ea5e9";
      el.dataset.sliderThumb = "#0ea5e9";
      el.dataset.sliderTrackH = "8";
      el.dataset.sliderThumbS = "18";
    }
    el.dataset.sliderPreset = name;
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function updateSliderVisuals(el) {
    injectBaseCssOnce();
    const cfg = getSliderCfg(el);

    const min = cfg.min;
    const max = (cfg.max <= min) ? (min + 1) : cfg.max;
    const step = (cfg.step <= 0) ? 1 : cfg.step;
    const value = clamp(cfg.value, min, max);
    el.dataset.sliderMin = String(min);
    el.dataset.sliderMax = String(max);
    el.dataset.sliderStep = String(step);
    el.dataset.sliderValue = String(value);

    const pct = computePct(min, max, value);
    el.style.setProperty("--sg-track", cfg.track);
    el.style.setProperty("--sg-fill", cfg.fill);
    el.style.setProperty("--sg-thumb", cfg.thumb);
    el.style.setProperty("--sg-track-h", cfg.trackH + "px");
    el.style.setProperty("--sg-thumb-s", cfg.thumbS + "px");
    el.style.setProperty("--sg-pct", String(pct));
    el.style.setProperty("--sg-thumb-shadow", "0 6px 14px rgba(0,0,0,.16)");

    const valueText = cfg.unit ? `${value}${cfg.unit}` : String(value);

    el.innerHTML = `
      <div class="sg-slider-inner">
        <div class="sg-slider-top">
          <div class="sg-slider-label">${escapeHtml(cfg.label)}</div>
          ${cfg.showValue ? `<div class="sg-slider-value">${escapeHtml(valueText)}</div>` : ""}
        </div>
        <input class="sg-range" type="range" min="${min}" max="${max}" step="${step}" value="${value}" disabled style="pointer-events:none;"/>
        ${cfg.showMinMax ? `<div class="sg-slider-minmax"><span>${min}</span><span>${max}</span></div>` : ""}
      </div>
    `;
  }

  window.createSliderElement = function createSliderElement(x, y) {
    if (typeof activeContainer === "undefined" || typeof canvas === "undefined") {
      console.error("[sg_slider] Brak globalnych: activeContainer/canvas");
      return;
    }
    if (typeof setupElementMovement !== "function" || typeof selectElement !== "function") {
      console.error("[sg_slider] Brak globalnych: setupElementMovement/selectElement");
      return;
    }

    zCounter++;
    const div = document.createElement("div");
    div.className = "canvas-element type-slider";
    div.dataset.id = "sld_" + Date.now();
    div.dataset.type = "slider";
    div.style.zIndex = zCounter;
    div.spellcheck = false;

    div.style.width = "280px";
    div.style.height = "90px";

    div.style.backgroundColor = "#ffffff";
    div.style.border = "1px solid #e2e8f0";
    div.style.borderRadius = "14px";
    div.style.boxShadow = "0px 10px 24px 0px rgba(0,0,0,0.10)";

    div.dataset.sliderLabel = "Zsuwak";
    div.dataset.sliderUnit = "";
    div.dataset.sliderMin = "0";
    div.dataset.sliderMax = "100";
    div.dataset.sliderStep = "1";
    div.dataset.sliderValue = "50";
    div.dataset.sliderShowValue = "1";
    div.dataset.sliderShowMinMax = "0";
    div.dataset.sliderPreset = "soft";
    div.dataset.sliderTrack = "#e2e8f0";
    div.dataset.sliderFill = "#156fe5";
    div.dataset.sliderThumb = "#156fe5";
    div.dataset.sliderTrackH = "8";
    div.dataset.sliderThumbS = "18";

    const rect = activeContainer.getBoundingClientRect();
    div.style.left = (x - rect.left) + "px";
    div.style.top = (y - rect.top) + "px";

    div.contentEditable = "false";
    updateSliderVisuals(div);

    setupElementMovement(div, "slider");
    activeContainer.appendChild(div);
    selectElement(div);
    refreshLayers?.();
    return div;
  };

  window.syncSliderInputs = function syncSliderInputs(el) {
    if (!el || el.dataset.type !== "slider") return;
    const cfg = getSliderCfg(el);

    const setVal = (id, v) => { const n = $(id); if (n) n.value = String(v); };

    setVal("slider-label", cfg.label);
    setVal("slider-unit", cfg.unit);
    setVal("slider-min", cfg.min);
    setVal("slider-max", cfg.max);
    setVal("slider-step", cfg.step);
    setVal("slider-value", cfg.value);
    setVal("slider-show-value", cfg.showValue ? "1" : "0");
    setVal("slider-show-minmax", cfg.showMinMax ? "1" : "0");

    setVal("slider-track", cfg.track);
    setVal("slider-fill", cfg.fill);
    setVal("slider-thumb", cfg.thumb);
    setVal("slider-track-h", cfg.trackH);
    setVal("slider-thumb-s", cfg.thumbS);

    setVal("slider-width", parseInt(el.style.width) || 280);
    setVal("slider-height", parseInt(el.style.height) || 90);
  };

  function bindSliderUI() {

    $("add-slider-btn")?.addEventListener("click", () => { addMode = "slider"; });

    $("slider-preset-minimal")?.addEventListener("click", () => {
      const el = ensureActiveSlider(); if (!el) return;
      applyPreset(el, "minimal");
      syncSliderInputs(el);
      updateSliderVisuals(el);
      refreshLayers?.();
    });
    $("slider-preset-soft")?.addEventListener("click", () => {
      const el = ensureActiveSlider(); if (!el) return;
      applyPreset(el, "soft");
      syncSliderInputs(el);
      updateSliderVisuals(el);
      refreshLayers?.();
    });
    $("slider-preset-neon")?.addEventListener("click", () => {
      const el = ensureActiveSlider(); if (!el) return;
      applyPreset(el, "neon");
      syncSliderInputs(el);
      updateSliderVisuals(el);
      refreshLayers?.();
    });
    $("slider-preset-glass")?.addEventListener("click", () => {
      const el = ensureActiveSlider(); if (!el) return;
      applyPreset(el, "glass");
      syncSliderInputs(el);
      updateSliderVisuals(el);
      refreshLayers?.();
    });

    const simpleMap = [
      ["slider-label", "sliderLabel"],
      ["slider-unit", "sliderUnit"],
      ["slider-min", "sliderMin"],
      ["slider-max", "sliderMax"],
      ["slider-step", "sliderStep"],
      ["slider-value", "sliderValue"],
      ["slider-show-value", "sliderShowValue"],
      ["slider-show-minmax", "sliderShowMinMax"],
      ["slider-track", "sliderTrack"],
      ["slider-fill", "sliderFill"],
      ["slider-thumb", "sliderThumb"],
      ["slider-track-h", "sliderTrackH"],
      ["slider-thumb-s", "sliderThumbS"],
    ];

    simpleMap.forEach(([id, key]) => {
      $(id)?.addEventListener("input", (e) => {
        const el = ensureActiveSlider(); if (!el) return;
        el.dataset[key] = e.target.value;
        updateSliderVisuals(el);
      });
      $(id)?.addEventListener("change", (e) => {
        const el = ensureActiveSlider(); if (!el) return;
        el.dataset[key] = e.target.value;
        updateSliderVisuals(el);
      });
    });

    $("slider-width")?.addEventListener("input", (e) => {
      const el = ensureActiveSlider(); if (!el) return;
      el.style.width = (parseInt(e.target.value || "0", 10) || 0) + "px";
      refreshLayers?.();
    });
    $("slider-height")?.addEventListener("input", (e) => {
      const el = ensureActiveSlider(); if (!el) return;
      el.style.height = (parseInt(e.target.value || "0", 10) || 0) + "px";
      refreshLayers?.();
    });

    $("slider-pin-to-target")?.addEventListener("click", () => {
      const el = ensureActiveSlider();
      if (!el) return;
      if (typeof activeContainer === "undefined" || !activeContainer) return;

      if (activeContainer === canvas) {
        alert("Najpierw wybierz ramkę jako cel: kliknij 🎯 przy ramce w panelu warstw.");
        return;
      }
      if (activeContainer.dataset?.type !== "block") {
        alert("Aktywny cel nie jest ramką.");
        return;
      }
      if (typeof nestElement === "function") nestElement(el.dataset.id, activeContainer.dataset.id);
      refreshLayers?.();
    });

    $("slider-unpin-to-canvas")?.addEventListener("click", () => {
      const el = ensureActiveSlider(); if (!el) return;
      if (typeof unNestElement === "function") unNestElement(el);
      refreshLayers?.();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSliderUI);
  } else {
    bindSliderUI();
  }
})();
