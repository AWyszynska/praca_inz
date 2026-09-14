(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/wizyta_pacjent.php";

const IDS = {
  clientNameText: "el_1779785327572",
  mainTextareaForm: "form_1779785221613_9682",
  prescriptionForm: "form_1779785526661_9772",
  submitButton: "el_1779785354676",
  prescriptionButton: "el_1779785632141",
  mainBlock: "blk_1779785134916"
};

  let currentVisit = null;
  let services = [];
  let totalTouched = false;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }
function loadWorkerPanelNav() {
  if (window.__workerPanelNavLoader === true) return;
  window.__workerPanelNavLoader = true;

  const s = document.createElement("script");
  s.src = "projects/worker_panel_nav.js?v=" + Date.now();
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

  function getParam(name) {
    return new URLSearchParams(location.search || "").get(name) || "";
  }

  function getVisitId() {
    return (
      getParam("visit_id") ||
      localStorage.getItem("vetmell_current_visit_id") ||
      ""
    ).trim();
  }
function setupBackToVisitsButton() {
  const buttons = Array.from(document.querySelectorAll("button, .sgbtn"));

  const btn = buttons.find((el) => {
    const txt = String(el.textContent || "").trim().toLowerCase();
    return txt === "kliknij";
  });

  if (!btn || btn.dataset.backToVisitsBound === "1") return;

  btn.dataset.backToVisitsBound = "1";
  btn.textContent = "Powrót";

  btn.style.cursor = "pointer";

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }

    window.location.href = "/praca_inz/final_view.php?file=Worker_panel_wizyty.xml";
  }, true);
}
  function byDataId(id) {
    return document.querySelector(`.page-element[data-id="${CSS.escape(id)}"]`);
  }

  function getTextarea(formId) {
    const host = byDataId(formId);
    if (!host) return null;

    return host.querySelector("textarea");
  }

  function getSubmitButton() {
    const host = byDataId(IDS.submitButton);
    if (!host) return null;

    return host.querySelector("button.sgbtn, button");
  }
function getPrescriptionGenerateButton() {
  const host = byDataId(IDS.prescriptionButton);
  if (!host) return null;

  return host.querySelector("button.sgbtn, button") || host;
}
function ensurePatientHeaderOverlay() {
  const root = document.getElementById("sg-scroll") || document.body;
  const mainForm = byDataId(IDS.mainTextareaForm);
  const oldName = byDataId(IDS.clientNameText);

  let overlay = document.getElementById("visit-patient-header-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "visit-patient-header-overlay";
    overlay.style.cssText = `
      position:absolute;
      z-index:99999;
      pointer-events:none;
      background:transparent;
      color:#0f172a;
      font-family:'Segoe UI', Arial, sans-serif;
      box-sizing:border-box;
      overflow:visible;
      white-space:normal;
    `;
    root.appendChild(overlay);
  }

  if (mainForm) {
    overlay.style.left = (mainForm.offsetLeft + 18) + "px";
    overlay.style.top = Math.max(0, mainForm.offsetTop - 48) + "px";
    overlay.style.width = Math.max(260, mainForm.offsetWidth - 36) + "px";
    overlay.style.height = "42px";
  } else if (oldName) {
    overlay.style.left = oldName.offsetLeft + "px";
    overlay.style.top = oldName.offsetTop + "px";
    overlay.style.width = "900px";
    overlay.style.height = "42px";
  }

  if (oldName) {
    oldName.innerHTML = "";
    oldName.style.display = "none";
  }

  return overlay;
}

