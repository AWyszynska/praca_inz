

<div id="calendar-edit-section" style="display:none; margin-top:14px;">
  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:12px 0 8px;">
    <h3 style="margin:0; font-size:13px; color:#0f172a;">Kalendarz</h3>
  </div>

  <div style="border:1px solid #e2e8f0; border-radius:10px; padding:10px; background:#f8fafc; margin-bottom:10px;">
    <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Podgląd</div>
    <div id="calendar-panel-preview" style="width:100%; height:200px; border-radius:10px; overflow:hidden;"></div>
  </div>

  <label>Rok</label>
  <input type="number" id="cal-year" min="1970" max="2100" value="2026">

  <label>Miesiąc</label>
  <select id="cal-month">
    <?php for($m=1;$m<=12;$m++): ?>
      <option value="<?= $m ?>"><?= $m ?></option>
    <?php endfor; ?>
  </select>

  <label>Początek tygodnia</label>
  <select id="cal-week-start">
    <option value="mon">Poniedziałek</option>
    <option value="sun">Niedziela</option>
  </select>

  <label>Motyw</label>
  <select id="cal-theme">
    <option value="blue">Niebieski</option>
    <option value="dark">Ciemny</option>
    <option value="light">Jasny</option>
  </select>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
    <div>
      <label>Szerokość (px)</label>
      <input type="number" id="cal-w" min="240" max="2000" value="720">
    </div>
    <div>
      <label>Wysokość (px)</label>
      <input type="number" id="cal-h" min="200" max="2000" value="520">
    </div>
  </div>
<div style="margin-top:14px; padding-top:12px; border-top:1px solid #e2e8f0;">
  <div style="font-size:11px; color:#64748b; font-weight:800; letter-spacing:.6px; margin-bottom:8px;">
    WYGLĄD
  </div>

  <label>KOLORY (GRADIENT)</label>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Góra</div>
      <input type="color" id="cal-bg-a" value="#2d66b8">
    </div>
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Dół</div>
      <input type="color" id="cal-bg-b" value="#1f4a93">
    </div>
  </div>

  <label style="margin-top:10px;">AKCENT (DZISIAJ)</label>
  <input type="color" id="cal-accent" value="#ffd166">

  <label style="margin-top:10px;">PROMIENIE / ODSTĘPY</label>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Zaokrąglenie (px)</div>
      <input type="number" id="cal-radius" value="30" min="0" max="80">
    </div>
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Padding (px)</div>
      <input type="number" id="cal-pad" value="22" min="0" max="80">
    </div>
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Gap (px)</div>
      <input type="number" id="cal-gap" value="10" min="0" max="40">
    </div>
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Cell radius (px)</div>
      <input type="number" id="cal-cell-radius" value="16" min="0" max="40">
    </div>
  </div>

  <label style="margin-top:10px;">TEKST</label>
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Miesiąc (px)</div>
      <input type="number" id="cal-month-size" value="34" min="16" max="64">
    </div>
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Dni (px)</div>
      <input type="number" id="cal-day-size" value="18" min="10" max="40">
    </div>
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Nagłówki dni (px)</div>
      <input type="number" id="cal-week-size" value="14" min="10" max="28">
    </div>
    <div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Przyciski (px)</div>
      <input type="number" id="cal-nav-size" value="44" min="28" max="72">
    </div>
  </div>

  <label style="margin-top:10px;">ZACHOWANIE</label>
  <div style="display:flex; gap:12px; flex-wrap:wrap;">
    <label style="display:flex; align-items:center; gap:8px; font-weight:700; font-size:12px; color:#0f172a; text-transform:none; margin:0;">
      <input type="checkbox" id="cal-show-outside" checked>
      Pokaż dni spoza miesiąca
    </label>
    <label style="display:flex; align-items:center; gap:8px; font-weight:700; font-size:12px; color:#0f172a; text-transform:none; margin:0;">
      <input type="checkbox" id="cal-show-today" checked>
      Podświetl dzisiaj
    </label>
  </div>
</div>

  <button type="button" id="cal-today" class="btn" style="background:#0ea5e9; color:white; margin-top:10px;">
    USTAW DZISIAJ
  </button>

  <div style="margin-top:10px; font-size:12px; color:#64748b; line-height:1.35;">
    <b>Uwaga:</b> Na razie kalendarz jest tylko wizualny (bez wpisywania).<br>
    Przewijanie miesięcy działa strzałkami w kalendarzu.
  </div>
</div>
