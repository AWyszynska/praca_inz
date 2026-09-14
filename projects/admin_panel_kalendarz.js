(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/admin_panel_kalendarz.php";

  const state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    visits: [],
    notes: [],
    employees: [],
    selectedDate: "",
    employeeId: "",
    type: "",
  };

  let savedCalendarLook = null;
const ADMIN_CALENDAR_INNER_LOOK = {
  calOuterPad: "26",
  calGap: "9",
  calCellRadius: "12",
  calDaySize: "22",
  calWeekSize: "18",
  calMonthSize: "40",
  calNavSize: "22"
};

function applyAdminCalendarInnerLook(look) {
  if (!look) return look;

  return {
    ...look,
    ...ADMIN_CALENDAR_INNER_LOOK
  };
}

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[ch]));
  }

  function isoDate(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function findCalendarEl() {
    return document.querySelector(
      '.page-element[data-type="calendar"], .canvas-element[data-type="calendar"], [data-type="calendar"]'
    );
  }

  function captureCalendarLook(cal) {
    if (!cal) return null;

    const ds = cal.dataset || {};

    return {
      calTheme: ds.calTheme || "light",
      calBgA: ds.calBgA || "#419b95",
      calBgB: ds.calBgB || "#4ba091",
      calAccent: ds.calAccent || "#ffc02e",

      calRadius: ds.calRadius || "4",
      calOuterPad: ds.calOuterPad || "80",
      calGap: ds.calGap || "8",
      calCellRadius: ds.calCellRadius || "9",

      calMonthSize: ds.calMonthSize || "",
      calDaySize: ds.calDaySize || "20",
      calWeekSize: ds.calWeekSize || "",
      calNavSize: ds.calNavSize || "",

      calShowOutside: ds.calShowOutside || "",
      calShowToday: ds.calShowToday || "",

      style: cal.getAttribute("style") || "",
      className: cal.getAttribute("class") || ""
    };
  }

  function lockCalendarLook(cal) {
    if (!cal) return;

    if (!savedCalendarLook) {
      savedCalendarLook = captureCalendarLook(cal);
    }

    const look = applyAdminCalendarInnerLook(savedCalendarLook);
if (!look) return;

    cal.dataset.calTheme = look.calTheme;
    cal.dataset.calBgA = look.calBgA;
    cal.dataset.calBgB = look.calBgB;
    cal.dataset.calAccent = look.calAccent;

    cal.dataset.calRadius = look.calRadius;
    cal.dataset.calOuterPad = look.calOuterPad;
    cal.dataset.calGap = look.calGap;
    cal.dataset.calCellRadius = look.calCellRadius;

cal.dataset.calMonthSize = look.calMonthSize;
cal.dataset.calDaySize = look.calDaySize;
cal.dataset.calWeekSize = look.calWeekSize;
cal.dataset.calNavSize = look.calNavSize;

    if (look.calShowOutside) cal.dataset.calShowOutside = look.calShowOutside;
    if (look.calShowToday) cal.dataset.calShowToday = look.calShowToday;

    if (look.className) {
      cal.setAttribute("class", look.className);
    }

    if (look.style) {
      cal.setAttribute("style", look.style);
    }
  }

  function protectCalendarVisuals() {
    if (window.__adminCalendarProtected === true) return;
    if (typeof window.updateCalendarVisuals !== "function") return;

    const originalUpdate = window.updateCalendarVisuals;

    window.updateCalendarVisuals = function (cal) {
      if (cal && cal.dataset && cal.dataset.type === "calendar") {
        lockCalendarLook(cal);
      }

      const result = originalUpdate.apply(this, arguments);

      if (cal && cal.dataset && cal.dataset.type === "calendar") {
        lockCalendarLook(cal);
      }

      return result;
    };

    window.__adminCalendarProtected = true;
  }

  function getCalendarCfg(cal) {
    const now = new Date();

    const year =
      parseInt(cal?.dataset?.calYear || String(state.year || now.getFullYear()), 10) ||
      now.getFullYear();

    const month =
      parseInt(cal?.dataset?.calMonth || String(state.month || now.getMonth() + 1), 10) ||
      now.getMonth() + 1;

    const weekStart = cal?.dataset?.calWeekStart === "sun" ? "sun" : "mon";

    return { year, month, weekStart };
  }

  function gridDays(year, month, weekStart) {
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    const daysInMonth = last.getDate();
    const jsDow = first.getDay();

    const startIndex = weekStart === "sun"
      ? jsDow
      : (jsDow === 0 ? 6 : jsDow - 1);

    const prevLast = new Date(year, month - 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < 42; i++) {
      const dayNum = i - startIndex + 1;

      if (dayNum < 1) {
        cells.push({
          day: prevLast + dayNum,
          muted: true,
          date: "",
        });
      } else if (dayNum > daysInMonth) {
        cells.push({
          day: dayNum - daysInMonth,
          muted: true,
          date: "",
        });
      } else {
        cells.push({
          day: dayNum,
          muted: false,
          date: isoDate(year, month, dayNum),
        });
      }
    }

    return cells;
  }

  function statusInfo(status) {
    const s = String(status || "").toUpperCase();

    if (s === "FREE") {
      return { label: "Wolny", color: "#60a5fa", bg: "rgba(96,165,250,.88)" };
    }

    if (s === "BOOKED") {
      return { label: "Umówiona", color: "#22c55e", bg: "rgba(34,197,94,.88)" };
    }

    if (s === "CONFIRMED") {
      return { label: "Potwierdzona", color: "#8b5cf6", bg: "rgba(139,92,246,.88)" };
    }

    if (s === "PENDING" || s === "WAITING" || s === "OCZEKUJACE" || s === "OCZEKUJĄCE") {
      return { label: "Oczekująca", color: "#f59e0b", bg: "rgba(245,158,11,.88)" };
    }

    if (s === "IN_PROGRESS") {
      return { label: "W trakcie", color: "#f97316", bg: "rgba(249,115,22,.88)" };
    }

    if (s === "DONE") {
      return { label: "Zakończona", color: "#64748b", bg: "rgba(100,116,139,.86)" };
    }

    if (s === "CANCELLED" || s === "CANCELED" || s === "ANULOWANA" || s === "NOT_DONE") {
      return { label: "Odwołana", color: "#ef4444", bg: "rgba(239,68,68,.88)" };
    }

    return { label: status || "Inna", color: "#14b8a6", bg: "rgba(20,184,166,.86)" };
  }

  function shortStatus(status) {
    const s = String(status || "").toUpperCase();

    if (s === "FREE") return "wolny";
    if (s === "BOOKED") return "umów.";
    if (s === "CONFIRMED") return "potw.";
    if (s === "PENDING" || s === "WAITING" || s === "OCZEKUJACE" || s === "OCZEKUJĄCE") return "oczek.";
    if (s === "IN_PROGRESS") return "trwa";
    if (s === "DONE") return "koniec";
    if (s === "CANCELLED" || s === "CANCELED" || s === "ANULOWANA" || s === "NOT_DONE") return "odwoł.";

    return "wizyta";
  }

  function filterVisits(list) {
    const employeeId = String(state.employeeId || "");
    const type = String(state.type || "").toUpperCase();

    return (Array.isArray(list) ? list : []).filter((item) => {
      const itemEmployeeId = String(item.employee_id || "");
      const status = String(item.status || "").toUpperCase();

      if (type === "NOTES") return false;

      const okEmployee = !employeeId || itemEmployeeId === employeeId;
      const okType = !type || status === type;

      return okEmployee && okType;
    });
  }

  function filterNotes(list) {
    const employeeId = String(state.employeeId || "");
    const type = String(state.type || "").toUpperCase();

    return (Array.isArray(list) ? list : []).filter((item) => {
      const itemEmployeeId = String(item.employee_id || "");

      if (type && type !== "NOTES") return false;

      return !employeeId || itemEmployeeId === employeeId;
    });
  }

  function groupByDate(list) {
    const map = {};

    (Array.isArray(list) ? list : []).forEach((item) => {
      const date = String(item.date || "").trim();
      if (!date) return;

      if (!map[date]) map[date] = [];
      map[date].push(item);
    });

    return map;
  }

  function injectCss() {
    if (document.getElementById("admin-calendar-runtime-css")) return;

    const style = document.createElement("style");
    style.id = "admin-calendar-runtime-css";

    style.textContent = `
      .admin-cal-decorated {
        cursor: pointer !important;
        position: relative !important;
        overflow: hidden !important;
      }

      .admin-cal-daynum {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #020617;
}

      .admin-cal-note-corner {
        position: absolute;
        right: 0;
        top: 0;
        width: 32px;
        height: 32px;
        background: #facc15;
        clip-path: polygon(100% 0, 0 0, 100% 100%);
        z-index: 5;
        pointer-events: none;
      }

      #admin-calendar-panel {
        font-family: Arial, sans-serif;
        color: #0f172a;
      }

      #admin-calendar-panel input,
      #admin-calendar-panel textarea,
      #admin-calendar-panel select {
        font-family: Arial, sans-serif;
      }

      .admin-cal-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(255,255,255,.88);
  border: 1px solid rgba(148,163,184,.35);
  color: #0f172a;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 3px;
  box-sizing: border-box;
}
    `;

    document.head.appendChild(style);
  }

  function renderCellContent(day, visits, notes) {
    const lines = visits.slice(0, 2).map((visit) => {
      const info = statusInfo(visit.status);

      return `
        <div class="admin-cal-pill">
          <span style="
            width:7px;
            height:7px;
            border-radius:999px;
            background:${info.color};
            flex:0 0 auto;
          "></span>

          <span>${escapeHtml(visit.time || "--:--")}</span>
          <span>${escapeHtml(shortStatus(visit.status))}</span>
        </div>
      `;
    }).join("");

    const more = visits.length > 2
      ? `
        <div style="
          font-size:10px;
          font-weight:900;
          margin-top:3px;
          color:inherit;
          opacity:.9;
        ">
          +${visits.length - 2} więcej
        </div>
      `
      : "";

    const noteCorner = notes.length
      ? `<span class="admin-cal-note-corner"></span>`
      : "";

    return `
      ${noteCorner}

      <span class="admin-cal-daynum">${escapeHtml(day)}</span>

      <div style="
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        gap:1px;
        max-width:100%;
        overflow:hidden;
      ">
        ${lines}
        ${more}
      </div>
    `;
  }

  function decorateCalendar() {
    const cal = findCalendarEl();

    if (!cal) return false;

    protectCalendarVisuals();
    lockCalendarLook(cal);
    injectCss();

    const cfg = getCalendarCfg(cal);
    const cellsModel = gridDays(cfg.year, cfg.month, cfg.weekStart);

    const cellEls = Array.from(cal.querySelectorAll(".sgcal__grid .sgcal__cell"));

    if (!cellEls.length) return false;

    const filteredVisits = filterVisits(state.visits);
    const filteredNotes = filterNotes(state.notes);

    const visitsByDate = groupByDate(filteredVisits);
    const notesByDate = groupByDate(filteredNotes);

    cellEls.forEach((cell, index) => {
      const model = cellsModel[index];

      if (!model) return;

      const date = model.date || "";
      const visits = date ? (visitsByDate[date] || []) : [];
      const notes = date ? (notesByDate[date] || []) : [];

      cell.dataset.date = date;
      cell.classList.add("admin-cal-decorated");

      /*
        Nie zmieniamy:
        - cell.style.background
        - cell.style.color
        - cell.style.boxShadow

        Dzięki temu wygląd z Super Generatora zostaje taki sam.
      */

      if (model.muted || !date) {
        cell.innerHTML = `<span class="admin-cal-daynum">${escapeHtml(model.day)}</span>`;
        return;
      }

      cell.innerHTML = renderCellContent(model.day, visits, notes);

      if (cell.dataset.adminCalendarCellBound !== "1") {
        cell.dataset.adminCalendarCellBound = "1";

        cell.addEventListener("click", () => {
          state.selectedDate = cell.dataset.date || "";

          const input = document.getElementById("admin-calendar-note-date");
          if (input) input.value = state.selectedDate;

          renderSelectedDay(state.selectedDate);
        });
      }
    });

    hookCalendarArrows(cal);

    return true;
  }

  function hookCalendarArrows(cal) {
    if (!cal || cal.dataset.adminCalendarArrowsBound === "1") return;

    cal.dataset.adminCalendarArrowsBound = "1";

    cal.addEventListener("click", (event) => {
      const btn = event.target.closest(".sgcal__prev, .sgcal__next");
      if (!btn) return;

      setTimeout(() => {
        lockCalendarLook(cal);

        const cfg = getCalendarCfg(cal);

        state.year = cfg.year;
        state.month = cfg.month;

        loadData();
      }, 160);
    }, true);
  }

  function ensureAdminPanel() {
    const cal = findCalendarEl();

    if (!cal) return null;

    let panel = document.getElementById("admin-calendar-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "admin-calendar-panel";

      const parent = cal.parentElement || document.body;
      parent.appendChild(panel);
    }

    const left = cal.offsetLeft;
    const top = cal.offsetTop + cal.offsetHeight + 18;
    const width = Math.max(700, cal.offsetWidth);

    panel.style.cssText = `
      position:absolute;
      left:${left}px;
      top:${top}px;
      width:${width}px;
      min-height:230px;
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      box-shadow:0 12px 30px rgba(0,0,0,.10);
      padding:14px;
      box-sizing:border-box;
      z-index:30;
    `;

    panel.innerHTML = `
      <div style="
        display:flex;
        justify-content:space-between;
        gap:12px;
        align-items:center;
        margin-bottom:12px;
      ">
        <div style="
          font-size:19px;
          font-weight:900;
          font-family:Georgia, serif;
          font-style:italic;
        ">
          Kalendarz administratora
        </div>

        <div style="
          display:flex;
          gap:8px;
          align-items:center;
          font-size:12px;
          font-weight:800;
          color:#334155;
          flex-wrap:wrap;
        ">
          <span>🟩 umówione</span>
          <span>🟦 wolne</span>
          <span>🟨 notatka</span>
          <span>⬛ zakończone</span>
        </div>
      </div>

      <div style="
        display:grid;
        grid-template-columns:220px 190px 1fr;
        gap:10px;
        align-items:end;
        margin-bottom:12px;
      ">
        <div>
          <label style="
            display:block;
            font-size:12px;
            font-weight:900;
            color:#334155;
            margin-bottom:5px;
          ">
            Lekarz
          </label>

          <select id="admin-calendar-filter-employee" style="
            height:40px;
            width:100%;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            box-sizing:border-box;
            background:white;
          ">
            <option value="">Wszyscy lekarze</option>
            ${state.employees.map((emp) => `
              <option value="${escapeHtml(emp.id)}" ${String(state.employeeId) === String(emp.id) ? "selected" : ""}>
                ${escapeHtml(emp.name)}
              </option>
            `).join("")}
          </select>
        </div>

        <div>
          <label style="
            display:block;
            font-size:12px;
            font-weight:900;
            color:#334155;
            margin-bottom:5px;
          ">
            Typ / status
          </label>

          <select id="admin-calendar-filter-type" style="
            height:40px;
            width:100%;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            box-sizing:border-box;
            background:white;
          ">
            <option value="" ${state.type === "" ? "selected" : ""}>Wszystko</option>
            <option value="FREE" ${state.type === "FREE" ? "selected" : ""}>Wolne terminy</option>
            <option value="BOOKED" ${state.type === "BOOKED" ? "selected" : ""}>Umówione</option>
            <option value="CONFIRMED" ${state.type === "CONFIRMED" ? "selected" : ""}>Potwierdzone</option>
            <option value="IN_PROGRESS" ${state.type === "IN_PROGRESS" ? "selected" : ""}>W trakcie</option>
            <option value="DONE" ${state.type === "DONE" ? "selected" : ""}>Zakończone</option>
            <option value="CANCELLED" ${state.type === "CANCELLED" ? "selected" : ""}>Odwołane</option>
            <option value="NOTES" ${state.type === "NOTES" ? "selected" : ""}>Tylko notatki</option>
          </select>
        </div>

        <div style="
          font-size:13px;
          color:#64748b;
          line-height:1.35;
        ">
          Filtry działają na listę wizyt oraz oznaczenia w kalendarzu.
        </div>
      </div>

      <div style="
        border-top:1px solid #e2e8f0;
        padding-top:12px;
      ">
        <div style="
          display:grid;
          grid-template-columns:170px 130px 220px 1fr 120px;
          gap:10px;
          align-items:start;
        ">
          <input id="admin-calendar-note-date" type="date" value="${escapeHtml(state.selectedDate || "")}" style="
            height:40px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            box-sizing:border-box;
          ">

          <input id="admin-calendar-note-time" type="time" style="
            height:40px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            box-sizing:border-box;
          ">

          <select id="admin-calendar-note-employee" style="
            height:40px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            box-sizing:border-box;
            background:white;
          ">
            <option value="">Lekarz notatki</option>
            ${state.employees.map((emp) => `
              <option value="${escapeHtml(emp.id)}" ${String(state.employeeId) === String(emp.id) ? "selected" : ""}>
                ${escapeHtml(emp.name)}
              </option>
            `).join("")}
          </select>

          <textarea id="admin-calendar-note-text" placeholder="Wpisz notatkę do kalendarza..." style="
            height:72px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:10px;
            resize:none;
            box-sizing:border-box;
          "></textarea>

          <button type="button" id="admin-calendar-note-save" style="
            height:40px;
            border:none;
            border-radius:10px;
            background:#1d4ed8;
            color:white;
            font-weight:900;
            cursor:pointer;
          ">
            Zapisz
          </button>
        </div>

        <div id="admin-calendar-selected-day" style="
          margin-top:12px;
          font-size:13px;
          color:#475569;
        ">
          Kliknij dzień w kalendarzu, żeby zobaczyć wizyty i notatki.
        </div>
      </div>
    `;

    bindPanelEvents();

    if (state.selectedDate) {
      renderSelectedDay(state.selectedDate);
    }

    return panel;
  }

  function bindPanelEvents() {
    const employeeFilter = document.getElementById("admin-calendar-filter-employee");
    const typeFilter = document.getElementById("admin-calendar-filter-type");
    const saveBtn = document.getElementById("admin-calendar-note-save");

    if (employeeFilter && employeeFilter.dataset.bound !== "1") {
      employeeFilter.dataset.bound = "1";

      employeeFilter.addEventListener("change", () => {
        state.employeeId = employeeFilter.value || "";

        const noteEmployee = document.getElementById("admin-calendar-note-employee");
        if (noteEmployee && state.employeeId) {
          noteEmployee.value = state.employeeId;
        }

        decorateCalendar();

        if (state.selectedDate) {
          renderSelectedDay(state.selectedDate);
        }
      });
    }

    if (typeFilter && typeFilter.dataset.bound !== "1") {
      typeFilter.dataset.bound = "1";

      typeFilter.addEventListener("change", () => {
        state.type = typeFilter.value || "";
        decorateCalendar();

        if (state.selectedDate) {
          renderSelectedDay(state.selectedDate);
        }
      });
    }

    if (saveBtn && saveBtn.dataset.bound !== "1") {
      saveBtn.dataset.bound = "1";
      saveBtn.addEventListener("click", addNote);
    }
  }

  function renderSelectedDay(date) {
    const box = document.getElementById("admin-calendar-selected-day");

    if (!box || !date) return;

    const visits = filterVisits(state.visits).filter((v) => v.date === date);
    const notes = filterNotes(state.notes).filter((n) => n.date === date);

    box.innerHTML = `
      <div style="
        font-size:15px;
        font-weight:900;
        color:#0f172a;
        margin-bottom:8px;
      ">
        Wybrany dzień: ${escapeHtml(date)}
      </div>

      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
      ">
        <div>
          <div style="font-weight:900;margin-bottom:6px;">
            Wizyty / terminy
          </div>

          ${visits.length ? visits.map((visit) => {
            const info = statusInfo(visit.status);
            const isFree = String(visit.status || "").toUpperCase() === "FREE";

            return `
              <div style="
                background:#f8fafc;
                border:1px solid #e2e8f0;
                border-radius:10px;
                padding:8px;
                margin-bottom:6px;
              ">
                <div style="
                  display:flex;
                  justify-content:space-between;
                  gap:10px;
                  align-items:center;
                ">
                  <div style="font-weight:900;">
                    ${escapeHtml(visit.time || "")} — ${escapeHtml(info.label)}
                  </div>

                  <span style="
                    font-size:11px;
                    font-weight:900;
                    padding:4px 8px;
                    border-radius:999px;
                    background:${info.bg};
                    color:white;
                  ">
                    ${escapeHtml(visit.employee_name || "-")}
                  </span>
                </div>

                <div style="font-size:12px;color:#64748b;margin-top:3px;">
                  ${escapeHtml(visit.client_name || "Wolny termin")}
                  ${visit.duration_min ? " • " + escapeHtml(visit.duration_min) + " min" : ""}
                </div>

                ${
                  !isFree
                    ? `
                      <button type="button" data-open-visit="${escapeHtml(visit.id)}" data-client-id="${escapeHtml(visit.client_id || "")}" style="
                        margin-top:7px;
                        border:none;
                        border-radius:7px;
                        background:#1d4ed8;
                        color:white;
                        font-size:12px;
                        font-weight:900;
                        padding:5px 8px;
                        cursor:pointer;
                      ">
                        Otwórz wizytę
                      </button>
                    `
                    : ""
                }
              </div>
            `;
          }).join("") : `<div style="color:#64748b;">Brak wizyt spełniających filtry.</div>`}
        </div>

        <div>
          <div style="font-weight:900;margin-bottom:6px;">
            Notatki
          </div>

          ${notes.length ? notes.map((note) => `
            <div style="
              background:#fefce8;
              border:1px solid #fde68a;
              border-radius:10px;
              padding:8px;
              margin-bottom:6px;
            ">
              <div style="
                font-size:12px;
                font-weight:900;
                color:#92400e;
                margin-bottom:4px;
              ">
                ${note.time ? escapeHtml(note.time) : "Bez godziny"} • ${escapeHtml(note.employee_name || "-")}
              </div>

              <div style="white-space:pre-wrap;">
                ${escapeHtml(note.note_text)}
              </div>

              <button type="button" data-delete-note="${escapeHtml(note.id)}" style="
                margin-top:7px;
                border:none;
                border-radius:7px;
                background:#ef4444;
                color:white;
                font-size:12px;
                font-weight:900;
                padding:5px 8px;
                cursor:pointer;
              ">
                Usuń
              </button>
            </div>
          `).join("") : `<div style="color:#64748b;">Brak notatek.</div>`}
        </div>
      </div>
    `;

    box.querySelectorAll("[data-delete-note]").forEach((btn) => {
      btn.addEventListener("click", () => {
        deleteNote(btn.dataset.deleteNote);
      });
    });

    box.querySelectorAll("[data-open-visit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const visitId = btn.dataset.openVisit || "";
        const clientId = btn.dataset.clientId || "";

        if (!visitId) return;

        localStorage.setItem("vetmell_current_visit_id", visitId);
        localStorage.setItem("vetmell_current_client_id", clientId);

        window.location.href =
          "/praca_inz/final_view.php?file=wizyta_pacjent.xml&visit_id=" +
          encodeURIComponent(visitId);
      });
    });
  }

  async function addNote() {
    const dateInput = document.getElementById("admin-calendar-note-date");
    const timeInput = document.getElementById("admin-calendar-note-time");
    const employeeInput = document.getElementById("admin-calendar-note-employee");
    const textInput = document.getElementById("admin-calendar-note-text");

    const noteDate = dateInput ? dateInput.value : "";
    const noteTime = timeInput ? timeInput.value : "";
    const employeeId = employeeInput ? employeeInput.value : "";
    const noteText = textInput ? textInput.value.trim() : "";

    if (!noteDate) {
      alert("Wybierz datę notatki.");
      return;
    }

    if (!employeeId) {
      alert("Wybierz lekarza dla notatki.");
      return;
    }

    if (!noteText) {
      alert("Wpisz treść notatki.");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          action: "add_note",
          employee_id: employeeId,
          note_date: noteDate,
          note_time: noteTime,
          note_text: noteText,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        alert(data && data.message ? data.message : "Nie udało się dodać notatki.");
        return;
      }

      if (textInput) textInput.value = "";
      if (timeInput) timeInput.value = "";

      state.selectedDate = noteDate;

      await loadData();
      renderSelectedDay(noteDate);
    } catch (err) {
      alert("Błąd połączenia z serwerem.");
    }
  }

  async function deleteNote(id) {
    if (!confirm("Usunąć tę notatkę?")) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          action: "delete_note",
          id: id,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        alert(data && data.message ? data.message : "Nie udało się usunąć notatki.");
        return;
      }

      await loadData();

      if (state.selectedDate) {
        renderSelectedDay(state.selectedDate);
      }
    } catch (err) {
      alert("Błąd połączenia z serwerem.");
    }
  }

  function redrawCalendar() {
    const cal = findCalendarEl();

    if (!cal) return false;

    protectCalendarVisuals();
    lockCalendarLook(cal);

    const cfg = getCalendarCfg(cal);

    state.year = cfg.year;
    state.month = cfg.month;

    if (typeof window.updateCalendarVisuals === "function") {
      window.updateCalendarVisuals(cal);
    }

    lockCalendarLook(cal);

    setTimeout(() => {
      lockCalendarLook(cal);
      decorateCalendar();
      ensureAdminPanel();

      if (state.selectedDate) {
        renderSelectedDay(state.selectedDate);
      }
    }, 80);

    return true;
  }

  async function loadData() {
    const cal = findCalendarEl();

    if (!cal) {
      setTimeout(loadData, 300);
      return;
    }

    protectCalendarVisuals();
    lockCalendarLook(cal);

    const cfg = getCalendarCfg(cal);

    state.year = cfg.year;
    state.month = cfg.month;

    try {
      const res = await fetch(`${API_URL}?action=data&year=${state.year}&month=${state.month}`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json",
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        console.warn(data && data.message ? data.message : "Nie udało się pobrać danych kalendarza.");
        return;
      }

      state.visits = Array.isArray(data.visits) ? data.visits : [];
      state.notes = Array.isArray(data.notes) ? data.notes : [];
      state.employees = Array.isArray(data.employees) ? data.employees : [];

      redrawCalendar();
    } catch (err) {
      console.error("[admin_panel_kalendarz.js]", err);
    }
  }

  function boot() {
    let tries = 0;

    const timer = setInterval(() => {
      tries++;

      protectCalendarVisuals();

      const cal = findCalendarEl();

      if (cal) {
        lockCalendarLook(cal);
      }

      if (cal && cal.querySelector(".sgcal__grid .sgcal__cell")) {
        clearInterval(timer);
        loadData();
      }

      if (tries >= 40) {
        clearInterval(timer);
        loadData();
      }
    }, 150);
  }

  ready(boot);
})();