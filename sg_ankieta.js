(() => {
  const $ = (id) => document.getElementById(id);

  const pointer = { x: 140, y: 140 };
  function updatePointer(e) {
    if (!window.canvas) return;
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  }
  document.addEventListener("mousemove", updatePointer, true);
  document.addEventListener("mousedown", updatePointer, true);

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function parseOptions(raw) {
    return String(raw ?? "")
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function isForm(el) {
    return !!el && !!el.dataset && el.dataset.type === "form";
  }

  function getActive() {
    try {
      return typeof activeElement !== "undefined" ? activeElement : null;
    } catch {
      return null;
    }
  }

  function ensureDefaults(el) {
    if (!isForm(el)) return;

    if (!el.dataset.formType) el.dataset.formType = "text";
    if (el.dataset.label === undefined) el.dataset.label = "";
    if (el.dataset.options === undefined) el.dataset.options = "";
    if (el.dataset.formHelpText === undefined) el.dataset.formHelpText = "";
    if (el.dataset.formPlaceholder === undefined) el.dataset.formPlaceholder = "";
    if (el.dataset.formRequired === undefined) el.dataset.formRequired = "0";
    if (el.dataset.formInline === undefined) el.dataset.formInline = "0";
    if (el.dataset.formName === undefined) el.dataset.formName = "";

    if (el.dataset.formRows === undefined) el.dataset.formRows = "3";
    if (el.dataset.formMin === undefined) el.dataset.formMin = "";
    if (el.dataset.formMax === undefined) el.dataset.formMax = "";
    if (el.dataset.formStep === undefined) el.dataset.formStep = "";

    if (el.dataset.ratingMin === undefined) el.dataset.ratingMin = "1";
    if (el.dataset.ratingMax === undefined) el.dataset.ratingMax = "5";
    if (el.dataset.ratingStep === undefined) el.dataset.ratingStep = "1";
    if (el.dataset.ratingMinLabel === undefined) el.dataset.ratingMinLabel = "";
    if (el.dataset.ratingMaxLabel === undefined) el.dataset.ratingMaxLabel = "";

    if (el.dataset.likertMin === undefined) el.dataset.likertMin = "1";
    if (el.dataset.likertMax === undefined) el.dataset.likertMax = "5";
    if (el.dataset.likertLeft === undefined) el.dataset.likertLeft = "";
    if (el.dataset.likertRight === undefined) el.dataset.likertRight = "";

    if (!el.dataset.accentColor) el.dataset.accentColor = "#156fe5";
    if (el.dataset.formInputRadius === undefined) el.dataset.formInputRadius = "10";
    if (!el.style.fontSize) el.style.fontSize = "16px";
    if (!el.style.color) el.style.color = "#0f172a";
    const bg = String(el.style.background || "").trim();
    if (!el.style.backgroundColor && (bg === "" || bg === "none" || bg === "transparent")) {
      el.style.backgroundColor = "#ffffff";
    }
    if (bg === "transparent") {
      el.style.background = "";
    }

    if (!el.style.border || el.style.border === "none") el.style.border = "1px solid #e2e8f0";

    if (!el.style.borderRadius || String(el.style.borderRadius).trim() === "0px") el.style.borderRadius = "14px";

    if (!el.style.boxShadow || el.style.boxShadow === "none") el.style.boxShadow = "0px 10px 24px 0px rgba(0,0,0,0.10)";

    const __isFinal = String(window.SG_MODE || '').toLowerCase() === 'final';
    if (__isFinal) {
      if (!el.style.overflow || el.style.overflow === 'visible') el.style.overflow = 'hidden';
    } else {
      if (!el.style.overflow) el.style.overflow = 'visible';
    }
    
    if (!el.style.width) el.style.width = "320px";
  }

  function updatePanelVisibility(type) {
    const show = (id, on) => {
      const n = $(id);
      if (n) n.style.display = on ? "block" : "none";
    };

    show("form-options-container", ["select", "radio", "checkbox"].includes(type));
    show("form-inline-row", ["radio", "checkbox"].includes(type));

    show("form-placeholder-row", ["text", "textarea", "email", "number", "date"].includes(type));
    show("form-textarea-container", type === "textarea");
    show("form-number-container", type === "number");

    show("form-rating-container", type === "rating");
    show("form-likert-container", type === "likert");
  }

  function inputBaseStyle(fs, radius) {
    return `width:100%; font-size:${fs}px; padding:9px 10px; border:1px solid #d1d5db; border-radius:${radius}px; box-sizing:border-box; background:#fff; color:inherit; pointer-events:none;`;
  }

  function tinyHelpStyle() {
    return "font-size:12px; color:#64748b; margin-top:4px; line-height:1.35;";
  }

  function labelStyle(required) {
    return `font-weight:700; font-size:14px; color:inherit; display:flex; gap:6px; align-items:baseline;` + (required ? "" : "");
  }

  function buildRequiredMark(required) {
    if (!required) return "";
    return `<span style="color:#ef4444; font-weight:800;">*</span>`;
  }

  function updateFormVisuals(el) {
    if (!isForm(el)) return;
    ensureDefaults(el);

    const __isFinal = String(window.SG_MODE || "").toLowerCase() === "final";

    const type = el.dataset.formType || "text";
    const label = el.dataset.label || "";
    const help = el.dataset.formHelpText || "";
    const placeholder = el.dataset.formPlaceholder || "";
    const required = el.dataset.formRequired === "1";
    const inline = el.dataset.formInline === "1";

    const accent = el.dataset.accentColor || "#156fe5";
    const fs = parseInt(el.style.fontSize || "16", 10) || 16;
    const radius = clamp(parseInt(el.dataset.formInputRadius || "10", 10) || 10, 0, 30);

    const options = parseOptions(el.dataset.options || "");

    const header = `
      ${label ? `<div style="${labelStyle(required)}">${escapeHtml(label)}${buildRequiredMark(required)}</div>` : ""}
      ${help ? `<div style="${tinyHelpStyle()}">${escapeHtml(help)}</div>` : ""}
    `;

    let field = "";

    if (["text", "email", "number", "date"].includes(type)) {
      const inputType = (type === "text") ? "text" : type;
      field = `<input type="${inputType}" disabled placeholder="${escapeHtml(placeholder || "Wpisz odpowiedź...")}" style="${inputBaseStyle(fs, radius)}" />`;
    }

    if (type === "textarea") {
      const rows = clamp(parseInt(el.dataset.formRows || "3", 10) || 3, 1, 20);
      field = `<textarea disabled rows="${rows}" placeholder="${escapeHtml(placeholder || "Wpisz odpowiedź...")}" style="${inputBaseStyle(fs, radius)} resize:none;"></textarea>`;
    }

    if (type === "select") {
      const opts = (options.length ? options : ["Opcja 1", "Opcja 2"]);
      field = `
        <select disabled style="${inputBaseStyle(fs, radius)}">
          ${opts.map(o => `<option>${escapeHtml(o)}</option>`).join("\n")}
        </select>
      `;
    }

    if (type === "radio" || type === "checkbox") {
      const inputType = type;
      const opts = (options.length ? options : ["Opcja 1", "Opcja 2"]);
      const rowStyle = inline
        ? "display:flex; flex-wrap:wrap; gap:10px;"
        : "display:flex; flex-direction:column; gap:6px;";

      field = `
        <div style="${rowStyle} margin-top:2px;">
          ${opts.map((o) => `
            <label style="display:flex; align-items:center; gap:8px; font-size:${fs}px; color:inherit; pointer-events:none;">
              <input type="${inputType}" disabled style="accent-color:${accent}; width:14px; height:14px; margin:0;border-radius:${Math.min(radius,6)}px;" />
              <span>${escapeHtml(o)}</span>
            </label>
          `).join("\n")}
        </div>
      `;
    }

    if (type === "yesno") {
      field = `
        <div style="display:flex; gap:14px; margin-top:2px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:${fs}px; pointer-events:none;">
            <input type="radio" disabled style="accent-color:${accent}; width:14px; height:14px; margin:0;" /> Tak
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:${fs}px; pointer-events:none;">
            <input type="radio" disabled style="accent-color:${accent}; width:14px; height:14px; margin:0;" /> Nie
          </label>
        </div>
      `;
    }

    if (type === "rating") {
      const min = parseInt(el.dataset.ratingMin || "1", 10) || 1;
      const max = parseInt(el.dataset.ratingMax || "5", 10) || 5;
      const step = parseInt(el.dataset.ratingStep || "1", 10) || 1;
      const left = el.dataset.ratingMinLabel || "";
      const right = el.dataset.ratingMaxLabel || "";

      const values = [];
      for (let v = min; v <= max; v += step) values.push(v);

      field = `
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; margin-top:6px;">
          <div style="font-size:12px; color:#64748b; min-width:60px;">${escapeHtml(left)}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
            ${values.map(v => `
              <div style="width:28px; height:28px; border-radius:999px; border:1px solid #d1d5db; display:flex; align-items:center; justify-content:center; font-size:12px; color:inherit; background:#fff; box-shadow:0 6px 14px rgba(0,0,0,0.06); pointer-events:none;">
                ${v}
              </div>
            `).join("")}
          </div>
          <div style="font-size:12px; color:#64748b; min-width:60px; text-align:right;">${escapeHtml(right)}</div>
        </div>
        <div style="margin-top:8px; height:6px; border-radius:999px; background:#e2e8f0; position:relative; overflow:hidden;">
          <div style="width:45%; height:100%; background:${accent};"></div>
        </div>
      `;
    }

    if (type === "likert") {
      const min = parseInt(el.dataset.likertMin || "1", 10) || 1;
      const max = parseInt(el.dataset.likertMax || "5", 10) || 5;
      const left = el.dataset.likertLeft || "";
      const right = el.dataset.likertRight || "";
      const values = [];
      for (let v = min; v <= max; v++) values.push(v);

      field = `
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-top:6px;">
          <div style="font-size:12px; color:#64748b; width:80px;">${escapeHtml(left)}</div>
          <div style="display:flex; gap:10px; flex-wrap:nowrap; justify-content:center;">
            ${values.map(v => `
              <label style="display:flex; flex-direction:column; align-items:center; gap:6px; font-size:11px; color:#64748b; pointer-events:none;">
                <input type="radio" disabled style="accent-color:${accent}; width:14px; height:14px; margin:0;" />
                <span>${v}</span>
              </label>
            `).join("")}
          </div>
          <div style="font-size:12px; color:#64748b; width:80px; text-align:right;">${escapeHtml(right)}</div>
        </div>
      `;
    }

    el.innerHTML = `
      <div class="sg-form-inner" style="padding:12px; box-sizing:border-box; width:100%; height:100%; pointer-events:none; border-radius:inherit; background:transparent; overflow:${__isFinal ? "hidden" : "visible"};" >
        ${header}
        <div style="margin-top:${label || help ? 10 : 0}px; color:inherit;">
          ${field}
        </div>
      </div>
    `;

    el.querySelectorAll("input, select, textarea, label, button").forEach((n) => {
      n.style.pointerEvents = "none";
    });
  }

  window.updateFormVisuals = updateFormVisuals;

  window.createFormElement = function createFormElement(clientX, clientY) {
    if (!window.canvas) return;
    if (typeof window.zCounter === "undefined") window.zCounter = 1;

    const div = document.createElement("div");
    div.className = "canvas-element type-form";
    div.dataset.id = "form_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
    div.dataset.type = "form";

    ensureDefaults(div);
    const host = (typeof activeContainer !== "undefined" && activeContainer) ? activeContainer : canvas;
    const rect = host.getBoundingClientRect();
    const lx = (Number.isFinite(clientX) ? (clientX - rect.left) : pointer.x);
    const ly = (Number.isFinite(clientY) ? (clientY - rect.top) : pointer.y);

    div.style.left = Math.max(0, Math.round(lx - 160)) + "px";
    div.style.top = Math.max(0, Math.round(ly - 40)) + "px";

    div.style.zIndex = String(++window.zCounter);

    updateFormVisuals(div);

    if (typeof window.setupElementMovement === "function") window.setupElementMovement(div, "form");
    host.appendChild(div);

    if (typeof window.selectElement === "function") window.selectElement(div);
    if (typeof window.refreshLayers === "function") window.refreshLayers();

    return div;
  };
  window.syncFormInputs = function syncFormInputs(el) {
    if (!isForm(el)) return;
    ensureDefaults(el);

    const __isFinal = String(window.SG_MODE || "").toLowerCase() === "final";

    const type = el.dataset.formType || "text";
    const fs = parseInt(el.style.fontSize || "16", 10) || 16;

    if ($("form-type-select")) $("form-type-select").value = type;
    if ($("form-label-text")) $("form-label-text").value = el.dataset.label || "";
    if ($("form-help-text")) $("form-help-text").value = el.dataset.formHelpText || "";
    if ($("form-placeholder")) $("form-placeholder").value = el.dataset.formPlaceholder || "";

    if ($("form-required")) $("form-required").checked = el.dataset.formRequired === "1";
    if ($("form-inline")) $("form-inline").checked = el.dataset.formInline === "1";

    if ($("form-name")) $("form-name").value = el.dataset.formName || "";

    if ($("form-options-list")) $("form-options-list").value = el.dataset.options || "";

    if ($("form-rows")) $("form-rows").value = parseInt(el.dataset.formRows || "3", 10) || 3;

    if ($("form-min")) $("form-min").value = el.dataset.formMin || "";
    if ($("form-max")) $("form-max").value = el.dataset.formMax || "";
    if ($("form-step")) $("form-step").value = el.dataset.formStep || "";

    if ($("rating-min")) $("rating-min").value = parseInt(el.dataset.ratingMin || "1", 10) || 1;
    if ($("rating-max")) $("rating-max").value = parseInt(el.dataset.ratingMax || "5", 10) || 5;
    if ($("rating-step")) $("rating-step").value = parseInt(el.dataset.ratingStep || "1", 10) || 1;
    if ($("rating-min-label")) $("rating-min-label").value = el.dataset.ratingMinLabel || "";
    if ($("rating-max-label")) $("rating-max-label").value = el.dataset.ratingMaxLabel || "";

    if ($("likert-min")) $("likert-min").value = parseInt(el.dataset.likertMin || "1", 10) || 1;
    if ($("likert-max")) $("likert-max").value = parseInt(el.dataset.likertMax || "5", 10) || 5;
    if ($("likert-left")) $("likert-left").value = el.dataset.likertLeft || "";
    if ($("likert-right")) $("likert-right").value = el.dataset.likertRight || "";

    if ($("form-font-size")) $("form-font-size").value = fs;
    if ($("form-text-color")) $("form-text-color").value = (typeof rgbToHex === "function") ? rgbToHex(el.style.color) : "#0f172a";
    if ($("form-accent-color")) $("form-accent-color").value = el.dataset.accentColor || "#156fe5";

    if ($("form-input-radius")) $("form-input-radius").value = parseInt(el.dataset.formInputRadius || "10", 10) || 10;
    if ($("form-width")) $("form-width").value = parseInt(el.style.width || "320", 10) || 320;

    updatePanelVisibility(type);
    updateFormVisuals(el);
  };
  function bindFormUI() {
    if (!$("form-type-select")) return;
    [
      "form-type-select",
      "form-label-text",
      "form-options-list",
      "form-font-size",
      "form-accent-color",
    ].forEach((id) => {
      const n = $(id);
      if (!n) return;
      n.oninput = null;
      n.onchange = null;
      n.onclick = null;
    });

    const activeForm = () => {
      const el = getActive();
      if (!isForm(el)) return null;
      ensureDefaults(el);
      return el;
    };

    const on = (id, ev, fn) => {
      const n = $(id);
      if (!n) return;
      const key = `__sgFormBound_${ev}`;
      if (n.dataset[key] === "1") return;
      n.dataset[key] = "1";
      n.addEventListener(ev, fn);
    };

    on("form-type-select", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formType = e.target.value;
      updatePanelVisibility(el.dataset.formType);
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-label-text", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.label = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-help-text", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formHelpText = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-placeholder", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formPlaceholder = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-required", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formRequired = e.target.checked ? "1" : "0";
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-inline", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInline = e.target.checked ? "1" : "0";
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-name", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formName = e.target.value;
      refreshLayers?.();
    });

    on("form-options-list", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.options = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-rows", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formRows = String(parseInt(e.target.value || "3", 10) || 3);
      updateFormVisuals(el);
      refreshLayers?.();
    });

    ["form-min","form-max","form-step"].forEach((id) => {
      on(id, "input", (e) => {
        const el = activeForm(); if (!el) return;
        const map = { "form-min": "formMin", "form-max": "formMax", "form-step": "formStep" };
        el.dataset[map[id]] = e.target.value;
        updateFormVisuals(el);
        refreshLayers?.();
      });
    });

    ["rating-min","rating-max","rating-step"].forEach((id) => {
      on(id, "input", (e) => {
        const el = activeForm(); if (!el) return;
        const map = { "rating-min": "ratingMin", "rating-max": "ratingMax", "rating-step": "ratingStep" };
        el.dataset[map[id]] = e.target.value;
        updateFormVisuals(el);
        refreshLayers?.();
      });
    });

    on("rating-min-label", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.ratingMinLabel = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("rating-max-label", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.ratingMaxLabel = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    ["likert-min","likert-max"].forEach((id) => {
      on(id, "input", (e) => {
        const el = activeForm(); if (!el) return;
        const map = { "likert-min": "likertMin", "likert-max": "likertMax" };
        el.dataset[map[id]] = e.target.value;
        updateFormVisuals(el);
        refreshLayers?.();
      });
    });

    on("likert-left", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.likertLeft = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("likert-right", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.likertRight = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-font-size", "input", (e) => {
      const el = activeForm(); if (!el) return;
      const n = parseInt(e.target.value || "16", 10) || 16;
      el.style.fontSize = n + "px";
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-text-color", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.style.color = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-accent-color", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.accentColor = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-radius", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputRadius = String(parseInt(e.target.value || "10", 10) || 10);
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-width", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.style.width = (parseInt(e.target.value || "320", 10) || 320) + "px";
      updateFormVisuals(el);
      refreshLayers?.();
    });
  }
  function hookSelectElement() {
    if (typeof window.selectElement !== "function") return;
    if (window.selectElement.__sgFormHooked) return;

    const orig = window.selectElement;
    window.selectElement = function (el) {
      orig(el);
      if (isForm(el) && typeof window.syncFormInputs === "function") {
        window.syncFormInputs(el);
      }
    };

    window.selectElement.__sgFormHooked = true;
  }
  function hookGetElementData() {
    if (typeof window.getElementData !== "function") return;
    if (window.getElementData.__sgFormHooked) return;

    const orig = window.getElementData;
    window.getElementData = function (el) {
      const data = orig(el);
      if (isForm(el)) {
        ensureDefaults(el);

        data.formHelpText = el.dataset.formHelpText || "";
        data.formPlaceholder = el.dataset.formPlaceholder || "";
        data.formRequired = el.dataset.formRequired || "0";
        data.formInline = el.dataset.formInline || "0";
        data.formName = el.dataset.formName || "";
        data.formRows = el.dataset.formRows || "3";
        data.formMin = el.dataset.formMin || "";
        data.formMax = el.dataset.formMax || "";
        data.formStep = el.dataset.formStep || "";
        data.ratingMin = el.dataset.ratingMin || "1";
        data.ratingMax = el.dataset.ratingMax || "5";
        data.ratingStep = el.dataset.ratingStep || "1";
        data.ratingMinLabel = el.dataset.ratingMinLabel || "";
        data.ratingMaxLabel = el.dataset.ratingMaxLabel || "";
        data.likertMin = el.dataset.likertMin || "1";
        data.likertMax = el.dataset.likertMax || "5";
        data.likertLeft = el.dataset.likertLeft || "";
        data.likertRight = el.dataset.likertRight || "";
        data.formInputRadius = el.dataset.formInputRadius || "10";
      }
      return data;
    };

    window.getElementData.__sgFormHooked = true;
  }

  function init() {
    bindFormUI();
    hookSelectElement();
    hookGetElementData();
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      hookSelectElement();
      hookGetElementData();
      document.querySelectorAll('.canvas-element[data-type="form"]').forEach(el => updateFormVisuals(el));

      if (window.selectElement?.__sgFormHooked && window.getElementData?.__sgFormHooked) clearInterval(t);
      if (tries >= 80) clearInterval(t);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
