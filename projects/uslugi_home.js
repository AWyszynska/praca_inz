(function () {
const CLOSED_H = 205;
const OPEN_H = 330;
const ROW_GAP = 60;
const DETAILS_START_Y = 190;

  function esc(value) {
    if (window.CSS && CSS.escape) {
      return CSS.escape(String(value));
    }

    return String(value).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  function numPx(value) {
    return parseInt(String(value || "0").replace("px", ""), 10) || 0;
  }

  function getButtonText(btnWrap) {
    return (btnWrap.textContent || "").trim().toLowerCase();
  }

  function isServiceButton(btnWrap) {
    return getButtonText(btnWrap).includes("dowiedz się więcej")
      || getButtonText(btnWrap).includes("zwiń");
  }

  function getServiceCards() {
    return Array.from(document.querySelectorAll('.page-element[data-type="block"]'))
      .filter((card) => {
        const btn = card.querySelector('.page-element[data-type="button"]');
        return btn && isServiceButton(btn);
      })
      .sort((a, b) => {
        const ay = numPx(a.style.top);
        const by = numPx(b.style.top);
        const ax = numPx(a.style.left);
        const bx = numPx(b.style.left);

        if (Math.abs(ay - by) > 20) {
          return ay - by;
        }

        return ax - bx;
      });
  }

  function getCardId(card) {
    return String(card.dataset.id || "");
  }

  function getDetails(card) {
    return Array.from(card.children).filter((child) => {
      if (!child.classList || !child.classList.contains("page-element")) {
        return false;
      }

      if (child.getAttribute("data-type") === "button") {
        return false;
      }

      return child.offsetTop >= DETAILS_START_Y;
    });
  }

  function setButtonText(card, open) {
    const btnText = card.querySelector('.page-element[data-type="button"] .sgbtn__text');
    const btn = card.querySelector('.page-element[data-type="button"] .sgbtn');

    const text = open ? "Zwiń" : "Dowiedz się więcej";

    if (btnText) {
      btnText.textContent = text;
      return;
    }

    if (btn) {
      btn.textContent = text;
    }
  }

  function groupRows(cards) {
    const rows = [];

    cards.forEach((card) => {
      const top = numPx(card.dataset.serviceOriginalTop || card.style.top);
      let row = rows.find((r) => Math.abs(r.top - top) <= 30);

      if (!row) {
        row = {
          top,
          cards: [],
        };

        rows.push(row);
      }

      row.cards.push(card);
    });

    rows.forEach((row) => {
      row.cards.sort((a, b) => {
        return numPx(a.style.left) - numPx(b.style.left);
      });
    });

    rows.sort((a, b) => a.top - b.top);

    return rows;
  }

  function layoutCards() {
    const cards = getServiceCards();

    if (!cards.length) {
      return;
    }

    const startY = Math.min(
      ...cards.map((card) => numPx(card.dataset.serviceOriginalTop || card.style.top))
    );

    const rows = groupRows(cards);
    let y = startY;

    rows.forEach((row) => {
      let rowHeight = CLOSED_H;

      row.cards.forEach((card) => {
        const open = card.dataset.serviceOpen === "1";
        const height = open ? OPEN_H : CLOSED_H;

        card.style.top = y + "px";
        card.style.height = height + "px";

        if (open) {
          card.classList.add("sg-service-open");
        } else {
          card.classList.remove("sg-service-open");
        }

        getDetails(card).forEach((detail) => {
  detail.classList.add("sg-service-detail");

  if (open) {
    detail.style.visibility = "visible";
    detail.style.opacity = "1";
    detail.style.pointerEvents = "auto";
  } else {
    detail.style.visibility = "hidden";
    detail.style.opacity = "0";
    detail.style.pointerEvents = "none";
  }
});

        setButtonText(card, open);

        rowHeight = Math.max(rowHeight, height);
      });

      y += rowHeight + ROW_GAP;
    });

    const spacer = document.getElementById("sg-scroll-spacer");

    if (spacer) {
      spacer.style.height = Math.max(y + 180, 1000) + "px";
    }

    if (typeof window.sgRefreshFinalLayout === "function") {
      window.sgRefreshFinalLayout();
    }
  }

  function prepareCards() {
    const cards = getServiceCards();

    cards.forEach((card) => {
      if (!card.dataset.serviceOriginalTop) {
        card.dataset.serviceOriginalTop = String(numPx(card.style.top));
      }

      if (!card.dataset.serviceOpen) {
        card.dataset.serviceOpen = "0";
      }

      card.classList.add("sg-service-card");
      card.classList.add("sg-service-ready");

      card.style.overflow = "hidden";

      getDetails(card).forEach((detail) => {
        detail.classList.add("sg-service-detail");
      });

      const btn = card.querySelector('.page-element[data-type="button"]');
      if (btn) {
        btn.classList.add("sg-service-more-btn");
      }
    });

    layoutCards();
  }

  function bindButtons() {
    document.addEventListener("click", function (event) {
      const btnWrap = event.target.closest('.page-element[data-type="button"]');

      if (!btnWrap || !isServiceButton(btnWrap)) {
        return;
      }

      const card = btnWrap.closest('.page-element[data-type="block"]');

      if (!card || !card.classList.contains("sg-service-card")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }

      card.dataset.serviceOpen = card.dataset.serviceOpen === "1" ? "0" : "1";
      layoutCards();
    }, true);
  }

  function boot() {
    prepareCards();
    bindButtons();

    setTimeout(prepareCards, 100);
    setTimeout(prepareCards, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();