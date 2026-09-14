(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/admin_panel_statystki.php";

  const state = {
    data: null
  };

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
      "'": "&#039;"
    }[ch]));
  }

  function findMainFrame() {
    const root =
      document.getElementById("sg-scroll") ||
      document.querySelector(".page-canvas") ||
      document.body;

    let frame = document.getElementById("admin-stats-created-frame");

    if (!frame) {
      frame = document.createElement("div");
      frame.id = "admin-stats-created-frame";
      root.appendChild(frame);
    }

    if (root && getComputedStyle(root).position === "static") {
      root.style.position = "relative";
    }

    frame.style.cssText = `
      position:absolute;
      left:50%;
      top:180px;
      transform:translateX(-50%);
      width:min(1180px, calc(100% - 120px));
      min-height:760px;
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:16px;
      box-shadow:0 12px 30px rgba(0,0,0,0.12);
      box-sizing:border-box;
      overflow:visible;
      z-index:20;
      pointer-events:auto;
    `;

    return frame;
  }

  function ensurePanel() {
    const frame = findMainFrame();

    let panel = document.getElementById("admin-stats-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "admin-stats-panel";
      frame.appendChild(panel);
    }

    panel.style.cssText = `
      position:relative;
      width:100%;
      min-height:760px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      gap:18px;
      font-family:Arial, sans-serif;
      color:#0f172a;
      padding:28px;
      background:#ffffff;
      border-radius:16px;
    `;

    return panel;
  }

  function renderShell() {
    const panel = ensurePanel();

    panel.innerHTML = `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:20px;
      ">
        <div>
          <div style="
            font-family: Georgia, serif;
            font-size:34px;
            font-style:italic;
            font-weight:700;
            line-height:1.1;
            color:#102a56;
          ">
            Statystyki
          </div>

          <div style="
            margin-top:8px;
            font-size:15px;
            color:#57708f;
          ">
            Podsumowanie wizyt, płatności, pracy lekarzy i usług w wybranym okresie.
          </div>
        </div>

        <div id="admin-stats-period-label" style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:220px;
          padding:14px 18px;
          border-radius:999px;
          border:1px solid #b6d2fb;
          background:#eef6ff;
          color:#2954d1;
          font-weight:500;
          font-size:15px;
          text-align:center;
        ">
          Ładowanie...
        </div>
      </div>

      <div style="
        display:grid;
        grid-template-columns:180px 180px 150px 150px 1fr;
        gap:14px;
        align-items:end;
        padding:18px;
        background:#f8fafc;
        border:1px solid #d7e0ea;
        border-radius:18px;
      ">
        <div>
          <div style="
            font-size:14px;
            font-weight:600;
            color:#203b67;
            margin-bottom:8px;
          ">
            Od
          </div>

          <input id="admin-stats-date-from" type="date" style="
            width:100%;
            height:46px;
            border:1px solid #b7c6d8;
            border-radius:14px;
            padding:0 14px;
            box-sizing:border-box;
            font-size:15px;
            outline:none;
            background:white;
          ">
        </div>

        <div>
          <div style="
            font-size:14px;
            font-weight:600;
            color:#203b67;
            margin-bottom:8px;
          ">
            Do
          </div>

          <input id="admin-stats-date-to" type="date" style="
            width:100%;
            height:46px;
            border:1px solid #b7c6d8;
            border-radius:14px;
            padding:0 14px;
            box-sizing:border-box;
            font-size:15px;
            outline:none;
            background:white;
          ">
        </div>

        <button type="button" id="admin-stats-load" style="
          height:46px;
          border:none;
          border-radius:14px;
          background:#1d4ed8;
          color:white;
          font-size:16px;
          font-weight:600;
          cursor:pointer;
        ">
          Pokaż
        </button>

        <button type="button" id="admin-stats-this-month" style="
          height:46px;
          border:none;
          border-radius:14px;
          background:#364863;
          color:white;
          font-size:16px;
          font-weight:600;
          cursor:pointer;
        ">
          Ten miesiąc
        </button>

        <div style="
          color:#64748b;
          font-size:13px;
          line-height:1.4;
        ">

        </div>
      </div>

      <div id="admin-stats-content">
        <div style="
          padding:18px;
          background:#f8fafc;
          border:1px solid #d7e0ea;
          border-radius:16px;
          color:#475569;
          font-size:15px;
        ">
          Ładowanie statystyk...
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const loadBtn = document.getElementById("admin-stats-load");
    const monthBtn = document.getElementById("admin-stats-this-month");

    if (loadBtn) {
      loadBtn.addEventListener("click", loadStats);
    }

    if (monthBtn) {
      monthBtn.addEventListener("click", () => {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);

        document.getElementById("admin-stats-date-from").value = toInputDate(first);
        document.getElementById("admin-stats-date-to").value = toInputDate(now);

        loadStats();
      });
    }
  }

  function toInputDate(date) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function statItem(title, value, sub, color) {
    return `
      <div style="
        padding:16px 18px;
        box-sizing:border-box;
        min-height:104px;
      ">
        <div style="
          font-size:12px;
          text-transform:uppercase;
          font-weight:600;
          color:#64748b;
          letter-spacing:.2px;
        ">
          ${escapeHtml(title)}
        </div>

        <div style="
          margin-top:8px;
          font-size:28px;
          font-weight:400;
          color:${color || "#0f172a"};
          line-height:1;
        ">
          ${escapeHtml(value)}
        </div>

        <div style="
          margin-top:8px;
          font-size:13px;
          color:#57708f;
          line-height:1.35;
        ">
          ${escapeHtml(sub || "")}
        </div>
      </div>
    `;
  }

  function statsSummary(s) {
    return `
      <div style="
        border:1px solid #e2e8f0;
        background:#ffffff;
        border-radius:18px;
        overflow:hidden;
        box-sizing:border-box;
      ">
        <div style="
          display:grid;
          grid-template-columns:repeat(4, 1fr);
          gap:0;
        ">
          <div style="border-right:1px solid #eef2f7;border-bottom:1px solid #eef2f7;">${statItem("Wszystkie terminy", s.total_slots || 0, "", "#0f172a")}</div>
          <div style="border-right:1px solid #eef2f7;border-bottom:1px solid #eef2f7;">${statItem("Umówione wizyty", s.booked_count || 0, "", "#1d4ed8")}</div>
          <div style="border-right:1px solid #eef2f7;border-bottom:1px solid #eef2f7;">${statItem("Potwierdzone", s.confirmed_count || 0, "", "#166534")}</div>
          <div style="border-bottom:1px solid #eef2f7;">${statItem("Niepotwierdzone", s.unconfirmed_count || 0, "", "#92400e")}</div>
          <div style="border-right:1px solid #eef2f7;">${statItem("Zrealizowane", s.done_count || 0, "", "#5b21b6")}</div>
          <div style="border-right:1px solid #eef2f7;">${statItem("Wolne terminy", s.free_count || 0, "", "#475569")}</div>
          <div style="border-right:1px solid #eef2f7;">${statItem("Przychód opłacony", s.paid_revenue_label || "0,00 zł", "", "#166534")}</div>
          <div>${statItem("Wartość planowana", s.planned_revenue_label || "0,00 zł", "", "#1d4ed8")}</div>
        </div>
      </div>
    `;
  }

  function renderContent(data) {
    const box = document.getElementById("admin-stats-content");
    const period = document.getElementById("admin-stats-period-label");

    if (!box || !data) return;

    const s = data.stats || {};

    if (period && data.range) {
      period.textContent = `${data.range.date_from_label} - ${data.range.date_to_label}`;
    }

    const fromInput = document.getElementById("admin-stats-date-from");
    const toInput = document.getElementById("admin-stats-date-to");

    if (fromInput && data.range?.date_from) fromInput.value = data.range.date_from;
    if (toInput && data.range?.date_to) toInput.value = data.range.date_to;

    box.innerHTML = `
      ${statsSummary(s)}

      <div style="
        display:grid;
        grid-template-columns:1.3fr .7fr;
        gap:16px;
      ">
        ${renderDailyChart(data.daily || [])}
        ${renderStatusChart(s)}
      </div>

      ${renderEmployeesTable(data.employees || [])}

      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:16px;
      ">
        ${renderServices(data.services || [])}
        ${renderMethodsAndClients(data.methods || [], data.top_clients || [])}
      </div>
    `;
  }

  function bar(width, color) {
    return `
      <div style="
        width:${Math.max(0, Math.min(100, width))}%;
        height:100%;
        background:${color};
        border-radius:999px;
      "></div>
    `;
  }

  function renderDailyChart(daily) {
    const max = Math.max(1, ...daily.map((d) => Number(d.total_slots || 0)));

    return `
      <div style="
        border:1px solid #e2e8f0;
        border-radius:18px;
        background:#ffffff;
        padding:18px;
        box-sizing:border-box;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
          margin-bottom:12px;
        ">
          <div>
            <div style="
              font-size:22px;
              font-weight:600;
              color:#0f172a;
            ">
              Wykres dzienny wizyt
            </div>

            <div style="
              margin-top:4px;
              color:#64748b;
              font-size:13px;
            ">
              Niebieski = umówione, zielony = potwierdzone, żółty = niepotwierdzone.
            </div>
          </div>
        </div>

        <div style="
          display:flex;
          flex-direction:column;
          gap:10px;
          max-height:330px;
          overflow:auto;
          padding-right:4px;
        ">
          ${daily.map((d) => {
            const total = Number(d.total_slots || 0);
            const booked = Number(d.booked_count || 0);
            const confirmed = Number(d.confirmed_count || 0);
            const unconfirmed = Number(d.unconfirmed_count || 0);

            const bookedWidth = total ? (booked / max) * 100 : 0;
            const confirmedWidth = total ? (confirmed / max) * 100 : 0;
            const unconfirmedWidth = total ? (unconfirmed / max) * 100 : 0;

            return `
              <div style="
                display:grid;
                grid-template-columns:92px 1fr 56px;
                gap:10px;
                align-items:center;
              ">
                <div style="
                  font-size:13px;
                  font-weight:600;
                  color:#334155;
                ">
                  ${escapeHtml(d.date_label)}
                </div>

                <div style="
                  height:20px;
                  background:#eef2f7;
                  border-radius:999px;
                  overflow:hidden;
                  position:relative;
                  display:flex;
                ">
                  ${bar(bookedWidth, "#60a5fa")}
                  ${bar(confirmedWidth, "#22c55e")}
                  ${bar(unconfirmedWidth, "#f59e0b")}
                </div>

                <div style="
                  font-size:13px;
                  font-weight:400;
                  text-align:right;
                  color:#334155;
                ">
                  ${escapeHtml(total)}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function statusRow(label, value, max, color) {
    const width = max ? (Number(value || 0) / max) * 100 : 0;

    return `
      <div style="margin-bottom:12px;">
        <div style="
          display:flex;
          justify-content:space-between;
          font-size:13px;
          color:#334155;
          margin-bottom:5px;
        ">
          <span style="font-weight:600;">${escapeHtml(label)}</span>
          <span style="font-weight:400;">${escapeHtml(value || 0)}</span>
        </div>

        <div style="
          height:12px;
          background:#eef2f7;
          border-radius:999px;
          overflow:hidden;
        ">
          ${bar(width, color)}
        </div>
      </div>
    `;
  }

  function renderStatusChart(s) {
    const max = Math.max(
      1,
      Number(s.booked_count || 0),
      Number(s.confirmed_count || 0),
      Number(s.unconfirmed_count || 0),
      Number(s.done_count || 0),
      Number(s.free_count || 0),
      Number(s.cancelled_count || 0)
    );

    return `
      <div style="
        border:1px solid #e2e8f0;
        border-radius:18px;
        background:#ffffff;
        padding:18px;
        box-sizing:border-box;
      ">
        <div style="
          font-size:22px;
          font-weight:600;
          color:#0f172a;
          margin-bottom:14px;
        ">
          Statusy wizyt
        </div>

        ${statusRow("Umówione", s.booked_count, max, "#60a5fa")}
        ${statusRow("Potwierdzone", s.confirmed_count, max, "#22c55e")}
        ${statusRow("Niepotwierdzone", s.unconfirmed_count, max, "#f59e0b")}
        ${statusRow("Zrealizowane", s.done_count, max, "#8b5cf6")}
        ${statusRow("Wolne", s.free_count, max, "#94a3b8")}
        ${statusRow("Anulowane / niezrealizowane", s.cancelled_count, max, "#ef4444")}

        <div style="
          margin-top:14px;
          padding:12px;
          border-radius:14px;
          background:#f8fafc;
          color:#64748b;
          font-size:13px;
          line-height:1.4;
        ">
          Płatności oczekujące: <b>${escapeHtml(s.pending_revenue_label || "0,00 zł")}</b><br>
          Płatności anulowane/zwroty: <b>${escapeHtml(s.cancelled_revenue_label || "0,00 zł")}</b>
        </div>
      </div>
    `;
  }

  function renderEmployeesTable(employees) {
    if (!employees.length) {
      return `
        <div style="
          padding:18px;
          background:#f8fafc;
          border:1px dashed #cbd5e1;
          border-radius:16px;
          color:#64748b;
          font-size:15px;
        ">
          Brak statystyk lekarzy w wybranym okresie.
        </div>
      `;
    }

    return `
      <div style="
        border:1px solid #e2e8f0;
        border-radius:18px;
        background:#ffffff;
        overflow:auto;
      ">
        <div style="
          padding:18px;
          border-bottom:1px solid #e2e8f0;
        ">
          <div style="
            font-size:22px;
            font-weight:600;
            color:#0f172a;
          ">
            Statystyki pracy lekarzy
          </div>

          <div style="
            margin-top:4px;
            color:#64748b;
            font-size:13px;
          ">
            Wizyty, potwierdzenia, zrealizowane wizyty, czas pracy i przychód.
          </div>
        </div>

        <table style="
          width:100%;
          border-collapse:collapse;
          min-width:1120px;
          font-size:14px;
        ">
          <thead>
            <tr style="background:#f1f5f9;color:#274267;">
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Lekarz</th>
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Wizyty</th>
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Potwierdzone</th>
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Niepotwierdzone</th>
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Zrealizowane</th>
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Wolne</th>
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Czas</th>
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Przychód opłacony</th>
              <th style="padding:14px;text-align:left;border-bottom:1px solid #d7e0ea;">Wartość wizyt</th>
            </tr>
          </thead>

          <tbody>
            ${employees.map((emp) => `
              <tr style="border-bottom:1px solid #eef2f7;">
                <td style="padding:14px;">
                  <div style="font-weight:600;font-size:16px;color:#0f172a;">
                    ${escapeHtml(emp.name)}
                  </div>

                  <div style="font-size:13px;color:#64748b;margin-top:4px;">
                    ${escapeHtml(emp.email || emp.phone || "ID: " + emp.id)}
                  </div>
                </td>

                <td style="padding:14px;font-weight:400;color:#1d4ed8;">
                  ${escapeHtml(emp.visits_count || 0)}
                </td>

                <td style="padding:14px;color:#166534;font-weight:400;">
                  ${escapeHtml(emp.confirmed_count || 0)}
                </td>

                <td style="padding:14px;color:#92400e;font-weight:400;">
                  ${escapeHtml(emp.unconfirmed_count || 0)}
                </td>

                <td style="padding:14px;color:#5b21b6;font-weight:400;">
                  ${escapeHtml(emp.done_count || 0)}
                </td>

                <td style="padding:14px;color:#64748b;font-weight:400;">
                  ${escapeHtml(emp.free_count || 0)}
                </td>

                <td style="padding:14px;color:#334155;font-weight:400;">
                  ${escapeHtml(emp.work_hours_label || "0h 0min")}
                </td>

                <td style="padding:14px;">
                  <span style="
                    display:inline-flex;
                    padding:7px 12px;
                    border-radius:999px;
                    background:#dcfce7;
                    border:1px solid #86efac;
                    color:#166534;
                    font-weight:500;
                    white-space:nowrap;
                  ">
                    ${escapeHtml(emp.paid_revenue_label || "0,00 zł")}
                  </span>
                </td>

                <td style="padding:14px;">
                  <span style="
                    display:inline-flex;
                    padding:7px 12px;
                    border-radius:999px;
                    background:#eff6ff;
                    border:1px solid #bfdbfe;
                    color:#1d4ed8;
                    font-weight:500;
                    white-space:nowrap;
                  ">
                    ${escapeHtml(emp.planned_revenue_label || "0,00 zł")}
                  </span>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderServices(services) {
    return `
      <div style="
        border:1px solid #e2e8f0;
        border-radius:18px;
        background:#ffffff;
        padding:18px;
        box-sizing:border-box;
      ">
        <div style="
          font-size:22px;
          font-weight:600;
          color:#0f172a;
          margin-bottom:12px;
        ">
          Najczęściej wybierane usługi
        </div>

        ${services.length ? services.map((service) => `
          <div style="
            display:grid;
            grid-template-columns:1fr 70px 100px;
            gap:10px;
            align-items:center;
            padding:10px 0;
            border-bottom:1px solid #eef2f7;
          ">
            <div>
              <div style="font-weight:600;color:#0f172a;">
                ${escapeHtml(service.name || "-")}
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:3px;">
                ${escapeHtml(service.price_label || "0,00 zł")} • ${escapeHtml(service.duration_min || 0)} min
              </div>
            </div>

            <div style="
              font-weight:400;
              color:#1d4ed8;
              text-align:center;
            ">
              ${escapeHtml(service.used_count || 0)}
            </div>

            <div style="
              font-weight:500;
              color:#166534;
              text-align:right;
              white-space:nowrap;
            ">
              ${escapeHtml(service.services_value_label || "0,00 zł")}
            </div>
          </div>
        `).join("") : `
          <div style="color:#64748b;font-size:14px;">
            Brak danych usług w wybranym okresie.
          </div>
        `}
      </div>
    `;
  }

  function methodLabel(method) {
    const m = String(method || "").toUpperCase();

    if (m === "CASH") return "Gotówka";
    if (m === "CARD") return "Karta";
    if (m === "TRANSFER") return "Przelew";
    if (m === "BLIK") return "BLIK";
    if (m === "BRAK") return "Brak metody";

    return method || "-";
  }

  function renderMethodsAndClients(methods, clients) {
    return `
      <div style="
        border:1px solid #e2e8f0;
        border-radius:18px;
        background:#ffffff;
        padding:18px;
        box-sizing:border-box;
      ">
        <div style="
          font-size:22px;
          font-weight:600;
          color:#0f172a;
          margin-bottom:12px;
        ">
          Płatności i klienci
        </div>

        <div style="
          font-size:15px;
          font-weight:600;
          color:#274267;
          margin-bottom:8px;
        ">
          Metody płatności
        </div>

        ${methods.length ? methods.map((m) => `
          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            padding:8px 0;
            border-bottom:1px solid #eef2f7;
          ">
            <div>
              <span style="font-weight:500;">${escapeHtml(methodLabel(m.method))}</span>
              <span style="color:#64748b;font-size:12px;">(${escapeHtml(m.payments_count || 0)})</span>
            </div>
            <div style="font-weight:500;color:#166534;">
              ${escapeHtml(m.amount_label || "0,00 zł")}
            </div>
          </div>
        `).join("") : `
          <div style="color:#64748b;font-size:14px;margin-bottom:12px;">
            Brak płatności w wybranym okresie.
          </div>
        `}

        <div style="
          font-size:15px;
          font-weight:600;
          color:#274267;
          margin:16px 0 8px 0;
        ">
          Najaktywniejsi klienci
        </div>

        ${clients.length ? clients.map((client) => `
          <div style="
            display:grid;
            grid-template-columns:1fr 60px 100px;
            gap:10px;
            align-items:center;
            padding:8px 0;
            border-bottom:1px solid #eef2f7;
          ">
            <div>
              <div style="font-weight:600;color:#0f172a;">
                ${escapeHtml(client.name)}
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:3px;">
                ${escapeHtml(client.phone || client.email || "ID: " + client.id)}
              </div>
            </div>

            <div style="font-weight:400;color:#1d4ed8;text-align:center;">
              ${escapeHtml(client.visits_count || 0)}
            </div>

            <div style="font-weight:500;color:#166534;text-align:right;white-space:nowrap;">
              ${escapeHtml(client.paid_revenue_label || "0,00 zł")}
            </div>
          </div>
        `).join("") : `
          <div style="color:#64748b;font-size:14px;">
            Brak klientów w wybranym okresie.
          </div>
        `}
      </div>
    `;
  }

  async function loadStats() {
    const box = document.getElementById("admin-stats-content");

    if (box) {
      box.innerHTML = `
        <div style="
          padding:18px;
          background:#f8fafc;
          border:1px solid #d7e0ea;
          border-radius:16px;
          color:#475569;
          font-size:15px;
        ">
          Ładowanie statystyk...
        </div>
      `;
    }

    const dateFrom = document.getElementById("admin-stats-date-from")?.value || "";
    const dateTo = document.getElementById("admin-stats-date-to")?.value || "";

    const params = new URLSearchParams({
      action: "data"
    });

    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);

    try {
      const res = await fetch(`${API_URL}?${params.toString()}`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        throw new Error(data && data.message ? data.message : "Nie udało się pobrać statystyk.");
      }

      state.data = data;
      renderContent(data);
    } catch (err) {
      if (box) {
        box.innerHTML = `
          <div style="
            padding:18px;
            background:#fff1f2;
            border:1px solid #fecdd3;
            border-radius:16px;
            color:#9f1239;
            font-size:15px;
          ">
            ${escapeHtml(err.message || "Błąd pobierania statystyk.")}
          </div>
        `;
      }
    }
  }

  function init() {
    renderShell();
    loadStats();
  }

  ready(init);
})();