function setTextElement(id, html) {
  if (id === IDS.clientNameText) {
    const overlay = ensurePatientHeaderOverlay();
    overlay.innerHTML = html;
    return;
  }

  const el = byDataId(id);
  if (!el) return;

  el.innerHTML = html;
}

  function statusLabel(status) {
    const s = String(status || "").toUpperCase();

    if (s === "BOOKED") return "Umówiona";
    if (s === "CONFIRMED") return "Potwierdzona";
    if (s === "IN_PROGRESS") return "W trakcie";
    if (s === "DONE") return "Zrealizowana";
    if (s === "NOT_DONE") return "Niezrealizowana";

    return status || "Brak";
  }

  function money(value) {
    const n = Number(value || 0);
    return n.toFixed(2);
  }

  function waitForRuntimeForm(callback, tries = 0) {
    const main = getTextarea(IDS.mainTextareaForm);
    const btn = getSubmitButton();

    if (main && btn) {
      callback();
      return;
    }

    if (tries > 80) {
      console.warn("[wizyta_pacjent.js] Nie znaleziono formularza albo przycisku.");
      callback();
      return;
    }

    setTimeout(() => waitForRuntimeForm(callback, tries + 1), 100);
  }

  function ensureInfoPanel() {
    let panel = document.getElementById("visit-detail-runtime-panel");

    if (panel) return panel;

    const block = byDataId(IDS.mainBlock) || document.body;

    panel = document.createElement("div");
    panel.id = "visit-detail-runtime-panel";
    panel.style.cssText = `
      position:absolute;
      left:390px;
      top:442px;
      width:560px;
      min-height:175px;
      box-sizing:border-box;
      padding:14px;
      border:1px solid #dbe4f0;
      border-radius:14px;
      background:#f8fafc;
      box-shadow:0 10px 24px rgba(15,23,42,0.08);
      font-family:'Segoe UI', Arial, sans-serif;
      color:#0f172a;
      z-index:50;
    `;

    panel.innerHTML = `
      <div style="
        display:grid;
        grid-template-columns:1fr 160px;
        gap:12px;
        align-items:start;
      ">
        <div>
          <div style="font-size:13px;font-weight:900;margin-bottom:8px;">
            Zrealizowane usługi
          </div>

          <div id="visit-services-list" style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:6px 10px;
            max-height:92px;
            overflow:auto;
            padding-right:4px;
          ">
            Ładowanie usług...
          </div>
        </div>

        <div>
          <label style="display:block;font-size:12px;font-weight:900;margin-bottom:5px;">
            Status wizyty
          </label>

          <select id="visit-status-select" style="
            width:100%;
            height:36px;
            border:1px solid #cbd5e1;
            border-radius:10px;
            padding:0 8px;
            background:white;
            font-size:13px;
            box-sizing:border-box;
          ">
            <option value="DONE">Zrealizowana</option>
            <option value="NOT_DONE">Niezrealizowana</option>
            <option value="IN_PROGRESS">W trakcie</option>
            <option value="CONFIRMED">Potwierdzona</option>
            <option value="BOOKED">Umówiona</option>
          </select>

          <label style="display:block;font-size:12px;font-weight:900;margin:12px 0 5px;">
            Cena całkowita
          </label>

          <div style="display:flex;gap:6px;align-items:center;">
            <input id="visit-total-price" type="number" min="0" step="0.01" value="0" style="
              width:100%;
              height:36px;
              border:1px solid #cbd5e1;
              border-radius:10px;
              padding:0 8px;
              font-size:13px;
              box-sizing:border-box;
            ">
            <span style="font-size:13px;font-weight:800;">zł</span>
          </div>
        </div>
      </div>

      <div id="visit-save-message" style="
        margin-top:10px;
        min-height:18px;
        font-size:12px;
        font-weight:800;
      "></div>
    `;

    block.appendChild(panel);

    const totalInput = panel.querySelector("#visit-total-price");
    if (totalInput) {
      totalInput.addEventListener("input", () => {
        totalTouched = true;
      });
    }

    return panel;
  }

  function renderServices() {
    const box = document.getElementById("visit-services-list");
    const totalInput = document.getElementById("visit-total-price");

    if (!box) return;

    if (!services.length) {
      box.innerHTML = `
        <div style="grid-column:1/-1;color:#64748b;font-size:12px;">
          Brak aktywnych usług w tabeli service.
        </div>
      `;
      return;
    }

    box.innerHTML = services.map((srv) => `
      <label style="
        display:flex;
        align-items:center;
        gap:7px;
        font-size:12px;
        font-weight:700;
        color:#334155;
        background:white;
        border:1px solid #e2e8f0;
        border-radius:10px;
        padding:7px 8px;
        cursor:pointer;
      ">
        <input
          type="checkbox"
          class="visit-service-check"
          value="${escapeHtml(srv.id)}"
          data-price="${escapeHtml(srv.price)}"
          style="width:14px;height:14px;margin:0;"
        >
        <span style="min-width:0;">
          ${escapeHtml(srv.name)}
          <span style="display:block;color:#64748b;font-size:11px;">
            ${money(srv.price)} zł
          </span>
        </span>
      </label>
    `).join("");

    box.querySelectorAll(".visit-service-check").forEach((check) => {
      check.addEventListener("change", () => {
        const sum = getSelectedServiceSum();

        if (totalInput && !totalTouched) {
          totalInput.value = money(sum);
        }
      });
    });
  }

  function getSelectedServiceIds() {
    return Array.from(document.querySelectorAll(".visit-service-check:checked"))
      .map((el) => parseInt(el.value || "0", 10))
      .filter(Boolean);
  }

  function getSelectedServiceSum() {
    return Array.from(document.querySelectorAll(".visit-service-check:checked"))
      .reduce((sum, el) => sum + Number(el.dataset.price || 0), 0);
  }

  function setMessage(text, type = "info") {
    const box = document.getElementById("visit-save-message");
    if (!box) return;

    const color =
      type === "ok" ? "#166534" :
      type === "error" ? "#991b1b" :
      "#334155";

    box.style.color = color;
    box.textContent = text || "";
  }

  function fillVisitData() {
    if (!currentVisit) return;

    const name = currentVisit.client_name || "Brak klienta";
    const date = currentVisit.date || "";
    const time = currentVisit.time || "";

    setTextElement(IDS.clientNameText, `
  <div style="font-weight:900;font-size:18px;line-height:1.05;">
    ${escapeHtml(name)}
  </div>
  <div style="font-size:11px;color:#64748b;margin-top:2px;line-height:1.1;">
    Wizyta #${escapeHtml(currentVisit.id)}
    ${date || time ? ` • ${escapeHtml(date)} ${escapeHtml(time)}` : ""}
    ${currentVisit.client_phone ? ` • tel. ${escapeHtml(currentVisit.client_phone)}` : ""}
  </div>
`);

    const mainText = getTextarea(IDS.mainTextareaForm);
    if (mainText && !mainText.value.trim()) {
      mainText.value = currentVisit.notes || "";
    }

    const statusSelect = document.getElementById("visit-status-select");
    if (statusSelect) {
      const s = String(currentVisit.status || "").toUpperCase();
      statusSelect.value = s && statusSelect.querySelector(`option[value="${CSS.escape(s)}"]`)
        ? s
        : "DONE";
    }

    const totalInput = document.getElementById("visit-total-price");
    if (totalInput) {
      totalInput.value = money(currentVisit.total_price || 0);
    }
  }

  async function loadVisit() {
    const visitId = getVisitId();

    if (!visitId) {
      setTextElement(IDS.clientNameText, `
        <div style="font-weight:900;color:#991b1b;">
          Nie wybrano wizyty
        </div>
      `);

      setMessage("Wejdź przez Najbliższe wizyty i kliknij Otwórz.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}?action=get&visit_id=${encodeURIComponent(visitId)}`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        if (data && data.redirect) {
          window.location.href = data.redirect;
          return;
        }

        throw new Error(data?.message || "Nie udało się pobrać wizyty.");
      }

      currentVisit = data.visit;
      services = Array.isArray(data.services) ? data.services : [];

      localStorage.setItem("vetmell_current_visit_id", String(currentVisit.id || ""));
      localStorage.setItem("vetmell_current_client_id", String(currentVisit.client_id || ""));

      renderServices();
      fillVisitData();
    } catch (err) {
      console.error("[wizyta_pacjent.js]", err);
      setMessage(err.message || "Błąd pobierania wizyty.", "error");
    }
  }

  async function saveVisit() {
    if (!currentVisit) {
      setMessage("Najpierw wybierz wizytę z listy Najbliższe wizyty.", "error");
      return;
    }

    const mainText = getTextarea(IDS.mainTextareaForm);
    const prescriptionText = getTextarea(IDS.prescriptionForm);
    const statusSelect = document.getElementById("visit-status-select");
    const totalInput = document.getElementById("visit-total-price");

    const historyText = mainText ? mainText.value.trim() : "";
    const prescription = prescriptionText ? prescriptionText.value.trim() : "";
    const status = statusSelect ? statusSelect.value : "DONE";
    const totalPrice = totalInput ? Number(totalInput.value || 0) : 0;

    if (!historyText) {
      setMessage("Wpisz opis wizyty w dużym polu tekstowym.", "error");
      mainText?.focus();
      return;
    }

    setMessage("Zapisywanie...", "info");

    try {
      const res = await fetch(`${API_URL}?action=save`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          visit_id: currentVisit.id,
          client_id: currentVisit.client_id,
          history_text: historyText,
          prescription_text: prescription,
          status: status,
          total_price: totalPrice,
          service_ids: getSelectedServiceIds()
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.message || "Nie udało się zapisać wizyty.");
      }

      currentVisit.status = status;
      currentVisit.total_price = totalPrice;
      currentVisit.notes = historyText;

      setMessage(data.message || "Zapisano wizytę.", "ok");

      setTextElement(IDS.clientNameText, `
        <div style="font-weight:900;font-size:22px;line-height:1.15;">
          ${escapeHtml(currentVisit.client_name)}
        </div>
        <div style="font-size:12px;color:#166534;margin-top:4px;font-weight:800;">
          Zapisano • status: ${escapeHtml(statusLabel(status))} • ${money(totalPrice)} zł
        </div>
      `);
    } catch (err) {
      console.error("[wizyta_pacjent.js]", err);
      setMessage(err.message || "Błąd zapisu.", "error");
    }
  }
