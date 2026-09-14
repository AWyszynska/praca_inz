
(function () {
  if (window.__vetmellMojTopbarLoaded === true) return;
  window.__vetmellMojTopbarLoaded = true;

  const script = document.createElement("script");
  script.src = "/praca_inz/projects/pulpit_pacjent_moj_topbar.js?v=" + Date.now();
  script.defer = true;
  document.head.appendChild(script);
})();

(function () {
  const HISTORY_BLOCK_ID = "blk_1781875913625";
  const STYLE_ID = "patient-history-style-v3";

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function findHistoryBlock() {
    const safeId = cssEscape(HISTORY_BLOCK_ID);

    return (
      document.getElementById(HISTORY_BLOCK_ID) ||
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

  function typeLabel(type) {
    const t = String(type || "").toUpperCase();

    if (t === "NOTE") return "Notatka";
    if (t === "PRESCRIPTION") return "Recepta / zalecenia";
    if (t === "VISIT") return "Wizyta";
    if (t === "DIAGNOSIS") return "Diagnoza";

    return type ? String(type) : "Wpis";
  }

  function typeClass(type) {
    const t = String(type || "").toUpperCase();

    if (t === "PRESCRIPTION") return "prescription";
    if (t === "NOTE") return "note";
    if (t === "DIAGNOSIS") return "diagnosis";

    return "default";
  }

  function formatDate(value) {
    const raw = String(value || "").trim();

    if (!raw) return "Brak daty";

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

    if (!value) return "Brak treści wpisu.";
    if (value.length <= max) return value;

    return value.substring(0, max).trim() + "...";
  }

  function isPrescription(item) {
    return String(item.history_type || "").toUpperCase() === "PRESCRIPTION" || item.is_prescription === true;
  }

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      .pmh-shell {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 26px 30px;
        font-family: Arial, Helvetica, sans-serif;
        color: #0b2c63;
        overflow: hidden;
      }

      .pmh-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .pmh-title {
        margin: 0;
        font-size: 31px;
        line-height: 1.1;
        font-weight: 700;
        font-style: italic;
        font-family: Georgia, "Times New Roman", serif;
        color: #08285c;
      }

      .pmh-subtitle {
        margin: 6px 0 0;
        font-size: 15px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #486489;
      }

      .pmh-counter {
        min-width: 130px;
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

      .pmh-list {
        height: calc(100% - 92px);
        overflow-y: auto;
        padding-right: 10px;
        box-sizing: border-box;
      }

      .pmh-list::-webkit-scrollbar {
        width: 10px;
      }

      .pmh-list::-webkit-scrollbar-track {
        background: rgba(203, 213, 225, 0.35);
        border-radius: 999px;
      }

      .pmh-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.45);
        border-radius: 999px;
      }

      .pmh-item {
        background: #ffffff;
        border: 1px solid #d9e6f8;
        border-radius: 18px;
        padding: 18px 20px;
        margin-bottom: 14px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
      }

      .pmh-item.is-open {
        border-color: #9ec4ff;
        box-shadow: 0 14px 30px rgba(31, 86, 216, 0.12);
      }

      .pmh-item-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 12px;
      }

      .pmh-date {
        font-size: 17px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .pmh-meta {
        margin-top: 4px;
        font-size: 13px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #637999;
      }

      .pmh-badge {
        flex-shrink: 0;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        letter-spacing: 0.2px;
      }

      .pmh-badge.note {
        background: #eef6ff;
        color: #1f56d8;
        border: 1px solid #c8ddff;
      }

      .pmh-badge.prescription {
        background: #dcfce7;
        color: #13723c;
        border: 1px solid #91e5b2;
      }

      .pmh-badge.diagnosis {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
      }

      .pmh-badge.default {
        background: #f1f5f9;
        color: #334155;
        border: 1px solid #d8e0ea;
      }

      .pmh-preview {
        margin: 0 0 14px;
        line-height: 1.5;
        font-size: 15px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #233b5f;
      }

      .pmh-prescription-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 10px 14px;
        border-radius: 999px;
        background: #dcfce7;
        color: #13723c;
        border: 1px solid #91e5b2;
        font-size: 13px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
      }

      .pmh-details {
        display: none;
        margin-top: 14px;
        padding: 16px;
        border-radius: 16px;
        background: #f8fbff;
        border: 1px solid #dce9fb;
      }

      .pmh-item.is-open .pmh-details {
        display: block;
      }

      .pmh-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .pmh-info-box {
        padding: 10px 12px;
        border-radius: 13px;
        background: #ffffff;
        border: 1px solid #e0ebfa;
      }

      .pmh-info-label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #6b7f9d;
        margin-bottom: 4px;
      }

      .pmh-info-value {
        display: block;
        font-size: 14px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .pmh-info-value.good {
        color: #13723c;
      }

      .pmh-full-text-label {
        margin: 8px 0 7px;
        font-size: 13px;
        font-weight: 600;
        font-family: Arial, Helvetica, sans-serif;
        color: #08285c;
      }

      .pmh-text {
        margin: 0;
        white-space: pre-wrap;
        line-height: 1.6;
        font-size: 15px;
        font-weight: 400;
        font-family: Arial, Helvetica, sans-serif;
        color: #233b5f;
        background: #ffffff;
        border: 1px solid #e0ebfa;
        border-radius: 13px;
        padding: 12px;
      }

      .pmh-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: flex-end;
        margin-top: 14px;
      }

      .pmh-toggle {
        border: 0;
        border-radius: 999px;
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 500;
        font-family: Arial, Helvetica, sans-serif;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-sizing: border-box;
        background: #eef6ff;
        color: #1f56d8;
        border: 1px solid #c8ddff;
      }

      .pmh-toggle:hover {
        background: #dfeeff;
      }

      .pmh-empty,
      .pmh-loading,
      .pmh-error {
        height: calc(100% - 92px);
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

      .pmh-error {
        color: #991b1b;
        background: #fff1f2;
        border-color: #fecdd3;
      }

      @media (max-width: 800px) {
        .pmh-grid {
          grid-template-columns: 1fr;
        }

        .pmh-top {
          flex-direction: column;
        }

        .pmh-counter {
          align-self: flex-start;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function baseLayout(innerHtml, count) {
    const label = count === 1 ? "wpis" : "wpisów";

    return `
      <div class="pmh-shell">
        <div class="pmh-top">
          <div>
            <h2 class="pmh-title">Historia leczenia</h2>
            <p class="pmh-subtitle">Wizyty, notatki, zalecenia i recepty przypisane do Twojego konta.</p>
          </div>
          <div class="pmh-counter">${count} ${label}</div>
        </div>

        ${innerHtml}
      </div>
    `;
  }

  function renderLoading(block) {
    block.innerHTML = baseLayout(
      `<div class="pmh-loading">Ładowanie historii leczenia...</div>`,
      0
    );
  }

  function renderError(block, message) {
    block.innerHTML = baseLayout(
      `<div class="pmh-error">${escapeHtml(message || "Nie udało się pobrać historii leczenia.")}</div>`,
      0
    );
  }

  function renderEmpty(block) {
    block.innerHTML = baseLayout(
      `<div class="pmh-empty">Nie masz jeszcze żadnych wpisów w historii leczenia.</div>`,
      0
    );
  }

  function renderItems(block, items) {
    if (!items.length) {
      renderEmpty(block);
      return;
    }

    const html = items.map(function (item, index) {
      const employeeName = String(item.employee_name || "").trim();
      const doctorText = employeeName
        ? employeeName
        : item.employee_id
          ? `Lekarz ID: ${item.employee_id}`
          : "Brak danych";

      const visitText = item.visit_id ? `#${item.visit_id}` : "Brak numeru wizyty";
      const dateText = formatDate(item.created_at);
      const typeText = typeLabel(item.history_type);
      const prescription = isPrescription(item);

      const prescriptionStatus = prescription
        ? `<span class="pmh-prescription-status">Recepta: wystawiona</span>`
        : "";

      return `
        <article class="pmh-item" data-history-index="${index}">
          <div class="pmh-item-head">
            <div>
              <div class="pmh-date">${escapeHtml(dateText)}</div>
              <div class="pmh-meta">
                Lekarz: ${escapeHtml(doctorText)} • Wizyta ${escapeHtml(visitText)}
              </div>
            </div>

            <span class="pmh-badge ${typeClass(item.history_type)}">
              ${escapeHtml(typeText)}
            </span>
          </div>

          <p class="pmh-preview">${escapeHtml(shortText(item.text, 135))}</p>

          <div class="pmh-actions">
            ${prescriptionStatus}
            <button type="button" class="pmh-toggle">Rozwiń</button>
          </div>

          <div class="pmh-details">
            <div class="pmh-grid">
              <div class="pmh-info-box">
                <span class="pmh-info-label">Data wpisu</span>
                <span class="pmh-info-value">${escapeHtml(dateText)}</span>
              </div>

              <div class="pmh-info-box">
                <span class="pmh-info-label">Lekarz</span>
                <span class="pmh-info-value">${escapeHtml(doctorText)}</span>
              </div>

              <div class="pmh-info-box">
                <span class="pmh-info-label">Wizyta</span>
                <span class="pmh-info-value">${escapeHtml(visitText)}</span>
              </div>

              <div class="pmh-info-box">
                <span class="pmh-info-label">Rodzaj wpisu</span>
                <span class="pmh-info-value">${escapeHtml(typeText)}</span>
              </div>

              <div class="pmh-info-box">
                <span class="pmh-info-label">Recepta</span>
                <span class="pmh-info-value ${prescription ? "good" : ""}">
                  ${prescription ? "Wystawiona" : "Brak"}
                </span>
              </div>

              <div class="pmh-info-box">
                <span class="pmh-info-label">Numer wpisu</span>
                <span class="pmh-info-value">#${escapeHtml(item.id || "-")}</span>
              </div>
            </div>

            <div class="pmh-full-text-label">Pełna treść wpisu</div>
            <p class="pmh-text">${escapeHtml(item.text || "Brak treści wpisu.")}</p>
          </div>
        </article>
      `;
    }).join("");

    block.innerHTML = baseLayout(
      `<div class="pmh-list">${html}</div>`,
      items.length
    );

    bindToggles(block);
  }

  function bindToggles(block) {
    const buttons = block.querySelectorAll(".pmh-toggle");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const item = btn.closest(".pmh-item");

        if (!item) return;

        const isOpen = item.classList.contains("is-open");

        item.classList.toggle("is-open", !isOpen);
        btn.textContent = isOpen ? "Rozwiń" : "Zwiń";
      });
    });
  }

  async function fetchHistory() {
    const urls = [
      "projects/pulpit_pacjent_moj_historia.php",
      "/praca_inz/projects/pulpit_pacjent_moj_historia.php",
      "pulpit_pacjent_moj_historia.php"
    ];

    let lastError = "";

    for (const url of urls) {
      try {
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
          lastError = "PHP nie zwrócił poprawnego JSON.";
          continue;
        }

        if (!response.ok || !data.success) {
          lastError = data.message || "Nie udało się pobrać danych.";
          continue;
        }

        return data;
      } catch (e) {
        lastError = e.message || "Błąd połączenia.";
      }
    }

    throw new Error(lastError || "Nie udało się połączyć z plikiem PHP.");
  }

  async function init() {
    injectCss();

    const block = findHistoryBlock();

    if (!block) return;

    block.style.overflow = "hidden";
    block.style.boxSizing = "border-box";

    renderLoading(block);

    try {
      const data = await fetchHistory();
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