
<div id="nav-edit-section" style="display:none; margin-top:14px;">
  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:12px 0 8px;">
    <h3 style="margin:0; font-size:13px; color:#0f172a;">Panel nawigacyjny</h3>
  </div>

  <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#f8fafc; margin-bottom:10px;">
    <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Podgląd</div>
    <div id="nav-panel-preview" style="height:64px;"></div>
    <div style="font-size:12px;color:#64748b;margin-top:6px;">
      Podgląd jest “martwy” w edytorze (żeby dało się zaznaczać element).
    </div>
  </div>

  <label>Pozycje menu (każda linia: Etykieta|href)</label>
  <textarea id="nav-items" rows="6" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px; box-sizing:border-box; font-size:13px;"></textarea>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Układ</label>
      <select id="nav-orientation">
        <option value="horizontal" selected>Poziomy</option>
        <option value="vertical">Pionowy</option>
      </select>
    </div>
    <div>
      <label>Wyrównanie</label>
      <select id="nav-align">
        <option value="left" selected>Lewo</option>
        <option value="center">Środek</option>
        <option value="right">Prawo</option>
      </select>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Aktywny link (tryb)</label>
      <select id="nav-active-mode">
        <option value="none">Brak</option>
        <option value="url">Porównaj URL</option>
        <option value="query_page" selected>?page=...</option>
      </select>
    </div>
    <div>
      <label>Podkreślenie linków</label>
      <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:12px; color:#0f172a; margin-top:6px;">
        <input type="checkbox" id="nav-underline" style="width:auto;"> underline
      </label>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Szerokość (px)</label>
      <input type="number" id="nav-w" min="120" max="1600" value="680">
    </div>
    <div>
      <label>Wysokość (px)</label>
      <input type="number" id="nav-h" min="40" max="400" value="56">
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
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

  <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
    <div>
      <label>Tło kontenera</label>
      <input type="color" id="nav-bg" value="#111827">
    </div>
    <div>
      <label>Border (px)</label>
      <input type="number" id="nav-border-w" min="0" max="10" value="1">
    </div>
    <div>
      <label>Cień</label>
      <select id="nav-shadow">
        <option value="none">Brak</option>
        <option value="soft" selected>Soft</option>
        <option value="strong">Strong</option>
      </select>
    </div>
  </div>

  <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0;">
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button type="button" id="nav-preset-dark" class="btn" style="width:auto; padding:8px 10px; margin-top:0; background:#111827; color:#fff;">Preset: Dark</button>
      <button type="button" id="nav-preset-light" class="btn" style="width:auto; padding:8px 10px; margin-top:0; background:#e2e8f0; color:#0f172a;">Preset: Light</button>
    </div>
  </div>

  <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0;">
    <h4 style="margin:0 0 8px; font-size:12px; color:#0f172a;">Wygląd linków</h4>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div>
        <label>Kolor tekstu</label>
        <input type="color" id="nav-link-color" value="#ffffff">
      </div>
      <div>
        <label>Hover tło</label>
        <input type="text" id="nav-hover-bg" value="rgba(255,255,255,0.12)">
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div>
        <label>Hover kolor</label>
        <input type="color" id="nav-hover-color" value="#ffffff">
      </div>
      <div>
        <label>Active tło</label>
        <input type="text" id="nav-active-bg" value="rgba(255,255,255,0.18)">
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div>
        <label>Active kolor</label>
        <input type="color" id="nav-active-color" value="#ffffff">
      </div>
      <div></div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
      <div>
        <label>Padding X (px)</label>
        <input type="number" id="nav-link-pad-x" min="0" max="80" value="12">
      </div>
      <div>
        <label>Padding Y (px)</label>
        <input type="number" id="nav-link-pad-y" min="0" max="80" value="8">
      </div>
      <div>
        <label>Radius linku (px)</label>
        <input type="number" id="nav-link-radius" min="0" max="40" value="8">
      </div>
    </div>
  </div>

  <div style="margin-top:10px; font-size:12px; color:#64748b; line-height:1.35;">
    <b>XML (nowe znaczniki – do dopisania w super_generator.php / saveRecursive):</b><br>
    navItems, navOrientation, navAlign, navGap, navPad,<br>
    navLinkPadX, navLinkPadY, navLinkRadius, navUnderline,<br>
    navLinkColor, navHoverBg, navHoverColor, navActiveBg, navActiveColor, navActiveMode
  </div>
</div>
