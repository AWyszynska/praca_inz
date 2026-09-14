(function () {
  const RIGHT_BLOCK_ID = 'el_1778152859177_477183';

  const CSS_URL = 'projects/main_contact.css?v=' + Date.now();
  const PHP_URL = 'projects/main_contact.php?v=' + Date.now();

  function loadCss() {
    if (document.querySelector('link[data-contact-map-css="1"]')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    link.dataset.contactMapCss = '1';
    document.head.appendChild(link);
  }

  function fallbackMapHtml() {
    return `
      <div class="contact-map">
        <iframe
          title="Mapa dojazdu do VetMell"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=Warszawa%2C+ul.+Zwierzęca+12&output=embed">
        </iframe>
      </div>
    `;
  }

  async function insertContactMap() {
    loadCss();

    const rightBlock = document.querySelector(
      '.page-element[data-id="' + RIGHT_BLOCK_ID + '"]'
    );

    if (!rightBlock) {
      console.warn('[kontakt_home] Nie znaleziono prawego bloku:', RIGHT_BLOCK_ID);
      return;
    }

    if (rightBlock.querySelector('.contact-map-host')) {
      return;
    }

    const host = document.createElement('div');
    host.className = 'contact-map-host';

    try {
      const res = await fetch(PHP_URL, {
        credentials: 'same-origin'
      });

      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }

      host.innerHTML = await res.text();
    } catch (err) {
      console.warn('[kontakt_home] Nie udało się pobrać main_contact.php:', err);
      host.innerHTML = fallbackMapHtml();
    }

    rightBlock.appendChild(host);

    if (typeof window.sgRefreshFinalLayout === 'function') {
      window.sgRefreshFinalLayout();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertContactMap);
  } else {
    insertContactMap();
  }
})();