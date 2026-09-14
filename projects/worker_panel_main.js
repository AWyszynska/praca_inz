(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = "projects/worker_panel_main.php";

  const IDS = {
  welcome: "el_1779022286451",
  date: "el_1779022353550_808201",
  generalInfo: "el_1779022399188",

  nearestVisitsBlock: "blk_1779022709733",
  nearestVisitsText: "el_1779022811093",

  noteBox: "form_1779022987453_8193",
  scheduleInfo: "el_1779023261982",
};

  let currentEditNoteId = null;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) {
      return CSS.escape(String(value));
    }

    return String(value).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  function byDataId(id) {
    return document.querySelector(`[data-id="${cssEscape(id)}"]`);
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

  function setText(id, text) {
    const el = byDataId(id);
    if (!el) return false;

    el.textContent = text;
    return true;
  }

  function setHtml(id, html) {
    const el = byDataId(id);
    if (!el) return false;

    el.innerHTML = html;
    return true;
  }

  function fixTextBox(el, options = {}) {
    if (!el) return;

    el.style.boxSizing = "border-box";
    el.style.overflow = options.overflow || "visible";
    el.style.whiteSpace = options.whiteSpace || "normal";
    el.style.wordBreak = options.wordBreak || "normal";
    el.style.overflowWrap = options.overflowWrap || "normal";

    if (options.width) el.style.width = options.width;
    if (options.height) el.style.height = options.height;
    if (options.fontSize) el.style.fontSize = options.fontSize;
    if (options.lineHeight) el.style.lineHeight = options.lineHeight;
    if (options.textAlign) el.style.textAlign = options.textAlign;
    if (options.left) el.style.left = options.left;
    if (options.top) el.style.top = options.top;
  }

  function fixLayout() {
    const welcome = byDataId(IDS.welcome);

    fixTextBox(welcome, {
      width: "650px",
      height: "38px",
      whiteSpace: "nowrap",
      overflow: "visible",
      fontSize: "23px",
      lineHeight: "30px",
    });

    const date = byDataId(IDS.date);

    fixTextBox(date, {
      width: "260px",
      height: "34px",
      whiteSpace: "nowrap",
      overflow: "visible",
      fontSize: "22px",
      lineHeight: "30px",
    });

    const general = byDataId(IDS.generalInfo);

    fixTextBox(general, {
      left: "18px",
      top: "50px",
      width: "220px",
      height: "76px",
      overflow: "hidden",
      whiteSpace: "normal",
      fontSize: "16px",
      lineHeight: "24px",
      textAlign: "left",
    });

    const generalCard = general ? general.parentElement : null;

    if (generalCard) {
      generalCard.style.overflow = "hidden";
      generalCard.style.height = "140px";
      generalCard.style.boxSizing = "border-box";
    }

    const schedule = byDataId(IDS.scheduleInfo);

    fixTextBox(schedule, {
      left: "0px",
      top: "0px",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      whiteSpace: "normal",
      fontSize: "17px",
      lineHeight: "28px",
      textAlign: "center",
    });

    const scheduleCard = schedule ? schedule.parentElement : null;

    if (scheduleCard) {
      scheduleCard.style.overflow = "hidden";
      scheduleCard.style.height = "140px";
      scheduleCard.style.boxSizing = "border-box";
      scheduleCard.style.display = "flex";
      scheduleCard.style.alignItems = "center";
      scheduleCard.style.justifyContent = "center";
      scheduleCard.style.padding = "12px";
    }

const visitsBlock = byDataId(IDS.nearestVisitsBlock);
const visitsText = byDataId(IDS.nearestVisitsText);

if (visitsBlock) {
  visitsBlock.style.position = "absolute";
  visitsBlock.style.overflow = "hidden";
  visitsBlock.style.boxSizing = "border-box";
}

/*
  Przenosi listę wizyt do środka czerwonej ramki
  "Najbliższe wizyty".
*/
if (visitsBlock && visitsText && visitsText.parentElement !== visitsBlock) {
  visitsBlock.appendChild(visitsText);
}

fixTextBox(visitsText, {
  left: "14px",
  top: "45px",
  width: "500px",
  height: "82px",
  overflow: "hidden",
  whiteSpace: "normal",
  fontSize: "14px",
  lineHeight: "20px",
});

if (visitsText) {
  visitsText.style.zIndex = "50";
}

} // <-- DODAJ TO, zamyka function fixLayout()

function getNoteTextarea() {
    const host = byDataId(IDS.noteBox);
    if (!host) return null;

    return host.querySelector("textarea");
  }

  function getNoteCard() {
    const host = byDataId(IDS.noteBox);
    if (!host) return null;

    return host.parentElement;
  }

  function ensureNotesUi() {
    const card = getNoteCard();
    const textarea = getNoteTextarea();

    if (!card || !textarea) {
      setTimeout(ensureNotesUi, 300);
      return null;
    }

    card.style.position = "absolute";
    card.style.overflow = "hidden";

    textarea.style.pointerEvents = "auto";
    textarea.style.resize = "none";

    let controls = document.getElementById("worker-note-controls");

    if (!controls) {
      controls = document.createElement("div");
      controls.id = "worker-note-controls";
      controls.style.cssText = `
        position:absolute;
        left:9px;
        top:100px;
        width:348px;
        height:38px;
        display:flex;
        gap:8px;
        align-items:center;
        z-index:999;
        box-sizing:border-box;
      `;

      controls.innerHTML = `
        <button type="button" id="worker-note-submit" style="
          height:34px;
          padding:0 16px;
          border:none;
          border-radius:10px;
          background:#1d4ed8;
          color:white;
          font-size:14px;
          font-weight:700;
          cursor:pointer;
        ">Zatwierdź</button>

        <button type="button" id="worker-note-cancel" style="
          height:34px;
          padding:0 12px;
          border:1px solid #cbd5e1;
          border-radius:10px;
          background:white;
          color:#334155;
          font-size:13px;
          font-weight:700;
          cursor:pointer;
          display:none;
        ">Anuluj</button>

        <span id="worker-note-status" style="
          font-size:12px;
          color:#166534;
          font-weight:700;
        "></span>
      `;

      card.appendChild(controls);
    }

    let list = document.getElementById("worker-notes-list");

    if (!list) {
      list = document.createElement("div");
      list.id = "worker-notes-list";
      list.style.cssText = `
        position:absolute;
        left:9px;
        top:145px;
        width:348px;
        height:188px;
        overflow:auto;
        display:flex;
        flex-direction:column;
        gap:8px;
        z-index:999;
        box-sizing:border-box;
        padding-right:4px;
      `;

      card.appendChild(list);
    }

    const submitBtn = document.getElementById("worker-note-submit");
    const cancelBtn = document.getElementById("worker-note-cancel");

    if (submitBtn && submitBtn.dataset.bound !== "1") {
      submitBtn.dataset.bound = "1";
      submitBtn.addEventListener("click", saveNote);
    }

    if (cancelBtn && cancelBtn.dataset.bound !== "1") {
      cancelBtn.dataset.bound = "1";
      cancelBtn.addEventListener("click", () => {
        currentEditNoteId = null;
        textarea.value = "";
        submitBtn.textContent = "Zatwierdź";
        cancelBtn.style.display = "none";
        setNoteStatus("");
      });
    }

    return {
      card,
      textarea,
      controls,
      list,
      submitBtn,
      cancelBtn,
    };
  }

  function setNoteStatus(text, error = false) {
    const status = document.getElementById("worker-note-status");

    if (!status) return;

    status.textContent = text || "";
    status.style.color = error ? "#b91c1c" : "#166534";

    if (text) {
      setTimeout(() => {
        status.textContent = "";
      }, 2500);
    }
  }

  async function apiPost(payload) {
    const res = await fetch(API_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.ok) {
      throw new Error((data && data.message) || "Błąd zapisu.");
    }

    return data;
  }

  async function saveNote() {
    const ui = ensureNotesUi();

    if (!ui) return;

    const noteText = String(ui.textarea.value || "").trim();

    if (!noteText) {
      setNoteStatus("Wpisz notatkę.", true);
      return;
    }

    try {
      ui.submitBtn.disabled = true;
      ui.submitBtn.style.opacity = "0.7";

      const payload = currentEditNoteId
        ? {
            action: "update_note",
            id: currentEditNoteId,
            note_text: noteText,
          }
        : {
            action: "create_note",
            note_text: noteText,
          };

      const data = await apiPost(payload);

      currentEditNoteId = null;
      ui.textarea.value = "";
      ui.submitBtn.textContent = "Zatwierdź";
      ui.cancelBtn.style.display = "none";

      renderNotes(data.notes || []);

      setNoteStatus("Zapisano.");
    } catch (err) {
      setNoteStatus(err.message || "Błąd zapisu.", true);
    } finally {
      ui.submitBtn.disabled = false;
      ui.submitBtn.style.opacity = "1";
    }
  }

  async function deleteNote(id) {
    if (!confirm("Usunąć tę notatkę?")) {
      return;
    }

    try {
      const data = await apiPost({
        action: "delete_note",
        id: id,
      });

      renderNotes(data.notes || []);
      setNoteStatus("Usunięto.");
    } catch (err) {
      setNoteStatus(err.message || "Błąd usuwania.", true);
    }
  }

  function editNote(note) {
    const ui = ensureNotesUi();

    if (!ui) return;

    currentEditNoteId = note.id;
    ui.textarea.value = note.note_text || "";
    ui.textarea.focus();

    ui.submitBtn.textContent = "Zapisz zmiany";
    ui.cancelBtn.style.display = "inline-flex";
  }

  function renderNotes(notes) {
    const ui = ensureNotesUi();

    if (!ui) return;

    if (!Array.isArray(notes) || notes.length === 0) {
      ui.list.innerHTML = `
        <div style="
          font-size:13px;
          color:#64748b;
          background:rgba(255,255,255,0.65);
          border:1px dashed #cbd5e1;
          border-radius:10px;
          padding:10px;
          box-sizing:border-box;
        ">
          Brak notatek.
        </div>
      `;
      return;
    }

    ui.list.innerHTML = notes.map((note) => `
      <div class="worker-note-item" data-note-id="${escapeHtml(note.id)}" style="
        background:rgba(255,255,255,0.88);
        border:1px solid #cbd5e1;
        border-radius:12px;
        padding:8px;
        box-sizing:border-box;
        color:#0f172a;
        font-size:13px;
        line-height:1.35;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:8px;
          margin-bottom:5px;
        ">
          <div style="
            font-size:11px;
            color:#64748b;
            font-weight:700;
          ">
            #${escapeHtml(note.id)} • ${escapeHtml(note.created_at || "")}
          </div>

          <div style="display:flex; gap:5px;">
            <button type="button" data-action="edit" data-id="${escapeHtml(note.id)}" style="
              border:none;
              border-radius:7px;
              background:#facc15;
              color:#422006;
              font-size:11px;
              font-weight:800;
              padding:4px 7px;
              cursor:pointer;
            ">Edytuj</button>

            <button type="button" data-action="delete" data-id="${escapeHtml(note.id)}" style="
              border:none;
              border-radius:7px;
              background:#ef4444;
              color:white;
              font-size:11px;
              font-weight:800;
              padding:4px 7px;
              cursor:pointer;
            ">Usuń</button>
          </div>
        </div>

        <div style="
          white-space:pre-wrap;
          word-break:break-word;
        ">${escapeHtml(note.note_text || "")}</div>
      </div>
    `).join("");

    ui.list.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id || "0", 10);
        const action = btn.dataset.action || "";

        const note = notes.find((item) => Number(item.id) === id);

        if (!note) return;

        if (action === "edit") {
          editNote(note);
        }

        if (action === "delete") {
          deleteNote(id);
        }
      });
    });
  }

  function setButtonName(name) {
    const buttons = Array.from(document.querySelectorAll("button, .sgbtn"));

    const btn = buttons.find((button) => {
      const text = String(button.textContent || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      return text === "kliknij" || text.includes("kliknij");
    });

    if (!btn) return;

    const textSpan = btn.querySelector(".sgbtn__text");

    if (textSpan) {
      textSpan.textContent = name;
    } else {
      btn.textContent = name;
    }

    btn.title = name;
  }

  function statusLabel(status) {
    const s = String(status || "").toUpperCase();

    if (s === "BOOKED") return "Umówiona";
    if (s === "CONFIRMED") return "Potwierdzona";
    if (s === "IN_PROGRESS") return "W trakcie";
    if (s === "DONE") return "Zakończona";

    return status || "Zaplanowana";
  }

  function renderVisits(visits) {
    if (!Array.isArray(visits) || visits.length === 0) {
      return `
        <div style="font-size:15px; color:#64748b; margin-top:4px;">
          Brak najbliższych wizyt.
        </div>
      `;
    }

    return `
      <div style="display:flex; flex-direction:column; gap:5px;">
        ${visits.slice(0, 3).map((visit) => {
          const patient = visit.pet_id
            ? `Pacjent #${escapeHtml(visit.pet_id)}`
            : (visit.client_id ? `Klient #${escapeHtml(visit.client_id)}` : "Pacjent");

          return `
            <div style="
              display:grid;
              grid-template-columns:54px 1fr 94px;
              gap:7px;
              align-items:center;
              font-size:13px;
              line-height:1.2;
              padding:5px 7px;
              border-radius:9px;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              box-sizing:border-box;
            ">
              <div style="font-weight:800; color:#111827;">
                ${escapeHtml(visit.time || "--:--")}
              </div>

              <div style="min-width:0;">
                <div style="font-weight:700; color:#1f2937; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${patient}
                </div>
                <div style="font-size:11px; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  Wizyta #${escapeHtml(visit.id)}
                </div>
              </div>

              <div style="
                font-size:11px;
                font-weight:700;
                color:#166534;
                background:#dcfce7;
                border:1px solid #86efac;
                border-radius:999px;
                padding:4px 6px;
                text-align:center;
                white-space:nowrap;
              ">
                ${escapeHtml(statusLabel(visit.status))}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function fillPanel(data) {
    fixLayout();

    const employee = data.employee || {};
    const stats = data.stats || {};
    const today = data.today || {};
    const name = employee.name || "Lekarzu";

    setText(IDS.welcome, `Dzień dobry, ${name}`);
    setText(IDS.date, today.date || "");

    setButtonName(name);

    setHtml(IDS.generalInfo, `
      <div><span style="font-weight:700;">Dzisiejsze wizyty:</span> ${escapeHtml(stats.today_visits ?? 0)}</div>
      <div><span style="font-weight:700;">Najbliższa:</span> ${escapeHtml(stats.nearest_visit || "Brak")}</div>
      <div><span style="font-weight:700;">Pacjenci:</span> ${escapeHtml(stats.today_patients ?? 0)}</div>
    `);

    setHtml(IDS.nearestVisitsText, renderVisits(data.visits || []));

    setHtml(IDS.scheduleInfo, `
      <div style="
        width:100%;
        height:100%;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:10px;
        box-sizing:border-box;
      ">
        <div style="font-weight:700; font-style:italic; font-size:18px; line-height:24px;">
          Mój grafik<br>dzisiaj
        </div>
        <div style="font-size:17px;">08:00–16:00</div>
        <div style="font-size:17px;">Status: dostępny</div>
      </div>
    `);

    ensureNotesUi();
    renderNotes(data.notes || []);

    setTimeout(fixLayout, 50);
    setTimeout(fixLayout, 250);
  }

  async function loadPanel() {
    fixLayout();

    try {
      const res = await fetch(`${API_URL}?action=data`, {
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

        console.warn(data && data.message ? data.message : "Nie udało się pobrać danych panelu.");
        return;
      }

      fillPanel(data);
    } catch (err) {
      console.error("[worker_panel_main.js]", err);
    }
  }

  function init() {
    fixLayout();
    ensureNotesUi();
    loadPanel();
  }

ready(() => {
  init();

  setTimeout(init, 400);
  setTimeout(init, 1000);
});

(function loadWorkerPanelNav() {
  if (window.__workerPanelNavLoader === true) return;
  window.__workerPanelNavLoader = true;

  const s = document.createElement("script");
  s.src = "projects/worker_panel_nav.js?v=" + Date.now();
  s.defer = true;
  document.head.appendChild(s);
})();

})();