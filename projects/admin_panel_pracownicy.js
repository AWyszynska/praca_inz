(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/admin_panel_pracownicy.php";

  const state = {
    employees: [],
    filtered: [],
    search: "",
    role: "",
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

    let frame = document.getElementById("admin-employees-created-frame");

    if (!frame) {
      frame = document.createElement("div");
      frame.id = "admin-employees-created-frame";
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

    let panel = document.getElementById("admin-employees-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "admin-employees-panel";
      frame.appendChild(panel);
    }

    panel.style.cssText = `
      position:relative;
      width:100%;
      min-height:680px;
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

  function roleLabel(role) {
    const r = String(role || "").toLowerCase();

    if (r === "doctor") return "Lekarz";
    if (r === "admin") return "Administrator";
    if (r === "worker") return "Pracownik";
    if (r === "reception") return "Recepcja";

    return role || "-";
  }
function shortText(value, limit = 170) {
  const text = String(value ?? "").trim();

  if (text === "") {
    return "Brak opisu.";
  }

  if (text.length <= limit) {
    return text;
  }

  return text.slice(0, limit).trimEnd() + "...";
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
        ${isActive ? "Aktywny" : "Nieaktywny"}
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
            Pracownicy
          </div>

          <div style="
            margin-top:8px;
            font-size:15px;
            color:#57708f;
          ">
            Lista pracowników, dane kontaktowe oraz opisy profili lekarzy.
          </div>
        </div>

        <div style="display:flex;gap:10px;align-items:center;">
          <div id="admin-employees-counter" style="
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
            Pracownicy: 0
          </div>

          <button type="button" id="admin-add-employee-btn" style="
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
            Dodaj pracownika
          </button>
        </div>
      </div>

      <div style="
        display:grid;
        grid-template-columns:1fr 190px 170px 140px;
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

          <input id="admin-employee-search" type="text" placeholder="Imię, nazwisko, e-mail, telefon, opis..." style="
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
            Rola
          </div>

          <select id="admin-employee-role" style="
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
            <option value="doctor">Lekarz</option>
            <option value="admin">Administrator</option>
            <option value="worker">Pracownik</option>
            <option value="reception">Recepcja</option>
          </select>
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

          <select id="admin-employee-active" style="
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
            <option value="1">Aktywni</option>
            <option value="0">Nieaktywni</option>
          </select>
        </div>

        <button type="button" id="admin-employee-clear" style="
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

      <div id="admin-employees-table-box"></div>
      <div id="admin-employee-modal-root"></div>
    `;

    bindShellEvents();
  }

  function bindShellEvents() {
    const search = document.getElementById("admin-employee-search");
    const role = document.getElementById("admin-employee-role");
    const active = document.getElementById("admin-employee-active");
    const clear = document.getElementById("admin-employee-clear");
    const add = document.getElementById("admin-add-employee-btn");

    if (search) search.addEventListener("input", applyFilters);
    if (role) role.addEventListener("change", applyFilters);
    if (active) active.addEventListener("change", applyFilters);

    if (clear) {
      clear.addEventListener("click", () => {
        if (search) search.value = "";
        if (role) role.value = "";
        if (active) active.value = "";
        applyFilters();
      });
    }

    if (add) {
      add.addEventListener("click", openAddModal);
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById("admin-employee-search");
    const roleInput = document.getElementById("admin-employee-role");
    const activeInput = document.getElementById("admin-employee-active");

    state.search = normalize(searchInput ? searchInput.value : "");
    state.role = roleInput ? roleInput.value : "";
    state.active = activeInput ? activeInput.value : "";

    state.filtered = state.employees.filter((emp) => {
      const haystack = normalize([
        emp.id,
        emp.role,
        emp.name,
        emp.first_name,
        emp.last_name,
        emp.email,
        emp.phone,
        emp.birth_date,
        emp.hire_date,
        emp.file_name,
        emp.alt_text,
        emp.description
      ].join(" "));

      const okSearch = !state.search || haystack.includes(state.search);
      const okRole = !state.role || String(emp.role || "").toLowerCase() === state.role;
      const okActive = state.active === "" || String(emp.is_active ? 1 : 0) === state.active;

      return okSearch && okRole && okActive;
    });

    renderEmployeesTable();
  }

  function renderEmployeesTable() {
    const box = document.getElementById("admin-employees-table-box");
    const counter = document.getElementById("admin-employees-counter");

    if (!box) return;

    if (counter) {
      counter.textContent = `Pracownicy: ${state.filtered.length}`;
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
          Brak pracowników dla wybranych filtrów.
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
          min-width:1180px;
          font-size:14px;
        ">
          <thead>
            <tr style="background:#f1f5f9;color:#274267;">
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Pracownik</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Kontakt</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Rola</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Daty</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Opis</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Zdjęcie</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Status</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Akcja</th>
            </tr>
          </thead>

          <tbody>
            ${state.filtered.map((emp) => `
              <tr style="border-bottom:1px solid #eef2f7;">
                <td style="padding:15px;">
                  <div style="font-weight:900;font-size:16px;color:#0f172a;">
                    ${escapeHtml(emp.name)}
                  </div>
                  <div style="font-size:13px;color:#64748b;margin-top:4px;">
                    ID: ${escapeHtml(emp.id)}
                  </div>
                </td>

                <td style="padding:15px;">
                  <div style="font-size:14px;color:#0f172a;">
                    ${escapeHtml(emp.email || "-")}
                  </div>
                  <div style="font-size:13px;color:#64748b;margin-top:4px;">
                    ${escapeHtml(emp.phone || "-")}
                  </div>
                </td>

                <td style="padding:15px;font-weight:800;color:#0f172a;">
                  ${escapeHtml(roleLabel(emp.role))}
                </td>

                <td style="padding:15px;color:#334155;">
                  <div>Ur.: ${escapeHtml(emp.birth_date || "-")}</div>
                  <div style="margin-top:4px;">Zatr.: ${escapeHtml(emp.hire_date || "-")}</div>
                </td>

                <td style="padding:15px;">
                  <div style="
                    max-width:300px;
                    color:#334155;
                    line-height:1.45;
                    white-space:normal;
                  ">
                    ${escapeHtml(shortText(emp.description, 120))}
                  </div>
                  <div style="
                    margin-top:5px;
                    font-size:12px;
                    color:#64748b;
                  ">
                    ${escapeHtml(emp.alt_text || "")}
                  </div>
                </td>

                <td style="padding:15px;color:#334155;">
                  ${escapeHtml(emp.file_name || "-")}
                </td>

                <td style="padding:15px;">
                  ${activeBadge(emp.is_active)}
                </td>

                <td style="padding:15px;">
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button"
                      class="admin-edit-info-btn"
                      data-employee-id="${escapeHtml(emp.id)}"
                      style="
                        min-width:90px;
                        height:38px;
                        border:none;
                        border-radius:12px;
                        background:#1d4ed8;
                        color:white;
                        font-size:14px;
                        font-weight:500;
                        cursor:pointer;
                      ">
                      Edytuj opis
                    </button>

                    <button type="button"
                      class="admin-toggle-active-btn"
                      data-employee-id="${escapeHtml(emp.id)}"
                      data-active="${emp.is_active ? "0" : "1"}"
                      style="
                        min-width:90px;
                        height:38px;
                        border:none;
                        border-radius:12px;
                        background:${emp.is_active ? "#ef4444" : "#16a34a"};
                        color:white;
                        font-size:14px;
                        font-weight:500;
                        cursor:pointer;
                      ">
                      ${emp.is_active ? "Wyłącz" : "Włącz"}
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    box.querySelectorAll(".admin-edit-info-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.employeeId || 0);
        const emp = state.employees.find((x) => Number(x.id) === id);
        if (emp) openEditInfoModal(emp);
      });
    });

    box.querySelectorAll(".admin-toggle-active-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.employeeId || 0);
        const active = Number(btn.dataset.active || 0);
        setActive(id, active);
      });
    });
  }

  function modalRoot() {
    return document.getElementById("admin-employee-modal-root");
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
          width:min(760px, 95vw);
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

    const cancel = root.querySelector("[data-modal-close]");
    if (cancel) cancel.addEventListener("click", closeModal);
  }

  function openEditInfoModal(emp) {
    modalWrap(`
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:18px;">
        <div>
          <div style="
            font-family:Georgia, serif;
            font-size:28px;
            font-style:italic;
            font-weight:700;
            color:#102a56;
          ">
            Edytuj opis
          </div>
          <div style="margin-top:6px;color:#64748b;">
            ${escapeHtml(emp.name)} • ID: ${escapeHtml(emp.id)}
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

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Nazwa pliku zdjęcia</label>
          <input id="edit-file-name" value="${escapeHtml(emp.file_name || "")}" placeholder="np. vet_anna.png" style="
            width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;
          ">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Tekst alternatywny</label>
          <input id="edit-alt-text" value="${escapeHtml(emp.alt_text || "")}" placeholder="np. Anna Nowak – lekarka weterynarii" style="
            width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;
          ">
        </div>
      </div>

      <div>
        <label style="display:block;font-weight:800;margin-bottom:6px;">Opis pracownika</label>
        <textarea id="edit-description" placeholder="Wpisz opis pracownika..." style="
          width:100%;
          height:170px;
          border:1px solid #cbd5e1;
          border-radius:12px;
          padding:12px;
          resize:vertical;
          box-sizing:border-box;
          font-family:Arial, sans-serif;
          line-height:1.45;
        ">${escapeHtml(emp.description || "")}</textarea>
      </div>

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

        <button type="button" id="save-employee-info" style="
          height:42px;
          border:none;
          border-radius:12px;
          background:#1d4ed8;
          color:white;
          font-weight:900;
          padding:0 18px;
          cursor:pointer;
        ">
          Zapisz opis
        </button>
      </div>
    `);

    const save = document.getElementById("save-employee-info");
    if (save) {
      save.addEventListener("click", () => {
        updateInfo(emp.id);
      });
    }
  }

  function openAddModal() {
    modalWrap(`
      <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:18px;">
        <div>
          <div style="
            font-family:Georgia, serif;
            font-size:28px;
            font-style:italic;
            font-weight:700;
            color:#102a56;
          ">
            Dodaj pracownika
          </div>
          <div style="margin-top:6px;color:#64748b;">
            Dodaj nowego lekarza lub pracownika do systemu.
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

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Rola</label>
          <select id="add-role" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;background:white;">
            <option value="doctor">Lekarz</option>
            <option value="admin">Administrator</option>
            <option value="worker">Pracownik</option>
            <option value="reception">Recepcja</option>
          </select>
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Hasło tymczasowe</label>
          <input id="add-password" type="text" value="VetMell123!" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Imię</label>
          <input id="add-first-name" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Nazwisko</label>
          <input id="add-last-name" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Data urodzenia</label>
          <input id="add-birth-date" type="date" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Data zatrudnienia</label>
          <input id="add-hire-date" type="date" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">E-mail</label>
          <input id="add-email" type="email" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Telefon</label>
          <input id="add-phone" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Nazwa pliku zdjęcia</label>
          <input id="add-file-name" placeholder="np. vet_anna.png" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">Tekst alternatywny</label>
          <input id="add-alt-text" placeholder="np. Anna Nowak – lekarka weterynarii" style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;box-sizing:border-box;">
        </div>
      </div>

      <div style="margin-top:14px;">
        <label style="display:block;font-weight:800;margin-bottom:6px;">Opis</label>
        <textarea id="add-description" style="
          width:100%;
          height:120px;
          border:1px solid #cbd5e1;
          border-radius:12px;
          padding:12px;
          resize:vertical;
          box-sizing:border-box;
          font-family:Arial, sans-serif;
        "></textarea>
      </div>

      <label style="display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:500;">
        <input id="add-is-active" type="checkbox" checked>
        Aktywny pracownik
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

        <button type="button" id="save-new-employee" style="
          height:42px;
          border:none;
          border-radius:12px;
          background:#1d4ed8;
          color:white;
          font-weight:900;
          padding:0 18px;
          cursor:pointer;
        ">
          Dodaj pracownika
        </button>
      </div>
    `);

    const today = new Date().toISOString().slice(0, 10);
    const hireDate = document.getElementById("add-hire-date");
    if (hireDate) hireDate.value = today;

    const save = document.getElementById("save-new-employee");
    if (save) {
      save.addEventListener("click", addEmployee);
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

  async function updateInfo(employeeId) {
    const fileName = document.getElementById("edit-file-name")?.value || "";
    const altText = document.getElementById("edit-alt-text")?.value || "";
    const description = document.getElementById("edit-description")?.value || "";

    try {
      await apiPost({
        action: "update_info",
        employee_id: employeeId,
        file_name: fileName,
        alt_text: altText,
        description: description
      });

      closeModal();
      await loadEmployees();
    } catch (err) {
      alert(err.message || "Nie udało się zapisać opisu.");
    }
  }

  async function addEmployee() {
    const payload = {
      action: "add",
      role: document.getElementById("add-role")?.value || "doctor",
      first_name: document.getElementById("add-first-name")?.value || "",
      last_name: document.getElementById("add-last-name")?.value || "",
      birth_date: document.getElementById("add-birth-date")?.value || "",
      hire_date: document.getElementById("add-hire-date")?.value || "",
      email: document.getElementById("add-email")?.value || "",
      phone: document.getElementById("add-phone")?.value || "",
      password: document.getElementById("add-password")?.value || "",
      file_name: document.getElementById("add-file-name")?.value || "",
      alt_text: document.getElementById("add-alt-text")?.value || "",
      description: document.getElementById("add-description")?.value || "",
      is_active: document.getElementById("add-is-active")?.checked ? 1 : 0
    };

    try {
      await apiPost(payload);
      closeModal();
      await loadEmployees();
    } catch (err) {
      alert(err.message || "Nie udało się dodać pracownika.");
    }
  }

  async function setActive(employeeId, active) {
    const msg = active ? "Włączyć tego pracownika?" : "Wyłączyć tego pracownika?";

    if (!confirm(msg)) return;

    try {
      await apiPost({
        action: "set_active",
        employee_id: employeeId,
        is_active: active
      });

      await loadEmployees();
    } catch (err) {
      alert(err.message || "Nie udało się zmienić statusu.");
    }
  }

  async function loadEmployees() {
    const box = document.getElementById("admin-employees-table-box");

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
          Ładowanie pracowników...
        </div>
      `;
    }

    try {
      const data = await apiPost({ action: "list" });

      state.employees = Array.isArray(data.employees) ? data.employees : [];
      state.filtered = state.employees.slice();

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
            ${escapeHtml(err.message || "Błąd pobierania pracowników.")}
          </div>
        `;
      }
    }
  }

  function init() {
    renderShell();
    loadEmployees();
  }

  ready(init);
})();