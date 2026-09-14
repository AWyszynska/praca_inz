<div id="slider-edit-section" style="display:none; margin-top:15px; border-top:1px solid #e2e8f0; padding-top:15px;">

  <label style="color:#1e293b; font-size:12px;">ZSUWAK (slider)</label>

  <label style="color:#475569; font-size:12px; margin-top:10px;">Presety PRO (1 klik)</label>
  <div style="display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 12px;">
    <button type="button" class="tool-btn" id="slider-preset-minimal">Minimal</button>
    <button type="button" class="tool-btn" id="slider-preset-soft">Soft</button>
    <button type="button" class="tool-btn" id="slider-preset-neon">Neon</button>
    <button type="button" class="tool-btn" id="slider-preset-glass">Glass</button>
  </div>

  <label style="color:#1e293b; font-size:12px; margin-top:10px;">Treść</label>
  <label style="color:#475569; font-size:12px; margin-top:6px;">Etykieta</label>
  <input type="text" id="slider-label" placeholder="Np. Poziom głośności">

  <div style="display:flex; gap:8px; margin-top:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Jednostka (opcjonalnie)</label>
      <input type="text" id="slider-unit" placeholder="np. % / km / zł">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Pokaż wartość</label>
      <select id="slider-show-value">
        <option value="1">Tak</option>
        <option value="0">Nie</option>
      </select>
    </div>
  </div>

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Zakres</label>
  <div style="display:flex; gap:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Min</label>
      <input type="number" id="slider-min" value="0">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Max</label>
      <input type="number" id="slider-max" value="100">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Krok</label>
      <input type="number" id="slider-step" value="1">
    </div>
  </div>

  <label style="color:#475569; font-size:12px; margin-top:8px;">Wartość</label>
  <input type="number" id="slider-value" value="50">

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Wygląd PRO</label>
  <div style="display:flex; gap:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Kolor toru</label>
      <input type="color" id="slider-track" value="#e2e8f0">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Kolor wypełnienia</label>
      <input type="color" id="slider-fill" value="#156fe5">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Kolor gałki</label>
      <input type="color" id="slider-thumb" value="#156fe5">
    </div>
  </div>

  <div style="display:flex; gap:8px; margin-top:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Wysokość toru (px)</label>
      <input type="number" id="slider-track-h" value="8" min="2" max="40">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Rozmiar gałki (px)</label>
      <input type="number" id="slider-thumb-s" value="18" min="10" max="40">
    </div>
  </div>

  <div style="display:flex; gap:8px; margin-top:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Szerokość elementu (px)</label>
      <input type="number" id="slider-width" value="280" min="120">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Wysokość elementu (px)</label>
      <input type="number" id="slider-height" value="90" min="50">
    </div>
  </div>

  <label style="color:#475569; font-size:12px; margin-top:10px;">Podpisy min/max (PRO)</label>
  <select id="slider-show-minmax">
    <option value="0">Nie</option>
    <option value="1">Tak</option>
  </select>

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Przypięcie</label>
  <div style="display:flex; gap:8px;">
    <button type="button" class="tool-btn" id="slider-pin-to-target" style="flex:1;">📌 Przypnij do aktywnej ramki</button>
    <button type="button" class="tool-btn" id="slider-unpin-to-canvas" style="flex:1;">🧷 Odepnij na ekran</button>
  </div>


</div>
