<div id="nav-edit-section" style="display:none; margin-top:14px;">
  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:12px 0 8px;">
    <h3 style="margin:0; font-size:13px; color:#0f172a;">Panel nawigacyjny</h3>
  </div>
  <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#f8fafc; margin-bottom:10px;">
    <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Podgląd (klikany testowo)</div>

    <div id="nav-panel-preview" style="height:86px;"></div>

    <div id="nav-preview-status" style="font-size:12px;color:#64748b;margin-top:8px; line-height:1.35;">
      Kliknij link w podglądzie - zobaczysz symulację działania (bez prawdziwej nawigacji).
    </div>
  </div>

  <label>POZYCJE MENU</label>
  <div style="font-size:12px; color:#64748b; margin:-6px 0 8px; line-height:1.35;">
    Każda linia: <b>Etykieta|href</b> albo <b>Etykieta|href|key</b> (key ułatwia późniejsze podpinanie funkcjonalności).
  </div>
  <textarea id="nav-items" rows="6" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px; box-sizing:border-box; font-size:13px;"></textarea>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
    <div>
      <label>Layout</label>
      <select id="nav-layout">
        <option value="pills" selected>Pills</option>
        <option value="tabs">Tabs</option>
        <option value="underline">Underline</option>
        <option value="sidebar">Sidebar</option>
      </select>
    </div>
    <div>
      <label>Orientacja</label>
      <select id="nav-orientation">
        <option value="horizontal" selected>Poziomo</option>
        <option value="vertical">Pionowo</option>
      </select>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
    <div>
      <label>Wyrównanie</label>
      <select id="nav-align">
        <option value="left" selected>Lewo</option>
        <option value="center">Środek</option>
        <option value="right">Prawo</option>
      </select>
    </div>
    <div>
      <label>Hook (łatwe podpięcie później)</label>
      <select id="nav-hook-mode">
        <option value="none" selected>Brak</option>
        <option value="event">Event (sg:navigate)</option>
      </select>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
    <div>
      <label>Nazwa nawigacji (opcjonalnie)</label>
      <input type="text" id="nav-name" placeholder="np. mainNav">
    </div>
    <div>
      <label>ID / Klasy (opcjonalnie)</label>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <input type="text" id="nav-html-id" placeholder="id">
        <input type="text" id="nav-html-class" placeholder="class">
      </div>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
    <div>
      <label>Brand tekst</label>
      <input type="text" id="nav-brand-text" placeholder="np. LOGO / Nazwa">
    </div>
    <div>
      <label>Brand href</label>
      <input type="text" id="nav-brand-href" placeholder="?page=home">
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
    <div>
      <label>Rozmieszczenie (poziomy)</label>
      <select id="nav-justify">
        <option value="start" selected>Start (lewo)</option>
        <option value="center">Center</option>
        <option value="end">End (prawo)</option>
        <option value="between">Space-between</option>
        <option value="around">Space-around</option>
        <option value="evenly">Space-evenly</option>
      </select>
    </div>
    <div>
      <label>Rozmieszczenie (pionowy)</label>
      <select id="nav-v-justify">
        <option value="top" selected>Top</option>
        <option value="center">Center</option>
        <option value="bottom">Bottom</option>
      </select>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:6px;">
    <div>
      <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:12px; color:#0f172a; margin-top:6px;">
        <input type="checkbox" id="nav-wrap" style="width:auto;"> zawijaj (wrap)
      </label>
    </div>
    <div>
      <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:12px; color:#0f172a; margin-top:6px;">
        <input type="checkbox" id="nav-stretch" style="width:auto;"> rozciągnij linki
      </label>
    </div>
    <div>
      <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:12px; color:#0f172a; margin-top:6px;">
        <input type="checkbox" id="nav-divider" style="width:auto;"> separatory
      </label>
    </div>
      <div id="nav-divider-wrap" style="display:none; margin-top:10px; border:1px solid #e2e8f0; background:#fff; border-radius:10px; padding:10px;">
    <div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:6px;">
      Separatory między linkami
    </div>

    <label>Co wstawić między linkami?</label>
    <input type="text" id="nav-divider-text" placeholder='np. |   albo  •   albo  <img src="icons/paw.svg">'>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
      <div>
        <label>Wielkość separatora (px)</label>
        <input type="number" id="nav-divider-size" min="6" max="60" value="14">
      </div>

      <div>
        <label>Kolor separatora</label>
        <input type="color" id="nav-divider-color" value="#ffffff">
      </div>
    </div>

    <div style="font-size:12px; color:#64748b; margin-top:8px; line-height:1.35;">
      Możesz wpisać tekst (np. <b>|</b>, <b>-</b>, <b>•</b>) albo wkleić mini-HTML (np. <b>&lt;img ...&gt;</b>).
    </div>
  </div>

  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
    <div>
      <label>Aktywny link (tryb)</label>
      <select id="nav-active-mode">
        <option value="none">Brak</option>
        <option value="url">Porównaj URL</option>
        <option value="query_page" selected>?page=.</option>
      </select>
    </div>
    <div>
      <label>Podkreślenie linków</label>
      <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:12px; color:#0f172a; margin-top:6px;">
        <input type="checkbox" id="nav-underline" style="width:auto;"> underline
      </label>
    </div>
  </div>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
    <div>
      <label>Szerokość (px)</label>
      <input type="number" id="nav-w" min="120" max="1600" value="680">
    </div>
    <div>
      <label>Wysokość (px)</label>
      <input type="number" id="nav-h" min="40" max="400" value="56">
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:6px;">
    <div>
      <label>Gap (px)</label>
      <input type="number" id="nav-gap" min="0" max="80" value="10">
    </div>
    <div>
      <label>Padding wewn. (px)</label>
      <input type="number" id="nav-pad" min="0" max="80" value="10">
    </div>
    <div>
      <label>Radius kontenera (px)</label>
      <input type="number" id="nav-radius" min="0" max="40" value="12">
    </div>
  </div>
  <div style="margin-top:12px; border-top:1px solid #e5e7eb; padding-top:10px;">
    <div style="font-size:12px; color:#334155; font-weight:800; margin-bottom:6px;">Tło</div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div>
        <label>Tryb tła</label>
        <select id="nav-bg-mode">
          <option value="solid" selected>Solid</option>
          <option value="gradient">Gradient</option>
        </select>
      </div>
      <div id="nav-bg-solid-wrap">
        <label>Kolor tła</label>
        <input type="color" id="nav-bg-solid" value="#111827">
      </div>
    </div>

    <div id="nav-bg-grad-wrap" style="display:none; margin-top:8px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <label>Typ gradientu</label>
          <select id="nav-grad-type">
            <option value="linear" selected>linear-gradient</option>
            <option value="radial">radial-gradient</option>
            <option value="conic">conic-gradient</option>
          </select>
        </div>
        <div>
          <label>Preset</label>
          <select id="nav-grad-preset">
            <option value="" selected>— brak —</option>
            <option value="ocean">Ocean</option>
            <option value="sunset">Sunset</option>
            <option value="purple_night">Purple Night</option>
            <option value="candy">Candy</option>
            <option value="forest">Forest</option>
            <option value="neon_blue">Neon Blue</option>
            <option value="gold_warm">Gold Warm</option>
            <option value="cherry">Cherry</option>
            <option value="steel">Steel</option>
            <option value="frost">Frost</option>
            <option value="aurora">Aurora</option>
            <option value="lava">Lava</option>
            <option value="mint">Mint</option>
            <option value="space">Space</option>
            <option value="peach">Peach</option>

            <option value="midnight">Midnight</option>
            <option value="rose">Rose</option>
            <option value="mango">Mango</option>
            <option value="deepsea">Deep Sea</option>
            <option value="horizon">Horizon</option>
            <option value="electric">Electric</option>
            <option value="lime">Lime</option>
            <option value="royal">Royal</option>

          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:8px;">
        <div>
          <label>Kąt (linear/conic)</label>
          <input type="number" id="nav-grad-angle" min="0" max="360" value="135">
        </div>
        <div>
          <label>Pozycja X (radial/conic)</label>
          <input type="number" id="nav-grad-pos-x" min="0" max="100" value="50">
        </div>
        <div>
          <label>Pozycja Y (radial/conic)</label>
          <input type="number" id="nav-grad-pos-y" min="0" max="100" value="50">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:8px;">
        <div>
          <label>Kolor 1</label>
          <input type="color" id="nav-grad-from" value="#0ea5e9">
        </div>
        <div>
          <label style="display:flex; align-items:center; justify-content:space-between;">
            <span>Kolor 2 (środek)</span>
            <span style="font-size:12px; color:#64748b; font-weight:600;">
              <input type="checkbox" id="nav-grad-use-mid" style="width:auto; vertical-align:middle;"> użyj
            </span>
          </label>
          <input type="color" id="nav-grad-mid" value="#a855f7">
        </div>
        <div>
          <label>Kolor 3</label>
          <input type="color" id="nav-grad-to" value="#111827">
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-top:10px;">
        <button type="button" id="nav-grad-swap" class="tool-btn">Swap 1 ⇄ 3</button>
        <button type="button" id="nav-grad-swap-12" class="tool-btn">Swap 1 ⇄ 2</button>
        <button type="button" id="nav-grad-swap-23" class="tool-btn">Swap 2 ⇄ 3</button>
        <button type="button" id="nav-grad-random" class="tool-btn">🎲 Losowy preset</button>
      </div>
    </div>
  </div>
  <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:12px;">
    <div>
      <label>Obramowanie (px)</label>
      <input type="number" id="nav-border-w" min="0" max="12" value="1">
    </div>
    <div>
      <label>Kolor obramowania</label>
      <input type="color" id="nav-border-color" value="#ffffff">
    </div>
    <div>
      <label>Cień kontenera</label>
      <select id="nav-shadow">
        <option value="none">Brak</option>
        <option value="soft" selected>Soft</option>
        <option value="strong">Strong</option>
      </select>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
    <div>
      <label>Kolor tekstu</label>
      <input type="color" id="nav-text-color" value="#ffffff">
    </div>
    <div>
      <label>Rozmiar czcionki (px)</label>
      <input type="number" id="nav-font-size" min="10" max="60" value="15">
    </div>
  </div>
  <label style="margin-top:10px;">Rozciąganie NAV</label>

