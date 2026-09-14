(() => {
  const MODAL_ID = "vetmellSlotModalBackdrop";
  const SLOT_SELECTED_CLASS = "vetmell-slot-btn--selected";

  const monthNames = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];

  let selectedSlot = null;

  function isBuilder() {
    return !!document.getElementById("preview-canvas") || String(window.SG_MODE || "").toLowerCase() === "builder";
  }

  function slotsData() {
    return (window.VETMELL_FREE_SLOTS && typeof window.VETMELL_FREE_SLOTS === "object")
      ? window.VETMELL_FREE_SLOTS
      : {};
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function isoForYMD(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function gridDays(year, month, weekStart) {
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    const daysInMonth = last.getDate();
    const jsDow = first.getDay();

    const startIndex = weekStart === "sun"
      ? jsDow
      : (jsDow === 0 ? 6 : jsDow - 1);

    const prevLast = new Date(year, month - 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < 42; i++) {
      const dayNum = i - startIndex + 1;

      if (dayNum < 1) {
        const prevMonthDate = new Date(year, month - 2, prevLast + dayNum);

        cells.push({
          d: prevMonthDate.getDate(),
          y: prevMonthDate.getFullYear(),
          m: prevMonthDate.getMonth() + 1,
          muted: true,
        });
      } else if (dayNum > daysInMonth) {
        const nextMonthDate = new Date(year, month, dayNum - daysInMonth);

        cells.push({
          d: nextMonthDate.getDate(),
          y: nextMonthDate.getFullYear(),
          m: nextMonthDate.getMonth() + 1,
          muted: true,
        });
      } else {
        cells.push({
          d: dayNum,
          y: year,
          m: month,
          muted: false,
        });
      }
    }

    return cells;
  }

  function monthNumberFromTitle(root) {
    const text = (root.querySelector(".sgcal__month")?.textContent || "").trim().toLowerCase();
    const idx = monthNames.findIndex((name) => name.toLowerCase() === text);

    return idx >= 0 ? idx + 1 : null;
  }
function normalizeYearMonth(year, month) {
  const d = new Date(year, month - 1, 1);

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
  };
}

function setCalendarMonth(host, root, year, month) {
  const fixed = normalizeYearMonth(year, month);

  host.dataset.calYear = String(fixed.year);
  host.dataset.calMonth = String(fixed.month);

  host.setAttribute("data-cal-year", String(fixed.year));
  host.setAttribute("data-cal-month", String(fixed.month));

  if (root) {
    root.dataset.calYear = String(fixed.year);
    root.dataset.calMonth = String(fixed.month);

    const monthEl = root.querySelector(".sgcal__month");
    const yearEl = root.querySelector(".sgcal__year");

    if (monthEl) {
      monthEl.textContent = monthNames[fixed.month - 1] || "";
    }

    if (yearEl) {
      yearEl.textContent = String(fixed.year);
    }
  }

  return fixed;
}
  function getCalendarCfg(host, root) {
    const now = new Date();
    const yearText = root.querySelector(".sgcal__year")?.textContent || "";

    const year = parseInt(
      host.dataset.calYear || yearText || String(now.getFullYear()),
      10
    ) || now.getFullYear();

    const month = parseInt(
      host.dataset.calMonth || String(monthNumberFromTitle(root) || now.getMonth() + 1),
      10
    ) || (now.getMonth() + 1);

    const weekStart = host.dataset.calWeekStart === "sun" ? "sun" : "mon";
    const showOutside = String(host.dataset.calShowOutside ?? "1") === "1";

    return {
      year,
      month,
      weekStart,
      showOutside,
    };
  }

  function findCalendarHosts() {
    return Array.from(document.querySelectorAll([
      '.canvas-element[data-type="calendar"]',
      '.page-element[data-type="calendar"]',
      '.sg-calendar-runtime[data-type="calendar"]',
      '[data-type="calendar"].type-calendar'
    ].join(',')));
  }

function clearAppointmentClasses(cell) {
  cell.classList.remove(
    "sgcal__cell--has-slots",
    "sgcal__cell--selected",
    "sgcal__cell--today",
    "hide",
    "muted"
  );

  cell.removeAttribute("aria-current");
  cell.removeAttribute("role");
  cell.removeAttribute("tabindex");

  delete cell.dataset.visitDate;
}

  function decorateCalendar(host) {
    if (!host || host.__vetmellDecorating === true) {
      return;
    }

    const root = host.querySelector("[data-root]");
    const grid = host.querySelector(".sgcal__grid");

    if (!root || !grid) {
      return;
    }

const cells = Array.from(grid.querySelectorAll(".sgcal__cell"));

if (!cells.length) {
  return;
}

host.__vetmellDecorating = true;

if (!isBuilder() && host.dataset.vetmellUserNavigated !== "1") {
  const now = new Date();
  setCalendarMonth(host, root, now.getFullYear(), now.getMonth() + 1);
}

const cfg = getCalendarCfg(host, root);
const data = slotsData();
const days = gridDays(cfg.year, cfg.month, cfg.weekStart);

const now = new Date();
const todayIso = isoForYMD(
  now.getFullYear(),
  now.getMonth() + 1,
  now.getDate()
);

    cells.forEach((cell, index) => {
      const day = days[index];

      if (!day) {
        return;
      }

      clearAppointmentClasses(cell);

      cell.dataset.vetmellBound = cell.dataset.vetmellBound || "0";

      const isVisibleMonthDay = !day.muted;
      const iso = isoForYMD(day.y, day.m, day.d);
      const daySlots = isVisibleMonthDay ? (data[iso] || []) : [];
if (day.muted) {
  cell.classList.add("muted");

  if (!cfg.showOutside) {
    cell.classList.add("hide");
  }
}

if (isVisibleMonthDay && iso === todayIso) {
  cell.classList.add("sgcal__cell--today");
  cell.setAttribute("aria-current", "date");
}
 let html = `
  <div class="sgcal__day-head">
    <span class="sgcal__num">${escapeHtml(day.d)}</span>
    ${
      daySlots.length
        ? `<span class="sgcal__count-badge">${escapeHtml(daySlots.length)}</span>`
        : ""
    }
  </div>
`;

if (daySlots.length) {
  const uniqueTimes = [
    ...new Set(
      daySlots
        .map((slot) => String(slot.time || "").trim())
        .filter(Boolean)
    )
  ];

  const shownTimes = uniqueTimes.slice(0, 2);
  const remainingCount = Math.max(0, daySlots.length - shownTimes.length);

  html += `
    <div class="sgcal__visit-preview">
      <div class="sgcal__slot-list">
        ${shownTimes
          .map((time) => `<span class="sgcal__slot-chip">${escapeHtml(time)}</span>`)
          .join("")}
      </div>

      ${
        remainingCount > 0
          ? `<span class="sgcal__more">+${remainingCount} wolnych</span>`
          : `<span class="sgcal__more sgcal__more--single">wolny termin</span>`
      }
    </div>
  `;

  cell.classList.add("sgcal__cell--has-slots");
}

cell.innerHTML = html;

if (isVisibleMonthDay) {
  cell.dataset.visitDate = iso;
  cell.setAttribute("role", "button");
  cell.setAttribute("tabindex", "0");
} else {
  cell.removeAttribute("role");
  cell.removeAttribute("tabindex");
}

      if (cell.dataset.vetmellBound !== "1") {
        cell.dataset.vetmellBound = "1";

        cell.addEventListener("click", () => {
          const isoDate = cell.dataset.visitDate;

          if (!isoDate || isBuilder()) {
            return;
          }

          grid
            .querySelectorAll(".sgcal__cell--selected")
            .forEach((el) => el.classList.remove("sgcal__cell--selected"));

          cell.classList.add("sgcal__cell--selected");

          openSlotModal(isoDate);
        });

        cell.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          event.preventDefault();
          cell.click();
        });
      }
    });

    host.__vetmellDecorating = false;
  }

  function ensureModal() {
    let backdrop = document.getElementById(MODAL_ID);

    if (backdrop) {
      return backdrop;
    }

    backdrop = document.createElement("div");
    backdrop.id = MODAL_ID;
    backdrop.className = "vetmell-slot-modal-backdrop";

    backdrop.innerHTML = `
      <div class="vetmell-slot-modal" role="dialog" aria-modal="true" aria-labelledby="vetmellSlotModalTitle">
        <button class="vetmell-slot-modal__close" id="vetmellSlotModalClose" type="button" aria-label="Zamknij okno">×</button>

        <h2 id="vetmellSlotModalTitle">Dostępne terminy</h2>

        <div id="vetmellSlotModalOptions" class="vetmell-slot-modal__slots"></div>

        <p id="vetmellSlotModalDateTime" class="vetmell-slot-modal__datetime"></p>
        <p id="vetmellSlotModalDoctor" class="vetmell-slot-modal__doctor"></p>

        <div class="vetmell-slot-modal__actions">
          <button type="button" class="vetmell-slot-modal__btn vetmell-slot-modal__btn--primary" id="vetmellSlotBookBtn" disabled>
            Umów wizytę
          </button>

          <button type="button" class="vetmell-slot-modal__btn" id="vetmellSlotCancelBtn">
            Anuluj
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        closeSlotModal();
      }
    });

    backdrop
      .querySelector("#vetmellSlotModalClose")
      ?.addEventListener("click", closeSlotModal);

    backdrop
      .querySelector("#vetmellSlotCancelBtn")
      ?.addEventListener("click", closeSlotModal);

    backdrop
      .querySelector("#vetmellSlotBookBtn")
      ?.addEventListener("click", bookSelectedSlot);

    return backdrop;
  }

  function openSlotModal(isoDate) {
    const backdrop = ensureModal();

    const title = backdrop.querySelector("#vetmellSlotModalTitle");
    const options = backdrop.querySelector("#vetmellSlotModalOptions");
    const dateTime = backdrop.querySelector("#vetmellSlotModalDateTime");
    const doctor = backdrop.querySelector("#vetmellSlotModalDoctor");
    const bookBtn = backdrop.querySelector("#vetmellSlotBookBtn");

    const slots = slotsData()[isoDate] || [];

    selectedSlot = null;

    options.innerHTML = "";
    dateTime.textContent = "";
    doctor.textContent = "";
    bookBtn.disabled = true;

    if (!slots.length) {
      title.textContent = "Brak wolnych terminów";
      options.innerHTML = "<p>W wybranym dniu nie ma wolnych wizyt.</p>";
    } else {
      title.textContent = "Wybierz godzinę wizyty";

      slots.forEach((slot) => {
        const btn = document.createElement("button");

        btn.type = "button";
        btn.className = "vetmell-slot-btn";
        btn.textContent = `${slot.time || ""} – ${slot.doctor || "Lekarz"}`;

        btn.addEventListener("click", () => {
          options
            .querySelectorAll(`.${SLOT_SELECTED_CLASS}`)
            .forEach((el) => el.classList.remove(SLOT_SELECTED_CLASS));

          btn.classList.add(SLOT_SELECTED_CLASS);

          selectedSlot = slot;

          dateTime.textContent = `${slot.date || isoDate} • ${slot.time || ""}`;
          doctor.textContent = `Lekarz: ${slot.doctor || ""}`;
          bookBtn.disabled = false;
        });

        options.appendChild(btn);
      });
    }

    backdrop.classList.add("is-open");
    document.body.classList.add("vetmell-no-scroll");
  }

  function closeSlotModal() {
    const backdrop = document.getElementById(MODAL_ID);

    if (!backdrop) {
      return;
    }

    selectedSlot = null;

    backdrop.classList.remove("is-open");
    document.body.classList.remove("vetmell-no-scroll");
  }

  async function bookSelectedSlot() {
    if (!selectedSlot || !selectedSlot.id) {
      return;
    }

    const backdrop = ensureModal();
    const bookBtn = backdrop.querySelector("#vetmellSlotBookBtn");
    const originalText = bookBtn.textContent;

    try {
      bookBtn.disabled = true;
      bookBtn.textContent = "Rezerwuję...";

      const response = await fetch(
        window.VETMELL_BOOK_VISIT_URL || "main_make_appointment/book_visit.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visit_id: selectedSlot.id,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Nie udało się umówić wizyty");
      }

      alert(
        `Wizyta została umówiona:\n${selectedSlot.date} ${selectedSlot.time}\nLekarz: ${selectedSlot.doctor}`
      );

      closeSlotModal();
      window.location.reload();
    } catch (error) {
      alert("Błąd: " + error.message);
    } finally {
      bookBtn.disabled = false;
      bookBtn.textContent = originalText || "Umów wizytę";
    }
  }

function watchCalendar(host) {
  if (!host || host.__vetmellCalendarWatcher) {
    return;
  }

  host.__vetmellCalendarWatcher = true;

  decorateCalendar(host);

  setTimeout(() => decorateCalendar(host), 100);
  setTimeout(() => decorateCalendar(host), 300);
  setTimeout(() => decorateCalendar(host), 700);

host.addEventListener("click", (event) => {
  const navBtn = event.target.closest(".sgcal__prev, .sgcal__next");

  if (!navBtn) {
    return;
  }

  if (!isBuilder()) {
    event.preventDefault();
    event.stopPropagation();

    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    host.dataset.vetmellUserNavigated = "1";

    const root = host.querySelector("[data-root]");

    if (!root) {
      return;
    }

    const cfg = getCalendarCfg(host, root);
    const direction = navBtn.classList.contains("sgcal__prev") ? -1 : 1;
    const next = normalizeYearMonth(cfg.year, cfg.month + direction);

    setCalendarMonth(host, root, next.year, next.month);
    decorateCalendar(host);

    return;
  }

  setTimeout(() => decorateCalendar(host), 80);
  setTimeout(() => decorateCalendar(host), 180);
}, true);
}

  function initAppointmentCalendars() {
    findCalendarHosts().forEach(watchCalendar);
  }

  function boot() {
    initAppointmentCalendars();

    let tries = 0;

    const timer = window.setInterval(() => {
      tries += 1;

      initAppointmentCalendars();

      if (tries >= 30) {
        window.clearInterval(timer);
      }
    }, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();