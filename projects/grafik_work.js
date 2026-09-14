(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/grafik_work.php";
  const MAIN_BLOCK_ID = "blk_1779790328792";

  let currentWeekStart = "";
  let currentData = null;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function loadWorkerPanelNav() {
    if (window.__workerPanelNavLoader === true) return;
    window.__workerPanelNavLoader = true;

    const s = document.createElement("script");
    s.src = "projects/worker_panel_nav.js?v=" + Date.now();
    s.defer = true;
    document.head.appendChild(s);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[ch]));
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatLocalIso(dateObj) {
    return (
      dateObj.getFullYear() +
      "-" +
      pad2(dateObj.getMonth() + 1) +
      "-" +
      pad2(dateObj.getDate())
    );
  }

  function addDays(dateIso, days) {
    const d = new Date(dateIso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return formatLocalIso(d);
  }

  function mondayOf(dateObj) {
    const d = new Date(dateObj);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return formatLocalIso(d);
  }

  function minutesToHoursText(min) {
    const n = Math.max(0, parseInt(min || 0, 10) || 0);
    const h = Math.floor(n / 60);
    const m = n % 60;

    if (h <= 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  function statusLabel(kind, fallback) {
    if (kind === "free") return "Wolne";
    if (kind === "booked") return "Umówiona";
    if (kind === "confirmed") return "Potwierdzona";
    if (kind === "in_progress") return "W trakcie";
    if (kind === "done") return "Zrealizowana";
    if (kind === "cancelled") return "Niezrealizowana";
    return fallback || "Status";
  }

  function statusColors(kind) {
    if (kind === "free") {
      return {
        bg: "rgba(148,163,184,.16)",
        border: "rgba(148,163,184,.35)",
        color: "#475569"
      };
    }

    if (kind === "confirmed") {
      return {
        bg: "#fef3c7",
        border: "#facc15",
        color: "#854d0e"
      };
    }

    if (kind === "booked") {
      return {
        bg: "#dcfce7",
        border: "#86efac",
        color: "#166534"
      };
    }

    if (kind === "in_progress") {
      return {
        bg: "#dbeafe",
        border: "#93c5fd",
        color: "#1d4ed8"
      };
    }

    if (kind === "done") {
      return {
        bg: "#ede9fe",
        border: "#c4b5fd",
        color: "#5b21b6"
      };
    }

    if (kind === "cancelled") {
      return {
        bg: "#fee2e2",
        border: "#fecaca",
        color: "#991b1b"
      };
    }

    return {
      bg: "#f1f5f9",
      border: "#cbd5e1",
      color: "#334155"
    };
  }

  function injectGrafikStyle() {
    if (document.getElementById("grafik-work-extra-style")) return;

    const style = document.createElement("style");
    style.id = "grafik-work-extra-style";
    style.textContent = `
      #grafik-work-panel {
        scrollbar-width: thin;
        scrollbar-color: rgba(100,116,139,.45) transparent;
      }

      #grafik-work-panel::-webkit-scrollbar {
        width: 8px;
      }

      #grafik-work-panel::-webkit-scrollbar-track {
        background: transparent;
      }

      #grafik-work-panel::-webkit-scrollbar-thumb {
        background: rgba(100,116,139,.35);
        border-radius: 999px;
      }

      .grafik-card-hover {
        transition: box-shadow .15s ease, border-color .15s ease;
      }

      .grafik-card-hover:hover {
        box-shadow: 0 8px 20px rgba(15,23,42,.06) !important;
        border-color: #cbd5e1 !important;
      }

      .grafik-slot {
        transition: box-shadow .12s ease, filter .12s ease;
      }

      .grafik-slot:hover {
        filter: brightness(.99);
        box-shadow: 0 8px 18px rgba(15,23,42,.10) !important;
      }

      .grafik-week-btn {
        transition: background-color .12s ease, box-shadow .12s ease;
      }

      .grafik-week-btn:hover {
        box-shadow: 0 8px 18px rgba(15,23,42,.10);
      }
    `;

    document.head.appendChild(style);
  }

  function findMainFrame() {
    const exact = document.querySelector(`.page-element[data-id="${cssEscape(MAIN_BLOCK_ID)}"]`);
    if (exact) return exact;

    const blocks = Array.from(document.querySelectorAll('[data-type="block"], .type-block'));

    const candidates = blocks
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 700 && r.height > 400 && r.left > 200;
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (br.width * br.height) - (ar.width * ar.height);
      });

    if (candidates[0]) return candidates[0];

    const root = document.getElementById("sg-scroll") || document.body;

    const frame = document.createElement("div");
    frame.id = "grafik-work-created-frame";
    frame.style.cssText = `
      position:absolute;
      left:271px;
      top:174px;
      width:1000px;
      height:600px;
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      box-shadow:0 12px 30px rgba(0,0,0,0.12);
      box-sizing:border-box;
      overflow:hidden;
      z-index:9;
    `;

    root.appendChild(frame);
    return frame;
  }

  function ensurePanel() {
    injectGrafikStyle();

    const frame = findMainFrame();

    frame.style.position = "absolute";
    frame.style.overflow = "hidden";
    frame.style.boxSizing = "border-box";

    let panel = document.getElementById("grafik-work-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "grafik-work-panel";
      frame.appendChild(panel);
    }

    panel.style.cssText = `
      position:absolute;
      inset:28px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      gap:18px;
      font-family:Arial, Helvetica, sans-serif;
      color:#0f172a;
      overflow:auto;
      padding-right:4px;
    `;

    return panel;
  }

  function renderHeader(data) {
    return `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:20px;
        padding-bottom:4px;
      ">
        <div>
          <h1 style="
            margin:0;
            font-size:34px;
            font-family:Arial, Helvetica, sans-serif;
            font-style:normal;
            font-weight:700;
            line-height:1.15;
            color:#0f172a;
          ">
            Grafik pracy
          </h1>

          <div style="
            margin-top:8px;
            color:#57708f;
            font-size:15px;
            line-height:1.4;
            font-weight:400;
          ">
            Tygodniowy podgląd pracy lekarza, wizyt oraz wolnych terminów.
          </div>
        </div>

        <div style="
          background:#eef6ff;
          color:#0f172a;
          border:1px solid #dbe4f0;
          border-radius:16px;
          padding:14px 18px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:500;
          font-size:14px;
          white-space:nowrap;
          min-width:190px;
          text-align:center;
        ">
          ${escapeHtml(data.week_label || "")}
        </div>
      </div>
    `;
  }

  function renderControls(data) {
    return `
      <div style="
        display:grid;
        grid-template-columns:145px 145px 1fr 145px;
        gap:12px;
        align-items:end;
        background:#f8fafc;
        border:1px solid #d7e0ea;
        border-radius:18px;
        padding:18px;
        box-sizing:border-box;
      ">
        <button type="button" id="grafik-prev-week" class="grafik-week-btn" style="
          height:46px;
          border:none;
          border-radius:14px;
          background:#364863;
          color:white;
          font-family:Arial, Helvetica, sans-serif;
          font-size:16px;
          font-weight:600;
          cursor:pointer;
        ">
          ← Poprzedni
        </button>

        <button type="button" id="grafik-this-week" class="grafik-week-btn" style="
          height:46px;
          border:none;
          border-radius:14px;
          background:#1d4ed8;
          color:white;
          font-family:Arial, Helvetica, sans-serif;
          font-size:16px;
          font-weight:600;
          cursor:pointer;
        ">
          Ten tydzień
        </button>

        <div>
          <label style="
            display:block;
            font-family:Arial, Helvetica, sans-serif;
            font-size:14px;
            font-weight:600;
            color:#203b67;
            margin-bottom:8px;
          ">
            Wybierz tydzień
          </label>

          <input id="grafik-week-date" type="date" value="${escapeHtml(data.week_start || "")}" style="
            width:100%;
            height:46px;
            border:1px solid #b7c6d8;
            border-radius:14px;
            padding:0 14px;
            font-family:Arial, Helvetica, sans-serif;
            font-size:15px;
            box-sizing:border-box;
            background:white;
            color:#0f172a;
            outline:none;
          ">
        </div>

        <button type="button" id="grafik-next-week" class="grafik-week-btn" style="
          height:46px;
          border:none;
          border-radius:14px;
          background:#364863;
          color:white;
          font-family:Arial, Helvetica, sans-serif;
          font-size:16px;
          font-weight:600;
          cursor:pointer;
        ">
          Następny →
        </button>
      </div>
    `;
  }

  function statCard(title, value, desc, accent) {
    return `
      <div class="grafik-card-hover" style="
        background:#ffffff;
        border:1px solid #d7e0ea;
        border-radius:18px;
        padding:18px;
        box-sizing:border-box;
        min-height:120px;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
        ">
          <div style="
            font-family:Arial, Helvetica, sans-serif;
            font-size:12px;
            color:#64748b;
            font-weight:600;
            text-transform:uppercase;
            letter-spacing:.25px;
          ">
            ${escapeHtml(title)}
          </div>

          <span style="
            width:10px;
            height:10px;
            border-radius:999px;
            background:${accent};
            display:inline-block;
          "></span>
        </div>

        <div style="
          margin-top:12px;
          font-size:26px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:600;
          line-height:1.05;
          color:#0f172a;
        ">
          ${escapeHtml(value)}
        </div>

        <div style="
          margin-top:10px;
          font-size:13px;
          color:#57708f;
          line-height:1.4;
          font-weight:400;
        ">
          ${escapeHtml(desc)}
        </div>
      </div>
    `;
  }

  function renderStats(data) {
    const s = data.stats || {};

    return `
      <section>
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom:10px;
        ">
          <div style="
            font-size:22px;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:700;
            color:#0f172a;
          ">
            Statystyki tygodnia
          </div>

          <div style="
            font-size:13px;
            color:#57708f;
            font-weight:500;
            font-family:Arial, Helvetica, sans-serif;
          ">
            Podsumowanie wizyt i czasu pracy
          </div>
        </div>

        <div style="
          display:grid;
          grid-template-columns:repeat(4, 1fr);
          gap:12px;
        ">
          ${statCard(
            "Godziny pracy",
            minutesToHoursText(s.work_min),
            "Suma wszystkich zaplanowanych slotów.",
            "#156fe5"
          )}

          ${statCard(
            "Umówione",
            minutesToHoursText(s.booked_min),
            `${s.visits_count || 0} wizyt w tygodniu.`,
            "#22c55e"
          )}

          ${statCard(
            "Wolne",
            minutesToHoursText(s.free_min),
            `${s.free_count || 0} wolnych terminów.`,
            "#94a3b8"
          )}

          ${statCard(
            "Niepotwierdzone",
            minutesToHoursText(s.not_confirmed_min),
            "Wizyty oczekujące na potwierdzenie.",
            "#f59e0b"
          )}
        </div>
      </section>
    `;
  }

  function dayNameFromIso(data, iso) {
    const d = (data.days || []).find((x) => x.date_iso === iso);
    return d ? `${d.label} ${d.date_pl}` : iso;
  }

  function renderBarChart(data) {
    const rows = data.stats_by_day || [];
    const maxWork = Math.max(30, ...rows.map((r) => parseInt(r.work_min || 0, 10) || 0));

    return `
      <section style="
        background:#ffffff;
        border:1px solid #d7e0ea;
        border-radius:18px;
        padding:18px;
        box-sizing:border-box;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:14px;
        ">
          <div>
            <div style="
              font-size:22px;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:700;
              color:#0f172a;
            ">
              Tygodniowy wykres godzin
            </div>

            <div style="
              font-size:13px;
              color:#57708f;
              margin-top:4px;
              font-weight:400;
            ">
              Porównanie zajętych i wolnych godzin w każdym dniu.
            </div>
          </div>

          <div style="
            display:flex;
            gap:12px;
            flex-wrap:wrap;
            font-size:13px;
            color:#475569;
            font-weight:500;
            font-family:Arial, Helvetica, sans-serif;
          ">
            <span><span style="color:#22c55e;">●</span> umówione</span>
            <span><span style="color:#f59e0b;">●</span> niepotwierdzone</span>
            <span><span style="color:#94a3b8;">●</span> wolne</span>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          ${rows.map((row) => {
            const work = parseInt(row.work_min || 0, 10) || 0;
            const booked = parseInt(row.booked_min || 0, 10) || 0;
            const pending = parseInt(row.not_confirmed_min || 0, 10) || 0;
            const free = parseInt(row.free_min || 0, 10) || 0;

            const bookedPct = Math.max(0, Math.min(100, (booked / maxWork) * 100));
            const pendingPct = Math.max(0, Math.min(100, (pending / maxWork) * 100));
            const freePct = Math.max(0, Math.min(100, (free / maxWork) * 100));

            return `
              <div style="
                display:grid;
                grid-template-columns:140px 1fr 80px;
                gap:12px;
                align-items:center;
              ">
                <div style="
                  font-size:13px;
                  font-weight:600;
                  color:#334155;
                  white-space:nowrap;
                  font-family:Arial, Helvetica, sans-serif;
                ">
                  ${escapeHtml(dayNameFromIso(data, row.date_iso))}
                </div>

                <div style="
                  height:14px;
                  background:#e2e8f0;
                  border-radius:999px;
                  overflow:hidden;
                  display:flex;
                ">
                  <div title="Umówione" style="height:100%;width:${bookedPct}%;background:#22c55e;"></div>
                  <div title="Niepotwierdzone" style="height:100%;width:${pendingPct}%;background:#f59e0b;"></div>
                  <div title="Wolne" style="height:100%;width:${freePct}%;background:#94a3b8;opacity:.55;"></div>
                </div>

                <div style="
                  font-size:13px;
                  font-weight:500;
                  color:#475569;
                  text-align:right;
                  font-family:Arial, Helvetica, sans-serif;
                ">
                  ${escapeHtml(minutesToHoursText(work))}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function computeTimelineRange(slots) {
    if (!Array.isArray(slots) || !slots.length) {
      return { startHour: 8, endHour: 18 };
    }

    let min = 8 * 60;
    let max = 18 * 60;

    slots.forEach((slot) => {
      const start = parseInt(slot.start_minutes || 0, 10) || 0;
      const dur = parseInt(slot.duration_min || 30, 10) || 30;
      min = Math.min(min, start);
      max = Math.max(max, start + dur);
    });

    let startHour = Math.floor(min / 60);
    let endHour = Math.ceil(max / 60);

    startHour = Math.max(6, Math.min(22, startHour));
    endHour = Math.max(startHour + 1, Math.min(24, endHour));

    return { startHour, endHour };
  }

  function renderTimeLabels(startHour, endHour, rowH) {
    let out = "";

    for (let h = startHour; h <= endHour; h++) {
      const y = (h - startHour) * rowH;

      out += `
        <div style="
          position:absolute;
          top:${y - 7}px;
          right:8px;
          font-size:11px;
          color:#64748b;
          font-weight:600;
          font-family:Arial, Helvetica, sans-serif;
        ">
          ${String(h).padStart(2, "0")}:00
        </div>
      `;
    }

    return out;
  }

  function renderHourLines(startHour, endHour, rowH) {
    let out = "";

    for (let h = startHour; h <= endHour; h++) {
      const y = (h - startHour) * rowH;

      out += `
        <div style="
          position:absolute;
          left:0;
          right:0;
          top:${y}px;
          border-top:1px solid rgba(226,232,240,.95);
        "></div>
      `;
    }

    return out;
  }

  function openVisit(slot) {
    if (!slot || !slot.id) return;
    if (slot.status_kind === "free") return;

    localStorage.setItem("vetmell_current_visit_id", String(slot.id || ""));
    localStorage.setItem("vetmell_current_client_id", String(slot.client_id || ""));

    window.location.href =
      "/praca_inz/final_view.php?file=wizyta_pacjent.xml&visit_id=" +
      encodeURIComponent(slot.id);
  }

  function renderSlotBlock(slot, startHour, rowH) {
    const colors = statusColors(slot.status_kind);
    const start = parseInt(slot.start_minutes || 0, 10) || 0;
    const dur = parseInt(slot.duration_min || 30, 10) || 30;

    const top = ((start - startHour * 60) / 60) * rowH + 3;
    const height = Math.max(24, (dur / 60) * rowH - 6);

    const title = slot.status_kind === "free"
      ? "Wolny termin"
      : (slot.client_name || "Wizyta");

    const cursor = slot.status_kind === "free" ? "default" : "pointer";

    return `
      <div
        class="grafik-slot"
        data-visit-id="${escapeHtml(slot.id)}"
        data-status-kind="${escapeHtml(slot.status_kind)}"
        style="
          position:absolute;
          left:6px;
          right:6px;
          top:${top}px;
          height:${height}px;
          border:1px solid ${colors.border};
          background:${colors.bg};
          color:${colors.color};
          border-radius:12px;
          padding:6px 8px;
          box-sizing:border-box;
          overflow:hidden;
          cursor:${cursor};
          box-shadow:${slot.status_kind === "free" ? "none" : "0 8px 18px rgba(15,23,42,.08)"};
        "
        title="${escapeHtml(title)} ${escapeHtml(slot.start_time)}-${escapeHtml(slot.end_time)}"
      >
        <div style="
          font-size:11px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:600;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">
          ${escapeHtml(slot.start_time)} - ${escapeHtml(slot.end_time)}
        </div>

        <div style="
          margin-top:2px;
          font-size:11px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:600;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">
          ${escapeHtml(title)}
        </div>

        <div style="
          margin-top:1px;
          font-size:10px;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:400;
          opacity:.85;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">
          ${escapeHtml(statusLabel(slot.status_kind, slot.status_label))}
        </div>
      </div>
    `;
  }

  function renderWeekSchedule(data) {
    const days = data.days || [];
    const slots = data.slots || [];
    const { startHour, endHour } = computeTimelineRange(slots);

    const rowH = 54;
    const totalHeight = (endHour - startHour) * rowH;

    return `
      <section>
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:10px;
        ">
          <div>
            <div style="
              font-size:22px;
              font-family:Arial, Helvetica, sans-serif;
              font-weight:700;
              color:#0f172a;
            ">
              Grafik tygodniowy
            </div>

            <div style="
              font-size:13px;
              color:#57708f;
              margin-top:4px;
              font-weight:400;
            ">
              Kliknij wizytę, aby otworzyć szczegóły pacjenta.
            </div>
          </div>

          <div style="
            display:flex;
            gap:12px;
            flex-wrap:wrap;
            font-size:13px;
            font-weight:500;
            color:#475569;
            font-family:Arial, Helvetica, sans-serif;
          ">
            <span><span style="color:#94a3b8;">●</span> Wolne</span>
            <span><span style="color:#22c55e;">●</span> Umówione</span>
            <span><span style="color:#f59e0b;">●</span> Potwierdzone</span>
            <span><span style="color:#3b82f6;">●</span> W trakcie</span>
          </div>
        </div>

        <div style="
          border:1px solid #d7e0ea;
          border-radius:18px;
          overflow:hidden;
          background:white;
        ">
          <div style="
            display:grid;
            grid-template-columns:70px repeat(7, 1fr);
            background:#f8fafc;
            border-bottom:1px solid #d7e0ea;
          ">
            <div style="
              padding:11px 10px;
              font-size:12px;
              font-weight:600;
              color:#334155;
              font-family:Arial, Helvetica, sans-serif;
            ">
              Godz.
            </div>

            ${days.map((day) => `
              <div style="
                padding:11px 8px;
                text-align:center;
                border-left:1px solid #e2e8f0;
                ${day.is_today ? "background:#eff6ff;color:#1d4ed8;" : "color:#334155;"}
              ">
                <div style="font-size:13px;font-weight:600;font-family:Arial, Helvetica, sans-serif;">${escapeHtml(day.label)}</div>
                <div style="font-size:11px;color:inherit;opacity:.8;font-family:Arial, Helvetica, sans-serif;">${escapeHtml(day.date_pl)}</div>
              </div>
            `).join("")}
          </div>

          <div style="
            display:grid;
            grid-template-columns:70px repeat(7, 1fr);
            height:${totalHeight}px;
            overflow:auto;
          ">
            <div style="
              position:relative;
              height:${totalHeight}px;
              background:#f8fafc;
              border-right:1px solid #e2e8f0;
            ">
              ${renderTimeLabels(startHour, endHour, rowH)}
            </div>

            ${days.map((day) => {
              const daySlots = slots.filter((slot) => slot.date_iso === day.date_iso);

              return `
                <div style="
                  position:relative;
                  height:${totalHeight}px;
                  border-left:1px solid #eef2f7;
                  background:${day.is_today ? "rgba(239,246,255,.45)" : "#ffffff"};
                ">
                  ${renderHourLines(startHour, endHour, rowH)}
                  ${daySlots.map((slot) => renderSlotBlock(slot, startHour, rowH)).join("")}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderTipBox(data) {
    const s = data.stats || {};
    const work = parseInt(s.work_min || 0, 10) || 0;
    const free = parseInt(s.free_min || 0, 10) || 0;
    const booked = parseInt(s.booked_min || 0, 10) || 0;

    let fill = 0;
    if (work > 0) fill = Math.round((booked / work) * 100);

    return `
      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:12px;
      ">
        <div style="
          background:#ffffff;
          border:1px solid #d7e0ea;
          border-radius:18px;
          padding:18px;
        ">
          <div style="
            font-size:16px;
            font-weight:600;
            margin-bottom:10px;
            color:#0f172a;
            font-family:Arial, Helvetica, sans-serif;
          ">
            Wypełnienie tygodnia
          </div>

          <div style="
            height:10px;
            background:#e2e8f0;
            border-radius:999px;
            overflow:hidden;
          ">
            <div style="
              height:100%;
              width:${Math.max(0, Math.min(100, fill))}%;
              background:#156fe5;
            "></div>
          </div>

          <div style="
            margin-top:10px;
            font-size:13px;
            color:#57708f;
            line-height:1.4;
            font-family:Arial, Helvetica, sans-serif;
            font-weight:400;
          ">
            ${fill}% czasu pracy jest już zajęte wizytami. Wolne: ${escapeHtml(minutesToHoursText(free))}.
          </div>
        </div>

        <div style="
          background:#ffffff;
          border:1px solid #d7e0ea;
          border-radius:18px;
          padding:18px;
        ">
          <div style="
            font-size:16px;
            font-weight:600;
            margin-bottom:10px;
            color:#0f172a;
            font-family:Arial, Helvetica, sans-serif;
          ">
            Legenda
          </div>

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:8px 12px;
            font-size:13px;
            font-weight:500;
            color:#334155;
            font-family:Arial, Helvetica, sans-serif;
          ">
            <div><span style="color:#94a3b8;">●</span> wolne terminy</div>
            <div><span style="color:#22c55e;">●</span> umówione</div>
            <div><span style="color:#f59e0b;">●</span> potwierdzone</div>
            <div><span style="color:#3b82f6;">●</span> w trakcie</div>
          </div>
        </div>
      </div>
    `;
  }

  function bindControls() {
    const prev = document.getElementById("grafik-prev-week");
    const next = document.getElementById("grafik-next-week");
    const today = document.getElementById("grafik-this-week");
    const date = document.getElementById("grafik-week-date");

    if (prev && prev.dataset.bound !== "1") {
      prev.dataset.bound = "1";
      prev.addEventListener("click", () => {
        loadWeek(addDays(currentWeekStart, -7));
      });
    }

    if (next && next.dataset.bound !== "1") {
      next.dataset.bound = "1";
      next.addEventListener("click", () => {
        loadWeek(addDays(currentWeekStart, 7));
      });
    }

    if (today && today.dataset.bound !== "1") {
      today.dataset.bound = "1";
      today.addEventListener("click", () => {
        loadWeek(mondayOf(new Date()));
      });
    }

    if (date && date.dataset.bound !== "1") {
      date.dataset.bound = "1";
      date.addEventListener("change", () => {
        if (!date.value) return;
        loadWeek(mondayOf(new Date(date.value + "T00:00:00")));
      });
    }

    document.querySelectorAll(".grafik-slot[data-visit-id]").forEach((slotEl) => {
      if (slotEl.dataset.bound === "1") return;

      slotEl.dataset.bound = "1";
      slotEl.addEventListener("click", () => {
        const id = slotEl.dataset.visitId || "";
        const kind = slotEl.dataset.statusKind || "";

        if (!id || kind === "free") return;

        const slot = (currentData?.slots || []).find((s) => String(s.id) === String(id));
        openVisit(slot);
      });
    });
  }

  function render(data) {
    currentData = data;
    currentWeekStart = data.week_start || mondayOf(new Date());

    const panel = ensurePanel();

    panel.innerHTML = `
      ${renderHeader(data)}
      ${renderControls(data)}
      ${renderStats(data)}
      ${renderBarChart(data)}
      ${renderWeekSchedule(data)}
      ${renderTipBox(data)}
    `;

    bindControls();

    if (typeof window.sgRefreshFinalLayout === "function") {
      window.sgRefreshFinalLayout();
    }
  }

  function renderLoading() {
    const panel = ensurePanel();

    panel.innerHTML = `
      <div style="
        padding:18px;
        border:1px solid #d7e0ea;
        background:#f8fafc;
        border-radius:16px;
        font-size:15px;
        font-weight:400;
        font-family:Arial, Helvetica, sans-serif;
        color:#475569;
      ">
        Ładowanie grafiku pracy...
      </div>
    `;
  }

  function renderError(message) {
    const panel = ensurePanel();

    panel.innerHTML = `
      <div style="
        padding:18px;
        border:1px solid #fecaca;
        background:#fef2f2;
        color:#991b1b;
        border-radius:16px;
        font-size:15px;
        font-weight:400;
        font-family:Arial, Helvetica, sans-serif;
      ">
        ${escapeHtml(message || "Nie udało się pobrać grafiku pracy.")}
      </div>
    `;
  }

  async function loadWeek(weekStart) {
    renderLoading();

    const start = weekStart || currentWeekStart || mondayOf(new Date());

    try {
      const res = await fetch(`${API_URL}?action=week&week_start=${encodeURIComponent(start)}`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        if (data && data.redirect) {
          window.location.href = data.redirect;
          return;
        }

        throw new Error(data?.message || "Błąd pobierania grafiku.");
      }

      render(data);
    } catch (err) {
      console.error("[grafik_work.js]", err);
      renderError(err.message || "Błąd pobierania grafiku pracy.");
    }
  }

  ready(() => {
    loadWorkerPanelNav();
    loadWeek(mondayOf(new Date()));
  });
})();