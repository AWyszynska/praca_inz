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
        <option value="'Segoe UI', sans-serif">Standardowa (Segoe UI)</option>
        <option value="'Arial', sans-serif">Arial</option>
        <option value="'Verdana', sans-serif">Verdana</option>
        <option value="'Times New Roman', serif">Times New Roman</option>
        <option value="'Georgia', serif">Georgia</option>
        <option value="'Courier New', monospace">Courier New</option>
        <option value="'Brush Script MT', cursive">Artystyczna (Brush Script)</option>
      </select>
    </div>
  </div>

</div>