<label style="display:flex; gap:8px; align-items:center; margin-top:6px; font-weight:600; text-transform:none;">
  <input type="checkbox" id="nav-fill-x">
  Pełna szerokość (X = 100%)
</label>

<label style="display:flex; gap:8px; align-items:center; margin-top:6px; font-weight:600; text-transform:none;">
  <input type="checkbox" id="nav-fill-y">
  Pełna wysokość (Y = 100%)
</label>

  <div style="margin-top:12px; border-top:1px solid #e5e7eb; padding-top:10px;">
    <div style="font-size:12px; color:#334155; font-weight:800; margin-bottom:6px;">Wygląd linków</div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
      <div>
        <label>Padding X</label>
        <input type="number" id="nav-link-pad-x" min="0" max="80" value="12">
      </div>
      <div>
        <label>Padding Y</label>
        <input type="number" id="nav-link-pad-y" min="0" max="80" value="8">
      </div>
      <div>
        <label>Radius linku</label>
        <input type="number" id="nav-link-radius" min="0" max="40" value="8">
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:6px;">
      <div>
        <label>Border linku (px)</label>
        <input type="number" id="nav-link-border-w" min="0" max="8" value="1">
      </div>
      <div>
        <label>Kolor border linku</label>
        <input type="color" id="nav-link-border-color" value="#ffffff">
      </div>
      <div>
        <label>Cień linku</label>
        <select id="nav-link-shadow">
          <option value="none">Brak</option>
          <option value="soft" selected>Soft</option>
        </select>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
      <div>
        <label>Kolor linku</label>
        <input type="color" id="nav-link-color" value="#ffffff">
      </div>
      <div>
        <label>Hover: kolor tekstu</label>
        <input type="color" id="nav-hover-color" value="#ffffff">
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
      <div>
        <label>Hover: tło</label>
        <input type="text" id="nav-hover-bg" value="rgba(255,255,255,0.12)" placeholder="np. rgba(255,255,255,0.12)">
      </div>
      <div>
        <label>Active: tło</label>
        <input type="text" id="nav-active-bg" value="rgba(255,255,255,0.18)" placeholder="np. rgba(255,255,255,0.18)">
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px;">
      <div>
        <label>Active: kolor tekstu</label>
        <input type="color" id="nav-active-color" value="#ffffff">
      </div>
      <div></div>
    </div>

    <div style="margin-top:10px; font-size:12px; color:#64748b; line-height:1.35;">
      Jeśli ustawisz <b>Hook = Event</b>, klik w podglądzie wyemituje zdarzenie:
      <b>document.dispatchEvent(new CustomEvent('sg:navigate', { detail: { key, href, page, navName } }))</b>.
    </div>
  </div>
</div>
