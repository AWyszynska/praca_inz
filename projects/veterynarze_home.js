(function () {
  const START_Y = 251;
  const GAP = 30;
  const CLOSED_H = 290;
  const EXTRA_Y = 216;
  const EXTRA_H = 230;
  const EXTRA_PADDING = 24;

  function esc(s) {
    if (window.CSS && CSS.escape) return CSS.escape(String(s));
    return String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');
  }

  function getVetCards() {
    return Array.from(document.querySelectorAll('.page-element[data-id^="vet_card_"]'))
      .sort((a, b) => {
        const ay = parseInt(a.style.top || '0', 10) || 0;
        const by = parseInt(b.style.top || '0', 10) || 0;
        return ay - by;
      });
  }

  function getVetIdFromCard(card) {
    return String(card.dataset.id || '').replace(/^vet_card_/, '');
  }

  function setButtonText(card, vetId, open) {
    const btnText = card.querySelector(
      '.page-element[data-id="vet_btn_' + esc(vetId) + '"] .sgbtn__text'
    );

    if (btnText) {
      btnText.textContent = open ? 'Zwiń' : 'Czytaj więcej';
      return;
    }

    const btn = card.querySelector(
      '.page-element[data-id="vet_btn_' + esc(vetId) + '"] .sgbtn'
    );

    if (btn) {
      btn.textContent = open ? 'Zwiń' : 'Czytaj więcej';
    }
  }

  function layoutVetCards() {
    const cards = getVetCards();
    let y = START_Y;

    cards.forEach((card) => {
      const vetId = getVetIdFromCard(card);
      if (!vetId) return;

      const extra = document.querySelector(
        '.page-element[data-id="vet_extra_' + esc(vetId) + '"]'
      );

      const open = card.dataset.vetOpen === '1';
      const height = open ? (EXTRA_Y + EXTRA_H + EXTRA_PADDING) : CLOSED_H;

      card.style.top = y + 'px';
      card.style.height = height + 'px';

      if (extra) {
        extra.style.display = open ? 'block' : 'none';
      }

      setButtonText(card, vetId, open);

      y += height + GAP;
    });

    const spacer = document.getElementById('sg-scroll-spacer');
    if (spacer) {
      spacer.style.height = Math.max(y + 120, 900) + 'px';
    }
  }

  function bindVetButtons() {
    document.querySelectorAll('.page-element[data-id^="vet_card_"]').forEach((card) => {
      if (!card.dataset.vetOpen) {
        card.dataset.vetOpen = '0';
      }
    });

    document.addEventListener('click', function (e) {
      const btnWrap = e.target.closest('.page-element[data-type="button"][data-id^="vet_btn_"]');
      if (!btnWrap) return;

      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      const vetId = String(btnWrap.dataset.id || '').replace(/^vet_btn_/, '');
      const card = document.querySelector(
        '.page-element[data-id="vet_card_' + esc(vetId) + '"]'
      );

      if (!card) return;

      card.dataset.vetOpen = card.dataset.vetOpen === '1' ? '0' : '1';
      layoutVetCards();
    }, true);

    layoutVetCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindVetButtons);
  } else {
    bindVetButtons();
  }
})();