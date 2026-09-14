
(function () {
  if (window.__vetmellMojTopbarLoaded === true) return;
  window.__vetmellMojTopbarLoaded = true;

  const script = document.createElement("script");
  script.src = "/praca_inz/projects/pulpit_pacjent_moj_topbar.js?v=" + Date.now();
  script.defer = true;
  document.head.appendChild(script);
})();

(function () {
  const PAYMENT_BLOCK_ID = "blk_1781875913625";
  const STYLE_ID = "patient-payments-style-v1";

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function findPaymentBlock() {
    const safeId = cssEscape(PAYMENT_BLOCK_ID);

    return (
      document.getElementById(PAYMENT_BLOCK_ID) ||
      $(`[data-id="${safeId}"]`) ||
      $(`.page-element[data-id="${safeId}"]`) ||
      $(`.canvas-element[data-id="${safeId}"]`)
    );
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function statusBucket(status) {
    const s = normalizeText(status);

    if (
      s.includes("zaplac") ||
      s.includes("paid") ||
      s.includes("success") ||
      s.includes("completed") ||
      s.includes("confirmed")
    ) {
      return "paid";
    }

    if (
      s.includes("oczek") ||
      s.includes("pending") ||
      s.includes("unpaid") ||
      s.includes("new") ||
      s.includes("created")
    ) {
      return "pending";
    }

    if (
      s.includes("anul") ||
      s.includes("cancel") ||
      s.includes("refund") ||
      s.includes("zwrot")
    ) {
      return "cancelled";
    }

    return "other";
  }

  function statusLabel(status) {
    const bucket = statusBucket(status);

    if (bucket === "paid") return "Zapłacone";
    if (bucket === "pending") return "Oczekujące";
    if (bucket === "cancelled") return "Anulowane / zwrot";

    return status ? String(status) : "Brak statusu";
  }

  function methodLabel(method) {
    const m = normalizeText(method);

    if (!m || m === "-") return "Nie podano";
    if (m.includes("card") || m.includes("karta")) return "Karta";
    if (m.includes("cash") || m.includes("gotow")) return "Gotówka";
    if (m.includes("transfer") || m.includes("przelew")) return "Przelew";
    if (m.includes("blik")) return "BLIK";
    if (m.includes("online")) return "Online";

    return String(method);
  }

  function money(value) {
    const num = Number(value);

    if (!Number.isFinite(num)) {
      return "-";
    }

    return num.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " zł";
  }

  function formatDate(value) {
    const raw = String(value || "").trim();

    if (!raw) return "-";

    const normalized = raw.replace(" ", "T");
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return raw.substring(0, 16);
    }

    return date.toLocaleString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      .ppay-shell {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 26px 30px;
        font-family: Arial, Helvetica, sans-serif;
        color: #0b2c63;
        overflow: hidden;
      }

      .ppay-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .ppay-title {
        margin: 0;
        font-size: 31px;
        line-height: 1.1;
        font-weight: 700;
        font-style: italic;
        font-family: Georgia, "Times New Roman", serif;
        color: #08285c;
      }

      .ppay-subtitle {
        margin: 6px 0 0;
        font-size: 15px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #486489;
      }

      .ppay-counter {
        min-width: 135px;
        text-align: center;
        padding: 12px 18px;
        border-radius: 999px;
        background: #eaf3ff;
        color: #1f56d8;
        border: 1px solid #bad5ff;
        font-weight: 500;
        font-size: 18px;
        font-family: Arial, Helvetica, sans-serif;
        box-sizing: border-box;
      }

      .ppay-filters {
        display: grid;
        grid-template-columns: 1fr 170px 170px;
        gap: 12px;
        align-items: end;
        padding: 16px 18px;
        border-radius: 18px;
        background: #f8fbff;
        border: 1px solid #dbe8fb;
        margin-bottom: 14px;
        box-sizing: border-box;
      }

      .ppay-field label {
        display: block;
        margin-bottom: 7px;
        font-size: 13px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .ppay-input,
      .ppay-select {
        width: 100%;
        height: 44px;
        box-sizing: border-box;
        border-radius: 13px;
        border: 1px solid #b9cce8;
        background: #ffffff;
        color: #08285c;
        font-size: 14px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        padding: 0 14px;
        outline: none;
      }

      .ppay-input:focus,
      .ppay-select:focus {
        border-color: #1f56d8;
        box-shadow: 0 0 0 4px rgba(31, 86, 216, 0.12);
      }

      .ppay-stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 14px;
      }

      .ppay-stat {
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid #dbe4f2;
        background: #ffffff;
        box-sizing: border-box;
      }

      .ppay-stat-label {
        display: block;
        color: #617590;
        font-size: 12px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        letter-spacing: .4px;
        text-transform: uppercase;
        margin-bottom: 5px;
      }

      .ppay-stat-value {
        display: block;
        color: #1f56d8;
        font-size: 24px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.1;
      }

      .ppay-stat-value.green {
        color: #087640;
      }

      .ppay-stat-value.orange {
        color: #9a4b00;
      }

      .ppay-stat-value.red {
        color: #991b1b;
      }

      .ppay-list {
        height: calc(100% - 238px);
        overflow-y: auto;
        padding-right: 10px;
        box-sizing: border-box;
      }

      .ppay-list::-webkit-scrollbar {
        width: 10px;
      }

      .ppay-list::-webkit-scrollbar-track {
        background: rgba(203, 213, 225, 0.35);
        border-radius: 999px;
      }

      .ppay-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.45);
        border-radius: 999px;
      }

      .ppay-card {
        display: grid;
        grid-template-columns: 135px 1fr 145px 145px 145px;
        gap: 14px;
        align-items: center;
        padding: 16px 18px;
        margin-bottom: 12px;
        border-radius: 18px;
        background: #ffffff;
        border: 1px solid #d9e6f8;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
      }

      .ppay-main {
        min-width: 0;
      }

      .ppay-id {
        font-size: 17px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .ppay-small {
        margin-top: 4px;
        font-size: 13px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #637999;
      }

      .ppay-visit {
        font-size: 15px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .ppay-muted {
        margin-top: 4px;
        font-size: 13px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #637999;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ppay-amount {
        justify-self: start;
        padding: 10px 15px;
        border-radius: 999px;
        background: #eaf3ff;
        border: 1px solid #bad5ff;
        color: #1f56d8;
        font-weight: 500;
        font-size: 15px;
        font-family: Arial, Helvetica, sans-serif;
        white-space: nowrap;
      }

      .ppay-method {
        font-size: 14px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .ppay-badge {
        justify-self: start;
        padding: 9px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        white-space: nowrap;
      }

      .ppay-badge.paid {
        background: #dcfce7;
        color: #13723c;
        border: 1px solid #91e5b2;
      }

      .ppay-badge.pending {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
      }

      .ppay-badge.cancelled {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .ppay-badge.other {
        background: #f1f5f9;
        color: #334155;
        border: 1px solid #d8e0ea;
      }

      .ppay-empty,
      .ppay-loading,
      .ppay-error {
        height: calc(100% - 238px);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border: 1px dashed #cbd5e1;
        border-radius: 18px;
        background: #f8fbff;
        color: #526b8e;
        font-size: 16px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.45;
        padding: 28px;
        box-sizing: border-box;
      }

      .ppay-error {
        color: #991b1b;
        background: #fff1f2;
        border-color: #fecdd3;
      }

      @media (max-width: 950px) {
        .ppay-filters {
          grid-template-columns: 1fr;
        }

        .ppay-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ppay-card {
          grid-template-columns: 1fr;
          align-items: start;
        }

        .ppay-list,
        .ppay-empty,
        .ppay-loading,
        .ppay-error {
          height: calc(100% - 330px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getStats(items) {
    let paidCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let toPay = 0;

    items.forEach(function (item) {
      const bucket = statusBucket(item.status);
      const amount = Number(item.amount);

      if (bucket === "paid") {
        paidCount++;
      } else if (bucket === "pending") {
        pendingCount++;

        if (Number.isFinite(amount)) {
          toPay += amount;
        }
      } else if (bucket === "cancelled") {
        cancelledCount++;
      }
    });

    return {
      paidCount,
      pendingCount,
      cancelledCount,
      toPay
    };
  }

  function baseLayout(innerHtml, count, items) {
    const stats = getStats(items || []);
    const label = count === 1 ? "płatność" : "płatności";

    return `
      <div class="ppay-shell">
        <div class="ppay-top">
          <div>
            <h2 class="ppay-title">Płatności</h2>
            <p class="ppay-subtitle">Twoje rozliczenia za wizyty, statusy płatności i podstawowe informacje.</p>
          </div>

          <div class="ppay-counter">${count} ${label}</div>
        </div>

        <div class="ppay-filters">
          <div class="ppay-field">
            <label>Szukaj</label>
            <input class="ppay-input" id="ppay-search" type="text"
              placeholder="ID płatności, ID wizyty, lekarz, usługa, zwierzę...">
          </div>

          <div class="ppay-field">
            <label>Status</label>
            <select class="ppay-select" id="ppay-status">
              <option value="all">Wszystkie</option>
              <option value="paid">Zapłacone</option>
              <option value="pending">Oczekujące</option>
              <option value="cancelled">Anulowane / zwroty</option>
            </select>
          </div>

          <div class="ppay-field">
            <label>Metoda</label>
            <select class="ppay-select" id="ppay-method">
              <option value="all">Wszystkie</option>
              <option value="card">Karta</option>
              <option value="cash">Gotówka</option>
              <option value="transfer">Przelew</option>
              <option value="blik">BLIK</option>
              <option value="online">Online</option>
              <option value="empty">Nie podano</option>
            </select>
          </div>
        </div>

        <div class="ppay-stats">
          <div class="ppay-stat">
            <span class="ppay-stat-label">Do zapłaty</span>
            <span class="ppay-stat-value orange">${money(stats.toPay)}</span>
          </div>

          <div class="ppay-stat">
            <span class="ppay-stat-label">Zapłacone</span>
            <span class="ppay-stat-value green">${stats.paidCount}</span>
          </div>

          <div class="ppay-stat">
            <span class="ppay-stat-label">Oczekujące</span>
            <span class="ppay-stat-value orange">${stats.pendingCount}</span>
          </div>

          <div class="ppay-stat">
            <span class="ppay-stat-label">Anulowane / zwroty</span>
            <span class="ppay-stat-value red">${stats.cancelledCount}</span>
          </div>
        </div>

        ${innerHtml}
      </div>
    `;
  }

  function renderLoading(block) {
    block.innerHTML = baseLayout(
      `<div class="ppay-loading">Ładowanie płatności...</div>`,
      0,
      []
    );
  }

  function renderError(block, message) {
    block.innerHTML = baseLayout(
      `<div class="ppay-error">${escapeHtml(message || "Nie udało się pobrać płatności.")}</div>`,
      0,
      []
    );
  }

  function renderEmpty(block, items) {
    block.innerHTML = baseLayout(
      `<div class="ppay-empty">Nie masz jeszcze żadnych płatności.</div>`,
      0,
      items || []
    );
  }

  function itemSearchText(item) {
    return normalizeText([
      item.payment_id,
      item.visit_id,
      item.employee_name,
      item.service_name,
      item.pet_name,
      item.status,
      item.method,
      item.amount
    ].join(" "));
  }

  function methodBucket(method) {
    const m = normalizeText(method);

    if (!m || m === "-") return "empty";
    if (m.includes("card") || m.includes("karta")) return "card";
    if (m.includes("cash") || m.includes("gotow")) return "cash";
    if (m.includes("transfer") || m.includes("przelew")) return "transfer";
    if (m.includes("blik")) return "blik";
    if (m.includes("online")) return "online";

    return "other";
  }

  function buildCards(items) {
    if (!items.length) {
      return `<div class="ppay-empty">Brak płatności pasujących do filtrów.</div>`;
    }

    return `
      <div class="ppay-list">
        ${items.map(function (item) {
          const bucket = statusBucket(item.status);
          const doctor = String(item.employee_name || "").trim() || "Brak danych";
          const service = String(item.service_name || "").trim() || "Usługa niewpisana";
          const pet = String(item.pet_name || "").trim() || "Zwierzę niewpisane";

          return `
            <article class="ppay-card">
              <div>
                <div class="ppay-id">#${escapeHtml(item.payment_id || "-")}</div>
                <div class="ppay-small">${escapeHtml(formatDate(item.payment_datetime))}</div>
              </div>

              <div class="ppay-main">
                <div class="ppay-visit">Wizyta #${escapeHtml(item.visit_id || "-")}</div>
                <div class="ppay-muted">${escapeHtml(formatDate(item.visit_datetime))}</div>
                <div class="ppay-muted">Lekarz: ${escapeHtml(doctor)}</div>
                <div class="ppay-muted">Usługa: ${escapeHtml(service)} • Zwierzę: ${escapeHtml(pet)}</div>
              </div>

              <div class="ppay-amount">${escapeHtml(money(item.amount))}</div>

              <div>
                <div class="ppay-method">${escapeHtml(methodLabel(item.method))}</div>
                <div class="ppay-small">Metoda płatności</div>
              </div>

              <span class="ppay-badge ${bucket}">
                ${escapeHtml(statusLabel(item.status))}
              </span>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderItems(block, allItems) {
    if (!allItems.length) {
      renderEmpty(block, allItems);
      bindFilters(block, allItems);
      return;
    }

    block.innerHTML = baseLayout(buildCards(allItems), allItems.length, allItems);
    bindFilters(block, allItems);
  }

  function bindFilters(block, allItems) {
    const search = block.querySelector("#ppay-search");
    const status = block.querySelector("#ppay-status");
    const method = block.querySelector("#ppay-method");

    function applyFilters() {
      const q = normalizeText(search ? search.value : "");
      const statusValue = status ? status.value : "all";
      const methodValue = method ? method.value : "all";

      const filtered = allItems.filter(function (item) {
        const matchesSearch = !q || itemSearchText(item).includes(q);
        const matchesStatus = statusValue === "all" || statusBucket(item.status) === statusValue;
        const matchesMethod = methodValue === "all" || methodBucket(item.method) === methodValue;

        return matchesSearch && matchesStatus && matchesMethod;
      });

      const oldShell = block.querySelector(".ppay-shell");

      if (!oldShell) return;

      const searchValue = search ? search.value : "";
      const statusSelected = status ? status.value : "all";
      const methodSelected = method ? method.value : "all";

      block.innerHTML = baseLayout(buildCards(filtered), filtered.length, allItems);
      bindFilters(block, allItems);

      const nextSearch = block.querySelector("#ppay-search");
      const nextStatus = block.querySelector("#ppay-status");
      const nextMethod = block.querySelector("#ppay-method");

      if (nextSearch) nextSearch.value = searchValue;
      if (nextStatus) nextStatus.value = statusSelected;
      if (nextMethod) nextMethod.value = methodSelected;
    }

    if (search) search.addEventListener("input", applyFilters);
    if (status) status.addEventListener("change", applyFilters);
    if (method) method.addEventListener("change", applyFilters);
  }

  async function fetchPayments() {
    const url = "/praca_inz/projects/pulpit_pacjent_moj_platnosci.php";

    const response = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json"
      }
    });

    const text = await response.text();

    let data = null;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("PHP zwrócił tekst zamiast JSON:", text);
      throw new Error("PHP nie zwrócił poprawnego JSON.");
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Nie udało się pobrać danych.");
    }

    return data;
  }

  async function init() {
    injectCss();

    const block = findPaymentBlock();

    if (!block) return;

    block.style.overflow = "hidden";
    block.style.boxSizing = "border-box";

    renderLoading(block);

    try {
      const data = await fetchPayments();
      const items = Array.isArray(data.items) ? data.items : [];

      renderItems(block, items);
    } catch (e) {
      renderError(block, e.message);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();