(() => {
  const $ = (id) => document.getElementById(id);

  const mode = String(window.SG_MODE || "builder").toLowerCase();
  const isFinal = mode === "final";

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const pointer = { x: 140, y: 140 };
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

  function injectCssOnce() {
    if (document.getElementById("sg-form-pro-css")) return;

    const st = document.createElement("style");
    st.id = "sg-form-pro-css";
    st.textContent = `
      .sg-form-inner input::placeholder,
      .sg-form-inner textarea::placeholder{
        color: var(--sg-placeholder, #94a3b8);
        opacity: 1;
      }

      .sg-form-inner input:focus,
      .sg-form-inner select:focus,
      .sg-form-inner textarea:focus{
        border-color: var(--sg-accent, #156fe5) !important;
        box-shadow: 0 0 0 var(--sg-focus-ring, 4px) rgba(21,111,229, var(--sg-focus-a, 0.18)) !important;
        outline: none !important;
      }
    `;
    document.head.appendChild(st);
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
if (el.dataset.passMinLen === undefined) el.dataset.passMinLen = "0";
if (el.dataset.passReveal === undefined) el.dataset.passReveal = "1";
if (el.dataset.passMeter === undefined) el.dataset.passMeter = "1";
if (el.dataset.passAutocomplete === undefined) el.dataset.passAutocomplete = "";

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

    if (el.dataset.formMarkerText === undefined) el.dataset.formMarkerText = "";
    if (!el.dataset.formMarkerStyle) el.dataset.formMarkerStyle = "none";

    if (el.dataset.formIcon === undefined) el.dataset.formIcon = "";
    if (!el.dataset.formIconSide) el.dataset.formIconSide = "left";
    if (!el.dataset.formIconMode) el.dataset.formIconMode = "split";
    if (!el.dataset.formIconBg) el.dataset.formIconBg = "#f1f5f9";
    if (!el.dataset.formIconColor) el.dataset.formIconColor = "#0f172a";

    if (!el.dataset.formInputStyle) el.dataset.formInputStyle = "box"; 
    if (!el.dataset.formInputBg) el.dataset.formInputBg = "#ffffff";
    if (!el.dataset.formInputBorder) el.dataset.formInputBorder = "#d1d5db";
    if (!el.dataset.formInputBorderStyle) el.dataset.formInputBorderStyle = "solid";
    if (el.dataset.formInputBorderW === undefined) el.dataset.formInputBorderW = "1";
    if (!el.dataset.formInputShadow) el.dataset.formInputShadow = "soft";

    if (el.dataset.formInputRadius === undefined) el.dataset.formInputRadius = "10";
    if (el.dataset.formInputPadX === undefined) el.dataset.formInputPadX = "10";
    if (el.dataset.formInputPadY === undefined) el.dataset.formInputPadY = "9";

    if (!el.dataset.formPlaceholderColor) el.dataset.formPlaceholderColor = "#94a3b8";
    if (el.dataset.formFocusRing === undefined) el.dataset.formFocusRing = "4";
    if (el.dataset.formFocusOpacity === undefined) el.dataset.formFocusOpacity = "18";
if (el.dataset.formNoBg === undefined) el.dataset.formNoBg = "0";
    if (!el.dataset.accentColor) el.dataset.accentColor = "#156fe5";
    if (!el.style.fontSize) el.style.fontSize = "16px";
    if (!el.style.color) el.style.color = "#0f172a";

const noBg = (String(el.dataset.formNoBg || "0") === "1");

if (noBg) {
  if (el.dataset.formPrevBg === undefined) el.dataset.formPrevBg = "";
  if (el.dataset.formPrevBorder === undefined) el.dataset.formPrevBorder = "";
  if (el.dataset.formPrevShadow === undefined) el.dataset.formPrevShadow = "";
  if (el.dataset.formPrevRadius === undefined) el.dataset.formPrevRadius = "";

  if (!String(el.dataset.formPrevBg).trim()) {
    const prevBg = String(el.style.backgroundColor || el.style.background || "").trim();
    if (prevBg) el.dataset.formPrevBg = prevBg;
  }
  if (!String(el.dataset.formPrevBorder).trim()) {
    const prevBorder = String(el.style.border || "").trim();
    if (prevBorder) el.dataset.formPrevBorder = prevBorder;
  }
  if (!String(el.dataset.formPrevShadow).trim()) {
    const prevShadow = String(el.style.boxShadow || "").trim();
    if (prevShadow) el.dataset.formPrevShadow = prevShadow;
  }
  if (!String(el.dataset.formPrevRadius).trim()) {
    const prevRadius = String(el.style.borderRadius || "").trim();
    if (prevRadius) el.dataset.formPrevRadius = prevRadius;
  }
  el.style.background = "rgba(0,0,0,0)";
  el.style.backgroundColor = "rgba(0,0,0,0)";
  el.style.border = "none";
  el.style.boxShadow = "none";
  el.style.borderRadius = "0px";
} else {
  const bg = String(el.style.background || "").trim();
  if (!el.style.backgroundColor && (bg === "" || bg === "none" || bg === "transparent")) {
    el.style.backgroundColor = "#ffffff";
  }
  if (bg === "transparent") el.style.background = "";
  if (!el.style.border || el.style.border === "none") el.style.border = "1px solid #e2e8f0";
  if (!el.style.borderRadius || String(el.style.borderRadius).trim() === "0px") el.style.borderRadius = "14px";
  if (!el.style.boxShadow || el.style.boxShadow === "none") el.style.boxShadow = "0px 10px 24px 0px rgba(0,0,0,0.10)";
}


    if (isFinal) {
      if (!el.style.overflow || el.style.overflow === "visible") el.style.overflow = "hidden";
    } else {
      if (!el.style.overflow) el.style.overflow = "visible";
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

    show("form-placeholder-row", ["text", "textarea", "email", "number", "date", "password"].includes(type));
show("form-password-container", type === "password");

    show("form-textarea-container", type === "textarea");
    show("form-number-container", type === "number");

    show("form-rating-container", type === "rating");
    show("form-likert-container", type === "likert");
show("form-no-bg-row", ["radio", "checkbox"].includes(type));

    show("form-email-presets", type === "email");
  }

  function shadowCss(name) {
    if (name === "strong") return "0 14px 30px rgba(2,6,23,0.12)";
    if (name === "none") return "none";
    return "0 8px 18px rgba(2,6,23,0.08)";
  }

  function iconChar(name) {
    const k = String(name || "").trim();
    if (k === "mail") return "✉️";
    if (k === "at") return "@";
    if (k === "user") return "👤";
    if (k === "phone") return "📞";
    if (k === "search") return "🔎";
    if (k === "pin") return "📍";
    if (k === "lock") return "🔒";

    return "";
  }

  function buildMarkerHtml(text, style, accent) {
    const t = String(text || "").trim();
    const s = String(style || "none").trim();
    if (!t || s === "none") return "";

    const base = "font-size:10px; font-weight:900; letter-spacing:.4px; padding:4px 8px; border-radius:999px; line-height:1; user-select:none;";
    if (s === "chip") return `<span style="${base} background:${accent}; color:#ffffff;">${escapeHtml(t)}</span>`;
    if (s === "outline") return `<span style="${base} background:transparent; border:1px solid ${accent}; color:${accent};">${escapeHtml(t)}</span>`;
    return `<span style="${base} background:rgba(15,23,42,0.06); color:rgba(15,23,42,0.70);">${escapeHtml(t)}</span>`;
  }

  function applyEmailPreset(el, preset) {
    const p = String(preset || "").trim();
    if (!p) return;

    if (!String(el.dataset.formMarkerText || "").trim()) el.dataset.formMarkerText = "EMAIL";
    if (!String(el.dataset.formName || "").trim()) el.dataset.formName = "email";
    if (!String(el.dataset.formPlaceholder || "").trim()) el.dataset.formPlaceholder = "Wpisz email...";

    if (p === "gmail") {
      el.dataset.formMarkerStyle = "chip";
      el.dataset.formIcon = "mail";
      el.dataset.formIconSide = "left";
      el.dataset.formIconMode = "bubble";
      el.dataset.formIconBg = "#eff6ff";
      el.dataset.formIconColor = "#1d4ed8";
      el.dataset.formInputStyle = "pill";
      el.dataset.formInputBg = "#ffffff";
      el.dataset.formInputBorder = "#e2e8f0";
      el.dataset.formInputBorderStyle = "solid";
      el.dataset.formInputBorderW = "1";
      el.dataset.formInputShadow = "soft";
      el.dataset.formInputRadius = "24";
      el.dataset.accentColor = "#2563eb";
    } else if (p === "outlook") {
      el.dataset.formMarkerStyle = "outline";
      el.dataset.formIcon = "at";
      el.dataset.formIconSide = "left";
      el.dataset.formIconMode = "split";
      el.dataset.formIconBg = "#eff6ff";
      el.dataset.formIconColor = "#0a62d0";
      el.dataset.formInputStyle = "box";
      el.dataset.formInputBg = "#eff6ff";
      el.dataset.formInputBorder = "#bfdbfe";
      el.dataset.formInputBorderStyle = "solid";
      el.dataset.formInputBorderW = "1";
      el.dataset.formInputShadow = "soft";
      el.dataset.accentColor = "#0a62d0";
    } else if (p === "minimal") {
      el.dataset.formMarkerStyle = "muted";
      el.dataset.formIcon = "";
      el.dataset.formInputStyle = "underline";
      el.dataset.formInputBg = "transparent";
      el.dataset.formInputBorder = "#cbd5e1";
      el.dataset.formInputBorderStyle = "solid";
      el.dataset.formInputBorderW = "1";
      el.dataset.formInputShadow = "none";
      el.dataset.formInputRadius = "0";
    } else if (p === "dark") {
      el.dataset.formMarkerStyle = "chip";
      el.dataset.formIcon = "mail";
      el.dataset.formIconSide = "left";
      el.dataset.formIconMode = "bubble";
      el.dataset.formIconBg = "#111827";
      el.dataset.formIconColor = "#e5e7eb";
      el.dataset.formInputStyle = "box";
      el.dataset.formInputBg = "#0b1220";
      el.dataset.formInputBorder = "#1f2937";
      el.dataset.formInputBorderStyle = "solid";
      el.dataset.formInputBorderW = "1";
      el.dataset.formInputShadow = "strong";
      if (!el.style.color) el.style.color = "#e5e7eb";
      el.dataset.accentColor = "#60a5fa";
    }
  }

  function tinyHelpStyle() {
    return "font-size:12px; color:#64748b; margin-top:4px; line-height:1.35;";
  }

  function labelStyle() {
    return "font-weight:700; font-size:14px; color:inherit; display:flex; gap:6px; align-items:baseline;";
  }

  function requiredMark(req) {
    return req ? `<span style="color:#ef4444; font-weight:800;">*</span>` : "";
  }

  function buildInputHtml({
    tag,
    attrs,
    placeholder,
    content,
    fs,
    inputStyle,
    radius,
    bg,
    borderColor,
    borderStyle,
    borderW,
    shadow,
    padX,
    padY,
    icon,
    iconSide,
    iconMode,
    iconBg,
    iconColor,
    required,
    name,
    min,
    max,
    step,
  }) {
    const ico = iconChar(icon);
    const bw = Math.max(0, Math.min(8, parseInt(borderW || "1", 10) || 1));
    const bs = String(borderStyle || "solid");
    const px = clamp(parseInt(padX || "10", 10) || 10, 4, 28);
    const py = clamp(parseInt(padY || "9", 10) || 9, 4, 22);

    const isVoid = String(tag || "").toLowerCase() === "input";
    const dis = isFinal ? "" : " disabled";
    const pe = isFinal ? "" : " pointer-events:none;";
    const reqAttr = isFinal && required ? " required" : "";
    const nameAttr = isFinal && String(name || "").trim() ? ` name="${escapeHtml(name)}"` : "";

    const minAttr = isFinal && min !== undefined && min !== "" ? ` min="${escapeHtml(min)}"` : "";
    const maxAttr = isFinal && max !== undefined && max !== "" ? ` max="${escapeHtml(max)}"` : "";
    const stepAttr = isFinal && step !== undefined && step !== "" ? ` step="${escapeHtml(step)}"` : "";

    const ph = placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : "";

    const styleBox = (() => {
      if (inputStyle === "underline") {
        return `width:100%; font-size:${fs}px; padding:${py}px ${px}px; border:0; border-bottom:${bw}px ${bs} ${borderColor}; border-radius:0; box-sizing:border-box; background:${bg}; color:inherit; box-shadow:none;${pe}`;
      }
      if (inputStyle === "soft") {
        return `width:100%; font-size:${fs}px; padding:${py}px ${px}px; border:${bw}px ${bs} ${borderColor}; border-radius:${radius}px; box-sizing:border-box; background:${bg}; color:inherit; box-shadow:${shadowCss("soft")};${pe}`;
      }
      if (inputStyle === "pill") {
        return `width:100%; font-size:${fs}px; padding:${py}px ${px}px; border:${bw}px ${bs} ${borderColor}; border-radius:999px; box-sizing:border-box; background:${bg}; color:inherit; box-shadow:${shadowCss(shadow)};${pe}`;
      }
      return `width:100%; font-size:${fs}px; padding:${py}px ${px}px; border:${bw}px ${bs} ${borderColor}; border-radius:${radius}px; box-sizing:border-box; background:${bg}; color:inherit; box-shadow:${shadowCss(shadow)};${pe}`;
    })();

    const inputCore = (() => {
      const commonAttrs = `${attrs || ""}${nameAttr}${reqAttr}${minAttr}${maxAttr}${stepAttr}${ph}${dis}`;
      if (isVoid) return `<${tag}${commonAttrs} style="${styleBox}" />`;
      return `<${tag}${commonAttrs} style="${styleBox}">${content || ""}</${tag}>`;
    })();

    if (!ico) return inputCore;

    if (iconMode === "bubble") {
      const shell = `position:relative; width:100%;`;
      const bubbleSize = clamp(Math.round(fs * 1.6), 26, 40);
      const bubble = `
        position:absolute;
        top:50%;
        ${iconSide === "right" ? "right" : "left"}:${Math.max(8, Math.round(px * 0.6))}px;
        transform:translateY(-50%);
        width:${bubbleSize}px;
        height:${bubbleSize}px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:${iconBg};
        color:${iconColor};
        font-size:${Math.max(14, Math.round(fs * 1.0))}px;
        opacity:0.95;
        user-select:none;
        ${isFinal ? "" : "pointer-events:none;"}
      `;

      const padExtra = bubbleSize + Math.max(14, Math.round(px * 0.8));
      const patched = inputCore.replace(
        /padding:\s*([0-9]+)px\s+([0-9]+)px;/,
        (m, a, b) => {
          const leftPad = iconSide === "left" ? (parseInt(b, 10) + padExtra) : parseInt(b, 10);
          const rightPad = iconSide === "right" ? (parseInt(b, 10) + padExtra) : parseInt(b, 10);
          return `padding:${a}px ${rightPad}px ${a}px ${leftPad}px;`;
        }
      );

      return `<div style="${shell}">${patched}<div style="${bubble}">${escapeHtml(ico)}</div></div>`;
    }

    const shellBorder = (() => {
      if (inputStyle === "underline") {
        return `display:flex; align-items:stretch; width:100%; border:0; border-bottom:${bw}px ${bs} ${borderColor}; border-radius:0; background:${bg}; box-sizing:border-box; overflow:hidden; box-shadow:none;`;
      }
      const rr = (inputStyle === "pill") ? "999px" : `${radius}px`;
      return `display:flex; align-items:stretch; width:100%; border:${bw}px ${bs} ${borderColor}; border-radius:${rr}; background:${bg}; box-sizing:border-box; overflow:hidden; box-shadow:${shadowCss(shadow)};`;
    })();

    const iconBox = (() => {
      const divider = (inputStyle === "underline") ? "border:0;" : `border-${iconSide === "right" ? "left" : "right"}:${bw}px ${bs} ${borderColor};`;
      return `
        width:44px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${Math.max(14, fs)}px;
        user-select:none;
        background:${iconBg};
        color:${iconColor};
        ${divider}
        ${isFinal ? "" : "pointer-events:none;"}
      `;
    })();

    const innerStyle = (() => {
      if (inputStyle === "underline") {
        return `flex:1; min-width:0; border:0; outline:none; background:transparent; color:inherit; font-size:${fs}px; padding:${py}px ${px}px; box-sizing:border-box; box-shadow:none;${isFinal ? "" : "pointer-events:none;"}`;
      }
      return `flex:1; min-width:0; border:0; outline:none; background:transparent; color:inherit; font-size:${fs}px; padding:${py}px ${px}px; box-sizing:border-box;${isFinal ? "" : "pointer-events:none;"}`;
    })();

    const innerTag = (() => {
      const commonAttrs = `${attrs || ""}${nameAttr}${reqAttr}${minAttr}${maxAttr}${stepAttr}${ph}${dis}`;
      if (isVoid) return `<${tag}${commonAttrs} style="${innerStyle}" />`;
      return `<${tag}${commonAttrs} style="${innerStyle}">${content || ""}</${tag}>`;
    })();

    return `
      <div style="${shellBorder}">
        ${iconSide === "right" ? "" : `<div style="${iconBox}">${escapeHtml(ico)}</div>`}
        ${innerTag}
        ${iconSide === "right" ? `<div style="${iconBox}">${escapeHtml(ico)}</div>` : ""}
      </div>
    `;
  }
function passScore(value) {
  const s = String(value || "");
  let points = 0;
  if (s.length >= 8) points++;
  if (s.length >= 12) points++;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) points++;
  if (/\d/.test(s)) points++;
  if (/[^a-zA-Z0-9]/.test(s)) points++;

  const pct = clamp(Math.round((points / 5) * 100), 0, 100);

  let label = "";
  if (!s) label = "";
  else if (points <= 1) label = "Słabe";
  else if (points <= 3) label = "Średnie";
  else label = "Mocne";

  return { pct, label };
}

function bindPasswordUi(host) {
  if (!host) return;

  const btn = host.querySelector(".sg-pass-toggle");
  const input = host.querySelector("input.sg-pass-input");
  const bar = host.querySelector(".sg-pass-meter-bar");
  const text = host.querySelector(".sg-pass-meter-text");

  if (btn && input && btn.dataset.__sgBound !== "1") {
    btn.dataset.__sgBound = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", next);
      btn.textContent = next === "password" ? "👁" : "🙈";
    }, true);
  }

  if (input && bar && input.dataset.__sgMeterBound !== "1") {
    input.dataset.__sgMeterBound = "1";
    const update = () => {
      const { pct, label } = passScore(input.value);
      bar.style.width = pct + "%";
      if (text) text.textContent = label ? `Siła: ${label}` : "";
    };
    input.addEventListener("input", update, true);
    update();
  }
}

  function updateFormVisuals(el) {
    if (!isForm(el)) return;
    injectCssOnce();
    ensureDefaults(el);

    const type = el.dataset.formType || "text";
    const label = el.dataset.label || "";
    const help = el.dataset.formHelpText || "";
    const placeholder = el.dataset.formPlaceholder || "";
    const required = el.dataset.formRequired === "1";
    const inline = el.dataset.formInline === "1";

    const accent = el.dataset.accentColor || "#156fe5";
    const fs = parseInt(el.style.fontSize || "16", 10) || 16;

    const inputStyle = el.dataset.formInputStyle || "box";
    const radius = clamp(parseInt(el.dataset.formInputRadius || "10", 10) || 10, 0, 80);
    const padX = el.dataset.formInputPadX || "10";
    const padY = el.dataset.formInputPadY || "9";

    const markerText = el.dataset.formMarkerText || "";
    const markerStyle = el.dataset.formMarkerStyle || "none";
    const markerHtml = buildMarkerHtml(markerText, markerStyle, accent);

    const icon = el.dataset.formIcon || "";
    const iconSide = el.dataset.formIconSide || "left";
    const iconMode = el.dataset.formIconMode || "split";
    const iconBg = el.dataset.formIconBg || "#f1f5f9";
    const iconColor = el.dataset.formIconColor || "#0f172a";

    const inputBg = el.dataset.formInputBg || "#ffffff";
    const inputBorder = el.dataset.formInputBorder || "#d1d5db";
    const inputBorderStyle = el.dataset.formInputBorderStyle || "solid";
    const inputBorderW = el.dataset.formInputBorderW || "1";
    const inputShadow = el.dataset.formInputShadow || "soft";

    const placeColor = el.dataset.formPlaceholderColor || "#94a3b8";
    const focusRing = clamp(parseInt(el.dataset.formFocusRing || "4", 10) || 4, 0, 20);
    const focusOpacity = clamp(parseInt(el.dataset.formFocusOpacity || "18", 10) || 18, 0, 60) / 100;
    

    const name = (el.dataset.formName || "").trim() || (type === "email" ? "email" : "");

    const options = parseOptions(el.dataset.options || "");

    const header = `
      ${label
        ? `<div style="display:flex; align-items:baseline; justify-content:space-between; gap:10px;">
            <div style="${labelStyle()}">${escapeHtml(label)}${requiredMark(required)}</div>
            ${markerHtml}
          </div>`
        : (markerHtml ? `<div style="display:flex; justify-content:flex-end;">${markerHtml}</div>` : "")}
      ${help ? `<div style="${tinyHelpStyle()}">${escapeHtml(help)}</div>` : ""}
    `;

    let field = "";
if (type === "password") {
  const minLen = clamp(parseInt(el.dataset.passMinLen || "0", 10) || 0, 0, 128);
  const auto = String(el.dataset.passAutocomplete || "").trim();
  const reveal = el.dataset.passReveal !== "0";
  const meter = el.dataset.passMeter !== "0";

  const minAttr = isFinal && minLen > 0 ? ` minlength="${minLen}"` : "";
  const autoAttr = isFinal && auto ? ` autocomplete="${escapeHtml(auto)}"` : "";

  const inputHtml = buildInputHtml({
    tag: "input",
    attrs: ` type="password" class="sg-pass-input"${minAttr}${autoAttr}`,
    placeholder: placeholder || "Wpisz hasło...",
    fs,
    inputStyle,
    radius,
    bg: inputBg,
    borderColor: inputBorder,
    borderStyle: inputBorderStyle,
    borderW: inputBorderW,
    shadow: inputShadow,
    padX,
    padY,
    icon,
    iconSide,
    iconMode,
    iconBg,
    iconColor,
    required,
    name: name || "password",
  });

  const toggleBtn = reveal
    ? `<button type="button" class="sg-pass-toggle"
          style="min-width:44px; padding:0 12px; border-radius:${Math.max(8, Math.min(18, radius))}px;
                 border:1px solid ${escapeHtml(inputBorder)}; background:${escapeHtml(inputBg)};
                 box-shadow:${shadowCss(inputShadow)}; font-size:${Math.max(14, Math.round(fs * 1.0))}px;
                 cursor:${isFinal ? "pointer" : "default"}; ${isFinal ? "" : "pointer-events:none;"}">👁</button>`
    : "";

  const meterBar = meter
    ? `
        <div class="sg-pass-meter" style="margin-top:8px; height:8px; width:100%; background:rgba(15,23,42,0.08); border-radius:999px; overflow:hidden;">
          <div class="sg-pass-meter-bar" style="height:100%; width:0%; background:${escapeHtml(accent)}; border-radius:999px;"></div>
        </div>
        <div class="sg-pass-meter-text" style="font-size:11px; color:#64748b; margin-top:4px;"></div>
      `
    : "";

  field = `
    <div class="sg-pass-shell" style="display:flex; gap:8px; align-items:stretch;">
      <div style="flex:1; min-width:0;">${inputHtml}</div>
      ${toggleBtn}
    </div>
    ${meterBar}
  `;
}

    if (["text", "email", "number", "date"].includes(type)) {
      const inputType = (type === "text") ? "text" : type;
      field = buildInputHtml({
        tag: "input",
        attrs: ` type="${inputType}"`,
        placeholder: placeholder || "Wpisz odpowiedź...",
        fs,
        inputStyle,
        radius,
        bg: inputBg,
        borderColor: inputBorder,
        borderStyle: inputBorderStyle,
        borderW: inputBorderW,
        shadow: inputShadow,
        padX,
        padY,
        icon,
        iconSide,
        iconMode,
        iconBg,
        iconColor,
        required,
        name,
        min: type === "number" ? (el.dataset.formMin || "") : "",
        max: type === "number" ? (el.dataset.formMax || "") : "",
        step: type === "number" ? (el.dataset.formStep || "") : "",
      });
    }

    if (type === "textarea") {
      const rows = clamp(parseInt(el.dataset.formRows || "3", 10) || 3, 1, 20);
      field = buildInputHtml({
        tag: "textarea",
        attrs: ` rows="${rows}"`,
        placeholder: placeholder || "Wpisz odpowiedź...",
        content: "",
        fs,
        inputStyle,
        radius,
        bg: inputBg,
        borderColor: inputBorder,
        borderStyle: inputBorderStyle,
        borderW: inputBorderW,
        shadow: inputShadow,
        padX,
        padY,
        icon,
        iconSide,
        iconMode,
        iconBg,
        iconColor,
        required,
        name,
      });
    }

    if (type === "select") {
      const opts = (options.length ? options : ["Opcja 1", "Opcja 2"]);
      const content = opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("\n");
      field = buildInputHtml({
        tag: "select",
        attrs: "",
        content,
        fs,
        inputStyle,
        radius,
        bg: inputBg,
        borderColor: inputBorder,
        borderStyle: inputBorderStyle,
        borderW: inputBorderW,
        shadow: inputShadow,
        padX,
        padY,
        icon,
        iconSide,
        iconMode,
        iconBg,
        iconColor,
        required,
        name,
      });
    }

    if (type === "radio" || type === "checkbox") {
      const inputType = type;
      const opts = (options.length ? options : ["Opcja 1", "Opcja 2"]);
      const rowStyle = inline
        ? "display:flex; flex-wrap:wrap; gap:10px;"
        : "display:flex; flex-direction:column; gap:6px;";

      const pe = isFinal ? "" : "pointer-events:none;";
      const dis = isFinal ? "" : "disabled";
      const nAttr = isFinal && name ? ` name="${escapeHtml(name)}"` : "";
      const reqAttr = isFinal && required && inputType === "radio" ? " required" : "";

      field = `
        <div style="${rowStyle} margin-top:2px; ${pe}">
          ${opts.map((o) => `
            <label style="display:flex; align-items:center; gap:8px; font-size:${fs}px; color:inherit; ${pe}">
              <input type="${inputType}" ${dis}${nAttr}${reqAttr} value="${escapeHtml(o)}"
                style="accent-color:${accent}; width:14px; height:14px; margin:0; border-radius:${Math.min(radius,6)}px;" />
              <span>${escapeHtml(o)}</span>
            </label>
          `).join("\n")}
        </div>
      `;
    }

    if (type === "yesno") {
      const pe = isFinal ? "" : "pointer-events:none;";
      const dis = isFinal ? "" : "disabled";
      const nAttr = isFinal && name ? ` name="${escapeHtml(name)}"` : "";
      const reqAttr = isFinal && required ? " required" : "";

      field = `
        <div style="display:flex; gap:14px; margin-top:2px; ${pe}">
          <label style="display:flex; align-items:center; gap:8px; font-size:${fs}px; ${pe}">
            <input type="radio" ${dis}${nAttr}${reqAttr} value="Tak" style="accent-color:${accent}; width:14px; height:14px; margin:0;" /> Tak
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:${fs}px; ${pe}">
            <input type="radio" ${dis}${nAttr} value="Nie" style="accent-color:${accent}; width:14px; height:14px; margin:0;" /> Nie
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

      const pe = isFinal ? "" : "pointer-events:none;";
      const dis = isFinal ? "" : "disabled";
      const nAttr = isFinal && name ? ` name="${escapeHtml(name)}"` : "";
      const reqAttr = isFinal && required ? " required" : "";

      field = `
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; margin-top:6px; ${pe}">
          <div style="font-size:12px; color:#64748b; min-width:60px;">${escapeHtml(left)}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; ${pe}">
            ${values.map(v => `
              <label style="display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:999px; border:1px solid #d1d5db; background:#fff; box-shadow:0 6px 14px rgba(0,0,0,0.06); cursor:${isFinal ? "pointer" : "default"}; ${pe}">
                <input type="radio" ${dis}${nAttr}${reqAttr} value="${v}"
                  style="position:absolute; opacity:0; width:1px; height:1px; margin:0;" />
                <span style="font-size:12px; color:inherit;">${v}</span>
              </label>
            `).join("")}
          </div>
          <div style="font-size:12px; color:#64748b; min-width:60px; text-align:right;">${escapeHtml(right)}</div>
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

      const pe = isFinal ? "" : "pointer-events:none;";
      const dis = isFinal ? "" : "disabled";
      const nAttr = isFinal && name ? ` name="${escapeHtml(name)}"` : "";
      const reqAttr = isFinal && required ? " required" : "";

      field = `
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-top:6px; ${pe}">
          <div style="font-size:12px; color:#64748b; width:80px;">${escapeHtml(left)}</div>
          <div style="display:flex; gap:10px; flex-wrap:nowrap; justify-content:center; ${pe}">
            ${values.map(v => `
              <label style="display:flex; flex-direction:column; align-items:center; gap:6px; font-size:11px; color:#64748b; cursor:${isFinal ? "pointer" : "default"}; ${pe}">
                <input type="radio" ${dis}${nAttr}${reqAttr} value="${v}"
                  style="accent-color:${accent}; width:14px; height:14px; margin:0;" />
                <span>${v}</span>
              </label>
            `).join("")}
          </div>
          <div style="font-size:12px; color:#64748b; width:80px; text-align:right;">${escapeHtml(right)}</div>
        </div>
      `;
    }

    const innerPe = isFinal ? "auto" : "none";

    el.innerHTML = `
      <div class="sg-form-inner"
        style="
          padding:12px;
          box-sizing:border-box;
          width:100%;
          height:100%;
          pointer-events:${innerPe};
          border-radius:inherit;
          background:transparent;
          overflow:${isFinal ? "hidden" : "visible"};
          --sg-accent:${accent};
          --sg-placeholder:${placeColor};
          --sg-focus-ring:${focusRing}px;
          --sg-focus-a:${focusOpacity};
        ">
        ${header}
        <div style="margin-top:${label || help ? 10 : 0}px; color:inherit;">
          ${field}
        </div>
      </div>
    `;
if (isFinal && type === "password") {
  bindPasswordUi(el);
}

    if (!isFinal) {
      el.querySelectorAll("input, select, textarea, label, button").forEach((n) => {
        n.style.pointerEvents = "none";
      });
    }
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
if ($("pass-minlen")) $("pass-minlen").value = parseInt(el.dataset.passMinLen || "0", 10) || 0;
if ($("pass-autocomplete")) $("pass-autocomplete").value = el.dataset.passAutocomplete || "";
if ($("pass-reveal")) $("pass-reveal").checked = el.dataset.passReveal !== "0";
if ($("pass-meter")) $("pass-meter").checked = el.dataset.passMeter !== "0";

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
if ($("form-no-bg")) $("form-no-bg").checked = el.dataset.formNoBg === "1";

    if ($("form-marker-text")) $("form-marker-text").value = el.dataset.formMarkerText || "";
    if ($("form-marker-style")) $("form-marker-style").value = el.dataset.formMarkerStyle || "none";
    if ($("form-icon")) $("form-icon").value = el.dataset.formIcon || "";
    if ($("form-icon-side")) $("form-icon-side").value = el.dataset.formIconSide || "left";

    if ($("form-icon-mode")) $("form-icon-mode").value = el.dataset.formIconMode || "split";
    if ($("form-icon-bg")) $("form-icon-bg").value = el.dataset.formIconBg || "#f1f5f9";
    if ($("form-icon-color")) $("form-icon-color").value = el.dataset.formIconColor || "#0f172a";

    if ($("form-input-style")) $("form-input-style").value = el.dataset.formInputStyle || "box";
    if ($("form-input-bg")) $("form-input-bg").value = el.dataset.formInputBg || "#ffffff";
    if ($("form-input-border")) $("form-input-border").value = el.dataset.formInputBorder || "#d1d5db";
    if ($("form-input-border-style")) $("form-input-border-style").value = el.dataset.formInputBorderStyle || "solid";
    if ($("form-input-border-w")) $("form-input-border-w").value = parseInt(el.dataset.formInputBorderW || "1", 10) || 1;
    if ($("form-input-shadow")) $("form-input-shadow").value = el.dataset.formInputShadow || "soft";

    if ($("form-input-radius")) $("form-input-radius").value = parseInt(el.dataset.formInputRadius || "10", 10) || 10;

    if ($("form-input-pad-x")) $("form-input-pad-x").value = parseInt(el.dataset.formInputPadX || "10", 10) || 10;
    if ($("form-input-pad-y")) $("form-input-pad-y").value = parseInt(el.dataset.formInputPadY || "9", 10) || 9;

    if ($("form-placeholder-color")) $("form-placeholder-color").value = el.dataset.formPlaceholderColor || "#94a3b8";
    if ($("form-focus-ring")) $("form-focus-ring").value = parseInt(el.dataset.formFocusRing || "4", 10) || 4;
    if ($("form-focus-opacity")) $("form-focus-opacity").value = parseInt(el.dataset.formFocusOpacity || "18", 10) || 18;

    if ($("form-width")) $("form-width").value = parseInt(el.style.width || "320", 10) || 320;

    updatePanelVisibility(type);
    updateFormVisuals(el);
  };

  function bindFormUI() {
    if (!$("form-type-select")) return;

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
      const nextType = e.target.value;
      el.dataset.formType = nextType;

      if (nextType === "email") {
        const mt = String(el.dataset.formMarkerText || "").trim();
        const ms = String(el.dataset.formMarkerStyle || "none").trim();
        if (!mt) el.dataset.formMarkerText = "EMAIL";
        if (ms === "none") el.dataset.formMarkerStyle = "outline";
        if (!String(el.dataset.formIcon || "").trim()) el.dataset.formIcon = "mail";
        if (!String(el.dataset.formName || "").trim()) el.dataset.formName = "email";
      }
if (nextType === "password") {
  const mt = String(el.dataset.formMarkerText || "").trim();
  const ms = String(el.dataset.formMarkerStyle || "none").trim();
  if (!mt) el.dataset.formMarkerText = "HASŁO";
  if (ms === "none") el.dataset.formMarkerStyle = "outline";
  if (!String(el.dataset.formIcon || "").trim()) el.dataset.formIcon = "lock";
  if (!String(el.dataset.formName || "").trim()) el.dataset.formName = "password";
  if (!String(el.dataset.formPlaceholder || "").trim()) el.dataset.formPlaceholder = "Wpisz hasło...";
  if (!String(el.dataset.passAutocomplete || "").trim()) el.dataset.passAutocomplete = "new-password";
}

      updatePanelVisibility(nextType);
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
on("form-no-bg", "change", (e) => {
  const el = activeForm(); if (!el) return;
  el.dataset.formNoBg = e.target.checked ? "1" : "0";
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

    on("form-marker-text", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formMarkerText = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-marker-style", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formMarkerStyle = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-icon", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formIcon = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-icon-side", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formIconSide = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-icon-mode", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formIconMode = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-icon-bg", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formIconBg = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-icon-color", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formIconColor = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-style", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputStyle = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-bg", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputBg = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-border", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputBorder = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-border-style", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputBorderStyle = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-border-w", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputBorderW = String(parseInt(e.target.value || "1", 10) || 1);
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-shadow", "change", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputShadow = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-radius", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputRadius = String(parseInt(e.target.value || "10", 10) || 10);
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-pad-x", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputPadX = String(parseInt(e.target.value || "10", 10) || 10);
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-input-pad-y", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formInputPadY = String(parseInt(e.target.value || "9", 10) || 9);
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-placeholder-color", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formPlaceholderColor = e.target.value;
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-focus-ring", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formFocusRing = String(parseInt(e.target.value || "4", 10) || 4);
      updateFormVisuals(el);
      refreshLayers?.();
    });

    on("form-focus-opacity", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.dataset.formFocusOpacity = String(parseInt(e.target.value || "18", 10) || 18);
      updateFormVisuals(el);
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

    ["form-min", "form-max", "form-step"].forEach((id) => {
      on(id, "input", (e) => {
        const el = activeForm(); if (!el) return;
        const map = { "form-min": "formMin", "form-max": "formMax", "form-step": "formStep" };
        el.dataset[map[id]] = e.target.value;
        updateFormVisuals(el);
        refreshLayers?.();
      });
    });
on("pass-minlen", "input", (e) => {
  const el = activeForm(); if (!el) return;
  el.dataset.passMinLen = String(clamp(parseInt(e.target.value || "0", 10) || 0, 0, 128));
  updateFormVisuals(el);
  refreshLayers?.();
});

on("pass-autocomplete", "change", (e) => {
  const el = activeForm(); if (!el) return;
  el.dataset.passAutocomplete = String(e.target.value || "");
  updateFormVisuals(el);
  refreshLayers?.();
});

on("pass-reveal", "change", (e) => {
  const el = activeForm(); if (!el) return;
  el.dataset.passReveal = e.target.checked ? "1" : "0";
  updateFormVisuals(el);
  refreshLayers?.();
});

on("pass-meter", "change", (e) => {
  const el = activeForm(); if (!el) return;
  el.dataset.passMeter = e.target.checked ? "1" : "0";
  updateFormVisuals(el);
  refreshLayers?.();
});

    ["rating-min", "rating-max", "rating-step"].forEach((id) => {
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

    ["likert-min", "likert-max"].forEach((id) => {
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

    on("form-width", "input", (e) => {
      const el = activeForm(); if (!el) return;
      el.style.width = (parseInt(e.target.value || "320", 10) || 320) + "px";
      updateFormVisuals(el);
      refreshLayers?.();
    });

    document.querySelectorAll("[data-sg-email-preset]").forEach((btn) => {
      if (btn.dataset.__sgBound === "1") return;
      btn.dataset.__sgBound = "1";
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const el = activeForm(); if (!el) return;
        applyEmailPreset(el, btn.getAttribute("data-sg-email-preset") || "");
        updatePanelVisibility(el.dataset.formType || "text");
        updateFormVisuals(el);
        window.syncFormInputs?.(el);
        refreshLayers?.();
      }, true);
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
        data.formNoBg = el.dataset.formNoBg || "0";

        data.formRequired = el.dataset.formRequired || "0";
        data.formInline = el.dataset.formInline || "0";
        data.formName = el.dataset.formName || "";

        data.formRows = el.dataset.formRows || "3";
        data.formMin = el.dataset.formMin || "";
        data.formMax = el.dataset.formMax || "";
        data.formStep = el.dataset.formStep || "";
data.passMinLen = el.dataset.passMinLen || "0";
data.passReveal = el.dataset.passReveal || "1";
data.passMeter = el.dataset.passMeter || "1";
data.passAutocomplete = el.dataset.passAutocomplete || "";

        data.ratingMin = el.dataset.ratingMin || "1";
        data.ratingMax = el.dataset.ratingMax || "5";
        data.ratingStep = el.dataset.ratingStep || "1";
        data.ratingMinLabel = el.dataset.ratingMinLabel || "";
        data.ratingMaxLabel = el.dataset.ratingMaxLabel || "";

        data.likertMin = el.dataset.likertMin || "1";
        data.likertMax = el.dataset.likertMax || "5";
        data.likertLeft = el.dataset.likertLeft || "";
        data.likertRight = el.dataset.likertRight || "";

        data.formMarkerText = el.dataset.formMarkerText || "";
        data.formMarkerStyle = el.dataset.formMarkerStyle || "none";
        data.formIcon = el.dataset.formIcon || "";
        data.formIconSide = el.dataset.formIconSide || "left";
        data.formIconMode = el.dataset.formIconMode || "split";
        data.formIconBg = el.dataset.formIconBg || "#f1f5f9";
        data.formIconColor = el.dataset.formIconColor || "#0f172a";

        data.formInputStyle = el.dataset.formInputStyle || "box";
        data.formInputBg = el.dataset.formInputBg || "#ffffff";
        data.formInputBorder = el.dataset.formInputBorder || "#d1d5db";
        data.formInputBorderStyle = el.dataset.formInputBorderStyle || "solid";
        data.formInputBorderW = el.dataset.formInputBorderW || "1";
        data.formInputShadow = el.dataset.formInputShadow || "soft";
        data.formInputRadius = el.dataset.formInputRadius || "10";
        data.formInputPadX = el.dataset.formInputPadX || "10";
        data.formInputPadY = el.dataset.formInputPadY || "9";

        data.formPlaceholderColor = el.dataset.formPlaceholderColor || "#94a3b8";
        data.formFocusRing = el.dataset.formFocusRing || "4";
        data.formFocusOpacity = el.dataset.formFocusOpacity || "18";
      }
      return data;
    };

    window.getElementData.__sgFormHooked = true;
  }

  function updateAll() {
    document
      .querySelectorAll('.canvas-element[data-type="form"], .page-element[data-type="form"]')
      .forEach((el) => updateFormVisuals(el));
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
      
      if (!isFinal) {
         updateAll();
      }

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
