(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/admin_panel_pacjenci.php";

  const state = {
    clients: [],
    filtered: [],
    selectedClientId: null,
    selectedClientHistory: null
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

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findMainFrame() {
    const root =
      document.getElementById("sg-scroll") ||
      document.querySelector(".page-canvas") ||
      document.body;

    let frame = document.getElementById("admin-patients-created-frame");

    if (!frame) {
      frame = document.createElement("div");
      frame.id = "admin-patients-created-frame";
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
  min-height:660px;
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

    let panel = document.getElementById("admin-patients-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "admin-patients-panel";
      frame.appendChild(panel);
    }

panel.style.cssText = `
  position:absolute;
  inset:24px 28px 24px 28px;
  box-sizing:border-box;
  display:flex;
  flex-direction:column;
  gap:18px;
  font-family:Arial, sans-serif;
  color:#0f172a;
  overflow-y:auto;
  overflow-x:hidden;
  padding-right:8px;
`;

    return panel;
  }

  function statusLabel(status) {
    const s = String(status || "").toUpperCase();

    if (s === "BOOKED") return "Umówiona";
    if (s === "FREE") return "Wolny termin";
    if (s === "DONE") return "Zakończona";
    if (s === "CONFIRMED") return "Potwierdzona";
    if (s === "IN_PROGRESS") return "W trakcie";
    if (s === "CANCELLED" || s === "CANCELED") return "Odwołana";
    if (s === "NOT_DONE") return "Niezrealizowana";

    return status || "Brak statusu";
  }

  function statusBadge(status) {
    const s = String(status || "").toUpperCase();

    let bg = "#e2e8f0";
    let color = "#334155";
    let border = "#cbd5e1";

    if (s === "BOOKED" || s === "CONFIRMED") {
      bg = "#d9fbe6";
      color = "#166534";
      border = "#86efac";
    } else if (s === "DONE") {
      bg = "#dbeafe";
      color = "#1d4ed8";
      border = "#93c5fd";
    } else if (s === "FREE") {
      bg = "#f1f5f9";
      color = "#64748b";
      border = "#cbd5e1";
    } else if (s === "CANCELLED" || s === "CANCELED" || s === "NOT_DONE") {
      bg = "#fee2e2";
      color = "#b91c1c";
      border = "#fca5a5";
    } else if (s === "IN_PROGRESS") {
      bg = "#fef3c7";
      color = "#92400e";
      border = "#fcd34d";
    }

    return `
      <span style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:110px;
        padding:8px 14px;
        border-radius:999px;
        background:${bg};
        color:${color};
        border:1px solid ${border};
        font-weight:800;
        font-size:14px;
      ">
        ${escapeHtml(statusLabel(status))}
      </span>
    `;
  }

  function getSearchValue() {
    const input = document.getElementById("admin-patient-filter-search");
    return normalize(input ? input.value : "");
  }

  function getVisitFilterValue() {
    const select = document.getElementById("admin-patient-filter-visits");
    return select ? select.value : "";
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
            font-size: 34px;
            font-style: italic;
            font-weight: 700;
            line-height: 1.1;
            color:#102a56;
          ">
            Pacjenci
          </div>

          <div style="
            margin-top:8px;
            font-size:15px;
            color:#57708f;
          ">
            Lista pacjentów wraz z podstawowymi danymi i dostępem do historii wizyt.
          </div>
        </div>

        <div id="admin-patients-counter" style="
          flex:0 0 auto;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:160px;
          padding:14px 18px;
          border-radius:999px;
          border:1px solid #b6d2fb;
          background:#eef6ff;
          color:#2954d1;
          font-weight:500;
          font-size:18px;
        ">
          Pacjenci: 0
        </div>
      </div>

      <div style="
        display:grid;
        grid-template-columns: 1fr 230px 150px;
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
            font-weight:800;
            color:#203b67;
            margin-bottom:8px;
          ">
            Szukaj
          </div>

          <input id="admin-patient-filter-search" type="text" placeholder="Imię, nazwisko, e-mail, telefon, ID pacjenta..." style="
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
            font-weight:800;
            color:#203b67;
            margin-bottom:8px;
          ">
            Wizyty
          </div>

          <select id="admin-patient-filter-visits" style="
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
            <option value="">Wszyscy</option>
            <option value="with_visits">Z historią wizyt</option>
            <option value="without_visits">Bez wizyt</option>
          </select>
        </div>

        <button type="button" id="admin-patient-filter-clear" style="
          height:46px;
          border:none;
          border-radius:14px;
          background:#364863;
          color:white;
          font-size:16px;
          font-weight:600;
          cursor:pointer;
        ">
          Wyczyść
        </button>
      </div>

      <div id="admin-patients-table-box"></div>

      <div id="admin-patient-history-box"></div>
    `;

    attachFilterEvents();
  }

  function applyFilters() {
    const search = getSearchValue();
    const visitFilter = getVisitFilterValue();

    state.filtered = state.clients.filter((client) => {
      const haystack = normalize([
        client.id,
        client.name,
        client.first_name,
        client.last_name,
        client.email,
        client.phone,
        client.birth_date,
        client.visits_count,
        client.last_visit,
        client.account_created_at
      ].join(" "));

      const okSearch = !search || haystack.includes(search);

      let okVisits = true;

      if (visitFilter === "with_visits") {
        okVisits = Number(client.visits_count || 0) > 0;
      } else if (visitFilter === "without_visits") {
        okVisits = Number(client.visits_count || 0) === 0;
      }

      return okSearch && okVisits;
    });

    renderClientsTable();
  }

  function renderClientsTable() {
    const box = document.getElementById("admin-patients-table-box");
    const counter = document.getElementById("admin-patients-counter");

    if (!box) return;

    if (counter) {
      counter.textContent = `Pacjenci: ${state.filtered.length}`;
    }

    if (!state.filtered.length) {
      box.innerHTML = `
        <div style="
          padding:18px;
          background:#f8fafc;
          border:1px dashed #cbd5e1;
          border-radius:16px;
          color:#64748b;
          font-size:15px;
        ">
          Brak pacjentów dla wybranych filtrów.
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div style="
        overflow:auto;
        border:1px solid #d7e0ea;
        border-radius:18px;
        background:white;
      ">
        <table style="
          width:100%;
          border-collapse:collapse;
          min-width:1100px;
          font-size:14px;
        ">
          <thead>
            <tr style="background:#f1f5f9; color:#274267;">
              <th style="padding:16px; text-align:left; border-bottom:1px solid #d7e0ea;">Pacjent</th>
              <th style="padding:16px; text-align:left; border-bottom:1px solid #d7e0ea;">Telefon</th>
              <th style="padding:16px; text-align:left; border-bottom:1px solid #d7e0ea;">E-mail</th>
              <th style="padding:16px; text-align:left; border-bottom:1px solid #d7e0ea;">Data ur.</th>
              <th style="padding:16px; text-align:left; border-bottom:1px solid #d7e0ea;">Wizyty</th>
              <th style="padding:16px; text-align:left; border-bottom:1px solid #d7e0ea;">Ostatnia wizyta</th>
              <th style="padding:16px; text-align:left; border-bottom:1px solid #d7e0ea;">Konto</th>
              <th style="padding:16px; text-align:left; border-bottom:1px solid #d7e0ea;">Akcja</th>
            </tr>
          </thead>

          <tbody>
            ${state.filtered.map((client) => `
              <tr style="border-bottom:1px solid #eef2f7;">
                <td style="padding:16px;">
                  <div style="
                    font-weight:800;
                    color:#0f172a;
                    font-size:16px;
                  ">
                    ${escapeHtml(client.name || "-")}
                  </div>

                  <div style="
                    font-size:13px;
                    color:#64748b;
                    margin-top:4px;
                  ">
                    ID pacjenta: ${escapeHtml(client.id)}
                  </div>
                </td>

                <td style="padding:16px; color:#0f172a; font-size:15px;">
                  ${escapeHtml(client.phone || "-")}
                </td>

                <td style="padding:16px;">
                  <div style="color:#0f172a; font-size:15px;">
                    ${escapeHtml(client.email || "-")}
                  </div>
                </td>

                <td style="padding:16px; color:#0f172a; font-size:15px;">
                  ${escapeHtml(client.birth_date || "-")}
                </td>

                <td style="padding:16px;">
                  <span style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    min-width:72px;
                    padding:8px 14px;
                    border-radius:999px;
                    background:${Number(client.visits_count || 0) > 0 ? "#d9fbe6" : "#f1f5f9"};
                    color:${Number(client.visits_count || 0) > 0 ? "#166534" : "#64748b"};
                    border:1px solid ${Number(client.visits_count || 0) > 0 ? "#86efac" : "#d7e0ea"};
                    font-weight:800;
                    font-size:14px;
                  ">
                    ${escapeHtml(client.visits_count)}
                  </span>
                </td>

                <td style="padding:16px; color:#0f172a; font-size:15px;">
                  ${escapeHtml(client.last_visit || "-")}
                </td>

                <td style="padding:16px; color:#64748b; font-size:13px;">
                  ${escapeHtml(client.account_created_at || "-")}
                </td>

                <td style="padding:16px;">
                  <button type="button"
                    class="admin-patient-history-btn"
                    data-client-id="${escapeHtml(client.id)}"
                    style="
                      min-width:104px;
                      height:42px;
                      border:none;
                      border-radius:14px;
                      background:#2f57da;
                      color:#fff;
                      font-size:15px;
                      font-weight:800;
                      cursor:pointer;
                    ">
                    Historia
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    box.querySelectorAll(".admin-patient-history-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const clientId = Number(btn.getAttribute("data-client-id") || 0);

        if (clientId > 0) {
          openClientHistory(clientId);
        }
      });
    });
  }

  function renderHistoryBox(data) {
    const box = document.getElementById("admin-patient-history-box");

    if (!box) return;

    if (!data || !data.client) {
      box.innerHTML = "";
      return;
    }

    const client = data.client;
    const visits = Array.isArray(data.visits) ? data.visits : [];

    box.innerHTML = `
      <div style="
        margin-top:4px;
        border:1px solid #d7e0ea;
        border-radius:20px;
        background:#ffffff;
        overflow:hidden;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:18px;
          padding:22px 22px 16px 22px;
          background:#f8fafc;
          border-bottom:1px solid #e2e8f0;
        ">
          <div>
            <div style="
              font-family: Georgia, serif;
              font-size: 28px;
              font-style: italic;
              font-weight: 700;
              line-height:1.1;
              color:#102a56;
            ">
              Historia wizyt
            </div>

            <div style="
              margin-top:10px;
              font-size:20px;
              font-weight:800;
              color:#0f172a;
            ">
              ${escapeHtml(client.name)}
            </div>

            <div style="
              margin-top:6px;
              color:#57708f;
              font-size:14px;
              line-height:1.5;
            ">
              Telefon: ${escapeHtml(client.phone || "-")}<br>
              E-mail: ${escapeHtml(client.email || "-")}<br>
              Data urodzenia: ${escapeHtml(client.birth_date || "-")}<br>
              Konto utworzone: ${escapeHtml(client.account_created_at || "-")}
            </div>
          </div>

          <button type="button" id="admin-close-patient-history" style="
            min-width:100px;
            height:42px;
            border:none;
            border-radius:14px;
            background:#364863;
            color:#fff;
            font-size:15px;
            font-weight:800;
            cursor:pointer;
          ">
            Zamknij
          </button>
        </div>

        <div style="padding:18px 22px 22px 22px;">
          ${visits.length ? `
            <div style="
  overflow:auto;
  max-height:360px;
  border:1px solid #d7e0ea;
  border-radius:16px;
">
              <table style="
                width:100%;
                border-collapse:collapse;
                min-width:900px;
                font-size:14px;
                background:#fff;
              ">
                <thead>
                  <tr style="background:#f1f5f9; color:#274267;">
                    <th style="padding:14px; text-align:left; border-bottom:1px solid #d7e0ea;">Data</th>
                    <th style="padding:14px; text-align:left; border-bottom:1px solid #d7e0ea;">Lekarz</th>
                    <th style="padding:14px; text-align:left; border-bottom:1px solid #d7e0ea;">Pacjent/zwierzę</th>
                    <th style="padding:14px; text-align:left; border-bottom:1px solid #d7e0ea;">Czas</th>
                    <th style="padding:14px; text-align:left; border-bottom:1px solid #d7e0ea;">Status</th>
                    <th style="padding:14px; text-align:left; border-bottom:1px solid #d7e0ea;">Cena</th>
                    <th style="padding:14px; text-align:left; border-bottom:1px solid #d7e0ea;">Notatki</th>
                  </tr>
                </thead>

                <tbody>
                  ${visits.map((visit) => `
                    <tr style="border-bottom:1px solid #eef2f7;">
                      <td style="padding:14px;">${escapeHtml(visit.date_time || "-")}</td>
                      <td style="padding:14px;">${escapeHtml(visit.doctor || "-")}</td>
                      <td style="padding:14px;">${visit.pet_id ? "ID: " + escapeHtml(visit.pet_id) : "-"}</td>
                      <td style="padding:14px;">${escapeHtml(visit.duration_min ? (visit.duration_min + " min") : "-")}</td>
                      <td style="padding:14px;">${statusBadge(visit.status)}</td>
                      <td style="padding:14px;">${escapeHtml(visit.price || "-")}</td>
                      <td style="padding:14px;">
                        <div style="
                          max-width:260px;
                          white-space:pre-wrap;
                          color:#334155;
                          line-height:1.45;
                        ">
                          ${escapeHtml(visit.notes || "-")}
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="
              padding:18px;
              background:#f8fafc;
              border:1px dashed #cbd5e1;
              border-radius:16px;
              color:#64748b;
              font-size:15px;
            ">
              Ten pacjent nie ma jeszcze historii wizyt.
            </div>
          `}
        </div>
      </div>
    `;

    const closeBtn = document.getElementById("admin-close-patient-history");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        state.selectedClientId = null;
        state.selectedClientHistory = null;
        box.innerHTML = "";
      });
    }
  }

  function attachFilterEvents() {
    const searchInput = document.getElementById("admin-patient-filter-search");
    const visitsSelect = document.getElementById("admin-patient-filter-visits");
    const clearBtn = document.getElementById("admin-patient-filter-clear");

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }

    if (visitsSelect) {
      visitsSelect.addEventListener("change", applyFilters);
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (visitsSelect) visitsSelect.value = "";
        applyFilters();
      });
    }
  }

  async function loadClients() {
    const box = document.getElementById("admin-patients-table-box");

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
          Ładowanie pacjentów...
        </div>
      `;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          action: "list"
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        throw new Error(data && data.message ? data.message : "Nie udało się pobrać pacjentów.");
      }

      state.clients = Array.isArray(data.clients) ? data.clients : [];
      state.filtered = state.clients.slice();

      renderClientsTable();
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
            ${escapeHtml(err && err.message ? err.message : "Błąd pobierania pacjentów.")}
          </div>
        `;
      }
    }
  }

  async function openClientHistory(clientId) {
    const box = document.getElementById("admin-patient-history-box");

    if (box) {
      box.innerHTML = `
        <div style="
          margin-top:4px;
          padding:18px;
          background:#f8fafc;
          border:1px solid #d7e0ea;
          border-radius:16px;
          color:#475569;
          font-size:15px;
        ">
          Ładowanie historii wizyt...
        </div>
      `;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          action: "history",
          client_id: clientId
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        throw new Error(data && data.message ? data.message : "Nie udało się pobrać historii wizyt.");
      }

      state.selectedClientId = clientId;
      state.selectedClientHistory = data;

      renderHistoryBox(data);

      const historyBox = document.getElementById("admin-patient-history-box");
      if (historyBox) {
        historyBox.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      if (box) {
        box.innerHTML = `
          <div style="
            margin-top:4px;
            padding:18px;
            background:#fff1f2;
            border:1px solid #fecdd3;
            border-radius:16px;
            color:#9f1239;
            font-size:15px;
          ">
            ${escapeHtml(err && err.message ? err.message : "Błąd pobierania historii wizyt.")}
          </div>
        `;
      }
    }
  }

  function init() {
    renderShell();
    loadClients();
  }

  ready(init);
})();