function getPrescriptionButtonHost() {
  return byDataId(IDS.prescriptionForm)?.parentElement || byDataId(IDS.mainBlock) || document.body;
}

function ensurePrescriptionPreviewButton() {
  if (document.getElementById("visit-prescription-preview-btn")) return;

  const prescriptionForm = byDataId(IDS.prescriptionForm);
  const host = getPrescriptionButtonHost();

  const btn = document.createElement("button");
  btn.id = "visit-prescription-preview-btn";
  btn.type = "button";
  btn.textContent = "Podgląd recepty";
  btn.style.cssText = `
    position:absolute;
    left:370px;
    top:603px;
    width:150px;
    height:33px;
    border:none;
    border-radius:10px;
    background:#334155;
    color:white;
    font-size:13px;
    font-weight:800;
    cursor:pointer;
    box-shadow:0 12px 26px rgba(15,23,42,.18);
    z-index:80;
  `;

  host.appendChild(btn);

  if (prescriptionForm && prescriptionForm.parentElement === host) {
    btn.style.left = "370px";
    btn.style.top = "603px";
  }

  btn.addEventListener("click", openPrescriptionPreview);
}

function postToNewWindow(url, payload) {
  const winName = "vetmell_prescription_preview_" + Date.now();

  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.target = winName;
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify(payload);

  form.appendChild(input);

  Object.entries(payload).forEach(([key, value]) => {
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = key;
    field.value = String(value ?? "");
    form.appendChild(field);
  });

  document.body.appendChild(form);

  window.open("", winName, "width=900,height=900,scrollbars=yes,resizable=yes");
  form.submit();
  form.remove();
}

