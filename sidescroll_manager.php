<div id="sidescroll-edit-section" style="display:none; margin-top:15px; border-top:1px solid #e2e8f0; padding-top:15px;">

  <label style="color:#1e293b; font-size:12px;">BOCZNY SUWAK PRZEWIJANIA</label>

  <label style="color:#475569; font-size:12px; margin-top:10px;">Cel przewijania</label>
  <select id="ss-target-mode">
    <option value="page">Strona (window scroll)</option>
    <option value="element">Element / Ramka</option>
  </select>

  <label style="color:#475569; font-size:12px; margin-top:8px;">ID elementu (gdy "Element / Ramka")</label>
  <input type="text" id="ss-target-id" placeholder="np. el_... lub block_...">

  <div style="display:flex; gap:8px; margin-top:8px;">
    <button type="button" class="tool-btn" id="ss-pin-page" style="flex:1;">🎚️ Steruj stroną</button>
    <button type="button" class="tool-btn" id="ss-pin-active" style="flex:1;">📌 Podepnij pod aktywną ramkę</button>
  </div>

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Przyklejenie (PIN)</label>
  <div style="display:flex; gap:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Tryb</label>
      <select id="ss-pin-mode">
        <option value="fixed">Przyklej do ekranu (fixed)</option>
        <option value="absolute">Wstaw w stronę (absolute)</option>
      </select>
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Strona</label>
      <select id="ss-side">
        <option value="right">Prawa</option>
        <option value="left">Lewa</option>
      </select>
    </div>
  </div>

  <div style="display:flex; gap:8px; margin-top:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Od góry (px)</label>
      <input type="number" id="ss-top" value="120" min="0">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Od boku (px)</label>
      <input type="number" id="ss-side-off" value="16" min="0">
    </div>
  </div>

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Rozmiar</label>
  <div style="display:flex; gap:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Wysokość (px)</label>
      <input type="number" id="ss-height" value="260" min="80">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Szerokość toru (px)</label>
      <input type="number" id="ss-track-w" value="10" min="6" max="24">
    </div>
  </div>

  <div style="display:flex; gap:8px; margin-top:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Wysokość gałki (px)</label>
      <input type="number" id="ss-thumb-h" value="64" min="20" max="160">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Start (0-100)</label>
      <input type="number" id="ss-value" value="0" min="0" max="100">
    </div>
  </div>

  <label style="color:#1e293b; font-size:12px; margin-top:12px;">Wygląd</label>
  <div style="display:flex; gap:8px;">
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Kolor toru</label>
      <input type="color" id="ss-track" value="#e2e8f0">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Kolor gałki</label>
      <input type="color" id="ss-thumb" value="#64748b">
    </div>
    <div style="flex:1;">
      <label style="color:#475569; font-size:12px;">Zaokrąglenie</label>
      <input type="number" id="ss-radius" value="999" min="0" max="999">
    </div>
  </div>

  <div style="font-size:11px; color:#64748b; margin-top:8px; line-height:1.3;">
    TIP: żeby sterować ramką, ramka musi mieć sensowną wysokość (mniejszą niż „zawartość”), wtedy suwak będzie przesuwał jej zawartość.
  </div>

</div>
<script>
  document.getElementById('edit-page-sidescroll-btn')?.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    window.sgEditPageSideScroll?.();
  });

  document.getElementById('add-frame-sidescroll-btn')?.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    window.sgAddSideScrollToFrame?.();
  });
</script>
