<div style="margin-top:10px;">

  <div class="text-toolbar">
    <button type="button" class="tool-btn" id="tool-bold"><b>B</b></button>
    <button type="button" class="tool-btn" id="tool-italic"><i>I</i></button>
    <button type="button" class="tool-btn" id="tool-underline"><u>U</u></button>
    <button type="button" class="tool-btn" id="tool-strike"><s>S</s></button>

    <span class="tool-sep"></span>

    <button type="button" class="tool-btn" id="tool-align-left">⬅</button>
    <button type="button" class="tool-btn" id="tool-align-center">↔</button>
    <button type="button" class="tool-btn" id="tool-align-right">➡</button>
    <button type="button" class="tool-btn" id="tool-align-justify">☰</button>

    <span class="tool-sep"></span>

    <button type="button" class="tool-btn" id="tool-clear-format">🧹 Wyczyść</button>
    <span class="tool-sep"></span>
<button type="button" class="tool-btn" id="tool-link" title="Zrób link z zaznaczenia">🔗 Link</button>
<button type="button" class="tool-btn" id="tool-unlink" title="Usuń link">⛔ Usuń</button>

  </div>
<div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:8px;">
  <input type="text" id="prop-link-href" placeholder="https://... / #sekcja / mailto: / tel:" style="flex:1; min-width:190px;">
  <select id="prop-link-target" style="min-width:120px;">
    <option value="_self">Ta karta</option>
    <option value="_blank">Nowa karta</option>
  </select>
</div>

  <label>Interlinia:</label>
  <select id="prop-line-height">
    <option value="1">1.0</option>
    <option value="1.15">1.15</option>
    <option value="1.2" selected>1.2</option>
    <option value="1.4">1.4</option>
    <option value="1.6">1.6</option>
    <option value="2">2.0</option>
  </select>

  <label>Odstęp liter (px):</label>
  <input type="number" id="prop-letter-spacing" value="0" step="0.5">

  <label>Odstęp słów (px):</label>
  <input type="number" id="prop-word-spacing" value="0" step="1">

  <label>Wcięcie pierwszej linii (px):</label>
  <input type="number" id="prop-text-indent" value="0" step="5">

  <label>Wielkość liter:</label>
  <select id="prop-text-transform">
    <option value="none" selected>Normalne</option>
    <option value="uppercase">WIELKIE</option>
    <option value="lowercase">małe</option>
    <option value="capitalize">Każde Słowo</option>
  </select>

  <label>Podświetlenie (marker):</label>
  <input type="color" id="prop-highlight" value="#ffff00">

  <div class="font-property-group" style="margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    <button type="button" id="toggle-fonts-btn" class="btn" style="background: #64748b; color: white; font-size: 12px; padding: 8px;">
      🔡 Opcje czcionki (rozwiń)
    </button>

    <div id="font-options" style="display: none; margin-top: 12px; background: #f1f5f9; padding: 12px; border-radius: 6px;">
      <label style="display: block; font-size: 12px; margin-bottom: 6px; color: #475569;">Krój pisma:</label>
      <select id="prop-font-family">
  <option value="'Segoe UI', system-ui, -apple-system, sans-serif">Standardowa (Segoe UI / system)</option>
<option value="Georgia, serif">Georgia</option>
  <option value="Arial, Helvetica, sans-serif">Arial / Helvetica</option>
  <option value="Verdana, Geneva, sans-serif">Verdana</option>
  <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
  <option value="'Trebuchet MS', Arial, sans-serif">Trebuchet MS</option>
  <option value="Calibri, 'Segoe UI', sans-serif">Calibri</option>
  <option value="'Gill Sans', 'Segoe UI', sans-serif">Gill Sans</option>
  <option value="'Lucida Sans Unicode', 'Lucida Grande', sans-serif">Lucida Sans</option>

  <option value="'Times New Roman', Times, serif">Times New Roman</option>
  <option value="Georgia, serif">Georgia</option>
  <option value="Garamond, 'Times New Roman', serif">Garamond</option>
  <option value="'Palatino Linotype', Palatino, serif">Palatino</option>
  <option value="Cambria, Georgia, serif">Cambria</option>
  <option value="Baskerville, 'Times New Roman', serif">Baskerville</option>

  <option value="'Courier New', Courier, monospace">Courier New</option>
  <option value="Consolas, Monaco, monospace">Consolas</option>
  <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>

  <option value="Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif">Impact</option>
  <option value="'Comic Sans MS', 'Comic Sans', cursive">Comic Sans</option>
  <option value="'Brush Script MT', 'Comic Sans MS', cursive">Artystyczna (Brush Script)</option>
</select>

    </div>
  </div>

</div>
