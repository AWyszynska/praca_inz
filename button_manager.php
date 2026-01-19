
<div id="button-edit-section" style="display:none; margin-top:14px;">
  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:12px 0 8px;">
    <h3 style="margin:0; font-size:13px; color:#0f172a;">Guzik</h3>
    <span style="font-size:11px; color:#64748b;">Edycja</span>
  </div>

  <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#f8fafc; margin-bottom:10px;">
    <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Warstwa guzika</div>

    <div id="btn-target-state" style="font-size:12px; color:#0f172a; margin-bottom:8px;">
      Dodajesz do: <b>Główny ekran</b>
    </div>

    <div style="display:flex; gap:8px;">
      <button type="button" id="btn-open-as-target"
        style="flex:1; border:1px solid #cbd5e1; background:#fff; border-radius:8px; padding:8px 10px; cursor:pointer; font-weight:700;">
        🎯 Otwórz (dodawaj do guzika)
      </button>
      <button type="button" id="btn-close-target"
        style="width:90px; border:1px solid #cbd5e1; background:#fff; border-radius:8px; padding:8px 10px; cursor:pointer;">
        Zamknij
      </button>
    </div>

    <div style="font-size:12px; color:#64748b; margin-top:8px; line-height:1.35;">
      Po otwarciu: nowe elementy (tekst/zdjęcie/ramka itd.) będą dodawane <b>do środka</b> tego guzika.
      <br>Na razie guzik w final view może mieć akcję ustawioną na <b>NONE</b>.
    </div>
  </div>

  <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#f8fafc; margin-bottom:10px;">
    <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Podgląd</div>
    <div style="height:48px;">
      <button type="button" id="btn-preview" class="sgbtn" style="width:100%; height:100%;">Kliknij</button>
    </div>
    <div style="font-size:12px;color:#64748b;margin-top:6px;">
      W builderze klik w guzik nie odpala akcji (żeby można było go zaznaczać i przeciągać).
    </div>
  </div>

  <label>Tekst guzika</label>
  <input type="text" id="btn-text" placeholder="Np. Wyślij / Zobacz więcej">

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Ikona (opcjonalnie)</label>
      <input type="text" id="btn-icon" placeholder="Np. ➜ / ✓ / 🔍">
    </div>
    <div>
      <label>Ikona po</label>
      <select id="btn-icon-pos">
        <option value="left" selected>Lewej</option>
        <option value="right">Prawej</option>
      </select>
    </div>
  </div>

  <label>Akcja (final view)</label>
  <select id="btn-action">
    <option value="none" selected>Brak akcji (na razie)</option>
    <option value="link">Otwórz link</option>
    <option value="scroll">Przewiń do elementu</option>
  </select>

  <div id="btn-link-wrap" style="display:none;">
    <label>Adres URL</label>
    <input type="text" id="btn-url" placeholder="https://example.com">

    <label>Otwórz</label>
    <select id="btn-target">
      <option value="_self">W tej samej karcie</option>
      <option value="_blank" selected>W nowej karcie</option>
    </select>
  </div>

  <div id="btn-scroll-wrap" style="display:none;">
    <label>ID elementu (data-id lub #id)</label>
    <input type="text" id="btn-scroll-target" placeholder="Np. el_170... albo #sekcja">

    <label>Offset (px)</label>
    <input type="number" id="btn-scroll-offset" min="0" max="500" value="0">
  </div>

  <div style="margin-top:10px; border-top:1px solid #e2e8f0; padding-top:10px;">
    <div style="font-size:11px; color:#64748b; font-weight:700; margin-bottom:6px; text-transform:uppercase;">
      Atrybuty HTML (opcjonalnie)
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div>
        <label>Tooltip (title)</label>
        <input type="text" id="btn-title" placeholder="Np. Kliknij, aby...">
      </div>
      <div>
        <label>Aria-label</label>
        <input type="text" id="btn-aria" placeholder="Np. Główny CTA">
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
      <div>
        <label>Typ przycisku</label>
        <select id="btn-type">
          <option value="button" selected>button</option>
          <option value="submit">submit</option>
          <option value="reset">reset</option>
        </select>
      </div>
      <div>
        <label>Nazwa pola (name)</label>
        <input type="text" id="btn-name" placeholder="Np. cta_main">
      </div>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
    <div>
      <label>Wygląd (preset)</label>
      <select id="btn-preset">
        <option value="primary" selected>Primary</option>
        <option value="secondary">Secondary</option>
        <option value="outline">Outline</option>
        <option value="ghost">Ghost</option>
      </select>
    </div>
    <div>
      <label>Rozmiar</label>
      <select id="btn-size">
        <option value="sm">Small</option>
        <option value="md" selected>Medium</option>
        <option value="lg">Large</option>
      </select>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Szerokość (px)</label>
      <input type="number" id="btn-w" min="60" max="900" value="180">
    </div>
    <div>
      <label>Wysokość (px)</label>
      <input type="number" id="btn-h" min="28" max="200" value="44">
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Zaokrąglenie (px)</label>
      <input type="number" id="btn-radius" min="0" max="30" value="10">
    </div>
    <div>
      <label>Grubość obramowania (px)</label>
      <input type="number" id="btn-border-w" min="0" max="6" value="1">
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Waga czcionki</label>
      <select id="btn-weight">
        <option value="400">Normal</option>
        <option value="500">Medium</option>
        <option value="600" selected>Semibold</option>
        <option value="700">Bold</option>
      </select>
    </div>
    <div>
      <label>Wyrównanie tekstu</label>
      <select id="btn-align">
        <option value="left">Lewo</option>
        <option value="center" selected>Środek</option>
        <option value="right">Prawo</option>
      </select>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Caps</label>
      <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:12px; color:#0f172a; margin-top:6px;">
        <input type="checkbox" id="btn-upper" style="width:auto;"> WIELKIE LITERY
      </label>
    </div>
    <div>
      <label>Odstęp liter (px)</label>
      <input type="number" id="btn-letter" min="0" max="6" step="0.5" value="0">
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Tło</label>
      <input type="color" id="btn-bg" value="#156fe5">
    </div>
    <div>
      <label>Tekst</label>
      <input type="color" id="btn-color" value="#ffffff">
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Obramowanie</label>
      <input type="color" id="btn-border" value="#156fe5">
    </div>
    <div>
      <label>Cień</label>
      <select id="btn-shadow">
        <option value="none">Brak</option>
        <option value="soft" selected>Soft</option>
        <option value="strong">Strong</option>
      </select>
    </div>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Hover tło</label>
      <input type="color" id="btn-hover-bg" value="#0f5bd1">
    </div>
    <div>
      <label>Hover tekst</label>
      <input type="color" id="btn-hover-color" value="#ffffff">
    </div>
  </div>

  <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0;">
    <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:12px; color:#0f172a;">
      <input type="checkbox" id="btn-gradient" style="width:auto;"> Gradient
    </label>

    <div id="btn-gradient-wrap" style="display:none; margin-top:10px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; align-items:end;">
      <div>
        <label>Od</label>
        <input type="color" id="btn-grad-from" value="#156fe5">
      </div>
      <div>
        <label>Do</label>
        <input type="color" id="btn-grad-to" value="#22c55e">
      </div>
      <div>
        <label>Kąt (deg)</label>
        <input type="number" id="btn-grad-angle" min="0" max="360" value="135">
      </div>
    </div>
  </div>

  <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e2e8f0;">
    <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:12px;">
      <input type="checkbox" id="btn-disabled" style="width:auto;"> Wyłączony (disabled)
    </label>
  </div>
</div>
