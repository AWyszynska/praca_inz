(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/admin_panel_uslugi.php";

  const state = {
    services: [],
    filtered: [],
    search: "",
    active: ""
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

    let frame = document.getElementById("admin-services-created-frame");

    if (!frame) {
      frame = document.createElement("div");
      frame.id = "admin-services-created-frame";
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

    let panel = document.getElementById("admin-services-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "admin-services-panel";
      frame.appendChild(panel);
    }

    panel.style.cssText = `
      position:relative;
      width:100%;
      min-height:660px;
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

  function activeBadge(active) {
    const isActive = !!active;

    return `
      <span style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:90px;
        padding:7px 12px;
        border-radius:999px;
        background:${isActive ? "#d9fbe6" : "#fee2e2"};
        color:${isActive ? "#166534" : "#991b1b"};
        border:1px solid ${isActive ? "#86efac" : "#fecaca"};
        font-weight:500;
        font-size:13px;
      ">
        ${isActive ? "Aktywna" : "Nieaktywna"}
      </span>
    `;
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
            Usługi i cennik
          </div>

          <div style="
            margin-top:8px;
            font-size:15px;
            color:#57708f;
          ">
            Lista usług weterynaryjnych, ceny, czas trwania oraz aktywność w systemie.
          </div>
        </div>

        <div style="display:flex;gap:10px;align-items:center;">
          <div id="admin-services-counter" style="
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-width:150px;
            padding:14px 18px;
            border-radius:999px;
            border:1px solid #b6d2fb;
            background:#eef6ff;
            color:#2954d1;
            font-weight:500;
            font-size:18px;
          ">
            Usługi: 0
          </div>

          <button type="button" id="admin-add-service-btn" style="
            height:48px;
            padding:0 18px;
            border:none;
            border-radius:14px;
            background:#1d4ed8;
            color:#ffffff;
            font-size:15px;
            font-weight:600;
            cursor:pointer;
            box-shadow:0 10px 20px rgba(29,78,216,.18);
          ">
            Dodaj usługę
          </button>
        </div>
      </div>

      <div style="
        display:grid;
        grid-template-columns:1fr 190px 140px;
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

          <input id="admin-service-search" type="text" placeholder="Nazwa usługi, opis, cena, czas..." style="
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
            Status
          </div>

          <select id="admin-service-active" style="
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
            <option value="">Wszystkie</option>
            <option value="1">Aktywne</option>
            <option value="0">Nieaktywne</option>
          </select>
        </div>

        <button type="button" id="admin-service-clear" style="
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

      <div id="admin-services-summary"></div>
      <div id="admin-services-table-box"></div>
      <div id="admin-service-modal-root"></div>
    `;

    bindShellEvents();
  }

  function bindShellEvents() {
    const search = document.getElementById("admin-service-search");
    const active = document.getElementById("admin-service-active");
    const clear = document.getElementById("admin-service-clear");
    const add = document.getElementById("admin-add-service-btn");

    if (search) search.addEventListener("input", applyFilters);
    if (active) active.addEventListener("change", applyFilters);

    if (clear) {
      clear.addEventListener("click", () => {
        if (search) search.value = "";
        if (active) active.value = "";
        applyFilters();
      });
    }

    if (add) {
      add.addEventListener("click", () => openServiceModal(null));
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById("admin-service-search");
    const activeInput = document.getElementById("admin-service-active");

    state.search = normalize(searchInput ? searchInput.value : "");
    state.active = activeInput ? activeInput.value : "";

    state.filtered = state.services.filter((service) => {
      const haystack = normalize([
        service.id,
        service.name,
        service.description,
        service.price_label,
        service.default_duration_min,
        service.is_active ? "aktywna" : "nieaktywna"
      ].join(" "));

      const okSearch = !state.search || haystack.includes(state.search);
      const okActive = state.active === "" || String(service.is_active ? 1 : 0) === state.active;

      return okSearch && okActive;
    });

    renderSummary();
    renderServicesTable();
  }

  function renderSummary() {
    const box = document.getElementById("admin-services-summary");
    if (!box) return;

    const all = state.services.length;
    const active = state.services.filter((s) => s.is_active).length;
    const inactive = all - active;

    const prices = state.services.map((s) => Number(s.price || 0)).filter((n) => n > 0);
    const avgPrice = prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0;

    box.innerHTML = `
      <div style="
        display:grid;
        grid-template-columns:repeat(4, 1fr);
        gap:12px;
      ">
        ${summaryCard("Wszystkie usługi", all, "#0f172a")}
        ${summaryCard("Aktywne", active, "#166534")}
        ${summaryCard("Nieaktywne", inactive, "#991b1b")}
        ${summaryCard("Średnia cena", formatMoney(avgPrice), "#1d4ed8")}
      </div>
    `;
  }

  function summaryCard(label, value, color) {
    return `
      <div style="
        border:1px solid #e2e8f0;
        background:#ffffff;
        border-radius:16px;
        padding:14px 16px;
        box-sizing:border-box;
      ">
        <div style="
          font-size:12px;
          text-transform:uppercase;
          font-weight:600;
          color:#64748b;
          letter-spacing:.2px;
        ">
          ${escapeHtml(label)}
        </div>

        <div style="
          margin-top:6px;
          font-size:26px;
          font-weight:400;
          color:${color};
          line-height:1;
        ">
          ${escapeHtml(value)}
        </div>
      </div>
    `;
  }

  function formatMoney(value) {
    const n = Number(value || 0);
    return n.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " zł";
  }

  function renderServicesTable() {
    const box = document.getElementById("admin-services-table-box");
    const counter = document.getElementById("admin-services-counter");

    if (!box) return;

    if (counter) {
      counter.textContent = `Usługi: ${state.filtered.length}`;
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
          Brak usług dla wybranych filtrów.
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
            <tr style="background:#f1f5f9;color:#274267;">
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Usługa</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Opis</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Cena</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Czas</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Status</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Akcja</th>
            </tr>
          </thead>

          <tbody>
            ${state.filtered.map((service) => `
              <tr style="border-bottom:1px solid #eef2f7;">
                <td style="padding:15px;">
                  <div style="
  font-weight:600;
  font-size:16px;
  color:#0f172a;
">
  ${escapeHtml(service.name || "-")}
</div>

                  <div style="
                    font-size:13px;
                    color:#64748b;
                    margin-top:4px;
                  ">
                    ID: ${escapeHtml(service.id)}
                  </div>
                </td>

                <td style="padding:15px;">
                  <div style="
                    max-width:460px;
                    color:#334155;
                    line-height:1.45;
                    white-space:normal;
                  ">
                    ${escapeHtml(service.description || "Brak opisu.")}
                  </div>
                </td>

                <td style="padding:15px;">
                  <div style="
  display:inline-flex;
  padding:8px 13px;
  border-radius:999px;
  background:#eff6ff;
  border:1px solid #bfdbfe;
  color:#1d4ed8;
  font-weight:500;
  white-space:nowrap;
">
  ${escapeHtml(service.price_label || "0,00 zł")}
</div>
                </td>

                <td style="padding:15px;color:#0f172a;font-weight:400;">
                  ${escapeHtml(service.default_duration_min || 0)} min
                </td>

                <td style="padding:15px;">
                  ${activeBadge(service.is_active)}
                </td>

                <td style="padding:15px;">
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button"
                      class="admin-edit-service-btn"
                      data-service-id="${escapeHtml(service.id)}"
                      style="
                        min-width:80px;
                        height:38px;
                        border:none;
                        border-radius:12px;
                        background:#1d4ed8;
                        color:white;
                        font-size:14px;
                        font-weight:500;
                        cursor:pointer;
                      ">
                      Edytuj
                    </button>

                    <button type="button"
                      class="admin-toggle-service-btn"
                      data-service-id="${escapeHtml(service.id)}"
                      data-active="${service.is_active ? "0" : "1"}"
                      style="
                        min-width:80px;
                        height:38px;
                        border:none;
                        border-radius:12px;
                        background:${service.is_active ? "#f59e0b" : "#16a34a"};
                        color:white;
                        font-size:14px;
                        font-weight:500;
                        cursor:pointer;
                      ">
                      ${service.is_active ? "Wyłącz" : "Włącz"}
                    </button>

                    <button type="button"
                      class="admin-delete-service-btn"
                      data-service-id="${escapeHtml(service.id)}"
                      style="
                        min-width:80px;
                        height:38px;
                        border:none;
                        border-radius:12px;
                        background:#ef4444;
                        color:white;
                        font-size:14px;
                        font-weight:500;
                        cursor:pointer;
                      ">
                      Usuń
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    box.querySelectorAll(".admin-edit-service-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.serviceId || 0);
        const service = state.services.find((x) => Number(x.id) === id);
        if (service) openServiceModal(service);
      });
    });

    box.querySelectorAll(".admin-toggle-service-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.serviceId || 0);
        const active = Number(btn.dataset.active || 0);
        setActive(id, active);
      });
    });

    box.querySelectorAll(".admin-delete-service-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.serviceId || 0);
        deleteService(id);
      });
    });
  }

  function modalRoot() {
    return document.getElementById("admin-service-modal-root");
  }

  function closeModal() {
    const root = modalRoot();
    if (root) root.innerHTML = "";
  }

  function modalWrap(content) {
    const root = modalRoot();
    if (!root) return;

    root.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        background:rgba(15,23,42,.45);
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:24px;
        box-sizing:border-box;
      ">
        <div style="
          width:min(720px, 95vw);
          max-height:90vh;
          overflow:auto;
          background:white;
          border-radius:20px;
          box-shadow:0 24px 70px rgba(0,0,0,.35);
          padding:24px;
          box-sizing:border-box;
          color:#0f172a;
          font-family:Arial, sans-serif;
        ">
          ${content}
        </div>
      </div>
    `;

    root.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });
  }

  function openServiceModal(service) {
    const isEdit = !!service;

    modalWrap(`
      <div style="
        display:flex;
        justify-content:space-between;
        gap:14px;
        align-items:flex-start;
        margin-bottom:18px;
      ">
        <div>
          <div style="
            font-family:Georgia, serif;
            font-size:28px;
            font-style:italic;
            font-weight:700;
            color:#102a56;
          ">
            ${isEdit ? "Edytuj usługę" : "Dodaj usługę"}
          </div>

          <div style="margin-top:6px;color:#64748b;">
            ${isEdit ? "Zmień nazwę, opis, cenę lub czas usługi." : "Dodaj nową usługę do cennika."}
          </div>
        </div>

        <button type="button" data-modal-close style="
          border:none;
          background:#f1f5f9;
          border-radius:12px;
          padding:10px 14px;
          font-weight:900;
          cursor:pointer;
        ">
          Zamknij
        </button>
      </div>

      <input id="service-id" type="hidden" value="${escapeHtml(service?.id || "")}">

      <div style="display:grid;grid-template-columns:1fr 160px 160px;gap:14px;margin-bottom:14px;">
        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">
            Nazwa usługi
          </label>

          <input id="service-name" value="${escapeHtml(service?.name || "")}" placeholder="np. Konsultacja internistyczna" style="
            width:100%;
            height:42px;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:0 12px;
            box-sizing:border-box;
          ">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">
            Cena
          </label>

          <input id="service-price" value="${escapeHtml(service?.price ?? "")}" placeholder="np. 150.00" style="
            width:100%;
            height:42px;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:0 12px;
            box-sizing:border-box;
          ">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">
            Czas min
          </label>

          <input id="service-duration" type="number" min="1" max="600" value="${escapeHtml(service?.default_duration_min || 30)}" style="
            width:100%;
            height:42px;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:0 12px;
            box-sizing:border-box;
          ">
        </div>
      </div>

      <div>
        <label style="display:block;font-weight:800;margin-bottom:6px;">
          Opis usługi
        </label>

        <textarea id="service-description" placeholder="Wpisz opis usługi..." style="
          width:100%;
          height:150px;
          border:1px solid #cbd5e1;
          border-radius:12px;
          padding:12px;
          resize:vertical;
          box-sizing:border-box;
          font-family:Arial, sans-serif;
          line-height:1.45;
        ">${escapeHtml(service?.description || "")}</textarea>
      </div>

      <label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:800;">
        <input id="service-is-active" type="checkbox" ${service ? (service.is_active ? "checked" : "") : "checked"}>
        Usługa aktywna w cenniku
      </label>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
        <button type="button" data-modal-close style="
          height:42px;
          border:none;
          border-radius:12px;
          background:#e2e8f0;
          color:#334155;
          font-weight:900;
          padding:0 18px;
          cursor:pointer;
        ">
          Anuluj
        </button>

        <button type="button" id="save-service-btn" style="
          height:42px;
          border:none;
          border-radius:12px;
          background:#1d4ed8;
          color:white;
          font-weight:900;
          padding:0 18px;
          cursor:pointer;
        ">
          ${isEdit ? "Zapisz zmiany" : "Dodaj usługę"}
        </button>
      </div>
    `);

    const save = document.getElementById("save-service-btn");
    if (save) {
      save.addEventListener("click", saveService);
    }
  }

  async function apiPost(payload) {
    const res = await fetch(API_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.ok) {
      throw new Error(data && data.message ? data.message : "Wystąpił błąd.");
    }

    return data;
  }

  async function saveService() {
    const id = Number(document.getElementById("service-id")?.value || 0);
    const name = document.getElementById("service-name")?.value || "";
    const description = document.getElementById("service-description")?.value || "";
    const price = document.getElementById("service-price")?.value || "";
    const duration = document.getElementById("service-duration")?.value || 30;
    const isActive = document.getElementById("service-is-active")?.checked ? 1 : 0;

    try {
      await apiPost({
        action: "save",
        id: id,
        name: name,
        description: description,
        price: price,
        default_duration_min: duration,
        is_active: isActive
      });

      closeModal();
      await loadServices();
    } catch (err) {
      alert(err.message || "Nie udało się zapisać usługi.");
    }
  }

  async function setActive(id, active) {
    if (!id) return;

    const msg = active ? "Włączyć tę usługę w cenniku?" : "Wyłączyć tę usługę w cenniku?";
    if (!confirm(msg)) return;

    try {
      await apiPost({
        action: "set_active",
        id: id,
        is_active: active
      });

      await loadServices();
    } catch (err) {
      alert(err.message || "Nie udało się zmienić statusu usługi.");
    }
  }

  async function deleteService(id) {
    if (!id) return;

    if (!confirm("Usunąć tę usługę? Jeśli jest używana w wizytach, zostanie tylko wyłączona.")) {
      return;
    }

    try {
      const data = await apiPost({
        action: "delete",
        id: id
      });

      if (data.message) {
        alert(data.message);
      }

      await loadServices();
    } catch (err) {
      alert(err.message || "Nie udało się usunąć usługi.");
    }
  }

  async function loadServices() {
    const box = document.getElementById("admin-services-table-box");

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
          Ładowanie usług...
        </div>
      `;
    }

    try {
      const data = await apiPost({ action: "list" });

      state.services = Array.isArray(data.services) ? data.services : [];
      state.filtered = state.services.slice();

      applyFilters();
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
            ${escapeHtml(err.message || "Błąd pobierania usług.")}
          </div>
        `;
      }
    }
  }

  function init() {
    renderShell();
    loadServices();
  }

  ready(init);
})();