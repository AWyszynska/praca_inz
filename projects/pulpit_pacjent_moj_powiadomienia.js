
(function () {
  if (window.__vetmellMojTopbarLoaded === true) return;
  window.__vetmellMojTopbarLoaded = true;

  const script = document.createElement("script");
  script.src = "/praca_inz/projects/pulpit_pacjent_moj_topbar.js?v=" + Date.now();
  script.defer = true;
  document.head.appendChild(script);
})();

(function () {
  const NOTIFICATION_BLOCK_ID = "blk_1781875913625";
  const STYLE_ID = "patient-notifications-style-v1";
  const API_URL = "/praca_inz/projects/pulpit_pacjent_moj_powiadomienia.php";

  let allNotifications = [];

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function findNotificationBlock() {
    const safeId = cssEscape(NOTIFICATION_BLOCK_ID);

    return (
      document.getElementById(NOTIFICATION_BLOCK_ID) ||
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

  function shortText(text, max) {
    const value = String(text || "").trim().replace(/\s+/g, " ");

    if (!value) return "Brak treści powiadomienia.";
    if (value.length <= max) return value;

    return value.substring(0, max).trim() + "...";
  }

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      .pnot-shell {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 26px 30px;
        font-family: Arial, Helvetica, sans-serif;
        color: #0b2c63;
        overflow: hidden;
      }

      .pnot-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .pnot-title {
        margin: 0;
        font-size: 31px;
        line-height: 1.1;
        font-weight: 700;
        font-style: italic;
        font-family: Georgia, "Times New Roman", serif;
        color: #08285c;
      }

      .pnot-subtitle {
        margin: 6px 0 0;
        font-size: 15px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #486489;
      }

      .pnot-counter {
        min-width: 150px;
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

      .pnot-controls {
        display: grid;
        grid-template-columns: 1fr 190px 210px;
        gap: 12px;
        align-items: end;
        padding: 16px 18px;
        border-radius: 18px;
        background: #f8fbff;
        border: 1px solid #dbe8fb;
        margin-bottom: 14px;
        box-sizing: border-box;
      }

      .pnot-field label {
        display: block;
        margin-bottom: 7px;
        font-size: 13px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .pnot-input,
      .pnot-select {
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

      .pnot-input:focus,
      .pnot-select:focus {
        border-color: #1f56d8;
        box-shadow: 0 0 0 4px rgba(31, 86, 216, 0.12);
      }

      .pnot-mark-all {
        width: 100%;
        height: 44px;
        border: 0;
        border-radius: 13px;
        background: #264f82;
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
      }

      .pnot-mark-all:hover {
        background: #1d3f69;
      }

      .pnot-stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 14px;
      }

      .pnot-stat {
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid #dbe4f2;
        background: #ffffff;
        box-sizing: border-box;
      }

      .pnot-stat-label {
        display: block;
        color: #617590;
        font-size: 12px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        letter-spacing: .4px;
        text-transform: uppercase;
        margin-bottom: 5px;
      }

      .pnot-stat-value {
        display: block;
        color: #1f56d8;
        font-size: 24px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.1;
      }

      .pnot-stat-value.orange {
        color: #9a4b00;
      }

      .pnot-stat-value.green {
        color: #087640;
      }

      .pnot-list {
        height: calc(100% - 238px);
        overflow-y: auto;
        padding-right: 10px;
        box-sizing: border-box;
      }

      .pnot-list::-webkit-scrollbar {
        width: 10px;
      }

      .pnot-list::-webkit-scrollbar-track {
        background: rgba(203, 213, 225, 0.35);
        border-radius: 999px;
      }

      .pnot-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.45);
        border-radius: 999px;
      }

      .pnot-card {
        position: relative;
        padding: 18px 20px;
        margin-bottom: 12px;
        border-radius: 18px;
        background: #ffffff;
        border: 1px solid #d9e6f8;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
      }

      .pnot-card.unread {
        background: #f8fbff;
        border-color: #9ec4ff;
        box-shadow: 0 14px 30px rgba(31, 86, 216, 0.12);
      }

      .pnot-card-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 12px;
      }

      .pnot-date {
        font-size: 17px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .pnot-meta {
        margin-top: 4px;
        font-size: 13px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #637999;
      }

      .pnot-badge {
        flex-shrink: 0;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }

      .pnot-badge.unread {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
      }

      .pnot-badge.read {
        background: #dcfce7;
        color: #13723c;
        border: 1px solid #91e5b2;
      }

      .pnot-preview {
        margin: 0 0 14px;
        line-height: 1.5;
        font-size: 15px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #233b5f;
      }

      .pnot-details {
        display: none;
        margin-top: 14px;
        padding: 16px;
        border-radius: 16px;
        background: #ffffff;
        border: 1px solid #dce9fb;
      }

      .pnot-card.is-open .pnot-details {
        display: block;
      }

      .pnot-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .pnot-info-box {
        padding: 10px 12px;
        border-radius: 13px;
        background: #f8fbff;
        border: 1px solid #e0ebfa;
      }

      .pnot-info-label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #6b7f9d;
        margin-bottom: 4px;
      }

      .pnot-info-value {
        display: block;
        font-size: 14px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .pnot-text-label {
        margin: 8px 0 7px;
        font-size: 13px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .pnot-text {
        margin: 0;
        white-space: pre-wrap;
        line-height: 1.6;
        font-size: 15px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #233b5f;
        background: #f8fbff;
        border: 1px solid #e0ebfa;
        border-radius: 13px;
        padding: 12px;
      }

      .pnot-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: flex-end;
        margin-top: 14px;
      }

      .pnot-toggle,
      .pnot-read-btn {
        border-radius: 999px;
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-sizing: border-box;
      }

      .pnot-toggle {
        background: #eef6ff;
        color: #1f56d8;
        border: 1px solid #c8ddff;
      }

      .pnot-toggle:hover {
        background: #dfeeff;
      }

      .pnot-read-btn {
        background: #dcfce7;
        color: #13723c;
        border: 1px solid #91e5b2;
      }

      .pnot-read-btn:hover {
        background: #c9f8da;
      }

      .pnot-read-btn:disabled,
      .pnot-mark-all:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .pnot-empty,
      .pnot-loading,
      .pnot-error {
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

      .pnot-error {
        color: #991b1b;
        background: #fff1f2;
        border-color: #fecdd3;
      }

      @media (max-width: 900px) {
        .pnot-controls,
        .pnot-stats,
        .pnot-grid {
          grid-template-columns: 1fr;
        }

        .pnot-list,
        .pnot-empty,
        .pnot-loading,
        .pnot-error {
          height: calc(100% - 360px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function getStats(items) {
    const total = items.length;
    const unread = items.filter(function (item) {
      return !item.is_read;
    }).length;
    const read = total - unread;

    return { total, unread, read };
  }

  function baseLayout(innerHtml, count, items) {
    const stats = getStats(items || []);
    const label = count === 1 ? "powiadomienie" : "powiadomień";

    return `
      <div class="pnot-shell">
        <div class="pnot-top">
          <div>
            <h2 class="pnot-title">Powiadomienia</h2>
            <p class="pnot-subtitle">Wiadomości od lecznicy, lekarzy oraz informacje dotyczące Twoich wizyt.</p>
          </div>

          <div class="pnot-counter">${count} ${label}</div>
        </div>

        <div class="pnot-controls">
          <div class="pnot-field">
            <label>Szukaj</label>
            <input class="pnot-input" id="pnot-search" type="text"
              placeholder="Treść, lekarz, data...">
          </div>

          <div class="pnot-field">
            <label>Status</label>
            <select class="pnot-select" id="pnot-status">
              <option value="all">Wszystkie</option>
              <option value="unread">Nieodczytane</option>
              <option value="read">Odczytane</option>
            </select>
          </div>

          <div class="pnot-field">
            <label>Akcja</label>
            <button type="button" class="pnot-mark-all" id="pnot-mark-all"
              ${stats.unread === 0 ? "disabled" : ""}>
              Oznacz wszystkie jako odczytane
            </button>
          </div>
        </div>

        <div class="pnot-stats">
          <div class="pnot-stat">
            <span class="pnot-stat-label">Nieodczytane</span>
            <span class="pnot-stat-value orange">${stats.unread}</span>
          </div>

          <div class="pnot-stat">
            <span class="pnot-stat-label">Odczytane</span>
            <span class="pnot-stat-value green">${stats.read}</span>
          </div>

          <div class="pnot-stat">
            <span class="pnot-stat-label">Wszystkie</span>
            <span class="pnot-stat-value">${stats.total}</span>
          </div>
        </div>

        ${innerHtml}
      </div>
    `;
  }

  function renderLoading(block) {
    block.innerHTML = baseLayout(
      `<div class="pnot-loading">Ładowanie powiadomień...</div>`,
      0,
      []
    );
  }

  function renderError(block, message) {
    block.innerHTML = baseLayout(
      `<div class="pnot-error">${escapeHtml(message || "Nie udało się pobrać powiadomień.")}</div>`,
      0,
      []
    );
  }

  function renderEmpty(block, items) {
    block.innerHTML = baseLayout(
      `<div class="pnot-empty">Nie masz jeszcze żadnych powiadomień.</div>`,
      0,
      items || []
    );
  }

  function itemSearchText(item) {
    return normalizeText([
      item.text,
      item.employee_name,
      item.created_at,
      item.read_at
    ].join(" "));
  }

  function buildCards(items) {
    if (!items.length) {
      return `<div class="pnot-empty">Brak powiadomień pasujących do filtrów.</div>`;
    }

    return `
      <div class="pnot-list">
        ${items.map(function (item, index) {
          const read = !!item.is_read;
          const employeeName = String(item.employee_name || "").trim();
          const sender = employeeName || (item.employee_id ? `Pracownik ID: ${item.employee_id}` : "System");
          const createdAt = formatDate(item.created_at);
          const readAt = item.read_at ? formatDate(item.read_at) : "-";

          return `
            <article class="pnot-card ${read ? "read" : "unread"}" data-notification-id="${escapeHtml(item.id)}" data-index="${index}">
              <div class="pnot-card-head">
                <div>
                  <div class="pnot-date">${escapeHtml(createdAt)}</div>
                  <div class="pnot-meta">Od: ${escapeHtml(sender)}</div>
                </div>

                <span class="pnot-badge ${read ? "read" : "unread"}">
                  ${read ? "Odczytane" : "Nowe"}
                </span>
              </div>

              <p class="pnot-preview">${escapeHtml(shortText(item.text, 150))}</p>

              <div class="pnot-actions">
                ${
                  read
                    ? ""
                    : `<button type="button" class="pnot-read-btn" data-read-id="${escapeHtml(item.id)}">Oznacz jako odczytane</button>`
                }

                <button type="button" class="pnot-toggle">Rozwiń</button>
              </div>

              <div class="pnot-details">
                <div class="pnot-grid">
                  <div class="pnot-info-box">
                    <span class="pnot-info-label">Data powiadomienia</span>
                    <span class="pnot-info-value">${escapeHtml(createdAt)}</span>
                  </div>

                  <div class="pnot-info-box">
                    <span class="pnot-info-label">Nadawca</span>
                    <span class="pnot-info-value">${escapeHtml(sender)}</span>
                  </div>

                  <div class="pnot-info-box">
                    <span class="pnot-info-label">Status</span>
                    <span class="pnot-info-value">${read ? "Odczytane" : "Nieodczytane"}</span>
                  </div>

                  <div class="pnot-info-box">
                    <span class="pnot-info-label">Odczytano</span>
                    <span class="pnot-info-value">${escapeHtml(readAt)}</span>
                  </div>
                </div>

                <div class="pnot-text-label">Pełna treść powiadomienia</div>
                <p class="pnot-text">${escapeHtml(item.text || "Brak treści powiadomienia.")}</p>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderItems(block, allItems) {
    if (!allItems.length) {
      renderEmpty(block, allItems);
      bindUi(block, allItems);
      return;
    }

    block.innerHTML = baseLayout(buildCards(allItems), allItems.length, allItems);
    bindUi(block, allItems);
  }

  function applyFilters(block, allItems) {
    const search = block.querySelector("#pnot-search");
    const status = block.querySelector("#pnot-status");

    const q = normalizeText(search ? search.value : "");
    const statusValue = status ? status.value : "all";

    const filtered = allItems.filter(function (item) {
      const matchesSearch = !q || itemSearchText(item).includes(q);

      const matchesStatus =
        statusValue === "all" ||
        (statusValue === "read" && item.is_read) ||
        (statusValue === "unread" && !item.is_read);

      return matchesSearch && matchesStatus;
    });

    const searchValue = search ? search.value : "";
    const statusSelected = status ? status.value : "all";

    block.innerHTML = baseLayout(buildCards(filtered), filtered.length, allItems);
    bindUi(block, allItems);

    const nextSearch = block.querySelector("#pnot-search");
    const nextStatus = block.querySelector("#pnot-status");

    if (nextSearch) nextSearch.value = searchValue;
    if (nextStatus) nextStatus.value = statusSelected;
  }

  function bindUi(block, allItems) {
    const search = block.querySelector("#pnot-search");
    const status = block.querySelector("#pnot-status");
    const markAll = block.querySelector("#pnot-mark-all");

    if (search) {
      search.addEventListener("input", function () {
        applyFilters(block, allItems);
      });
    }

    if (status) {
      status.addEventListener("change", function () {
        applyFilters(block, allItems);
      });
    }

    block.querySelectorAll(".pnot-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const card = btn.closest(".pnot-card");

        if (!card) return;

        const isOpen = card.classList.contains("is-open");

        card.classList.toggle("is-open", !isOpen);
        btn.textContent = isOpen ? "Rozwiń" : "Zwiń";
      });
    });

    block.querySelectorAll("[data-read-id]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const id = btn.getAttribute("data-read-id");

        if (!id) return;

        btn.disabled = true;
        btn.textContent = "Zapisywanie...";

        try {
          await markRead(id);
          await reload(block);
        } catch (e) {
          btn.disabled = false;
          btn.textContent = "Oznacz jako odczytane";
          alert(e.message || "Nie udało się oznaczyć powiadomienia.");
        }
      });
    });

    if (markAll) {
      markAll.addEventListener("click", async function () {
        markAll.disabled = true;
        markAll.textContent = "Zapisywanie...";

        try {
          await markAllRead();
          await reload(block);
        } catch (e) {
          markAll.disabled = false;
          markAll.textContent = "Oznacz wszystkie jako odczytane";
          alert(e.message || "Nie udało się oznaczyć powiadomień.");
        }
      });
    }
  }

  async function apiPost(action, data) {
    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(Object.assign({ action: action }, data || {}))
    });

    const text = await response.text();

    let json = null;

    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("PHP zwrócił tekst zamiast JSON:", text);
      throw new Error("PHP nie zwrócił poprawnego JSON.");
    }

    if (!response.ok || !json.success) {
      throw new Error(json.message || "Nie udało się zapisać danych.");
    }

    return json;
  }

  function markRead(id) {
    return apiPost("mark_read", { id: id });
  }

  function markAllRead() {
    return apiPost("mark_all_read", {});
  }

  async function fetchNotifications() {
    const response = await fetch(API_URL, {
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

  async function reload(block) {
    const data = await fetchNotifications();

    allNotifications = Array.isArray(data.items) ? data.items : [];
    renderItems(block, allNotifications);
  }

  async function init() {
    injectCss();

    const block = findNotificationBlock();

    if (!block) return;

    block.style.overflow = "hidden";
    block.style.boxSizing = "border-box";

    renderLoading(block);

    try {
      await reload(block);
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