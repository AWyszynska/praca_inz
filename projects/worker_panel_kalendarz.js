(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/worker_panel_kalendarz.php";

  const state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    visits: [],
    notes: [],
    selectedDate: "",
  };

  function loadWorkerPanelNav() {
    if (window.__workerPanelNavLoader === true) return;
    window.__workerPanelNavLoader = true;

    const s = document.createElement("script");
    s.src = "projects/worker_panel_nav.js?v=" + Date.now();
    s.defer = true;
    document.head.appendChild(s);
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

  function getCalendarCfg(cal) {
    const now = new Date();

    const year = parseInt(cal?.dataset?.calYear || String(now.getFullYear()), 10) || now.getFullYear();
    const month = parseInt(cal?.dataset?.calMonth || String(now.getMonth() + 1), 10) || (now.getMonth() + 1);
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

    if (s === "CANCELLED" || s === "CANCELED" || s === "ANULOWANA") {
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
  if (s === "CANCELLED" || s === "CANCELED" || s === "ANULOWANA") return "odwoł.";

  return "wizyta";
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

  function dayBackground(visits, notes) {
    const colors = [];
    const statuses = new Set();

    visits.forEach((visit) => {
      const s = String(visit.status || "").toUpperCase();
      statuses.add(s);
    });

    if (statuses.has("BOOKED") || statuses.has("CONFIRMED")) {
      colors.push("rgba(34,197,94,.90)");
    }

    if (statuses.has("PENDING") || statuses.has("WAITING") || statuses.has("OCZEKUJACE") || statuses.has("OCZEKUJĄCE")) {
      colors.push("rgba(245,158,11,.92)");
    }

    if (statuses.has("FREE")) {
      colors.push("rgba(96,165,250,.90)");
    }

    if (statuses.has("DONE")) {
      colors.push("rgba(100,116,139,.88)");
    }

    if (statuses.has("CANCELLED") || statuses.has("CANCELED") || statuses.has("ANULOWANA")) {
      colors.push("rgba(239,68,68,.90)");
    }

    if (colors.length >= 2) {
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 50%, ${colors[1]} 50%, ${colors[1]} 100%)`;
    }

    if (colors.length === 1) {
      return colors[0];
    }

    if (notes.length > 0) {
      return "rgba(250,204,21,.88)";
    }

    return "";
  }

  function injectCss() {
    if (document.getElementById("worker-calendar-runtime-css")) return;

    const style = document.createElement("style");
    style.id = "worker-calendar-runtime-css";

    style.textContent = `
      .worker-cal-decorated {
        cursor: pointer !important;
        position: relative !important;
        overflow: hidden !important;
      }

      .worker-cal-daynum {
        display: block;
        font-weight: 900;
        margin-bottom: 5px;
      }

      .worker-cal-line {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        line-height: 1.15;
        font-weight: 800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .worker-cal-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        flex: 0 0 auto;
        background: #ffffff;
      }

      .worker-cal-note {
        font-size: 10px;
        line-height: 1.15;
        margin-top: 3px;
        font-weight: 900;
      }
.worker-cal-note-corner {
  position: absolute;
  right: 0;
  top: 0;
  width: 34px;
  height: 34px;
  background: #facc15;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
  z-index: 5;
  pointer-events: none;
}

.worker-cal-note-corner::after {
  position: absolute;
  right: 2px;
  top: 1px;
  font-size: 10px;
}
      #worker-calendar-note-panel {
        font-family: Arial, sans-serif;
        color: #0f172a;
      }

      #worker-calendar-note-panel input,
      #worker-calendar-note-panel textarea {
        font-family: Arial, sans-serif;
      }
    `;

    document.head.appendChild(style);
  }

  function renderCellContent(day, visits, notes) {
  const lines = visits.slice(0, 2).map((visit) => {
    const info = statusInfo(visit.status);

    return `
      <div style="
        display:inline-flex;
        align-items:center;
        gap:4px;
        max-width:100%;
        padding:3px 6px;
        border-radius:999px;
        background:rgba(255,255,255,.25);
        border:1px solid rgba(255,255,255,.35);
        font-size:10px;
        line-height:1;
        font-weight:900;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        margin-top:3px;
        box-sizing:border-box;
      ">
        <span style="
          width:7px;
          height:7px;
          border-radius:999px;
          background:${info.color};
          flex:0 0 auto;
        "></span>

        <span>${escapeHtml(visit.time || "--:--")}</span>
        <span style="opacity:.9;">${escapeHtml(shortStatus(visit.status))}</span>
      </div>
    `;
  }).join("");

  const more = visits.length > 2
    ? `
      <div style="
        font-size:10px;
        font-weight:900;
        margin-top:3px;
        color:#ffffff;
      ">
        +${visits.length - 2} więcej
      </div>
    `
    : "";

const note = notes.length
  ? `
    <div style="
      display:inline-flex;
      align-items:center;
      gap:4px;
      padding:3px 6px;
      border-radius:999px;
      background:rgba(250,204,21,.95);
      color:#422006;
      font-size:10px;
      line-height:1;
      font-weight:900;
      margin-top:3px;
      max-width:100%;
    ">

    </div>
  `
  : "";

const noteCorner = notes.length
  ? `<span class="worker-cal-note-corner"></span>`
  : "";

return `
  ${noteCorner}

  <span class="worker-cal-daynum">${escapeHtml(day)}</span>

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
    ${note}
  </div>
`;
}

  function decorateCalendar() {
    const cal = findCalendarEl();
    if (!cal) return false;

    injectCss();

    const cfg = getCalendarCfg(cal);
    const cellsModel = gridDays(cfg.year, cfg.month, cfg.weekStart);

    const cellEls = Array.from(cal.querySelectorAll(".sgcal__grid .sgcal__cell"));

    if (!cellEls.length) return false;

    const visitsByDate = groupByDate(state.visits);
    const notesByDate = groupByDate(state.notes);

    cellEls.forEach((cell, index) => {
      const model = cellsModel[index];
      if (!model) return;

      const date = model.date || "";
      const visits = date ? (visitsByDate[date] || []) : [];
      const notes = date ? (notesByDate[date] || []) : [];

      cell.dataset.date = date;

      if (model.muted || !date) {
        cell.innerHTML = `<span class="worker-cal-daynum">${escapeHtml(model.day)}</span>`;
        return;
      }

      const bg = dayBackground(visits, notes);

      cell.classList.add("worker-cal-decorated");

      if (bg) {
        cell.style.background = bg;
        cell.style.color = "#ffffff";
        cell.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,.18), 0 10px 18px rgba(15,23,42,.14)";
      }

      cell.innerHTML = renderCellContent(model.day, visits, notes);

      cell.addEventListener("click", () => {
        state.selectedDate = date;
        const input = document.getElementById("calendar-note-date");
        if (input) input.value = date;
        renderSelectedDay(date);
      });
    });

    hookCalendarArrows(cal);

    return true;
  }

  function hookCalendarArrows(cal) {
    if (!cal || cal.dataset.workerCalendarArrowsBound === "1") return;

    cal.dataset.workerCalendarArrowsBound = "1";

    cal.addEventListener("click", (event) => {
      const btn = event.target.closest(".sgcal__prev, .sgcal__next");
      if (!btn) return;

      setTimeout(() => {
        const cfg = getCalendarCfg(cal);
        state.year = cfg.year;
        state.month = cfg.month;
        loadData();
      }, 120);
    }, true);
  }

  function ensureNotePanel() {
    const cal = findCalendarEl();
    if (!cal) return null;

    let panel = document.getElementById("worker-calendar-note-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "worker-calendar-note-panel";

      const parent = cal.parentElement || document.body;
      parent.appendChild(panel);
    }

    const left = cal.offsetLeft;
    const top = cal.offsetTop + cal.offsetHeight + 18;
    const width = Math.max(500, cal.offsetWidth);

    panel.style.cssText = `
      position:absolute;
      left:${left}px;
      top:${top}px;
      width:${width}px;
      min-height:150px;
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      box-shadow:0 12px 30px rgba(0,0,0,.10);
      padding:14px;
      box-sizing:border-box;
      z-index:30;
    `;

    if (!panel.dataset.rendered) {
      panel.dataset.rendered = "1";

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
            Notatki kalendarza
          </div>

          <div style="
            display:flex;
            gap:8px;
            align-items:center;
            font-size:12px;
            font-weight:800;
            color:#334155;
          ">
            <span>🟩 umówione</span>
            <span>🟦 wolne</span>
            <span>🟨 notatka</span>
          </div>
        </div>

        <div style="
          display:grid;
          grid-template-columns:160px 120px 1fr 120px;
          gap:10px;
          align-items:start;
        ">
          <input id="calendar-note-date" type="date" style="
            height:40px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            box-sizing:border-box;
          ">
<input id="calendar-note-time" type="time" style="
  height:40px;
  border:1px solid #cbd5e1;
  border-radius:10px;
  padding:0 10px;
  box-sizing:border-box;
">
          <textarea id="calendar-note-text" placeholder="Wpisz notatkę do kalendarza..." style="
            height:72px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:10px;
            resize:none;
            box-sizing:border-box;
          "></textarea>

          <button type="button" id="calendar-note-save" style="
            height:40px;
            border:none;
            border-radius:10px;
            background:#1d4ed8;
            color:white;
            font-weight:900;
            cursor:pointer;
          ">Zapisz</button>
        </div>

        <div id="calendar-selected-day" style="
          margin-top:12px;
          font-size:13px;
          color:#475569;
        ">
          Kliknij dzień w kalendarzu, żeby zobaczyć wizyty i notatki.
        </div>
      `;

      const saveBtn = panel.querySelector("#calendar-note-save");
      if (saveBtn) saveBtn.addEventListener("click", addNote);
    }

    return panel;
  }

  function renderSelectedDay(date) {
    const box = document.getElementById("calendar-selected-day");
    if (!box || !date) return;

    const visits = state.visits.filter((v) => v.date === date);
    const notes = state.notes.filter((n) => n.date === date);

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
          <div style="font-weight:900; margin-bottom:6px;">Wizyty</div>

          ${visits.length ? visits.map((visit) => {
            const info = statusInfo(visit.status);

            return `
              <div style="
                background:#f8fafc;
                border:1px solid #e2e8f0;
                border-radius:10px;
                padding:8px;
                margin-bottom:6px;
              ">
                <div style="font-weight:900;">
                  ${escapeHtml(visit.time || "")} — ${escapeHtml(info.label)}
                </div>

                <div style="font-size:12px; color:#64748b;">
                  ${escapeHtml(visit.client_name || "Wolny termin")}
                </div>
              </div>
            `;
          }).join("") : `<div style="color:#64748b;">Brak wizyt.</div>`}
        </div>

        <div>
          <div style="font-weight:900; margin-bottom:6px;">Notatki</div>

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
  ${note.time ? escapeHtml(note.time) : "Bez godziny"}
</div>

<div style="white-space:pre-wrap;">${escapeHtml(note.note_text)}</div>

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
              ">Usuń</button>
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
  }

  async function addNote() {
    const dateInput = document.getElementById("calendar-note-date");
const timeInput = document.getElementById("calendar-note-time");
const textInput = document.getElementById("calendar-note-text");

const noteDate = dateInput ? dateInput.value : "";
const noteTime = timeInput ? timeInput.value : "";
const noteText = textInput ? textInput.value.trim() : "";

    if (!noteDate) {
      alert("Wybierz datę notatki.");
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

    const cfg = getCalendarCfg(cal);
    state.year = cfg.year;
    state.month = cfg.month;


    setTimeout(() => {
      decorateCalendar();
      ensureNotePanel();

      if (state.selectedDate) {
        renderSelectedDay(state.selectedDate);
      }
    }, 40);

    return true;
  }

  async function loadData() {
    const cal = findCalendarEl();

    if (!cal) {
      setTimeout(loadData, 300);
      return;
    }

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
        if (data && data.redirect) {
          window.location.href = data.redirect;
          return;
        }

        console.warn(data && data.message ? data.message : "Nie udało się pobrać danych kalendarza.");
        return;
      }

      state.visits = Array.isArray(data.visits) ? data.visits : [];
      state.notes = Array.isArray(data.notes) ? data.notes : [];

      redrawCalendar();
    } catch (err) {
      console.error("[worker_panel_kalendarz.js]", err);
    }
  }

  function boot() {
    loadWorkerPanelNav();

    let tries = 0;

    const timer = setInterval(() => {
      tries++;

      const cal = findCalendarEl();

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