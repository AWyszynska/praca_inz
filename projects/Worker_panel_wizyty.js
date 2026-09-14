(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/Worker_panel_wizyty.php";
  let allVisits = [];

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

  function statusLabel(status) {
    const s = String(status || "").toUpperCase();

    if (s === "BOOKED") return "Umówiona";
    if (s === "CONFIRMED") return "Potwierdzona";
    if (s === "IN_PROGRESS") return "W trakcie";
    if (s === "DONE") return "Zakończona";
    if (s === "CANCELLED" || s === "CANCELED" || s === "ANULOWANA") return "Odwołana";

    return status || "Zaplanowana";
  }

  function statusBadgeStyle(status) {
    const s = String(status || "").toUpperCase();

    if (s === "CANCELLED" || s === "CANCELED" || s === "ANULOWANA") {
      return "background:#fee2e2; border:1px solid #fecaca; color:#991b1b;";
    }

    if (s === "DONE") {
      return "background:#e0e7ff; border:1px solid #c7d2fe; color:#3730a3;";
    }

    if (s === "IN_PROGRESS") {
      return "background:#fef3c7; border:1px solid #fde68a; color:#92400e;";
    }

    return "background:#dcfce7; border:1px solid #86efac; color:#166534;";
  }

  function canCancelVisit(status) {
    const s = String(status || "").toUpperCase();
    return !["DONE", "CANCELLED", "CANCELED", "ANULOWANA", "IN_PROGRESS"].includes(s);
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function dateInputToPl(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    const parts = raw.split("-");

    if (parts.length !== 3) return raw;

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  function renderFilters() {
    return `
      <div id="worker-visits-filters" style="
        display:grid;
        grid-template-columns:180px 1fr 190px 150px;
        gap:14px;
        align-items:end;
        padding:18px;
        background:#f8fafc;
        border:1px solid #d7e0ea;
        border-radius:18px;
        box-sizing:border-box;
      ">
        <div>
          <label style="
            display:block;
            font-family:Arial, Helvetica, sans-serif;
            font-size:14px;
            font-weight:600;
            color:#203b67;
            margin-bottom:8px;
          ">Data wizyty</label>

          <input id="visit-filter-date" type="date" style="
            width:100%;
            height:46px;
            border:1px solid #b7c6d8;
            border-radius:14px;
            padding:0 14px;
            font-family:Arial, Helvetica, sans-serif;
            font-size:15px;
            box-sizing:border-box;
            outline:none;
            background:#ffffff;
          ">
        </div>

        <div>
          <label style="
            display:block;
            font-family:Arial, Helvetica, sans-serif;
            font-size:14px;
            font-weight:600;
            color:#203b67;
            margin-bottom:8px;
          ">Szukaj</label>

          <input id="visit-filter-search" type="text" placeholder="Imię, nazwisko, email, telefon, ID wizyty..." style="
            width:100%;
            height:46px;
            border:1px solid #b7c6d8;
            border-radius:14px;
            padding:0 14px;
            font-family:Arial, Helvetica, sans-serif;
            font-size:15px;
            box-sizing:border-box;
            outline:none;
            background:#ffffff;
          ">
        </div>

        <div>
          <label style="
            display:block;
            font-family:Arial, Helvetica, sans-serif;
            font-size:14px;
            font-weight:600;
            color:#203b67;
            margin-bottom:8px;
          ">Status</label>

          <select id="visit-filter-status" style="
            width:100%;
            height:46px;
            border:1px solid #b7c6d8;
            border-radius:14px;
            padding:0 14px;
            font-family:Arial, Helvetica, sans-serif;
            font-size:15px;
            box-sizing:border-box;
            outline:none;
            background:#ffffff;
          ">
            <option value="">Wszystkie</option>
            <option value="BOOKED">Umówiona</option>
            <option value="CONFIRMED">Potwierdzona</option>
            <option value="IN_PROGRESS">W trakcie</option>
            <option value="DONE">Zakończona</option>
            <option value="CANCELLED">Odwołana</option>
          </select>
        </div>

        <button type="button" id="visit-filter-clear" style="
          height:46px;
          border:none;
          border-radius:14px;
          background:#364863;
          color:white;
          font-family:Arial, Helvetica, sans-serif;
          font-size:16px;
          font-weight:600;
          cursor:pointer;
        ">Wyczyść</button>
      </div>
    `;
  }

  function filteredVisits() {
    const dateInput = document.getElementById("visit-filter-date");
    const searchInput = document.getElementById("visit-filter-search");
    const statusInput = document.getElementById("visit-filter-status");

    const selectedDate = dateInputToPl(dateInput ? dateInput.value : "");
    const search = normalizeText(searchInput ? searchInput.value : "");
    const status = normalizeText(statusInput ? statusInput.value : "");

    return allVisits.filter((visit) => {
      const visitStatus = normalizeText(visit.status || "");
      const visitDate = String(visit.date || "");

      const haystack = normalizeText([
        visit.id,
        visit.date,
        visit.time,
        visit.client_name,
        visit.client_email,
        visit.client_phone,
        visit.pet_id ? "Pacjent #" + visit.pet_id : "",
        visit.duration_min ? visit.duration_min + " min" : "",
        statusLabel(visit.status),
        visit.status,
      ].join(" "));

      const okDate = !selectedDate || visitDate === selectedDate;
      const okSearch = !search || haystack.includes(search);
      const okStatus = !status || visitStatus === status;

      return okDate && okSearch && okStatus;
    });
  }

  async function cancelVisit(visitId) {
    if (!visitId) {
      alert("Brak ID wizyty.");
      return;
    }

    const ok = confirm("Czy na pewno chcesz odwołać tę wizytę?");
    if (!ok) return;

    try {
      const res = await fetch(API_URL + "?action=cancel", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          action: "cancel",
          visit_id: visitId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        alert((data && data.message) ? data.message : "Nie udało się odwołać wizyty.");
        return;
      }

      alert("Wizyta została odwołana.");
      loadVisits();

    } catch (err) {
      console.error("[cancelVisit]", err);
      alert("Błąd odwoływania wizyty.");
    }
  }

  function refreshVisitsTable() {
    const tableBox = document.getElementById("worker-visits-table-box");
    const counter = document.getElementById("worker-visits-counter");

    const visits = filteredVisits();

    if (tableBox) {
      tableBox.innerHTML = renderTable(visits);
    }

    if (counter) {
      counter.textContent = `Liczba wizyt: ${visits.length}`;
    }

    bindVisitButtons();
  }

  function bindVisitButtons() {
    document.querySelectorAll("button[data-visit-action]").forEach((btn) => {
      if (btn.dataset.bound === "1") return;

      btn.dataset.bound = "1";

      btn.addEventListener("click", () => {
        const action = btn.dataset.visitAction || "";
        const visitId = btn.dataset.visitId || "";
        const clientId = btn.dataset.clientId || "";

        if (action === "cancel") {
          cancelVisit(visitId);
          return;
        }

        if (action === "open") {
          if (!visitId) {
            alert("Brak ID wizyty.");
            return;
          }

          localStorage.setItem("vetmell_current_visit_id", visitId);
          localStorage.setItem("vetmell_current_client_id", clientId);

          window.location.href =
            "/praca_inz/final_view.php?file=wizyta_pacjent.xml&visit_id=" +
            encodeURIComponent(visitId);
        }
      });
    });
  }

  function bindVisitFilters() {
    const dateInput = document.getElementById("visit-filter-date");
    const searchInput = document.getElementById("visit-filter-search");
    const statusInput = document.getElementById("visit-filter-status");
    const clearBtn = document.getElementById("visit-filter-clear");

    [dateInput, searchInput, statusInput].forEach((input) => {
      if (!input || input.dataset.bound === "1") return;

      input.dataset.bound = "1";
      input.addEventListener("input", refreshVisitsTable);
      input.addEventListener("change", refreshVisitsTable);
    });

    if (clearBtn && clearBtn.dataset.bound !== "1") {
      clearBtn.dataset.bound = "1";

      clearBtn.addEventListener("click", () => {
        if (dateInput) dateInput.value = "";
        if (searchInput) searchInput.value = "";
        if (statusInput) statusInput.value = "";

        refreshVisitsTable();
      });
    }
  }

  function applyMainFrameStyle(frame) {
    if (!frame) return;

    const root =
      document.getElementById("sg-scroll") ||
      document.querySelector(".page-canvas") ||
      document.body;

    if (root && getComputedStyle(root).position === "static") {
      root.style.position = "relative";
    }

    frame.style.cssText = `
  position:absolute;
  left:257px;
  top:174px;
  width:1000px;
  min-height:600px;
  background:#ffffff;
  border:1px solid #e2e8f0;
  border-radius:16px;
  box-shadow:0 12px 30px rgba(0,0,0,0.12);
  box-sizing:border-box;
  overflow:visible;
  z-index:20;
  pointer-events:auto;
`;
  }

  function findMainFrame() {
    const blocks = Array.from(document.querySelectorAll('[data-type="block"], .type-block'));

    const candidates = blocks
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 600 && r.height > 350 && r.left > 220;
      })
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return (br.width * br.height) - (ar.width * ar.height);
      });

    if (candidates[0]) {
      applyMainFrameStyle(candidates[0]);
      return candidates[0];
    }

    const root =
      document.getElementById("sg-scroll") ||
      document.querySelector(".page-canvas") ||
      document.body;

    const frame = document.createElement("div");
    frame.id = "worker-visits-created-frame";
    root.appendChild(frame);

    applyMainFrameStyle(frame);

    return frame;
  }

  function ensurePanel() {
    const frame = findMainFrame();

    frame.style.position = "absolute";
    frame.style.overflow = "visible";
    frame.style.boxSizing = "border-box";

    let panel = document.getElementById("worker-visits-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "worker-visits-panel";
      frame.appendChild(panel);
    }

    panel.style.cssText = `
      position:relative;
      width:100%;
      min-height:600px;
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

  function renderTable(visits) {
    if (!Array.isArray(visits) || visits.length === 0) {
      return `
        <div style="
          padding:18px;
          border:1px dashed #cbd5e1;
          border-radius:16px;
          background:#f8fafc;
          color:#64748b;
          font-family:Arial, Helvetica, sans-serif;
          font-size:15px;
        ">
          Brak najbliższych umówionych wizyt.
        </div>
      `;
    }

    return `
      <div style="
        width:100%;
        overflow:auto;
        border:1px solid #d7e0ea;
        border-radius:18px;
        background:white;
      ">
        <table style="
          width:100%;
          border-collapse:collapse;
          font-size:14px;
          min-width:980px;
        ">
          <thead>
            <tr style="background:#f1f5f9; color:#274267;">
              <th style="padding:15px; text-align:left; border-bottom:1px solid #d7e0ea; font-weight:600;">Data</th>
              <th style="padding:15px; text-align:left; border-bottom:1px solid #d7e0ea; font-weight:600;">Godzina</th>
              <th style="padding:15px; text-align:left; border-bottom:1px solid #d7e0ea; font-weight:600;">Klient</th>
              <th style="padding:15px; text-align:left; border-bottom:1px solid #d7e0ea; font-weight:600;">Telefon</th>
              <th style="padding:15px; text-align:left; border-bottom:1px solid #d7e0ea; font-weight:600;">Pacjent</th>
              <th style="padding:15px; text-align:left; border-bottom:1px solid #d7e0ea; font-weight:600;">Czas</th>
              <th style="padding:15px; text-align:left; border-bottom:1px solid #d7e0ea; font-weight:600;">Status</th>
              <th style="padding:15px; text-align:left; border-bottom:1px solid #d7e0ea; font-weight:600;">Akcja</th>
            </tr>
          </thead>

          <tbody>
            ${visits.map((visit) => `
              <tr style="border-bottom:1px solid #eef2f7;">
                <td style="padding:15px; font-weight:400; color:#0f172a;">
                  ${escapeHtml(visit.date)}
                </td>

                <td style="padding:15px; font-weight:400; color:#0f172a;">
                  ${escapeHtml(visit.time)}
                </td>

                <td style="padding:15px;">
                  <div style="
  font-family:Arial, Helvetica, sans-serif;
  font-weight:600;
  color:#0f172a;
">
  ${escapeHtml(visit.client_name)}
</div>

                  <div style="
                    font-size:13px;
                    color:#64748b;
                    margin-top:4px;
                  ">
                    ${escapeHtml(visit.client_email || "")}
                  </div>
                </td>

                <td style="padding:15px; font-weight:400; color:#0f172a;">
                  ${escapeHtml(visit.client_phone || "-")}
                </td>

                <td style="padding:15px; font-weight:400; color:#0f172a;">
                  ${visit.pet_id ? "Pacjent #" + escapeHtml(visit.pet_id) : "-"}
                </td>

                <td style="padding:15px; font-weight:400; color:#0f172a;">
                  ${visit.duration_min ? escapeHtml(visit.duration_min) + " min" : "-"}
                </td>

                <td style="padding:15px;">
                  <span style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    min-width:96px;
                    padding:7px 12px;
                    border-radius:999px;
                    ${statusBadgeStyle(visit.status)}
                    font-family:Arial, Helvetica, sans-serif;
                    font-weight:500;
                    font-size:13px;
                    white-space:nowrap;
                  ">
                    ${escapeHtml(statusLabel(visit.status))}
                  </span>
                </td>

                <td style="padding:15px;">
                  <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button
                      type="button"
                      data-visit-action="open"
                      data-visit-id="${escapeHtml(visit.id)}"
                      data-client-id="${escapeHtml(visit.client_id || "")}"
                      style="
                        min-width:78px;
                        height:38px;
                        border:none;
                        border-radius:12px;
                        background:#1d4ed8;
                        color:white;
                        font-family:Arial, Helvetica, sans-serif;
                        font-size:14px;
                        font-weight:500;
                        cursor:pointer;
                      ">
                      Otwórz
                    </button>

                    ${canCancelVisit(visit.status) ? `
                      <button
                        type="button"
                        data-visit-action="cancel"
                        data-visit-id="${escapeHtml(visit.id)}"
                        style="
                          min-width:88px;
                          height:38px;
                          border:none;
                          border-radius:12px;
                          background:#dc2626;
                          color:white;
                          font-family:Arial, Helvetica, sans-serif;
                          font-size:14px;
                          font-weight:500;
                          cursor:pointer;
                        ">
                        Odwołaj
                      </button>
                    ` : ""}
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function render(visits) {
    allVisits = Array.isArray(visits) ? visits : [];

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
            font-family:Georgia, serif;
            font-size:34px;
            font-style:italic;
            font-weight:700;
            line-height:1.1;
            color:#102a56;
          ">
            Najbliższe wizyty
          </div>

          <div style="
            margin-top:8px;
            color:#57708f;
            font-size:15px;
          ">
            Lista najbliższych umówionych wizyt zalogowanego lekarza.
          </div>
        </div>

        <div id="worker-visits-counter" style="
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:150px;
          padding:14px 18px;
          border-radius:999px;
          border:1px solid #b6d2fb;
          background:#eef6ff;
          color:#2954d1;
          font-family:Arial, Helvetica, sans-serif;
          font-weight:500;
          font-size:18px;
          white-space:nowrap;
        ">
          Liczba wizyt: ${allVisits.length}
        </div>
      </div>

      ${renderFilters()}

      <div id="worker-visits-table-box">
        ${renderTable(allVisits)}
      </div>
    `;

    bindVisitFilters();
    refreshVisitsTable();

    bindVisitButtons();
  }

  async function loadVisits() {
    const panel = ensurePanel();

    panel.innerHTML = `
      <div style="
        padding:18px;
        background:#f8fafc;
        border:1px solid #d7e0ea;
        border-radius:16px;
        color:#475569;
        font-family:Arial, Helvetica, sans-serif;
        font-size:15px;
        font-weight:400;
      ">
        Ładowanie wizyt...
      </div>
    `;

    try {
      const res = await fetch(`${API_URL}?action=list`, {
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

        render([]);
        return;
      }

      render(data.visits || []);
    } catch (err) {
      console.error("[Worker_panel_wizyty.js]", err);

      panel.innerHTML = `
        <div style="
          padding:18px;
          border:1px solid #fecaca;
          background:#fef2f2;
          color:#991b1b;
          border-radius:16px;
          font-family:Arial, Helvetica, sans-serif;
          font-size:15px;
          font-weight:400;
        ">
          Nie udało się pobrać wizyt.
        </div>
      `;
    }
  }

  ready(() => {
    loadWorkerPanelNav();
    loadVisits();

    setTimeout(loadVisits, 400);
  });
})();