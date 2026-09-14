(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/admin_panel_glowny.php";

const IDS = {
  topBlock: "blk_1779824043158",

  topVisits: "el_1779958834570",
  topFree: "el_1779958893485_8515",
  topNext: "el_1779958925180_970138",
  topRevenue: "el_1779958953325_115339",

  scheduleBlock: "blk_1779824098102",
  infoBlock: "blk_1779824134069",
  hoursBlock: "el_1779959148964_820086"
};

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  function elById(id) {
    return document.querySelector(`[data-id="${cssEscape(id)}"]`);
  }
function centerTopPanel() {
  const topBlock = elById(IDS.topBlock);
  if (!topBlock) return;

  const parent = topBlock.parentElement;
  const parentWidth = parent ? parent.clientWidth : window.innerWidth;

  const panelWidth =
    parseInt(topBlock.style.width || topBlock.offsetWidth || "1500", 10) || 1500;

  const left = Math.max(0, Math.round((parentWidth - panelWidth) / 2));

  topBlock.style.left = left + "px";
  topBlock.style.right = "auto";
  topBlock.style.transform = "none";
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

  function statusStyle(kind) {
    if (kind === "free") return "background:#f1f5f9;color:#475569;border-color:#cbd5e1;";
    if (kind === "booked") return "background:#dcfce7;color:#166534;border-color:#86efac;";
    if (kind === "confirmed") return "background:#fef3c7;color:#854d0e;border-color:#facc15;";
    if (kind === "done") return "background:#ede9fe;color:#5b21b6;border-color:#c4b5fd;";
    if (kind === "in_progress") return "background:#dbeafe;color:#1d4ed8;border-color:#93c5fd;";
    if (kind === "cancelled") return "background:#fee2e2;color:#991b1b;border-color:#fecaca;";
    return "background:#f8fafc;color:#334155;border-color:#cbd5e1;";
  }

function setTopCard(id, title, value, sub) {
  const label = elById(id);
  const topBlock = elById(IDS.topBlock);

  if (!label || !topBlock) return;

  // Zostawiamy wygląd napisów z XML, np. Georgia + bold + italic.
  label.innerHTML = escapeHtml(title) + ":";
  label.style.overflow = "visible";

  topBlock.style.position = "absolute";
  topBlock.style.overflow = "hidden";
  centerTopPanel();
  topBlock.style.borderRadius = "18px";
  topBlock.style.boxShadow = "0 8px 20px rgba(15,23,42,0.06)";
  topBlock.style.border = "1px solid rgba(148,163,184,0.22)";

  let valueBox = document.getElementById("admin-value-" + id);

  if (!valueBox) {
    valueBox = document.createElement("div");
    valueBox.id = "admin-value-" + id;
    topBlock.appendChild(valueBox);
  }

  const labelLeft = parseInt(label.style.left || label.offsetLeft || "0", 10);
  const labelTop = parseInt(label.style.top || label.offsetTop || "0", 10);
  const labelWidth = parseInt(label.style.width || label.offsetWidth || "180", 10);

  const valueLeft = labelLeft + labelWidth + 10;
  const blockWidth = parseInt(topBlock.style.width || topBlock.offsetWidth || "1500", 10);
  const maxValueWidth = Math.max(90, blockWidth - valueLeft - 18);

  valueBox.style.cssText = `
    position:absolute;
    left:${valueLeft}px;
    top:${labelTop - 3}px;
    max-width:${maxValueWidth}px;
    height:48px;
    box-sizing:border-box;
    font-family:'Candara', 'Calibri', 'Segoe UI', Arial, sans-serif;
    color:#020617;
    z-index:80;
    overflow:hidden;
    pointer-events:none;
  `;

  valueBox.innerHTML = `
    <div style="
      font-size:25px;
      font-weight:400;
      line-height:1.05;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    ">
      ${escapeHtml(value)}
    </div>

    <div style="
  margin-top:5px;
  font-family:Arial, Helvetica, sans-serif;
  font-size:12px;
  font-weight:400;
  font-style:normal;
  color:#475569;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  letter-spacing:0px;
">
  ${escapeHtml(sub || "")}
</div>
  `;
}
  function contentBox(blockId, boxId, topPx) {
    const block = elById(blockId);
    if (!block) return null;

    block.style.overflow = "hidden";
    block.style.position = "absolute";

    let box = document.getElementById(boxId);

    if (!box) {
      box = document.createElement("div");
      box.id = boxId;
      block.appendChild(box);
    }

    box.style.cssText = `
      position:absolute;
      left:18px;
      right:18px;
      top:${topPx}px;
      bottom:14px;
      overflow:auto;
      font-family:'Segoe UI', Arial, sans-serif;
      color:#0f172a;
      box-sizing:border-box;
      padding-right:4px;
      scrollbar-width:thin;
    `;

    return box;
  }

  function renderSchedule(schedule) {
    const box = contentBox(IDS.scheduleBlock, "admin-dashboard-schedule", 58);
    if (!box) return;

    if (!Array.isArray(schedule) || schedule.length === 0) {
      box.innerHTML = `
        <div style="
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#64748b;
          font-size:14px;
          text-align:center;
        ">
          Brak wizyt i wolnych terminów na dzisiaj.
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${schedule.map((item) => `
<div style="
  display:grid;
  grid-template-columns:58px 1fr 120px 105px;
  gap:9px;
  align-items:center;
  border:1px solid #e2e8f0;
  background:#ffffff;
  border-radius:12px;
  padding:9px 10px;
  box-sizing:border-box;
">
<div style="
  font-family:Arial, Helvetica, sans-serif;
  font-weight: 800;
  font-size:14px;
  font-weight:400;
  color:#0f172a;
">
  ${escapeHtml(item.time || "-")}
</div>

  <div style="min-width:0;">
 <div style="
  font-family:Arial, Helvetica, sans-serif;
  font-weight: 500;
  font-size:13px;
  font-weight:400;
  color:#0f172a;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
">
  ${escapeHtml(item.client_name || "-")}
</div>

    <div style="
      font-size:12px;
      color:#64748b;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    ">
      ${escapeHtml(item.duration_min || 30)} min
    </div>
  </div>

  <div style="
    font-size:12px;
    color:#334155;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  ">
    ${escapeHtml(item.employee_name || "-")}
  </div>

  <div style="
  display:inline-flex;
  justify-content:center;
  border:1px solid;
  border-radius:999px;
  padding:5px 8px;
  font-family:Arial, Helvetica, sans-serif;
  font-size:11px;
  font-weight:600;
  ${statusStyle(item.status_kind)}
">
  ${escapeHtml(item.status || "-")}
</div>
</div>
        `).join("")}
      </div>
    `;
  }

  function renderInfo(data) {
    const box = contentBox(IDS.infoBlock, "admin-dashboard-info", 68);
    if (!box) return;

    const stats = data.stats || {};
    const next = data.next_visit;
    const info = Array.isArray(data.info) ? data.info : [];

    box.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:11px;background:white;">
          <div style="
  font-family:Arial, Helvetica, sans-serif;
  font-size:12px;
  color:#64748b;
  font-weight:550;
">
  Pacjenci
</div>

<div style="
  font-family:Arial, Helvetica, sans-serif;
  font-size:24px;
  font-weight:400;
  margin-top:4px;
">
  ${escapeHtml(stats.clients_count || 0)}
</div>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:11px;background:white;">
<div style="
  font-family:Arial, Helvetica, sans-serif;
  font-size:12px;
  color:#64748b;
  font-weight:600;
">
  Pracownicy
</div>

<div style="
  font-family:Arial, Helvetica, sans-serif;
  font-size:24px;
  font-weight:400;
  margin-top:4px;
">
  ${escapeHtml(stats.employees_count || 0)}
</div>
        </div>
      </div>

      <div style="
        border:1px solid #dbe4f0;
        background:#f8fafc;
        border-radius:12px;
        padding:12px;
        margin-bottom:12px;
      ">
        <div style="
  font-family:Arial, Helvetica, sans-serif;
  font-size:13px;
  font-weight:550;
  margin-bottom:6px;
">
  Najbliższa wizyta
</div>

        ${
          next
            ? `
              <div style="font-size:14px;font-weight:800;color:#0f172a;">
                ${escapeHtml(next.time)} • ${escapeHtml(next.client_name)}
              </div>
              <div style="font-size:12px;color:#64748b;margin-top:3px;">
                ${escapeHtml(next.date)} • ${escapeHtml(next.employee_name)} • ${escapeHtml(next.status)}
              </div>
            `
            : `
              <div style="font-size:13px;color:#64748b;">
                Brak nadchodzących wizyt.
              </div>
            `
        }
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        ${info.map((item) => {
          const color =
            item.type === "warning" ? "#f59e0b" :
            item.type === "ok" ? "#22c55e" :
            "#156fe5";

          return `
            <div style="
              border:1px solid #e2e8f0;
              background:white;
              border-radius:12px;
              padding:10px 11px;
              display:grid;
              grid-template-columns:10px 1fr;
              gap:9px;
            ">
              <span style="width:9px;height:9px;background:${color};border-radius:999px;margin-top:5px;"></span>
              <div>
                <div style="
  font-family:Arial, Helvetica, sans-serif;
  font-size:13px;
  font-weight:600;
  color:#0f172a;
">
  ${escapeHtml(item.title)}
</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;line-height:1.35;">
                  ${escapeHtml(item.text)}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderEmployees(employees) {
    const box = contentBox(IDS.hoursBlock, "admin-dashboard-hours", 62);
    if (!box) return;

    if (!Array.isArray(employees) || employees.length === 0) {
      box.innerHTML = `
        <div style="
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#64748b;
          font-size:14px;
          text-align:center;
        ">
          Brak aktywnych pracowników.
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${employees.map((emp) => `
          <div style="
  display:grid;
  grid-template-columns:1fr 130px 75px 75px;
  gap:10px;
  align-items:center;
  border:1px solid #e2e8f0;
  background:#ffffff;
  border-radius:12px;
  padding:10px 12px;
  box-sizing:border-box;
">
  <div>
    <div style="
      font-family:Arial, Helvetica, sans-serif;
      font-size:14px;
      font-weight:500;
      color:#0f172a;
    ">
      ${escapeHtml(emp.name || "-")}
    </div>

    <div style="
      font-family:Arial, Helvetica, sans-serif;
      font-size:12px;
      font-weight:400;
      color:#64748b;
      margin-top:2px;
    ">
      ${escapeHtml(emp.work_time || "Brak grafiku")}
    </div>
  </div>

  <div style="
    font-family:Arial, Helvetica, sans-serif;
    font-size:12px;
    font-weight:400;
    color:#475569;
  ">
    ${escapeHtml(emp.work_time || "Brak grafiku")}
  </div>

  <div style="
  text-align:center;
  background:#dcfce7;
  color:#166534;
  border:1px solid #86efac;
  border-radius:999px;
  padding:5px 7px;
  font-family:Arial, Helvetica, sans-serif;
  font-size:12px;
  font-weight:600;
">
  ${escapeHtml(emp.visits_count || 0)} wiz.
</div>

  <div style="
  text-align:center;
  background:#f1f5f9;
  color:#475569;
  border:1px solid #cbd5e1;
  border-radius:999px;
  padding:5px 7px;
  font-family:Arial, Helvetica, sans-serif;
  font-size:12px;
  font-weight:600;
">
  ${escapeHtml(emp.free_count || 0)} wol.
</div>
</div>
        `).join("")}
      </div>
    `;
  }

  function renderDashboard(data) {
    const stats = data.stats || {};
    const next = data.next_visit;

setTopCard(
  IDS.topVisits,
  "Dzisiejsze wizyty",
  stats.today_visits || 0,
  `Potwierdzone: ${stats.today_confirmed || 0}, zrealizowane: ${stats.today_done || 0}`
);

setTopCard(
  IDS.topFree,
  "Wolne terminy",
  stats.today_free || 0,
  "Dostępne sloty na dziś"
);

setTopCard(
  IDS.topNext,
  "Najbliższa wizyta",
  next ? `${next.time}` : "Brak",
  next ? "Najbliższy termin wizyty" : "Brak nadchodzących wizyt"
);

setTopCard(
  IDS.topRevenue,
  "Przychód miesięczny",
  stats.monthly_revenue_label || "0,00 zł",
  "Na podstawie płatności lub wizyt"
);

    renderSchedule(data.schedule || []);
    renderInfo(data);
    renderEmployees(data.employees_today || []);
  }

  function renderError(message) {
    setTopCard(IDS.topVisits, "Błąd", "-", message || "Nie udało się pobrać danych.");
  }

  async function loadDashboard() {
    try {
      const res = await fetch(`${API_URL}?action=dashboard`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.message || "Błąd pobierania danych.");
      }

      renderDashboard(data);
    } catch (err) {
      console.error("[admin_panel_glowny.js]", err);
      renderError(err.message || "Błąd pobierania danych.");
    }
  }

  ready(() => {
  loadDashboard();
  centerTopPanel();
  window.addEventListener("resize", centerTopPanel);
});
})();