<div id="block-edit-section" style="display:none; margin-top:15px; border-top:1px solid #e2e8f0; padding-top:15px;">

  <label style="color:#1e293b; font-size:12px;">Presety (1 klik)</label>
  <div style="display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 12px;">
    <button type="button" class="tool-btn" id="block-preset-card">Card</button>
    <button type="button" class="tool-btn" id="block-preset-glass">Glass</button>
    <button type="button" class="tool-btn" id="block-preset-ombre">Ombre</button>
    <button type="button" class="tool-btn" id="block-preset-glow">Glow</button>
    <button type="button" class="tool-btn" id="block-preset-flat">Flat</button>
  </div>

  <label style="color:#1e293b; font-size:12px;">Rozmiar</label>
  <label style="color:#475569; font-size:12px; margin-top:8px;">Szerokość (px)</label>
  <input type="number" id="prop-width" value="260" min="1">

  <label style="color:#475569; font-size:12px; margin-top:8px;">Wysokość (px)</label>
  <input type="number" id="prop-height" value="140" min="1">

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Zaokrąglenie rogów (px)</label>
  <input type="range" id="prop-radius" min="0" max="80" value="16">

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Przezroczystość (%)</label>
  <input type="range" id="prop-opacity" min="0" max="100" value="100">

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Tło</label>
  <select id="block-bg-mode">
    <option value="solid">Jednolity kolor</option>
    <option value="gradient">Gradient / Ombre</option>
  </select>

  <div id="block-bg-solid-controls" style="margin-top:8px;">
    <label style="color:#475569; font-size:12px;">Kolor tła</label>
    <input type="color" id="prop-bg-color" value="#ffffff">
  </div>

  <div id="block-bg-gradient-controls" style="display:none; margin-top:8px;">
    <label style="color:#475569; font-size:12px;">Typ gradientu</label>
    <select id="block-bg-grad-type">
      <option value="linear">Linear</option>
      <option value="radial">Radial</option>
    </select>

    <label style="color:#475569; font-size:12px; margin-top:8px;">Kąt (0-360)</label>
    <input type="number" id="block-bg-grad-angle" value="135" min="0" max="360">

    <label style="color:#475569; font-size:12px; margin-top:8px;">Kolor 1</label>
    <input type="color" id="block-bg-grad-1" value="#ffffff">

    <label style="color:#475569; font-size:12px; margin-top:8px;">Kolor 2</label>
    <input type="color" id="block-bg-grad-2" value="#c7d2fe">
  </div>

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Obramowanie</label>
  <label style="color:#475569; font-size:12px; margin-top:8px;">Styl</label>
  <select id="prop-border-style">
    <option value="solid">Solid</option>
    <option value="dashed">Dashed</option>
    <option value="dotted">Dotted</option>
    <option value="none">None</option>
  </select>

  <label style="color:#475569; font-size:12px; margin-top:8px;">Grubość (px)</label>
  <input type="number" id="prop-border-width" value="1" min="0">

  <label style="color:#475569; font-size:12px; margin-top:8px;">Kolor</label>
  <input type="color" id="prop-border-color" value="#e2e8f0">

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Cień</label>
  <select id="block-shadow-enable">
    <option value="on">Włączony</option>
    <option value="off">Wyłączony</option>
  </select>

  <div id="block-shadow-controls" style="margin-top:8px;">
    <label style="color:#475569; font-size:12px;">X</label>
    <input type="number" id="block-shadow-x" value="0">

    <label style="color:#475569; font-size:12px; margin-top:8px;">Y</label>
    <input type="number" id="block-shadow-y" value="12">

    <label style="color:#475569; font-size:12px; margin-top:8px;">Blur</label>
    <input type="number" id="block-shadow-blur" value="30" min="0">

    <label style="color:#475569; font-size:12px; margin-top:8px;">Spread</label>
    <input type="number" id="block-shadow-spread" value="0">

    <label style="color:#475569; font-size:12px; margin-top:8px;">Kolor cienia</label>
    <input type="color" id="block-shadow-color" value="#000000">

    <label style="color:#475569; font-size:12px; margin-top:8px;">Alpha (%)</label>
    <input type="range" id="block-shadow-alpha" min="0" max="100" value="12">
  </div>

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Glass blur (backdrop-filter)</label>
  <input type="range" id="block-backdrop-blur" min="0" max="30" value="0">
<div style="margin-top:12px; padding-top:10px; border-top:1px solid #e2e8f0;">
  <div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:8px;">
    Opcje w Final View (dla tej ramki)
  </div>

  <label style="text-transform:none; font-weight:600; font-size:12px; color:#334155;">
    <input type="checkbox" class="fvOpt" value="bg"> Tło
  </label><br>

  <label style="text-transform:none; font-weight:600; font-size:12px; color:#334155;">
    <input type="checkbox" class="fvOpt" value="border"> Obramowanie
  </label><br>

  <label style="text-transform:none; font-weight:600; font-size:12px; color:#334155;">
    <input type="checkbox" class="fvOpt" value="radius"> Zaokrąglenie
  </label><br>

  <label style="text-transform:none; font-weight:600; font-size:12px; color:#334155;">
    <input type="checkbox" class="fvOpt" value="shadow"> Cień
  </label><br>

  <label style="text-transform:none; font-weight:600; font-size:12px; color:#334155;">
    <input type="checkbox" class="fvOpt" value="blur"> Glass blur
  </label><br>

  <label style="text-transform:none; font-weight:600; font-size:12px; color:#334155;">
    <input type="checkbox" class="fvOpt" value="opacity"> Przezroczystość
  </label>
</div>

</div>
