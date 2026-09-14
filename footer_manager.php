<div id="footer-edit-section" style="display:none;">
  <div style="display:flex; gap:8px; margin-bottom:10px;">
    <button type="button" class="tool-btn" id="footer-open-as-target">🎯 Otwórz (dodawaj do stopki)</button>
    <button type="button" class="tool-btn" id="footer-close-target">↩ Wróć na ekran</button>
  </div>

  <label>Stopka: tryb</label>
  <select id="footer-mode">
    <option value="fixed">Przyklejona (podąża za scrollem)</option>
    <option value="page">Na stronie (na dole / u góry strony)</option>
  </select>

  <label>Stopka: pozycja (dock)</label>
  <select id="footer-dock">
    <option value="bottom">Dół</option>
    <option value="top">Góra</option>
  </select>

  <label>Odstęp od krawędzi (px)</label>
  <input type="number" id="footer-offset" value="0" min="0">

  <label>Odstęp od lewej (px)</label>
  <input type="number" id="footer-left" value="0" min="0">
<hr style="margin:12px 0; border:none; border-top:1px solid #e2e8f0;">

<label style="display:flex; align-items:center; gap:8px;">
  <input type="checkbox" id="footer-flex" checked>
  Układ: flex
</label>

<label>Rozstaw w poziomie (justify-content)</label>
<select id="footer-justify">
  <option value="flex-start">Do lewej</option>
  <option value="center">Środek</option>
  <option value="flex-end">Do prawej</option>
  <option value="space-between" selected>Space-between</option>
  <option value="space-around">Space-around</option>
  <option value="space-evenly">Space-evenly</option>
</select>

<label>Wyrównanie w pionie (align-items)</label>
<select id="footer-align">
  <option value="stretch">Stretch</option>
  <option value="flex-start">Góra</option>
  <option value="center" selected>Środek</option>
  <option value="flex-end">Dół</option>
  <option value="baseline">Baseline</option>
</select>

<label style="display:flex; align-items:center; gap:8px;">
  <input type="checkbox" id="footer-wrap" checked>
  Zawijaj elementy (flex-wrap: wrap)
</label>

<label>Odstęp między elementami (gap px)</label>
<input type="number" id="footer-gap" value="12" min="0" step="1">

  <div style="margin-top:12px; padding-top:12px; border-top:1px solid #e5e7eb;">
    <div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:8px;">
      Wygląd stopki
    </div>

    <label>Tło: tryb</label>
    <select id="footer-bg-mode">
      <option value="solid">Kolor</option>
      <option value="gradient">Gradient</option>
    </select>

    <div id="footer-bg-solid-wrap" style="margin-top:8px;">
      <label>Kolor tła</label>
      <input type="color" id="footer-bg-solid" value="#111827">
    </div>

    <div id="footer-bg-grad-wrap" style="display:none; margin-top:8px;">
      <label>Kąt gradientu (0-360)</label>
      <input type="number" id="footer-grad-angle" value="135" min="0" max="360">
      <label style="margin-top:8px;">Kolor 1</label>
      <input type="color" id="footer-grad-from" value="#111827">
      <label style="margin-top:8px;">Kolor 2</label>
      <input type="color" id="footer-grad-to" value="#0f172a">
    </div>

    <label style="margin-top:12px;">Kolor tekstu</label>
    <input type="color" id="footer-text-color" value="#ffffff">

    <label style="margin-top:12px;">Wysokość (px)</label>
    <input type="number" id="footer-height" value="80" min="20" max="600">

    <label style="margin-top:12px;">Padding wewnętrzny (px)</label>
    <input type="number" id="footer-pad" value="16" min="0" max="80">

    <label style="margin-top:12px;">Zaokrąglenie rogów (px)</label>
    <input type="range" id="footer-radius" min="0" max="80" value="0">

    <label style="margin-top:12px;">
      <input type="checkbox" id="footer-border-on"> Obramowanie
    </label>
    <div id="footer-border-wrap" style="display:none; margin-top:8px;">
      <label>Grubość (px)</label>
      <input type="number" id="footer-border-w" value="1" min="0" max="20">
      <label style="margin-top:8px;">Kolor obramowania</label>
      <input type="color" id="footer-border-color" value="#334155">
    </div>

    <label style="margin-top:12px;">Cień</label>
    <select id="footer-shadow-on">
      <option value="off">Wyłączony</option>
      <option value="on">Włączony</option>
    </select>
    <div id="footer-shadow-wrap" style="display:none; margin-top:8px;">
      <label>X</label>
      <input type="number" id="footer-shadow-x" value="0">
      <label style="margin-top:8px;">Y</label>
      <input type="number" id="footer-shadow-y" value="12">
      <label style="margin-top:8px;">Blur</label>
      <input type="number" id="footer-shadow-blur" value="30" min="0">
      <label style="margin-top:8px;">Spread</label>
      <input type="number" id="footer-shadow-spread" value="0">
      <label style="margin-top:8px;">Kolor</label>
      <input type="color" id="footer-shadow-color" value="#000000">
      <label style="margin-top:8px;">Alpha (%)</label>
      <input type="range" id="footer-shadow-alpha" min="0" max="100" value="18">
    </div>

    <label style="margin-top:12px;">Glass blur (backdrop-filter)</label>
    <input type="range" id="footer-blur" min="0" max="30" value="0">

    <label style="margin-top:12px;">Przezroczystość (%)</label>
    <input type="range" id="footer-opacity" min="0" max="100" value="100">
  </div>

  <div style="margin-top:10px; font-size:12px; color:#64748b; line-height:1.3;">
    Zmiany zapisują się do XML (stopka + wygląd).  
  </div>
</div>
