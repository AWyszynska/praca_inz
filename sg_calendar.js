(() => {
  const $ = (id) => document.getElementById(id);

  const inEditor = () => !!document.getElementById("preview-canvas");

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function capFirst(s) {
    s = String(s || "");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
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

  function escapeAttr(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function isCalendar(el) {
    return !!el && el.dataset && el.dataset.type === "calendar";
  }

  function ensureDefaults(el) {
    if (!isCalendar(el)) return;

    const now = new Date();
    if (!el.dataset.calYear) el.dataset.calYear = String(now.getFullYear());
    if (!el.dataset.calMonth) el.dataset.calMonth = String(now.getMonth() + 1);
    if (!el.dataset.calWeekStart) el.dataset.calWeekStart = "mon"; 
    if (!el.dataset.calTheme) el.dataset.calTheme = "blue"; 
if (!el.dataset.calBgA) el.dataset.calBgA = "";
if (!el.dataset.calBgB) el.dataset.calBgB = "";
if (!el.dataset.calAccent) el.dataset.calAccent = "";

if (!el.dataset.calRadius) el.dataset.calRadius = "30";
if (!el.dataset.calOuterPad) el.dataset.calOuterPad = "22";
if (!el.dataset.calGap) el.dataset.calGap = "10";
if (!el.dataset.calCellRadius) el.dataset.calCellRadius = "16";

if (!el.dataset.calMonthSize) el.dataset.calMonthSize = "34";
if (!el.dataset.calDaySize) el.dataset.calDaySize = "18";
if (!el.dataset.calWeekSize) el.dataset.calWeekSize = "14";
if (!el.dataset.calNavSize) el.dataset.calNavSize = "44";

if (!el.dataset.calShowOutside) el.dataset.calShowOutside = "1";
if (!el.dataset.calShowToday) el.dataset.calShowToday = "1";

    if (!el.style.width) el.style.width = "720px";
    if (!el.style.height) el.style.height = "520px";
    if (!el.style.background) el.style.background = "transparent";
    if (!el.style.border || el.style.border === "none") el.style.border = "none";
    if (!el.style.borderRadius) el.style.borderRadius = "24px";
    if (!el.style.boxShadow || el.style.boxShadow === "none") el.style.boxShadow = "0 14px 36px rgba(2,6,23,.18)";
    if (!el.style.color) el.style.color = "#ffffff";
    if (!el.style.fontSize) el.style.fontSize = "16px";
    if (!el.style.fontFamily) el.style.fontFamily = "'Segoe UI', sans-serif";
    if (!el.style.padding) el.style.padding = "0px";
  }

  function themeVars(theme) {
    if (theme === "dark") {
      return {
        bgA: "#111827",
        bgB: "#0b1220",
        panelA: "rgba(255,255,255,0.06)",
        panelB: "rgba(255,255,255,0.03)",
        tile: "rgba(255,255,255,0.07)",
        tileAlt: "rgba(255,255,255,0.04)",
        textSoft: "rgba(255,255,255,0.78)",
        accent: "#ffd166",
      };
    }
    if (theme === "light") {
      return {
        bgA: "#e2e8f0",
        bgB: "#cbd5e1",
        panelA: "rgba(255,255,255,0.65)",
        panelB: "rgba(255,255,255,0.45)",
        tile: "rgba(15,23,42,0.06)",
        tileAlt: "rgba(15,23,42,0.03)",
        textSoft: "rgba(15,23,42,0.72)",
        accent: "#f59e0b",
      };
    }
    return {
      bgA: "#2d66b8",
      bgB: "#1f4a93",
      panelA: "rgba(255,255,255,0.14)",
      panelB: "rgba(255,255,255,0.08)",
      tile: "rgba(255,255,255,0.13)",
      tileAlt: "rgba(255,255,255,0.08)",
      textSoft: "rgba(255,255,255,0.82)",
      accent: "#ffd166",
    };
  }

  function getCfgFull(el) {
    ensureDefaults(el);
    const year = clamp(parseInt(el.dataset.calYear || "2026", 10) || 2026, 1970, 2100);
    const month = clamp(parseInt(el.dataset.calMonth || "1", 10) || 1, 1, 12);
    const weekStart = (el.dataset.calWeekStart === "sun") ? "sun" : "mon";
    const theme = el.dataset.calTheme || "blue";
    const bgA = (el.dataset.calBgA || "").trim();
const bgB = (el.dataset.calBgB || "").trim();
const accent = (el.dataset.calAccent || "").trim();

const radius = clamp(parseInt(el.dataset.calRadius || "30", 10) || 30, 0, 80);
const outerPad = clamp(parseInt(el.dataset.calOuterPad || "22", 10) || 22, 0, 80);
const gap = clamp(parseInt(el.dataset.calGap || "10", 10) || 10, 0, 40);
const cellRadius = clamp(parseInt(el.dataset.calCellRadius || "16", 10) || 16, 0, 40);

const monthSize = clamp(parseInt(el.dataset.calMonthSize || "34", 10) || 34, 16, 64);
const daySize = clamp(parseInt(el.dataset.calDaySize || "18", 10) || 18, 10, 40);
const weekSize = clamp(parseInt(el.dataset.calWeekSize || "14", 10) || 14, 10, 28);
const navSize = clamp(parseInt(el.dataset.calNavSize || "44", 10) || 44, 28, 72);

const showOutside = (el.dataset.calShowOutside ?? "1") === "1";
const showToday = (el.dataset.calShowToday ?? "1") === "1";

return { year, month, weekStart, theme, bgA, bgB, accent, radius, outerPad, gap, cellRadius, monthSize, daySize, weekSize, navSize, showOutside, showToday };

  }

  function monthTitle(year, month) {
    const d = new Date(year, month - 1, 1);
    const fmtMonth = new Intl.DateTimeFormat("pl-PL", { month: "long" }).format(d);
    return capFirst(fmtMonth);
  }

  function dayLabels(weekStart) {
    const labelsMon = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"];
    return (weekStart === "sun")
      ? ["ND", "PN", "WT", "ŚR", "CZ", "PT", "SB"]
      : labelsMon;
  }

  function gridDays(year, month, weekStart) {
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    const daysInMonth = last.getDate();
    const jsDow = first.getDay();

    const startIndex = (weekStart === "sun")
      ? jsDow
      : (jsDow === 0 ? 6 : jsDow - 1);

    const prevLast = new Date(year, month - 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - startIndex + 1;
      if (dayNum < 1) cells.push({ d: prevLast + dayNum, muted: true });
      else if (dayNum > daysInMonth) cells.push({ d: dayNum - daysInMonth, muted: true });
      else cells.push({ d: dayNum, muted: false });
    }
    return cells;
  }

  function buildMarkup(el) {
    const cfg = getCfgFull(el);
const vars = themeVars(cfg.theme);

if (cfg.bgA) vars.bgA = cfg.bgA;
if (cfg.bgB) vars.bgB = cfg.bgB;
if (cfg.accent) vars.accent = cfg.accent;


    const title = monthTitle(cfg.year, cfg.month);
    const labels = dayLabels(cfg.weekStart);
    const cells = gridDays(cfg.year, cfg.month, cfg.weekStart);

    const now = new Date();
    const isThisMonth = (now.getFullYear() === cfg.year && (now.getMonth() + 1) === cfg.month);
    const today = isThisMonth ? now.getDate() : -1;

    const rootCls = `sgcal_${String(el.dataset.id || "cal").replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    return `
<style>
.${rootCls}{
  width:100%; height:100%; box-sizing:border-box;
  border-radius:${cfg.radius}px; padding:${cfg.outerPad}px;
  background:linear-gradient(180deg, ${vars.bgA}, ${vars.bgB});
  display:flex; flex-direction:column; gap:12px;
  position:relative; overflow:hidden;
}
  .${rootCls} .sgcal__top{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .${rootCls} .sgcal__navbtn{
  width:${cfg.navSize}px; height:${cfg.navSize}px; border-radius:999px; border:0;
  background:rgba(255,255,255,0.16); color:rgba(255,255,255,0.92);
  font-size:22px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;
  user-select:none; box-shadow:0 10px 22px rgba(2,6,23,.18);
}
  .${rootCls}[data-theme="light"] .sgcal__navbtn{ background:rgba(15,23,42,0.08); color:rgba(15,23,42,0.9); }
  .${rootCls} .sgcal__title{ text-align:center; flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; min-width:120px; }
  .${rootCls} .sgcal__month{ font-weight:800; font-size:${cfg.monthSize}px; line-height:1; }
  .${rootCls} .sgcal__year{ font-weight:700; font-size:16px; color:${vars.textSoft}; line-height:1.1; }
  .${rootCls} .sgcal__panel{
    flex:1; min-height:0; border-radius:22px; padding:16px;
    background:linear-gradient(180deg, ${vars.panelA}, ${vars.panelB});
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    display:flex; flex-direction:column; gap:12px;
  }
  .${rootCls} .sgcal__week{
  display:grid; grid-template-columns:repeat(7, 1fr); gap:${cfg.gap}px;
  text-align:center; font-weight:800; letter-spacing:.6px; font-size:${cfg.weekSize}px;
  color:${vars.textSoft}; user-select:none;
}
  .${rootCls} .sgcal__grid{
  flex:1; min-height:0;
  display:grid; grid-template-columns:repeat(7, 1fr);
  grid-auto-rows:1fr; gap:${cfg.gap}px;
}
.${rootCls} .sgcal__cell{
  border-radius:${cfg.cellRadius}px; background:${vars.tile};
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
  display:flex; align-items:flex-start; justify-content:flex-start;
  padding:10px 12px; font-weight:800; font-size:${cfg.daySize}px; line-height:1;
  user-select:none;
}
  .${rootCls} .sgcal__cell.muted{ opacity:.35; background:${vars.tileAlt}; }
  .${rootCls} .sgcal__cell.today{ background:${vars.accent}; color:#0f172a; box-shadow:0 10px 20px rgba(2,6,23,.16); }
  .${rootCls} .sgcal__cell.hide{ opacity:0; pointer-events:none; }
</style>

<div class="${rootCls}" data-root="${escapeAttr(rootCls)}" data-theme="${escapeAttr(cfg.theme)}">
  <div class="sgcal__top">
    <button type="button" class="sgcal__navbtn sgcal__prev">&lt;</button>
    <div class="sgcal__title">
      <div class="sgcal__month">${escapeHtml(title)}</div>
      <div class="sgcal__year">${cfg.year}</div>
    </div>
    <button type="button" class="sgcal__navbtn sgcal__next">&gt;</button>
  </div>

  <div class="sgcal__panel">
    <div class="sgcal__week">${labels.map((d) => `<div>${escapeHtml(d)}</div>`).join("")}</div>
    <div class="sgcal__grid">
      ${cells.map((c) => {
        const cls = ["sgcal__cell"];
        if (c.muted && cfg.showOutside) cls.push("muted");
if (c.muted && !cfg.showOutside) cls.push("hide");
if (!c.muted && c.d === today && cfg.showToday) cls.push("today");

        return `<div class="${cls.join(" ")}">${c.d}</div>`;
      }).join("")}
    </div>
  </div>
</div>
    `.trim();
  }

  function attachHandlers(el) {
    const root = el.querySelector("[data-root]");
    if (!root) return;
    if (root.dataset.bound === "1") return;
    root.dataset.bound = "1";

    const prevBtn = root.querySelector(".sgcal__prev");
    const nextBtn = root.querySelector(".sgcal__next");
    if (!prevBtn || !nextBtn) return;

    const stopDrag = (ev) => ev.stopPropagation();
    ["pointerdown", "mousedown"].forEach((t) => {
      prevBtn.addEventListener(t, stopDrag, true);
      nextBtn.addEventListener(t, stopDrag, true);
    });

    prevBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const y = parseInt(el.dataset.calYear || "2026", 10) || 2026;
      const m = parseInt(el.dataset.calMonth || "1", 10) || 1;

      let ny = y, nm = m - 1;
      if (nm < 1) { nm = 12; ny = y - 1; }

      el.dataset.calYear = String(ny);
      el.dataset.calMonth = String(nm);

      updateCalendarVisuals(el);
      window.syncCalendarInputs?.(el);
      window.refreshLayers?.();
    });

    nextBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const y = parseInt(el.dataset.calYear || "2026", 10) || 2026;
      const m = parseInt(el.dataset.calMonth || "1", 10) || 1;

      let ny = y, nm = m + 1;
      if (nm > 12) { nm = 1; ny = y + 1; }

      el.dataset.calYear = String(ny);
      el.dataset.calMonth = String(nm);

      updateCalendarVisuals(el);
      window.syncCalendarInputs?.(el);
      window.refreshLayers?.();
    });
  }

  function buildRuntimeMarkup(el) {
    const cfg = getCfgFull(el);
    const vars = themeVars(cfg.theme);
    const rootId = `sgcal_rt_${String(el.dataset.id || "cal").replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    return document.createElement("div").outerHTML;
  }

  function updateCalendarVisuals(el) {
    if (!isCalendar(el)) return;
    ensureDefaults(el);

    el.contentEditable = "false";
    el.innerHTML = buildMarkup(el);
    attachHandlers(el);

    const panelPrev = $("calendar-panel-preview");
    if (panelPrev) panelPrev.innerHTML = buildMarkup(el);
  }

  window.updateCalendarVisuals = updateCalendarVisuals;

  window.createCalendarElement = function createCalendarElement(clientX, clientY) {
    if (!inEditor()) return;
    if (!window.canvas) return;
    if (typeof window.zCounter === "undefined") window.zCounter = 1;

    const host = (typeof window.activeContainer !== "undefined" && window.activeContainer) ? window.activeContainer : canvas;
    const rect = host.getBoundingClientRect();

    const px = Number.isFinite(clientX) ? (clientX - rect.left) : Math.round(rect.width * 0.5);
    const py = Number.isFinite(clientY) ? (clientY - rect.top) : Math.round(rect.height * 0.25);

    const calEl = document.createElement("div");
    calEl.className = "canvas-element type-calendar";
    calEl.dataset.type = "calendar";
    calEl.dataset.id = "cal_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
    calEl.style.zIndex = String(++window.zCounter);

    calEl.style.left = Math.max(0, Math.round(px - 360)) + "px";
    calEl.style.top = Math.max(0, Math.round(py - 240)) + "px";

    ensureDefaults(calEl);
    updateCalendarVisuals(calEl);

    host.appendChild(calEl);

    if (typeof window.setupElementMovement === "function") window.setupElementMovement(calEl, "calendar");

    calEl.onclick = (ev) => { ev.stopPropagation(); window.selectElement?.(calEl); };
    window.selectElement?.(calEl);
    window.refreshLayers?.();

    return calEl;
  };

  window.syncCalendarInputs = function syncCalendarInputs(el) {
    if (!isCalendar(el)) return;
    ensureDefaults(el);

    const cfg = getCfgFull(el);
    const setVal = (id, v) => { const n = $(id); if (n) n.value = String(v ?? ""); };

    setVal("cal-year", cfg.year);
    setVal("cal-month", cfg.month);
    setVal("cal-week-start", cfg.weekStart);
    setVal("cal-theme", cfg.theme);
setVal("cal-bg-a", cfg.bgA || "#2d66b8");
setVal("cal-bg-b", cfg.bgB || "#1f4a93");
setVal("cal-accent", cfg.accent || "#ffd166");

setVal("cal-radius", cfg.radius);
setVal("cal-pad", cfg.outerPad);
setVal("cal-gap", cfg.gap);
setVal("cal-cell-radius", cfg.cellRadius);

setVal("cal-month-size", cfg.monthSize);
setVal("cal-day-size", cfg.daySize);
setVal("cal-week-size", cfg.weekSize);
setVal("cal-nav-size", cfg.navSize);

const outside = document.getElementById("cal-show-outside");
if (outside) outside.checked = cfg.showOutside;

const today = document.getElementById("cal-show-today");
if (today) today.checked = cfg.showToday;

    setVal("cal-w", parseInt(el.style.width) || 720);
    setVal("cal-h", parseInt(el.style.height) || 520);

    updateCalendarVisuals(el);
  };

  function bindCalendarUI() {
    const bindOnce = (id, ev, fn) => {
      const n = $(id);
      if (!n) return;
      const key = `__sgCalBound_${ev}`;
      if (n.dataset[key] === "1") return;
      n.dataset[key] = "1";
      n.addEventListener(ev, fn);
    };

    const activeCal = () => (window.activeElement && isCalendar(window.activeElement)) ? window.activeElement : null;


    bindOnce("cal-year", "input", (e) => {
      const el = activeCal(); if (!el) return;
      el.dataset.calYear = String(clamp(parseInt(e.target.value || "2026", 10) || 2026, 1970, 2100));
      updateCalendarVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("cal-month", "change", (e) => {
      const el = activeCal(); if (!el) return;
      el.dataset.calMonth = String(clamp(parseInt(e.target.value || "1", 10) || 1, 1, 12));
      updateCalendarVisuals(el);
      window.refreshLayers?.();
    });
bindOnce("cal-bg-a", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calBgA = e.target.value || "";
  updateCalendarVisuals(el);
  window.refreshLayers?.();
});

bindOnce("cal-bg-b", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calBgB = e.target.value || "";
  updateCalendarVisuals(el);
});

bindOnce("cal-accent", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calAccent = e.target.value || "";
  updateCalendarVisuals(el);
});

bindOnce("cal-radius", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calRadius = String(clamp(parseInt(e.target.value || "30", 10) || 30, 0, 80));
  updateCalendarVisuals(el);
});

bindOnce("cal-pad", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calOuterPad = String(clamp(parseInt(e.target.value || "22", 10) || 22, 0, 80));
  updateCalendarVisuals(el);
});

bindOnce("cal-gap", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calGap = String(clamp(parseInt(e.target.value || "10", 10) || 10, 0, 40));
  updateCalendarVisuals(el);
});

bindOnce("cal-cell-radius", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calCellRadius = String(clamp(parseInt(e.target.value || "16", 10) || 16, 0, 40));
  updateCalendarVisuals(el);
});

bindOnce("cal-month-size", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calMonthSize = String(clamp(parseInt(e.target.value || "34", 10) || 34, 16, 64));
  updateCalendarVisuals(el);
});

bindOnce("cal-day-size", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calDaySize = String(clamp(parseInt(e.target.value || "18", 10) || 18, 10, 40));
  updateCalendarVisuals(el);
});

bindOnce("cal-week-size", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calWeekSize = String(clamp(parseInt(e.target.value || "14", 10) || 14, 10, 28));
  updateCalendarVisuals(el);
});