async function openPrescriptionPreview() {
  const prescriptionText = getTextarea(IDS.prescriptionForm);
  const text = prescriptionText ? prescriptionText.value.trim() : "";

  if (!text) {
    setMessage("Wpisz treść recepty/zaleceń w dolnym polu.", "error");
    prescriptionText?.focus();
    return;
  }



  const payload = {
    visit_id: currentVisit?.id || getVisitId() || "",
    client_name: currentVisit?.client_name || "Pacjent",
    date: currentVisit?.date || new Date().toLocaleDateString("pl-PL"),
    time: currentVisit?.time || "",
    prescription_text: text
  };

  postToNewWindow(`${API_URL}?action=prescription_preview`, payload);
}
async function generatePrescriptionPdf() {
  const prescriptionText = getTextarea(IDS.prescriptionForm);
  const text = prescriptionText ? prescriptionText.value.trim() : "";
  const visitId = currentVisit?.id || getVisitId();

  if (!visitId) {
    setMessage("Brak ID wizyty — nie można wygenerować recepty.", "error");
    return;
  }

  if (!text) {
    setMessage("Wpisz treść recepty/zaleceń w dolnym polu.", "error");
    prescriptionText?.focus();
    return;
  }

  setMessage("Generowanie recepty PDF...", "info");

  try {
    const res = await fetch(`${API_URL}?action=generate_prescription_pdf`, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        action: "generate_prescription_pdf",
        visit_id: visitId,
        content: text
      })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.ok) {
      throw new Error(data?.message || "Nie udało się wygenerować recepty PDF.");
    }

    setMessage(
      "Zapisano PDF: " + (data.filename || "recepta.pdf"),
      "ok"
    );

    console.log("[recepta PDF]", data);
  } catch (err) {
    console.error("[generatePrescriptionPdf]", err);
    setMessage(err.message || "Błąd generowania PDF.", "error");
  }
}
  function bindSubmit() {
    const btn = getSubmitButton();

    if (!btn || btn.dataset.visitSaveBound === "1") return;

    btn.dataset.visitSaveBound = "1";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveVisit();
    }, true);
  }
