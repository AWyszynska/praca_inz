(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/admin_panel_platnosci.php";

  const state = {
    payments: [],
    visits: [],
    filtered: [],
    stats: {},
    search: "",
    status: "",
    method: ""
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

    let frame = document.getElementById("admin-payments-created-frame");

    if (!frame) {
      frame = document.createElement("div");
      frame.id = "admin-payments-created-frame";
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

    let panel = document.getElementById("admin-payments-panel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "admin-payments-panel";
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

  function methodLabel(method) {
    const m = String(method || "").toUpperCase();

    if (m === "CASH") return "Gotówka";
    if (m === "CARD") return "Karta";
    if (m === "TRANSFER") return "Przelew";
    if (m === "BLIK") return "BLIK";

    return method || "-";
  }

  function statusLabel(status) {
    const s = String(status || "").toUpperCase();

    if (s === "PAID" || s === "ZAPLACONE" || s === "ZAPŁACONE" || s === "DONE" || s === "COMPLETED") {
      return "Zapłacone";
    }

    if (s === "PENDING" || s === "OCZEKUJE" || s === "UNPAID") {
      return "Oczekuje";
    }

    if (s === "CANCELLED" || s === "ANULOWANE") {
      return "Anulowane";
    }

    if (s === "REFUNDED") {
      return "Zwrot";
    }

    return status || "Brak statusu";
  }

  function statusBadge(status) {
    const s = String(status || "").toUpperCase();

    let bg = "#f1f5f9";
    let color = "#475569";
    let border = "#cbd5e1";

    if (s === "PAID" || s === "ZAPLACONE" || s === "ZAPŁACONE" || s === "DONE" || s === "COMPLETED") {
      bg = "#d9fbe6";
      color = "#166534";
      border = "#86efac";
    } else if (s === "PENDING" || s === "OCZEKUJE" || s === "UNPAID") {
      bg = "#fef3c7";
      color = "#92400e";
      border = "#fcd34d";
    } else if (s === "CANCELLED" || s === "ANULOWANE" || s === "REFUNDED") {
      bg = "#fee2e2";
      color = "#991b1b";
      border = "#fecaca";
    }

    return `
      <span style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:100px;
        padding:7px 12px;
        border-radius:999px;
        background:${bg};
        color:${color};
        border:1px solid ${border};
        font-weight:500;
        font-size:13px;
        white-space:nowrap;
      ">
        ${escapeHtml(statusLabel(status))}
      </span>
    `;
  }

  function formatMoney(value) {
    const n = Number(value || 0);

    return n.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " zł";
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
            Płatności
          </div>

          <div style="
            margin-top:8px;
            font-size:15px;
            color:#57708f;
          ">
            Lista płatności, rozliczenia wizyt oraz kontrola statusów płatności.
          </div>
        </div>

        <div style="display:flex;gap:10px;align-items:center;">
          <div id="admin-payments-counter" style="
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
            Płatności: 0
          </div>

          <button type="button" id="admin-add-payment-btn" style="
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
            Dodaj płatność
          </button>
        </div>
      </div>

      <div style="
        display:grid;
        grid-template-columns:1fr 170px 160px 140px;
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

          <input id="admin-payment-search" type="text" placeholder="ID płatności, ID wizyty, klient, lekarz, telefon..." style="
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

          <select id="admin-payment-status" style="
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
            <option value="PAID">Zapłacone</option>
            <option value="PENDING">Oczekuje</option>
            <option value="CANCELLED">Anulowane</option>
            <option value="REFUNDED">Zwrot</option>
          </select>
        </div>

        <div>
          <div style="
            font-size:14px;
            font-weight:800;
            color:#203b67;
            margin-bottom:8px;
          ">
            Metoda
          </div>

          <select id="admin-payment-method" style="
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
            <option value="CASH">Gotówka</option>
            <option value="CARD">Karta</option>
            <option value="TRANSFER">Przelew</option>
            <option value="BLIK">BLIK</option>
          </select>
        </div>

        <button type="button" id="admin-payment-clear" style="
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

      <div id="admin-payments-summary"></div>
      <div id="admin-payments-table-box"></div>
      <div id="admin-payment-modal-root"></div>
    `;

    bindShellEvents();
  }

  function bindShellEvents() {
    const search = document.getElementById("admin-payment-search");
    const status = document.getElementById("admin-payment-status");
    const method = document.getElementById("admin-payment-method");
    const clear = document.getElementById("admin-payment-clear");
    const add = document.getElementById("admin-add-payment-btn");

    if (search) search.addEventListener("input", applyFilters);
    if (status) status.addEventListener("change", applyFilters);
    if (method) method.addEventListener("change", applyFilters);

    if (clear) {
      clear.addEventListener("click", () => {
        if (search) search.value = "";
        if (status) status.value = "";
        if (method) method.value = "";
        applyFilters();
      });
    }

    if (add) {
      add.addEventListener("click", () => openPaymentModal(null));
    }
  }

  function canonicalStatus(status) {
    const s = String(status || "").toUpperCase();

    if (s === "ZAPLACONE" || s === "ZAPŁACONE" || s === "DONE" || s === "COMPLETED") return "PAID";
    if (s === "OCZEKUJE" || s === "UNPAID") return "PENDING";
    if (s === "ANULOWANE") return "CANCELLED";

    return s;
  }

  function applyFilters() {
    const searchInput = document.getElementById("admin-payment-search");
    const statusInput = document.getElementById("admin-payment-status");
    const methodInput = document.getElementById("admin-payment-method");

    state.search = normalize(searchInput ? searchInput.value : "");
    state.status = statusInput ? statusInput.value : "";
    state.method = methodInput ? methodInput.value : "";

    state.filtered = state.payments.filter((payment) => {
      const haystack = normalize([
        payment.id,
        payment.visit_id,
        payment.amount_label,
        payment.method,
        methodLabel(payment.method),
        payment.status,
        statusLabel(payment.status),
        payment.paid_at,
        payment.visit_datetime,
        payment.client_name,
        payment.client_email,
        payment.client_phone,
        payment.employee_name
      ].join(" "));

      const okSearch = !state.search || haystack.includes(state.search);
      const okStatus = !state.status || canonicalStatus(payment.status) === state.status;
      const okMethod = !state.method || String(payment.method || "").toUpperCase() === state.method;

      return okSearch && okStatus && okMethod;
    });

    renderSummary();
    renderPaymentsTable();
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

  function renderSummary() {
    const box = document.getElementById("admin-payments-summary");
    if (!box) return;

    const st = state.stats || {};

    box.innerHTML = `
      <div style="
        display:grid;
        grid-template-columns:repeat(4, 1fr);
        gap:12px;
      ">
        ${summaryCard("Suma zapłacona", st.total_paid_label || "0,00 zł", "#166534")}
        ${summaryCard("Zapłacone", st.paid || 0, "#1d4ed8")}
        ${summaryCard("Oczekujące", st.pending || 0, "#92400e")}
        ${summaryCard("Anulowane / zwroty", st.cancelled || 0, "#991b1b")}
      </div>
    `;
  }

  function renderPaymentsTable() {
    const box = document.getElementById("admin-payments-table-box");
    const counter = document.getElementById("admin-payments-counter");

    if (!box) return;

    if (counter) {
      counter.textContent = `Płatności: ${state.filtered.length}`;
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
          Brak płatności dla wybranych filtrów.
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
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Płatność</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Wizyta</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Klient</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Lekarz</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Kwota</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Metoda</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Status</th>
              <th style="padding:15px;text-align:left;border-bottom:1px solid #d7e0ea;">Akcja</th>
            </tr>
          </thead>

          <tbody>
            ${state.filtered.map((payment) => `
              <tr style="border-bottom:1px solid #eef2f7;">
                <td style="padding:15px;">
                  <div style="font-weight:600;font-size:16px;color:#0f172a;">
                    #${escapeHtml(payment.id)}
                  </div>

                  <div style="font-size:13px;color:#64748b;margin-top:4px;">
                    ${escapeHtml(payment.paid_at || "-")}
                  </div>
                </td>

                <td style="padding:15px;">
                  <div style="font-weight:500;color:#0f172a;">
                    Wizyta #${escapeHtml(payment.visit_id || "-")}
                  </div>

                  <div style="font-size:13px;color:#64748b;margin-top:4px;">
                    ${escapeHtml(payment.visit_datetime || "-")}
                  </div>
                </td>

                <td style="padding:15px;">
                  <div style="font-weight:500;color:#0f172a;">
                    ${escapeHtml(payment.client_name || "-")}
                  </div>

                  <div style="font-size:13px;color:#64748b;margin-top:4px;">
                    ${escapeHtml(payment.client_phone || payment.client_email || "-")}
                  </div>
                </td>

                <td style="padding:15px;color:#334155;">
                  ${escapeHtml(payment.employee_name || "-")}
                </td>

                <td style="padding:15px;">
                  <span style="
                    display:inline-flex;
                    padding:8px 13px;
                    border-radius:999px;
                    background:#eff6ff;
                    border:1px solid #bfdbfe;
                    color:#1d4ed8;
                    font-weight:500;
                    white-space:nowrap;
                  ">
                    ${escapeHtml(payment.amount_label || "0,00 zł")}
                  </span>
                </td>

                <td style="padding:15px;font-weight:800;color:#0f172a;">
                  ${escapeHtml(methodLabel(payment.method))}
                </td>

                <td style="padding:15px;">
                  ${statusBadge(payment.status)}
                </td>

                <td style="padding:15px;">
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button"
                      class="admin-edit-payment-btn"
                      data-payment-id="${escapeHtml(payment.id)}"
                      style="
                        min-width:78px;
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
                      class="admin-paid-payment-btn"
                      data-payment-id="${escapeHtml(payment.id)}"
                      style="
                        min-width:88px;
                        height:38px;
                        border:none;
                        border-radius:12px;
                        background:#16a34a;
                        color:white;
                        font-size:14px;
                        font-weight:500;
                        cursor:pointer;
                      ">
                      Zapłacone
                    </button>

                    <button type="button"
                      class="admin-delete-payment-btn"
                      data-payment-id="${escapeHtml(payment.id)}"
                      style="
                        min-width:78px;
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

    box.querySelectorAll(".admin-edit-payment-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.paymentId || 0);
        const payment = state.payments.find((x) => Number(x.id) === id);
        if (payment) openPaymentModal(payment);
      });
    });

    box.querySelectorAll(".admin-paid-payment-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.paymentId || 0);
        setPaymentStatus(id, "PAID");
      });
    });

    box.querySelectorAll(".admin-delete-payment-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.paymentId || 0);
        deletePayment(id);
      });
    });
  }

  function modalRoot() {
    return document.getElementById("admin-payment-modal-root");
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
          width:min(780px, 95vw);
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

  function toInputDateTime(value) {
    if (!value) return "";

    const raw = String(value);
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);

    if (m) {
      return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
    }

    return "";
  }

  function openPaymentModal(payment) {
    const isEdit = !!payment;

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
            ${isEdit ? "Edytuj płatność" : "Dodaj płatność"}
          </div>

          <div style="margin-top:6px;color:#64748b;">
            ${isEdit ? "Zmień kwotę, metodę lub status płatności." : "Dodaj nową płatność do wybranej wizyty."}
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

      <input id="payment-id" type="hidden" value="${escapeHtml(payment?.id || "")}">

      <div style="display:grid;grid-template-columns:1fr 160px;gap:14px;margin-bottom:14px;">
        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">
            Wizyta
          </label>

          <select id="payment-visit-id" style="
            width:100%;
            height:42px;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:0 12px;
            box-sizing:border-box;
            background:white;
          ">
            <option value="">Wybierz wizytę</option>
            ${state.visits.map((visit) => `
              <option value="${escapeHtml(visit.id)}" data-price="${escapeHtml(visit.price || 0)}" ${String(payment?.visit_id || "") === String(visit.id) ? "selected" : ""}>
                ${escapeHtml(visit.label)}
              </option>
            `).join("")}
          </select>
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">
            Kwota
          </label>

          <input id="payment-amount" value="${escapeHtml(payment?.amount ?? "")}" placeholder="np. 150.00" style="
            width:100%;
            height:42px;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:0 12px;
            box-sizing:border-box;
          ">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">
        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">
            Metoda
          </label>

          <select id="payment-method" style="
            width:100%;
            height:42px;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:0 12px;
            box-sizing:border-box;
            background:white;
          ">
            <option value="CASH" ${String(payment?.method || "").toUpperCase() === "CASH" ? "selected" : ""}>Gotówka</option>
            <option value="CARD" ${String(payment?.method || "").toUpperCase() === "CARD" ? "selected" : ""}>Karta</option>
            <option value="TRANSFER" ${String(payment?.method || "").toUpperCase() === "TRANSFER" ? "selected" : ""}>Przelew</option>
            <option value="BLIK" ${String(payment?.method || "").toUpperCase() === "BLIK" ? "selected" : ""}>BLIK</option>
          </select>
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">
            Status
          </label>

          <select id="payment-status" style="
            width:100%;
            height:42px;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:0 12px;
            box-sizing:border-box;
            background:white;
          ">
            <option value="PAID" ${canonicalStatus(payment?.status || "PENDING") === "PAID" ? "selected" : ""}>Zapłacone</option>
            <option value="PENDING" ${canonicalStatus(payment?.status || "PENDING") === "PENDING" ? "selected" : ""}>Oczekuje</option>
            <option value="CANCELLED" ${canonicalStatus(payment?.status || "") === "CANCELLED" ? "selected" : ""}>Anulowane</option>
            <option value="REFUNDED" ${canonicalStatus(payment?.status || "") === "REFUNDED" ? "selected" : ""}>Zwrot</option>
          </select>
        </div>

        <div>
          <label style="display:block;font-weight:800;margin-bottom:6px;">
            Data płatności
          </label>

          <input id="payment-paid-at" type="datetime-local" value="${escapeHtml(toInputDateTime(payment?.paid_at_raw || ""))}" style="
            width:100%;
            height:42px;
            border:1px solid #cbd5e1;
            border-radius:12px;
            padding:0 12px;
            box-sizing:border-box;
          ">
        </div>
      </div>

      <div style="
        background:#f8fafc;
        border:1px solid #e2e8f0;
        border-radius:14px;
        padding:12px;
        color:#64748b;
        font-size:13px;
        line-height:1.45;
      ">
        Przy dodawaniu płatności możesz wybrać wizytę i wpisać kwotę ręcznie. Jeżeli wizyta ma cenę, po wyborze wizyty kwota może uzupełnić się automatycznie.
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

        <button type="button" id="save-payment-btn" style="
          height:42px;
          border:none;
          border-radius:12px;
          background:#1d4ed8;
          color:white;
          font-weight:900;
          padding:0 18px;
          cursor:pointer;
        ">
          ${isEdit ? "Zapisz zmiany" : "Dodaj płatność"}
        </button>
      </div>
    `);

    const visitSelect = document.getElementById("payment-visit-id");
    const amountInput = document.getElementById("payment-amount");

    if (visitSelect && amountInput && !isEdit) {
      visitSelect.addEventListener("change", () => {
        const opt = visitSelect.options[visitSelect.selectedIndex];
        const price = Number(opt?.dataset?.price || 0);

        if (price > 0) {
          amountInput.value = price.toFixed(2);
        }
      });
    }

    const paidAt = document.getElementById("payment-paid-at");
    if (paidAt && !isEdit) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      paidAt.value = now.toISOString().slice(0, 16);
    }

    const save = document.getElementById("save-payment-btn");
    if (save) {
      save.addEventListener("click", savePayment);
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

  async function savePayment() {
    const id = Number(document.getElementById("payment-id")?.value || 0);
    const visitId = Number(document.getElementById("payment-visit-id")?.value || 0);
    const amount = document.getElementById("payment-amount")?.value || "";
    const method = document.getElementById("payment-method")?.value || "CASH";
    const status = document.getElementById("payment-status")?.value || "PENDING";
    const paidAt = document.getElementById("payment-paid-at")?.value || "";

    try {
      await apiPost({
        action: "save",
        id: id,
        visit_id: visitId,
        amount: amount,
        method: method,
        status: status,
        paid_at: paidAt
      });

      closeModal();
      await loadPayments();
    } catch (err) {
      alert(err.message || "Nie udało się zapisać płatności.");
    }
  }

  async function setPaymentStatus(id, status) {
    if (!id) return;

    try {
      await apiPost({
        action: "set_status",
        id: id,
        status: status
      });

      await loadPayments();
    } catch (err) {
      alert(err.message || "Nie udało się zmienić statusu płatności.");
    }
  }

  async function deletePayment(id) {
    if (!id) return;

    if (!confirm("Usunąć tę płatność?")) return;

    try {
      await apiPost({
        action: "delete",
        id: id
      });

      await loadPayments();
    } catch (err) {
      alert(err.message || "Nie udało się usunąć płatności.");
    }
  }

  async function loadPayments() {
    const box = document.getElementById("admin-payments-table-box");

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
          Ładowanie płatności...
        </div>
      `;
    }

    try {
      const data = await apiPost({ action: "list" });

      state.payments = Array.isArray(data.payments) ? data.payments : [];
      state.visits = Array.isArray(data.visits) ? data.visits : [];
      state.stats = data.stats || {};
      state.filtered = state.payments.slice();

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
            ${escapeHtml(err.message || "Błąd pobierania płatności.")}
          </div>
        `;
      }
    }
  }

  function init() {
    renderShell();
    loadPayments();
  }

  ready(init);
})();