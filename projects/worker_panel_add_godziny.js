(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/worker_panel_add_godziny.php";

  const state = {
    weekStart: startOfWeek(new Date()),
    services: [],
    slots: [],
    selectedDate: isoDate(new Date()),
    editSlot: null,
  };

  const DAY_NAMES = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

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

  function normalizeStatus(status) {
    return String(status || "").toUpperCase();
  }

  function statusLabel(status) {
    const s = normalizeStatus(status);

    if (s === "FREE") return "Wolny";
    if (s === "BOOKED") return "Umówiona";
    if (s === "CONFIRMED") return "Potwierdzona";
    if (s === "DONE") return "Zakończona";
    if (s === "IN_PROGRESS") return "W trakcie";

    return status || "Termin";
  }

  function slotColor(status) {
    const s = normalizeStatus(status);

    if (s === "FREE") {
      return {
        bg: "#eef6ff",
        border: "#b6d2fb",
        color: "#2954d1",
      };
    }

    if (s === "BOOKED" || s === "CONFIRMED") {
      return {
        bg: "#dcfce7",
        border: "#86efac",
        color: "#166534",
      };
    }

    if (s === "DONE") {
      return {
        bg: "#f1f5f9",
        border: "#cbd5e1",
        color: "#475569",
      };
    }

    return {
      bg: "#fef3c7",
      border: "#fcd34d",
      color: "#92400e",
    };
  }

  function isoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  function dateLabel(value) {
    const d = new Date(value + "T12:00:00");
    return d.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function findMainFrame() {
    const byId = document.querySelector('[data-id="blk_1779033243301"]');
    if (byId) return byId;

    const blocks = Array.from(document.querySelectorAll('[data-type="block"], .type-block'));

    const candidates = blocks
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 600 && r.height > 350 && r.left > 200;
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (br.width * br.height) - (ar.width * ar.height);
      });

    return candidates[0] || document.body;
  }

  function ensurePanel() {
    const frame = findMainFrame();

frame.style.position = "absolute";
frame.style.overflow = "visible";
frame.style.boxSizing = "border-box";
frame.style.height = "auto";
frame.style.minHeight = "980px";

    let panel = document.getElementById("worker-hours-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "worker-hours-panel";
      panel.style.cssText = `
  position:relative;
  width:100%;
  min-height:930px;
  display:flex;
  flex-direction:column;
  gap:16px;
  font-family:Arial, Helvetica, sans-serif;
  color:#0f172a;
  box-sizing:border-box;
  overflow:visible;
  padding:24px 28px 32px 28px;
`;
      frame.appendChild(panel);
    }

    return panel;
  }

  function inputStyle() {
    return `
      width:100%;
      height:44px;
      border:1px solid #b7c6d8;
      border-radius:14px;
      padding:0 12px;
      box-sizing:border-box;
      font-size:14px;
      font-family:Arial, Helvetica, sans-serif;
      font-weight:400;
      outline:none;
      background:white;
      margin-top:7px;
      color:#0f172a;
    `;
  }

  function serviceOptions(selectedId = "") {
    return `
      <option value="">Bez usługi / własny czas</option>
      ${state.services.map((service) => `
        <option value="${escapeHtml(service.id)}" ${String(selectedId) === String(service.id) ? "selected" : ""}>
          ${escapeHtml(service.name)} — ${escapeHtml(service.duration_min)} min
        </option>
      `).join("")}
    `;
  }

  function renderHeader() {
    const freeCount = state.slots.filter((slot) => normalizeStatus(slot.status) === "FREE").length;
    const bookedCount = state.slots.filter((slot) => normalizeStatus(slot.status) !== "FREE").length;

    return `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:20px;
      ">
        <div>
          <div style="
            font-family:Georgia, serif;
            font-size:34px;
            font-style:italic;
            font-weight:700;
            line-height:1.1;
            color:#102a56;
          ">
            Dodaj godziny pracy
          </div>

          <div style="
            margin-top:8px;
            color:#57708f;
            font-size:15px;
            font-weight:400;
          ">
            Wybierz tydzień, kliknij dzień i wygeneruj wolne terminy dla zalogowanego lekarza.
          </div>
        </div>

        <div style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          justify-content:flex-end;
        ">
          <div style="
            border:1px solid #b6d2fb;
            background:#eef6ff;
            color:#2954d1;
            border-radius:999px;
            padding:14px 18px;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:500;
            font-size:18px;
            white-space:nowrap;
          ">
            Wolne: ${freeCount}
          </div>

          <div style="
            border:1px solid #86efac;
            background:#dcfce7;
            color:#166534;
            border-radius:999px;
            padding:14px 18px;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:500;
            font-size:18px;
            white-space:nowrap;
          ">
            Umówione: ${bookedCount}
          </div>
        </div>
      </div>
    `;
  }

  function renderWeekControls() {
    const start = isoDate(state.weekStart);
    const end = isoDate(addDays(state.weekStart, 6));

    return `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        background:#f8fafc;
        border:1px solid #d7e0ea;
        border-radius:18px;
        padding:16px 18px;
      ">
        <button id="hours-prev-week" type="button" style="
          width:52px;
          height:46px;
          border:none;
          border-radius:14px;
          background:#364863;
          color:white;
          font-size:28px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:600;
          cursor:pointer;
        ">&lt;</button>

        <div style="
          text-align:center;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:8px;
          flex:1;
        ">
          <div style="
            font-size:18px;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:700;
            color:#102a56;
          ">
            Tydzień: ${dateLabel(start)} – ${dateLabel(end)}
          </div>

          <div style="
            display:flex;
            align-items:center;
            justify-content:center;
            gap:10px;
            flex-wrap:wrap;
          ">
            <span style="
              font-size:14px;
              color:#64748b;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:600;
            ">
              Wybierz tydzień:
            </span>

            <input id="hours-week-picker" type="date" value="${escapeHtml(start)}" style="
              height:42px;
              border:1px solid #b7c6d8;
              border-radius:14px;
              padding:0 12px;
              box-sizing:border-box;
              font-size:14px;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:500;
              outline:none;
              background:white;
              color:#102a56;
            ">
          </div>

          <div style="
            font-size:13px;
            color:#64748b;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:400;
          ">
            Wybierz dowolną datę, a panel pokaże tydzień, w którym ta data się znajduje.
          </div>
        </div>

        <button id="hours-next-week" type="button" style="
          width:52px;
          height:46px;
          border:none;
          border-radius:14px;
          background:#364863;
          color:white;
          font-size:28px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:600;
          cursor:pointer;
        ">&gt;</button>
      </div>
    `;
  }

  function slotsForDate(date) {
    return state.slots
      .filter((slot) => slot.date === date)
      .sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }

  function renderSlot(slot) {
    const c = slotColor(slot.status);
    const editable = normalizeStatus(slot.status) === "FREE";

    return `
      <button type="button"
        class="hours-slot"
        data-slot-id="${escapeHtml(slot.id)}"
        style="
          width:100%;
          border:1px solid ${c.border};
          background:${c.bg};
          color:${c.color};
          border-radius:14px;
          padding:9px 10px;
          text-align:left;
          cursor:${editable ? "pointer" : "default"};
          box-sizing:border-box;
          display:flex;
          justify-content:space-between;
          gap:8px;
          align-items:center;
        ">
        <div style="min-width:0;">
          <div style="
            font-family:Arial, Helvetica, sans-serif;
            font-weight:600;
            font-size:13px;
          ">
            ${escapeHtml(slot.time)} • ${escapeHtml(slot.duration_min)} min
          </div>
          <div style="
            margin-top:2px;
            font-size:11px;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:400;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            opacity:.9;
          ">
            ${escapeHtml(slot.service_name || "Własny termin")}
          </div>
        </div>

        <span style="
          font-size:11px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:500;
          white-space:nowrap;
        ">
          ${escapeHtml(statusLabel(slot.status))}
        </span>
      </button>
    `;
  }

  function renderWeekGrid() {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = isoDate(addDays(state.weekStart, i));
      const list = slotsForDate(date);
      const selected = date === state.selectedDate;

      return `
        <div class="hours-day" data-date="${escapeHtml(date)}" style="
          min-height:230px;
          border:1px solid ${selected ? "#93c5fd" : "#d7e0ea"};
          background:${selected ? "#eff6ff" : "#ffffff"};
          border-radius:18px;
          padding:12px;
          box-sizing:border-box;
          cursor:pointer;
          display:flex;
          flex-direction:column;
          gap:9px;
        ">
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:8px;
            border-bottom:1px solid #e2e8f0;
            padding-bottom:9px;
          ">
            <div>
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-weight:600;
                color:#102a56;
                font-size:16px;
              ">
                ${DAY_NAMES[i]}
              </div>
              <div style="
                font-size:13px;
                color:#64748b;
                font-family:Arial, Helvetica, sans-serif;
                font-weight:400;
              ">
                ${dateLabel(date)}
              </div>
            </div>

            <span style="
              background:#f1f5f9;
              color:#475569;
              border:1px solid #e2e8f0;
              border-radius:999px;
              padding:5px 10px;
              font-size:12px;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:500;
            ">
              ${list.length}
            </span>
          </div>

          <div style="
            display:flex;
            flex-direction:column;
            gap:7px;
            min-height:120px;
          ">
            ${list.length ? list.map(renderSlot).join("") : `
              <div style="
                color:#94a3b8;
                font-size:13px;
                font-family:Arial, Helvetica, sans-serif;
                font-weight:400;
                border:1px dashed #cbd5e1;
                border-radius:12px;
                padding:12px;
                text-align:center;
                margin-top:8px;
              ">
                Brak terminów
              </div>
            `}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div style="
        display:grid;
        grid-template-columns:repeat(7, minmax(150px, 1fr));
        gap:12px;
        overflow:auto;
        padding-bottom:4px;
      ">
        ${days}
      </div>
    `;
  }

  function renderGenerateForm() {
    const from = state.selectedDate || isoDate(state.weekStart);
    const to = state.selectedDate || isoDate(state.weekStart);

    return `
      <div style="
        background:#f8fafc;
        border:1px solid #d7e0ea;
        border-radius:18px;
        padding:16px;
        box-sizing:border-box;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:14px;
          gap:12px;
        ">
          <div>
            <div style="
              font-family:Georgia, serif;
              font-size:25px;
              font-style:italic;
              font-weight:700;
              color:#102a56;
            ">
              Generator terminów
            </div>

            <div style="
              color:#64748b;
              font-size:13px;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:400;
              margin-top:4px;
            ">
            
            </div>
          </div>
        </div>

        <div style="
          display:grid;
          grid-template-columns:145px 145px 110px 110px 110px 145px;
          gap:12px;
          align-items:end;
        ">
          <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
            Data od
            <input id="hours-date-from" type="date" value="${escapeHtml(from)}" style="${inputStyle()}">
          </label>

          <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
            Data do
            <input id="hours-date-to" type="date" value="${escapeHtml(to)}" style="${inputStyle()}">
          </label>

          <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
            Od
            <input id="hours-start-time" type="time" value="08:00" style="${inputStyle()}">
          </label>

          <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
            Do
            <input id="hours-end-time" type="time" value="16:00" style="${inputStyle()}">
          </label>

          <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
            Przerwa
            <input id="hours-break-min" type="number" min="0" max="180" value="0" style="${inputStyle()}" placeholder="min">
          </label>

          <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
            Własny czas
            <input id="hours-custom-duration" type="number" min="5" max="240" value="30" style="${inputStyle()}" placeholder="min">
          </label>
        </div>

        <div style="margin-top:14px;">
          <div style="
            font-size:13px;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:600;
            color:#203b67;
            margin-bottom:8px;
          ">
            Rodzaje usług
          </div>

          <div id="hours-services-list" style="
            display:flex;
            flex-wrap:wrap;
            gap:10px;
          ">
            <label class="hours-service-chip" style="
              display:inline-flex;
              align-items:center;
              gap:8px;
              padding:10px 13px;
              border:1px solid #2f57da;
              background:#eff6ff;
              border-radius:999px;
              color:#1d4ed8;
              font-size:13px;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:500;
              cursor:pointer;
              user-select:none;
            ">
              <input type="radio" name="hours-service-choice" value="custom" checked style="
                width:16px;
                height:16px;
                accent-color:#2f57da;
                cursor:pointer;
              ">

              <span>
                Czas własny
                <span style="
                  color:#64748b;
                  font-weight:400;
                ">
                  • z pola „Własny czas”
                </span>
              </span>
            </label>

            ${state.services.map((service) => `
              <label class="hours-service-chip" style="
                display:inline-flex;
                align-items:center;
                gap:8px;
                padding:10px 13px;
                border:1px solid #c7d7eb;
                background:#ffffff;
                border-radius:999px;
                color:#203b67;
                font-size:13px;
                font-family:Arial, Helvetica, sans-serif;
                font-weight:500;
                cursor:pointer;
                user-select:none;
              ">
                <input type="radio" name="hours-service-choice" value="${escapeHtml(service.id)}" style="
                  width:16px;
                  height:16px;
                  accent-color:#2f57da;
                  cursor:pointer;
                ">

                <span>
                  ${escapeHtml(service.name)}
                  <span style="
                    color:#64748b;
                    font-weight:400;
                  ">
                    • ${escapeHtml(service.duration_min)} min
                  </span>
                </span>
              </label>
            `).join("")}
          </div>

          <div style="
            margin-top:7px;
            color:#64748b;
            font-size:12px;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:400;
          ">
            Wybierz jedną usługę albo opcję „Czas własny”. Przy czasie własnym używana jest wartość z pola „Własny czas”.
          </div>
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 170px;
          gap:12px;
          margin-top:12px;
          align-items:end;
        ">
          <div>
            <div style="
              font-size:13px;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:600;
              color:#203b67;
              margin-bottom:7px;
            ">
              Dni tygodnia
            </div>

            <div id="hours-weekdays" style="
              display:flex;
              flex-wrap:wrap;
              gap:8px;
            ">
              ${DAY_NAMES.map((name, index) => `
                <label style="
                  display:inline-flex;
                  align-items:center;
                  gap:6px;
                  padding:8px 10px;
                  border:1px solid #d7e0ea;
                  background:white;
                  border-radius:999px;
                  font-size:13px;
                  font-family:Arial, Helvetica, sans-serif;
                  font-weight:500;
                  color:#334155;
                  cursor:pointer;
                ">
                  <input type="checkbox" value="${index + 1}" ${index < 5 ? "checked" : ""}>
                  ${name}
                </label>
              `).join("")}
            </div>
          </div>

          <button id="hours-generate-btn" type="button" style="
            height:48px;
            border:none;
            border-radius:14px;
            background:#2f57da;
            color:white;
            font-family:Arial, Helvetica, sans-serif;
            font-size:16px;
            font-weight:600;
            cursor:pointer;
          ">
            Dodaj terminy
          </button>
        </div>

        <textarea id="hours-notes" placeholder="Notatka opcjonalna do dodawanych terminów..." style="
          width:100%;
          height:64px;
          margin-top:12px;
          border:1px solid #b7c6d8;
          border-radius:14px;
          padding:12px;
          box-sizing:border-box;
          resize:none;
          font-family:Arial, Helvetica, sans-serif;
          font-size:14px;
          font-weight:400;
          outline:none;
          color:#0f172a;
        "></textarea>
      </div>
    `;
  }

  function renderEditPanel() {
    const slot = state.editSlot;

    if (!slot) {
      return `
        <div style="
          background:#ffffff;
          border:1px dashed #cbd5e1;
          border-radius:18px;
          padding:16px;
          color:#64748b;
          font-size:14px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:400;
        ">
          Kliknij wolny termin w tygodniu, żeby go edytować albo usunąć.
        </div>
      `;
    }

    const editable = normalizeStatus(slot.status) === "FREE";

    return `
      <div style="
        background:#ffffff;
        border:1px solid #d7e0ea;
        border-radius:18px;
        padding:16px;
        box-sizing:border-box;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:12px;
        ">
          <div>
            <div style="
              font-family:Georgia, serif;
              font-size:24px;
              font-style:italic;
              font-weight:700;
              color:#102a56;
            ">
              Edycja terminu
            </div>

            <div style="
              margin-top:4px;
              color:#64748b;
              font-size:13px;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:400;
            ">
              Termin #${escapeHtml(slot.id)} — ${escapeHtml(statusLabel(slot.status))}
            </div>
          </div>

          <button id="hours-close-edit" type="button" style="
            height:40px;
            border:none;
            border-radius:12px;
            background:#364863;
            color:white;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:600;
            padding:0 16px;
            cursor:pointer;
          ">
            Zamknij
          </button>
        </div>

        ${editable ? `
          <div style="
            display:grid;
            grid-template-columns:150px 120px 130px 1fr 130px 120px;
            gap:12px;
            align-items:end;
          ">
            <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
              Data
              <input id="edit-date" type="date" value="${escapeHtml(slot.date)}" style="${inputStyle()}">
            </label>

            <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
              Godzina
              <input id="edit-time" type="time" value="${escapeHtml(slot.time)}" style="${inputStyle()}">
            </label>

            <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
              Czas min
              <input id="edit-duration" type="number" min="5" max="240" value="${escapeHtml(slot.duration_min)}" style="${inputStyle()}">
            </label>

            <label style="font-family:Arial, Helvetica, sans-serif;font-weight:600;font-size:13px;color:#203b67;">
              Usługa
              <select id="edit-service" style="${inputStyle()}">
                ${serviceOptions(slot.service_id || "")}
              </select>
            </label>

            <button id="edit-save" type="button" style="
              height:44px;
              border:none;
              border-radius:14px;
              background:#2f57da;
              color:white;
              font-family:Arial, Helvetica, sans-serif;
              font-size:15px;
              font-weight:600;
              cursor:pointer;
            ">
              Zapisz
            </button>

            <button id="edit-delete" type="button" style="
              height:44px;
              border:none;
              border-radius:14px;
              background:#ef4444;
              color:white;
              font-family:Arial, Helvetica, sans-serif;
              font-size:15px;
              font-weight:600;
              cursor:pointer;
            ">
              Usuń
            </button>
          </div>

          <textarea id="edit-notes" placeholder="Notatka do terminu..." style="
            width:100%;
            height:64px;
            margin-top:12px;
            border:1px solid #b7c6d8;
            border-radius:14px;
            padding:12px;
            box-sizing:border-box;
            resize:none;
            font-family:Arial, Helvetica, sans-serif;
            font-size:14px;
            font-weight:400;
            outline:none;
            color:#0f172a;
          ">${escapeHtml(slot.notes || "")}</textarea>
        ` : `
          <div style="
            padding:14px;
            background:#f8fafc;
            border:1px dashed #cbd5e1;
            border-radius:14px;
            color:#64748b;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:400;
          ">
            Ten termin nie jest wolny, więc nie można go edytować z tego panelu.
          </div>
        `}
      </div>
    `;
  }

  function render() {
  const panel = ensurePanel();

  panel.innerHTML = `
    ${renderHeader()}
    ${renderWeekControls()}
    ${renderGenerateForm()}
    ${renderWeekGrid()}
    ${renderEditPanel()}
  `;

  bindEvents();

  if (typeof window.sgRefreshFinalLayout === "function") {
    window.sgRefreshFinalLayout();
  }
}

  function bindEvents() {
    const prev = document.getElementById("hours-prev-week");
    const next = document.getElementById("hours-next-week");
    const generate = document.getElementById("hours-generate-btn");
    const weekPicker = document.getElementById("hours-week-picker");

    if (prev) {
      prev.addEventListener("click", () => {
        state.weekStart = addDays(state.weekStart, -7);
        state.selectedDate = isoDate(state.weekStart);
        loadData();
      });
    }

    if (next) {
      next.addEventListener("click", () => {
        state.weekStart = addDays(state.weekStart, 7);
        state.selectedDate = isoDate(state.weekStart);
        loadData();
      });
    }

    if (weekPicker) {
      weekPicker.addEventListener("change", () => {
        const value = weekPicker.value;

        if (!value) return;

        const pickedDate = new Date(value + "T12:00:00");

        state.weekStart = startOfWeek(pickedDate);
        state.selectedDate = isoDate(pickedDate);
        state.editSlot = null;

        loadData();
      });
    }

    if (generate) {
      generate.addEventListener("click", generateSlots);
    }

    document.querySelectorAll(".hours-day").forEach((day) => {
      day.addEventListener("click", (e) => {
        if (e.target.closest(".hours-slot")) return;

        const date = day.dataset.date || "";
        if (!date) return;

        state.selectedDate = date;

        const from = document.getElementById("hours-date-from");
        const to = document.getElementById("hours-date-to");

        if (from) from.value = date;
        if (to) to.value = date;

        render();
      });
    });

    document.querySelectorAll(".hours-slot").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();

        const id = Number(btn.dataset.slotId || 0);
        const slot = state.slots.find((item) => Number(item.id) === id);

        if (!slot) return;

        state.editSlot = slot;
        state.selectedDate = slot.date;
        render();
      });
    });

    const closeEdit = document.getElementById("hours-close-edit");
    if (closeEdit) {
      closeEdit.addEventListener("click", () => {
        state.editSlot = null;
        render();
      });
    }

    const save = document.getElementById("edit-save");
    if (save) save.addEventListener("click", updateSlot);

    const del = document.getElementById("edit-delete");
    if (del) del.addEventListener("click", deleteSlot);

    const editService = document.getElementById("edit-service");
    if (editService) {
      editService.addEventListener("change", () => {
        const service = state.services.find((s) => String(s.id) === String(editService.value));
        const duration = document.getElementById("edit-duration");

        if (service && duration) {
          duration.value = service.duration_min;
        }
      });
    }
  }

  function selectedServiceIds() {
    const selected = document.querySelector('input[name="hours-service-choice"]:checked');

    if (!selected || selected.value === "custom") {
      return [];
    }

    const id = Number(selected.value || 0);

    return id > 0 ? [id] : [];
  }

  function selectedWeekdays() {
    return Array.from(document.querySelectorAll("#hours-weekdays input:checked"))
      .map((input) => Number(input.value || 0))
      .filter((id) => id >= 1 && id <= 7);
  }

  async function generateSlots() {
    const payload = {
      action: "generate",
      date_from: document.getElementById("hours-date-from")?.value || "",
      date_to: document.getElementById("hours-date-to")?.value || "",
      start_time: document.getElementById("hours-start-time")?.value || "",
      end_time: document.getElementById("hours-end-time")?.value || "",
      break_min: Number(document.getElementById("hours-break-min")?.value || 0),
      custom_duration_min: Number(document.getElementById("hours-custom-duration")?.value || 30),
      service_ids: selectedServiceIds(),
      weekdays: selectedWeekdays(),
      notes: document.getElementById("hours-notes")?.value || "",
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        alert(data && data.message ? data.message : "Nie udało się dodać terminów.");
        return;
      }

      alert(`Dodano: ${data.added || 0}, pominięto: ${data.skipped || 0}`);
      await loadData();
    } catch (err) {
      alert("Błąd połączenia z serwerem.");
    }
  }

  async function updateSlot() {
    if (!state.editSlot) return;

    const payload = {
      action: "update_slot",
      id: state.editSlot.id,
      date: document.getElementById("edit-date")?.value || "",
      time: document.getElementById("edit-time")?.value || "",
      duration_min: Number(document.getElementById("edit-duration")?.value || 30),
      service_id: Number(document.getElementById("edit-service")?.value || 0),
      notes: document.getElementById("edit-notes")?.value || "",
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        alert(data && data.message ? data.message : "Nie udało się zapisać terminu.");
        return;
      }

      state.editSlot = null;
      await loadData();
    } catch (err) {
      alert("Błąd połączenia z serwerem.");
    }
  }

  async function deleteSlot() {
    if (!state.editSlot) return;

    if (!confirm("Usunąć ten wolny termin?")) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          action: "delete_slot",
          id: state.editSlot.id,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        alert(data && data.message ? data.message : "Nie udało się usunąć terminu.");
        return;
      }

      state.editSlot = null;
      await loadData();
    } catch (err) {
      alert("Błąd połączenia z serwerem.");
    }
  }

  async function loadData() {
    const panel = ensurePanel();

    panel.innerHTML = `
      <div style="
        padding:18px;
        font-size:15px;
        font-family:Arial, Helvetica, sans-serif;
        font-weight:400;
        color:#475569;
        background:#f8fafc;
        border:1px solid #d7e0ea;
        border-radius:16px;
      ">
        Ładowanie godzin pracy...
      </div>
    `;

    try {
      const weekStart = isoDate(state.weekStart);

      const res = await fetch(`${API_URL}?action=data&week_start=${encodeURIComponent(weekStart)}`, {
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

        throw new Error(data && data.message ? data.message : "Nie udało się pobrać danych.");
      }

      state.services = Array.isArray(data.services) ? data.services : [];
      state.slots = Array.isArray(data.slots) ? data.slots : [];

      render();
    } catch (err) {
      panel.innerHTML = `
        <div style="
          padding:18px;
          background:#fff1f2;
          border:1px solid #fecdd3;
          border-radius:16px;
          color:#9f1239;
          font-size:15px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:400;
        ">
          ${escapeHtml(err && err.message ? err.message : "Błąd pobierania danych.")}
        </div>
      `;
    }
  }

  function init() {
    loadWorkerPanelNav();
    loadData();
  }

  ready(init);
})();