function bindPrescriptionGenerateButton() {
  const btn = getPrescriptionGenerateButton();

  if (!btn || btn.dataset.prescriptionGenerateBound === "1") return;

  btn.dataset.prescriptionGenerateBound = "1";

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    generatePrescriptionPdf();
  }, true);
}
function fixVisitPageLayout() {
  const panel = ensureInfoPanel();

  // tylko odświeżenie pozycji napisu pacjenta nad dużym polem
  ensurePatientHeaderOverlay();

  // Panel dodatkowy — nie rusza pól z XML
  if (panel) {
    panel.style.left = "390px";
    panel.style.top = "442px";
    panel.style.width = "560px";
    panel.style.minHeight = "175px";
    panel.style.zIndex = "60";
  }
}
function boot() {
  loadWorkerPanelNav();
  setupBackToVisitsButton();

  setTimeout(setupBackToVisitsButton, 300);
  setTimeout(setupBackToVisitsButton, 800);
  setTimeout(setupBackToVisitsButton, 1500);

  ensureInfoPanel();

  waitForRuntimeForm(() => {
    ensureInfoPanel();
    fixVisitPageLayout();
bindSubmit();
bindPrescriptionGenerateButton();
ensurePrescriptionPreviewButton();
loadVisit();
setupBackToVisitsButton();
    setTimeout(fixVisitPageLayout, 300);
    setTimeout(fixVisitPageLayout, 800);
    setTimeout(bindPrescriptionGenerateButton, 900);
setTimeout(bindPrescriptionGenerateButton, 1500);
  });
}

  ready(boot);
})();