bindOnce("cal-nav-size", "input", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calNavSize = String(clamp(parseInt(e.target.value || "44", 10) || 44, 28, 72));
  updateCalendarVisuals(el);
});

bindOnce("cal-show-outside", "change", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calShowOutside = e.target.checked ? "1" : "0";
  updateCalendarVisuals(el);
});

bindOnce("cal-show-today", "change", (e) => {
  const el = activeCal(); if (!el) return;
  el.dataset.calShowToday = e.target.checked ? "1" : "0";
  updateCalendarVisuals(el);
});

    bindOnce("cal-week-start", "change", (e) => {
      const el = activeCal(); if (!el) return;
      el.dataset.calWeekStart = (e.target.value === "sun") ? "sun" : "mon";
      updateCalendarVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("cal-theme", "change", (e) => {
      const el = activeCal(); if (!el) return;
      el.dataset.calTheme = e.target.value || "blue";
      updateCalendarVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("cal-today", "click", () => {
      const el = activeCal(); if (!el) return;
      const now = new Date();
      el.dataset.calYear = String(now.getFullYear());
      el.dataset.calMonth = String(now.getMonth() + 1);
      updateCalendarVisuals(el);
      window.syncCalendarInputs?.(el);
      window.refreshLayers?.();
    });

    bindOnce("cal-w", "input", (e) => {
      const el = activeCal(); if (!el) return;
      el.style.width = clamp(parseInt(e.target.value || "720", 10) || 720, 240, 2000) + "px";
      updateCalendarVisuals(el);
      window.refreshLayers?.();
    });

    bindOnce("cal-h", "input", (e) => {
      const el = activeCal(); if (!el) return;
      el.style.height = clamp(parseInt(e.target.value || "520", 10) || 520, 200, 2000) + "px";
      updateCalendarVisuals(el);
      window.refreshLayers?.();
    });
  }

  function hookSelectElement() {
    if (typeof window.selectElement !== "function") return;
    if (window.selectElement.__sgCalHooked) return;

    const orig = window.selectElement;
    window.selectElement = function (el) {
      orig(el);

      const sec = $("calendar-edit-section");
      if (!sec) return;

      if (isCalendar(el)) {
        sec.style.display = "block";
        window.syncCalendarInputs?.(el);
      } else {
        sec.style.display = "none";
      }
    };

    window.selectElement.__sgCalHooked = true;
  }

  function hookGetElementData() {
    if (typeof window.getElementData !== "function") return;
    if (window.getElementData.__sgCalHooked) return;

    const orig = window.getElementData;
    window.getElementData = function (el) {
      const data = orig(el);

      if (isCalendar(el)) {
        ensureDefaults(el);
        data.content = (typeof window.__sgCalRuntime === "function")
          ? window.__sgCalRuntime(el)
          : data.content;

        data.calYear = el.dataset.calYear || "";
        data.calMonth = el.dataset.calMonth || "";
        data.calWeekStart = el.dataset.calWeekStart || "mon";
        data.calTheme = el.dataset.calTheme || "blue";
        data.calBgA = el.dataset.calBgA || "";
data.calBgB = el.dataset.calBgB || "";
data.calAccent = el.dataset.calAccent || "";

data.calRadius = el.dataset.calRadius || "30";
data.calOuterPad = el.dataset.calOuterPad || "22";
data.calGap = el.dataset.calGap || "10";
data.calCellRadius = el.dataset.calCellRadius || "16";

data.calMonthSize = el.dataset.calMonthSize || "34";
data.calDaySize = el.dataset.calDaySize || "18";
data.calWeekSize = el.dataset.calWeekSize || "14";
data.calNavSize = el.dataset.calNavSize || "44";

data.calShowOutside = el.dataset.calShowOutside || "1";
data.calShowToday = el.dataset.calShowToday || "1";

      }

      return data;
    };

    window.getElementData.__sgCalHooked = true;
  }

  function init() {
    bindCalendarUI();
    hookSelectElement();
    hookGetElementData();

document.querySelectorAll('.canvas-element[data-type="calendar"], .sg-calendar-runtime[data-type="calendar"]').forEach((el) => {
  ensureDefaults(el);
  updateCalendarVisuals(el);
});

    let tries = 0;
    const t = setInterval(() => {
      tries++;
      hookSelectElement();
      hookGetElementData();
      if (window.selectElement?.__sgCalHooked && window.getElementData?.__sgCalHooked) clearInterval(t);
      if (tries >= 80) clearInterval(t);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
