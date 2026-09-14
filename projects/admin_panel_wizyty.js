(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/admin_panel_wizyty.php";

  let allVisits = [];
  let allEmployees = [];
  let stats = {};

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function loadAdminPanelNav() {
    if (window.__adminPanelNavLoader === true) return;
    window.__adminPanelNavLoader = true;

    const s = document.createElement("script");
    s.src = "projects/admin_panel_nav.js?v=" + Date.now();
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

  function statusLabel(status) {
    const s = String(status || "").toUpperCase();

    if (s === "FREE") return "Wolny termin";
    if (s === "BOOKED") return "Umówiona";
    if (s === "CONFIRMED") return "Potwierdzona";
    if (s === "IN_PROGRESS") return "W trakcie";
    if (s === "DONE") return "Zrealizowana";
    if (s === "CANCELLED") return "Anulowana";
    if (s === "NOT_DONE") return "Niezrealizowana";

    return status || "Brak statusu";
  }

  function statusStyle(status) {
    const s = String(status || "").toUpperCase();

    if (s === "FREE") {
      return "background:#f1f5f9;border:1px solid #cbd5e1;color:#475569;";
    }

    if (s === "BOOKED") {
      return "background:#dcfce7;border:1px solid #86efac;color:#166534;";
    }

    if (s === "CONFIRMED") {
      return "background:#fef3c7;border:1px solid #facc15;color:#854d0e;";
    }

    if (s === "IN_PROGRESS") {
      return "background:#dbeafe;border:1px solid #93c5fd;color:#1d4ed8;";
    }

    if (s === "DONE") {
      return "background:#ede9fe;border:1px solid #c4b5fd;color:#5b21b6;";
    }

    if (s === "CANCELLED" || s === "NOT_DONE") {
      return "background:#fee2e2;border:1px solid #fecaca;color:#991b1b;";
    }

    return "background:#f8fafc;border:1px solid #cbd5e1;color:#334155;";
  }
function canCancelVisit(status) {
  const s = String(status || "").toUpperCase();

  return ![
    "FREE",
    "DONE",
    "CANCELLED",
    "CANCELED",
    "ANULOWANA",
    "NOT_DONE",
    "IN_PROGRESS"
  ].includes(s);
}
function canConfirmVisit(status) {
  return String(status || "").toUpperCase() === "BOOKED";
}
function findVisitById(visitId) {
  return allVisits.find((visit) => String(visit.id) === String(visitId)) || null;
}

function showVisitConfirmModal(visit, onConfirm) {
  const old = document.getElementById("admin-visit-confirm-modal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "admin-visit-confirm-modal";
  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:999999;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(15,23,42,0.45);
  `;

  modal.innerHTML = `
    <div style="
      width:min(430px, calc(100vw - 32px));
      background:white;
      border-radius:18px;
      box-shadow:0 24px 60px rgba(0,0,0,0.28);
      padding:22px;
      font-family:'Segoe UI', Arial, sans-serif;
      color:#0f172a;
    ">
      <div style="font-size:21px;font-weight:900;margin-bottom:8px;">
        Zmiana statusu wizyty
      </div>

      <div style="font-size:14px;color:#475569;line-height:1.45;margin-bottom:16px;">
        Czy na pewno chcesz zmienić status tej wizyty na <b>Potwierdzona</b>?
      </div>

      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:14px;
        padding:12px;
        font-size:14px;
        line-height:1.55;
        margin-bottom:14px;
      ">
        <b>Wizyta #${escapeHtml(visit.id || "-")}</b><br>
        Data: ${escapeHtml(visit.date || "-")} ${escapeHtml(visit.time || "")}<br>
        Pacjent: ${escapeHtml(visit.client_name || "-")}<br>
        Lekarz: ${escapeHtml(visit.employee_name || "-")}<br>
        Obecny status: ${escapeHtml(statusLabel(visit.status))}
      </div>

      <div id="admin-visit-confirm-message" style="
        min-height:18px;
        font-size:13px;
        font-weight:800;
        color:#991b1b;
        margin-bottom:12px;
      "></div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" data-modal-cancel style="
          border:none;
          border-radius:10px;
          background:#e2e8f0;
          color:#334155;
          font-size:14px;
          font-weight:800;
          padding:10px 14px;
          cursor:pointer;
        ">
          Anuluj
        </button>

        <button type="button" data-modal-confirm style="
          border:none;
          border-radius:10px;
          background:#16a34a;
          color:white;
          font-size:14px;
          font-weight:900;
          padding:10px 16px;
          cursor:pointer;
        ">
          Tak, potwierdź
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();

  modal.querySelector("[data-modal-cancel]").addEventListener("click", close);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  modal.querySelector("[data-modal-confirm]").addEventListener("click", async () => {
    const btn = modal.querySelector("[data-modal-confirm]");
    const msg = modal.querySelector("#admin-visit-confirm-message");

    btn.disabled = true;
    btn.textContent = "Zapisywanie...";
    msg.textContent = "";

    try {
      await onConfirm();
      close();
    } catch (err) {
      msg.textContent = err.message || "Nie udało się zmienić statusu.";
      btn.disabled = false;
      btn.textContent = "Tak, potwierdź";
    }
  });
}
async function confirmVisit(visitId) {
  const visit = findVisitById(visitId);

  if (!visitId || !visit) {
    return;
  }

  showVisitConfirmModal(visit, async () => {
    const res = await fetch(API_URL + "?action=confirm", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        action: "confirm",
        visit_id: visitId
      })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.ok) {
      throw new Error((data && data.message) ? data.message : "Nie udało się potwierdzić wizyty.");
    }

    loadVisits();
  });
}
function showVisitCancelModal(visit, onCancel) {
  const old = document.getElementById("admin-visit-cancel-modal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "admin-visit-cancel-modal";
  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:999999;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(15,23,42,0.45);
  `;

  modal.innerHTML = `
    <div style="
      width:min(520px, calc(100vw - 32px));
      background:white;
      border-radius:18px;
      box-shadow:0 24px 60px rgba(0,0,0,0.28);
      padding:22px;
      font-family:'Segoe UI', Arial, sans-serif;
      color:#0f172a;
    ">
      <div style="font-size:21px;font-weight:900;margin-bottom:8px;">
        Odwołanie wizyty
      </div>

      <div style="font-size:14px;color:#475569;line-height:1.45;margin-bottom:16px;">
        Podaj powód odwołania wizyty. Ten powód zostanie zapisany w bazie i wysłany pacjentowi jako powiadomienie.
      </div>

      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:14px;
        padding:12px;
        font-size:14px;
        line-height:1.55;
        margin-bottom:14px;
      ">
        <b>Wizyta #${escapeHtml(visit.id || "-")}</b><br>
        Data: ${escapeHtml(visit.date || "-")} ${escapeHtml(visit.time || "")}<br>
        Pacjent: ${escapeHtml(visit.client_name || "-")}<br>
        Lekarz: ${escapeHtml(visit.employee_name || "-")}<br>
        Obecny status: ${escapeHtml(statusLabel(visit.status))}
      </div>

      <label style="
        display:block;
        font-size:13px;
        font-weight:900;
        color:#334155;
        margin-bottom:6px;
      ">
        Powód odwołania
      </label>

      <textarea id="admin-visit-cancel-reason" style="
        width:100%;
        min-height:110px;
        resize:vertical;
        border:1px solid #cbd5e1;
        border-radius:12px;
        padding:10px 12px;
        box-sizing:border-box;
        font-size:14px;
        font-family:'Segoe UI', Arial, sans-serif;
        outline:none;
      " placeholder="Np. Lekarz jest niedostępny w tym terminie."></textarea>

      <div id="admin-visit-cancel-message" style="
        min-height:18px;
        font-size:13px;
        font-weight:800;
        color:#991b1b;
        margin-top:10px;
        margin-bottom:12px;
      "></div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button type="button" data-modal-cancel style="
          border:none;
          border-radius:10px;
          background:#e2e8f0;
          color:#334155;
          font-size:14px;
          font-weight:800;
          padding:10px 14px;
          cursor:pointer;
        ">
          Anuluj
        </button>

        <button type="button" data-modal-confirm style="
          border:none;
          border-radius:10px;
          background:#dc2626;
          color:white;
          font-size:14px;
          font-weight:900;
          padding:10px 16px;
          cursor:pointer;
        ">
          Odwołaj wizytę
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();

  modal.querySelector("[data-modal-cancel]").addEventListener("click", close);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  modal.querySelector("[data-modal-confirm]").addEventListener("click", async () => {
    const btn = modal.querySelector("[data-modal-confirm]");
    const msg = modal.querySelector("#admin-visit-cancel-message");
    const textarea = modal.querySelector("#admin-visit-cancel-reason");

    const reason = String(textarea ? textarea.value : "").trim();

    if (!reason) {
      msg.textContent = "Musisz podać powód odwołania wizyty.";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Odwoływanie...";
    msg.textContent = "";

    try {
      await onCancel(reason);
      close();
    } catch (err) {
      msg.textContent = err.message || "Nie udało się odwołać wizyty.";
      btn.disabled = false;
      btn.textContent = "Odwołaj wizytę";
    }
  });
}

async function cancelVisit(visitId) {
  const visit = findVisitById(visitId);

  if (!visitId || !visit) {
    alert("Brak danych wizyty.");
    return;
  }

  showVisitCancelModal(visit, async (reason) => {
    const res = await fetch(API_URL + "?action=cancel", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        action: "cancel",
        visit_id: visitId,
        reason: reason
      })
    });

    const text = await res.text();

    let data = null;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("PHP zwrócił tekst zamiast JSON:", text);
      throw new Error("PHP nie zwrócił poprawnego JSON.");
    }

    if (!res.ok || !data || !data.ok) {
      throw new Error((data && data.message) ? data.message : "Nie udało się odwołać wizyty.");
    }

    alert("Wizyta została odwołana. Powiadomienie zostało wysłane do pacjenta.");
    loadVisits();
  });
}
function findMainFrame() {
  const root =
    document.getElementById("sg-scroll") ||
    document.querySelector(".page-canvas") ||
    document.body;

  let frame = document.getElementById("admin-visits-created-frame");

  if (!frame) {
    frame = document.createElement("div");
    frame.id = "admin-visits-created-frame";
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
  min-height:680px;
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

    frame.style.position = "absolute";
    frame.style.overflow = "hidden";
    frame.style.boxSizing = "border-box";

    let panel = document.getElementById("admin-visits-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "admin-visits-panel";
      frame.appendChild(panel);
    }

    panel.style.cssText = `
      position:absolute;
      inset:28px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      gap:16px;
      font-family:'Segoe UI', Arial, sans-serif;
      color:#0f172a;
      overflow:auto;
      padding-right:4px;
    `;

    return panel;
  }

  function renderFilters() {
    return `
      <div id="admin-visits-filters" style="
        display:grid;
        grid-template-columns:160px 1fr 190px 170px 120px;
        gap:12px;
        align-items:end;
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:14px;
        padding:14px;
        box-sizing:border-box;
      ">
        <div>
          <label style="display:block;font-size:12px;font-weight:800;color:#334155;margin-bottom:5px;">
            Data wizyty
          </label>

          <input id="admin-visit-filter-date" type="date" style="
            width:100%;
            height:38px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            font-size:14px;
            box-sizing:border-box;
          ">
        </div>

        <div>
          <label style="display:block;font-size:12px;font-weight:800;color:#334155;margin-bottom:5px;">
            Szukaj
          </label>

          <input id="admin-visit-filter-search" type="text" placeholder="Pacjent, telefon, email, lekarz, ID wizyty..." style="
            width:100%;
            height:38px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            font-size:14px;
            box-sizing:border-box;
          ">
        </div>

        <div>
          <label style="display:block;font-size:12px;font-weight:800;color:#334155;margin-bottom:5px;">
            Lekarz
          </label>

          <select id="admin-visit-filter-employee" style="
            width:100%;
            height:38px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            font-size:14px;
            box-sizing:border-box;
            background:white;
          ">
            <option value="">Wszyscy lekarze</option>
            ${allEmployees.map((emp) => `
              <option value="${escapeHtml(emp.id)}">${escapeHtml(emp.name)}</option>
            `).join("")}
          </select>
        </div>

        <div>
          <label style="display:block;font-size:12px;font-weight:800;color:#334155;margin-bottom:5px;">
            Status
          </label>

          <select id="admin-visit-filter-status" style="
            width:100%;
            height:38px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 10px;
            font-size:14px;
            box-sizing:border-box;
            background:white;
          ">
            <option value="">Wszystkie</option>
            <option value="FREE">Wolny termin</option>
            <option value="BOOKED">Umówiona</option>
            <option value="CONFIRMED">Potwierdzona</option>
            <option value="IN_PROGRESS">W trakcie</option>
            <option value="DONE">Zrealizowana</option>
            <option value="CANCELLED">Anulowana</option>
            <option value="NOT_DONE">Niezrealizowana</option>
          </select>
        </div>

        <button type="button" id="admin-visit-filter-clear" style="
          height:38px;
          border:none;
          border-radius:10px;
          background:#334155;
          color:white;
          font-size:14px;
          font-weight:600;
          cursor:pointer;
        ">
          Wyczyść
        </button>
      </div>
    `;
  }

  function filteredVisits() {
    const dateInput = document.getElementById("admin-visit-filter-date");
    const searchInput = document.getElementById("admin-visit-filter-search");
    const employeeInput = document.getElementById("admin-visit-filter-employee");
    const statusInput = document.getElementById("admin-visit-filter-status");

    const selectedDate = dateInputToPl(dateInput ? dateInput.value : "");
    const search = normalizeText(searchInput ? searchInput.value : "");
    const employeeId = String(employeeInput ? employeeInput.value : "");
    const status = normalizeText(statusInput ? statusInput.value : "");

    return allVisits.filter((visit) => {
      const visitStatus = normalizeText(visit.status || "");
      const visitDate = String(visit.date || "");
      const visitEmployeeId = String(visit.employee_id || "");

      const haystack = normalizeText([
        visit.id,
        visit.date,
        visit.time,
        visit.employee_name,
        visit.client_name,
        visit.client_email,
        visit.client_phone,
        visit.pet_id ? "Pacjent #" + visit.pet_id : "",
        visit.duration_min ? visit.duration_min + " min" : "",
        visit.total_price_label,
        statusLabel(visit.status),
        visit.status,
        visit.notes
      ].join(" "));

      const okDate = !selectedDate || visitDate === selectedDate;
      const okSearch = !search || haystack.includes(search);
      const okEmployee = !employeeId || visitEmployeeId === employeeId;
      const okStatus = !status || visitStatus === status;

      return okDate && okSearch && okEmployee && okStatus;
    });
  }

function statPill(label, value, color) {
  return `
    <div style="
      background:#ffffff;
      border:1px solid #e2e8f0;
      border-radius:12px;
      padding:10px 12px;
      min-width:120px;
      box-sizing:border-box;
    ">
      <div style="
        font-family:Arial, Helvetica, sans-serif;
        font-size:11px;
        font-weight:600;
        color:#64748b;
        text-transform:uppercase;
      ">
        ${escapeHtml(label)}
      </div>

      <div style="
        margin-top:4px;
        font-family:Arial, Helvetica, sans-serif;
        font-size:22px;
        font-weight:400;
        color:${color};
        line-height:1;
      ">
        ${escapeHtml(value)}
      </div>
    </div>
  `;
}

  function renderStatsBox() {
    return `
      <div style="
        display:flex;
        gap:10px;
        flex-wrap:wrap;
      ">
        ${statPill("Wszystkie", stats.all || 0, "#0f172a")}
        ${statPill("Umówione", stats.booked || 0, "#166534")}
        ${statPill("Potwierdzone", stats.confirmed || 0, "#854d0e")}
        ${statPill("Wolne", stats.free || 0, "#475569")}
        ${statPill("Zrealizowane", stats.done || 0, "#5b21b6")}
      </div>
    `;
  }

  function renderTable(visits) {
    if (!Array.isArray(visits) || visits.length === 0) {
      return `
        <div style="
          padding:18px;
          border:1px dashed #cbd5e1;
          border-radius:14px;
          background:#f8fafc;
          color:#64748b;
          font-size:16px;
        ">
          Brak wizyt spełniających wybrane filtry.
        </div>
      `;
    }

    return `
      <div style="
        width:100%;
        overflow:auto;
        border:1px solid #e2e8f0;
        border-radius:14px;
        background:white;
      ">
        <table style="
          width:100%;
          border-collapse:collapse;
          font-size:14px;
          min-width:1120px;
        ">
          <thead>
            <tr style="background:#f1f5f9;color:#334155;">
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Data</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Godzina</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Lekarz</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Klient</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Telefon</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Pacjent</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Czas</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Cena</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Status</th>
              <th style="padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;">Akcja</th>
            </tr>
          </thead>

          <tbody>
            ${visits.map((visit) => {
              const isFree = String(visit.status || "").toUpperCase() === "FREE";

              return `
                <tr style="border-bottom:1px solid #eef2f7;">
                  <td style="padding:12px;font-weight:700;">${escapeHtml(visit.date)}</td>
                  <td style="
  padding:12px;
  font-family:Arial, Helvetica, sans-serif;
  font-weight:400;
">
  ${escapeHtml(visit.time)}
</td>

                  <td style="padding:12px;">
                    <div style="
  font-family:Arial, Helvetica, sans-serif;
  font-weight:500;
">
  ${escapeHtml(visit.employee_name || "-")}
</div>
                    <div style="font-size:12px;color:#64748b;">ID: ${escapeHtml(visit.employee_id || "-")}</div>
                  </td>

                  <td style="padding:12px;">
                    <div style="
  font-family:Arial, Helvetica, sans-serif;
  font-weight:500;
">
  ${escapeHtml(visit.client_name || "-")}
</div>
                    <div style="font-size:12px;color:#64748b;">${escapeHtml(visit.client_email || "")}</div>
                  </td>

                  <td style="padding:12px;">${escapeHtml(visit.client_phone || "-")}</td>

                  <td style="padding:12px;">
                    ${visit.pet_id ? "Pacjent #" + escapeHtml(visit.pet_id) : "-"}
                  </td>

                  <td style="padding:12px;">
                    ${visit.duration_min ? escapeHtml(visit.duration_min) + " min" : "-"}
                  </td>

                  <td style="
  padding:12px;
  font-family:Arial, Helvetica, sans-serif;
  font-weight:400;
">
  ${escapeHtml(visit.total_price_label || "0,00 zł")}
</td>

                  <td style="padding:12px;">
                    <span style="
                      display:inline-flex;
                      padding:5px 10px;
                      border-radius:999px;
                      font-family:Arial, Helvetica, sans-serif;
font-weight:500;
font-size:12px;
white-space:nowrap;
${statusStyle(visit.status)}
                    ">
                      ${escapeHtml(visit.status_label || statusLabel(visit.status))}
                    </span>
                  </td>

                 <td style="padding:12px;">
  ${
    isFree
      ? `
        <button type="button" disabled style="
          border:none;
          border-radius:9px;
          background:#cbd5e1;
          color:#475569;
          font-size:13px;
          font-family:Arial, Helvetica, sans-serif;
font-weight:500;
          padding:8px 12px;
          cursor:not-allowed;
        ">
          Wolne
        </button>
      `
      : `
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button
            type="button"
            data-visit-action="open"
            data-visit-id="${escapeHtml(visit.id)}"
            data-client-id="${escapeHtml(visit.client_id || "")}"
            style="
              border:none;
              border-radius:9px;
              background:#1d4ed8;
              color:white;
              font-size:13px;
              font-family:Arial, Helvetica, sans-serif;
font-weight:500;
              padding:8px 12px;
              cursor:pointer;
            "
          >
            Otwórz
          </button>
${canConfirmVisit(visit.status) ? `
  <button
    type="button"
    data-visit-action="confirm"
    data-visit-id="${escapeHtml(visit.id)}"
    style="
      border:none;
      border-radius:9px;
      background:#16a34a;
      color:white;
      font-size:13px;
     font-family:Arial, Helvetica, sans-serif;
font-weight:500;
      padding:8px 12px;
      cursor:pointer;
    "
  >
    Potwierdź
  </button>
` : ""}
          ${canCancelVisit(visit.status) ? `
            <button
              type="button"
              data-visit-action="cancel"
              data-visit-id="${escapeHtml(visit.id)}"
              style="
                border:none;
                border-radius:9px;
                background:#dc2626;
                color:white;
                font-size:13px;
                font-family:Arial, Helvetica, sans-serif;
font-weight:500;
                padding:8px 12px;
                cursor:pointer;
              "
            >
              Odwołaj
            </button>
          ` : ""}
        </div>
      `
  }
</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function refreshVisitsTable() {
    const tableBox = document.getElementById("admin-visits-table-box");
    const counter = document.getElementById("admin-visits-counter");

    const visits = filteredVisits();

    if (tableBox) {
      tableBox.innerHTML = renderTable(visits);
    }

    if (counter) {
      counter.textContent = `Liczba pozycji: ${visits.length}`;
    }

    bindVisitButtons();
  }

function bindVisitButtons() {
  document.querySelectorAll("#admin-visits-panel button[data-visit-action]").forEach((btn) => {
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
if (action === "confirm") {
  confirmVisit(visitId);
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
    const dateInput = document.getElementById("admin-visit-filter-date");
    const searchInput = document.getElementById("admin-visit-filter-search");
    const employeeInput = document.getElementById("admin-visit-filter-employee");
    const statusInput = document.getElementById("admin-visit-filter-status");
    const clearBtn = document.getElementById("admin-visit-filter-clear");

    [dateInput, searchInput, employeeInput, statusInput].forEach((input) => {
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
        if (employeeInput) employeeInput.value = "";
        if (statusInput) statusInput.value = "";

        refreshVisitsTable();
      });
    }
  }

  function render(visits, employees, incomingStats) {
    allVisits = Array.isArray(visits) ? visits : [];
    allEmployees = Array.isArray(employees) ? employees : [];
    stats = incomingStats || {};

    const panel = ensurePanel();

    panel.innerHTML = `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:16px;
      ">
        <div>
          <h1 style="
            margin:0;
            font-size:32px;
            font-family:Georgia, serif;
            font-style:italic;
            font-weight:700;
          ">
            Przegląd wizyt
          </h1>

          <div style="
            margin-top:6px;
            color:#64748b;
            font-size:14px;
          ">
            Lista najbliższych wizyt i wolnych terminów wszystkich lekarzy.
          </div>
        </div>

        <div id="admin-visits-counter" style="
          background:#eff6ff;
          color:#1d4ed8;
          border:1px solid #bfdbfe;
          border-radius:999px;
          padding:9px 14px;
          font-weight:500;
          font-size:14px;
          white-space:nowrap;
        ">
          Liczba pozycji: ${allVisits.length}
        </div>
      </div>

      ${renderStatsBox()}

      ${renderFilters()}

      <div id="admin-visits-table-box">
        ${renderTable(allVisits)}
      </div>
    `;

    bindVisitFilters();
    bindVisitButtons();
  }

  async function loadVisits() {
    const panel = ensurePanel();

    panel.innerHTML = `
      <div style="font-size:18px;font-weight:700;">
        Ładowanie wizyt...
      </div>
    `;

    try {
      const res = await fetch(`${API_URL}?action=list`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.message || "Błąd pobierania wizyt.");
      }

      render(data.visits || [], data.employees || [], data.stats || {});
    } catch (err) {
      console.error("[admin_panel_wizyty.js]", err);

      panel.innerHTML = `
        <div style="
          padding:18px;
          border:1px solid #fecaca;
          background:#fef2f2;
          color:#991b1b;
          border-radius:14px;
          font-weight:700;
        ">
          Nie udało się pobrać wizyt administratora.
        </div>
      `;
    }
  }

  ready(() => {
    loadVisits();
  });
})();