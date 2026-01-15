<div id="image-edit-section" style="display: none; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    <label style="color: #1e293b; font-size: 11px;">WYMIARY ZDJĘCIA (PX):</label>
    <div style="display: flex; gap: 5px;">
        <input type="number" id="img-width" placeholder="Szer.">
        <input type="number" id="img-height" placeholder="Wys.">
    </div>

    <label style="margin-top: 10px;">ZAOKRĄGLENIE ROGÓW (PX):</label>
    <input type="range" id="img-radius" min="0" max="100" value="0">

    <label style="margin-top: 10px;">INTENSYWNOŚĆ CIENIA:</label>
    <input type="range" id="img-shadow" min="0" max="50" value="0">
    
    <label style="margin-top: 10px;">OBRAMOWANIE (PX):</label>
    <input type="number" id="img-border-width" value="0">
    
    <label style="margin-top: 5px;">KOLOR OBRAMOWANIA:</label>
    <input type="color" id="img-border-color" value="#000000">

    <label style="margin-top: 10px;">PRZEŹROCZYSTOŚĆ:</label>
    <input type="range" id="img-opacity" min="0" max="100" value="100">
    <hr style="margin:14px 0; border:none; border-top:1px solid #e2e8f0;">

<label style="margin-top:10px;">DOPASOWANIE (object-fit):</label>
<select id="img-fit">
  <option value="cover">cover (kadruj)</option>
  <option value="contain">contain (całe)</option>
  <option value="fill">fill</option>
  <option value="none">none</option>
  <option value="scale-down">scale-down</option>
</select>

<label style="margin-top:10px;">POZYCJA (kadrowanie):</label>
<div style="display:flex; gap:6px;">
  <div style="flex:1;">
    <div style="font-size:11px; color:#64748b;">X (%)</div>
    <input type="range" id="img-pos-x" min="0" max="100" value="50">
  </div>
  <div style="flex:1;">
    <div style="font-size:11px; color:#64748b;">Y (%)</div>
    <input type="range" id="img-pos-y" min="0" max="100" value="50">
  </div>
</div>

<label style="margin-top:10px;">OBRÓT / ZOOM:</label>
<div style="display:flex; gap:6px;">
  <div style="flex:1;">
    <div style="font-size:11px; color:#64748b;">Obrót (deg)</div>
    <input type="range" id="img-rotate" min="-180" max="180" value="0">
  </div>
  <div style="flex:1;">
    <div style="font-size:11px; color:#64748b;">Skala (%)</div>
    <input type="range" id="img-scale" min="50" max="300" value="100">
  </div>
</div>

<div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
  <label style="display:flex; gap:6px; align-items:center; margin:0;">
    <input type="checkbox" id="img-flip-x"> Flip X
  </label>
  <label style="display:flex; gap:6px; align-items:center; margin:0;">
    <input type="checkbox" id="img-flip-y"> Flip Y
  </label>
  <label style="display:flex; gap:6px; align-items:center; margin:0;">
    <input type="checkbox" id="img-lock-ratio" checked> Trzymaj proporcje
  </label>
</div>

<label style="margin-top:10px;">FILTRY:</label>
<div style="display:grid; gap:8px;">
  <div>
    <div style="font-size:11px; color:#64748b;">Blur (px)</div>
    <input type="range" id="img-blur" min="0" max="20" value="0">
  </div>
  <div>
    <div style="font-size:11px; color:#64748b;">Grayscale (%)</div>
    <input type="range" id="img-gray" min="0" max="100" value="0">
  </div>
  <div>
    <div style="font-size:11px; color:#64748b;">Sepia (%)</div>
    <input type="range" id="img-sepia" min="0" max="100" value="0">
  </div>
  <div>
    <div style="font-size:11px; color:#64748b;">Brightness (%)</div>
    <input type="range" id="img-bright" min="50" max="200" value="100">
  </div>
  <div>
    <div style="font-size:11px; color:#64748b;">Contrast (%)</div>
    <input type="range" id="img-contrast" min="50" max="200" value="100">
  </div>
  <div>
    <div style="font-size:11px; color:#64748b;">Saturate (%)</div>
    <input type="range" id="img-saturate" min="0" max="300" value="100">
  </div>
</div>

<div style="display:flex; gap:8px; margin-top:12px;">
  <button type="button" id="img-replace-btn" class="btn" style="background:#334155; color:white;">Zmień zdjęcie</button>
  <button type="button" id="img-reset-btn" class="btn" style="background:#e2e8f0;">Reset ustawień</button>
</div>

</div>