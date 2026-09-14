<div id="brand-edit-section" style="display:none;">
  <div style="margin-top:12px; padding-top:12px; border-top:1px solid #e5e7eb;">
    <div style="font-size:12px; color:#0f172a; font-weight:900; margin-bottom:10px;">
      Pulpit logo (SVG)
    </div>

    <label>Tryb</label>
    <select id="brand-mode">
      <option value="builder">Kreator</option>
      <option value="raw">Własne SVG (wklej)</option>
    </select>

    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
      <button type="button" class="tool-btn" id="brand-preset-clean">Preset: Clean</button>
      <button type="button" class="tool-btn" id="brand-preset-underline">Preset: Underline</button>
      <button type="button" class="tool-btn" id="brand-preset-vetmell">Preset: VetMell</button>
      <button type="button" class="tool-btn" id="brand-randomize">Losuj styl</button>
      <button type="button" class="tool-btn" id="brand-copy-svg">Kopiuj SVG</button>
      <button type="button" class="tool-btn" id="brand-export-png">Eksport PNG</button>
    </div>
<div id="brand-common-box" style="margin-top:12px;">
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
    <div>
      <label>Wysokość logo (px)</label>
      <input id="brand-height" type="number" min="20" max="240" step="1" value="44">
    </div>
    <div>
      <label>Szerokość</label>
      <div style="display:flex; gap:8px;">
        <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:700; color:#334155;">
          <input id="brand-auto-width" type="checkbox" checked> auto
        </label>
        <input id="brand-width" type="number" min="80" max="1200" step="1" value="280">
      </div>
    </div>
  </div>
</div>
    <div id="brand-builder-box" style="margin-top:12px;">
     <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
  <div>
    <label>Wysokość logo (px)</label>
    <input id="brand-height" type="number" min="20" max="240" step="1" value="44">
  </div>
  <div>
    <label>Szerokość</label>
    <div style="display:flex; gap:8px;">
      <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:700; color:#334155;">
        <input id="brand-auto-width" type="checkbox" checked> auto
      </label>
      <input id="brand-width" type="number" min="80" max="1200" step="1" value="280">
    </div>
  </div>
</div>

      </div>

      <label style="margin-top:10px;">Font (CSS)</label>
      <input id="brand-font" type="text" value="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:10px;">
        <div>
          <label>Anchor</label>
          <select id="brand-anchor">
            <option value="start">Start</option>
            <option value="middle">Middle</option>
            <option value="end">End</option>
          </select>
        </div>
        <div>
          <label>X tekstu</label>
          <input id="brand-text-x" type="number" min="0" max="720" step="1" value="520">
        </div>
        <div>
          <label>Y tekstu</label>
          <input id="brand-text-y" type="number" min="0" max="160" step="1" value="104">
        </div>
      </div>

      <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #e5e7eb;">
        <div style="font-size:11px; font-weight:900; color:#0f172a; margin-bottom:8px;">WYPEŁNIENIE TEKSTU</div>

        <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
          <input id="brand-grad-on" type="checkbox"> Gradient (dla tekstu)
        </label>

        <div id="brand-grad-box" style="display:none; margin-top:8px;">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
            <div>
              <label>Od</label>
              <input id="brand-grad-from" type="color" value="#7c3aed">
            </div>
            <div>
              <label>Do</label>
              <input id="brand-grad-to" type="color" value="#06b6d4">
            </div>
            <div>
              <label>Kąt</label>
              <input id="brand-grad-angle" type="number" min="0" max="360" step="1" value="0">
            </div>
          </div>

          <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin-top:10px; text-transform:none; font-weight:800; color:#334155;">
            <input id="brand-grad-affects-stroke" type="checkbox"> Gradient także na outline (stroke)
          </label>
        </div>
      </div>

      <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #e5e7eb;">
        <div style="font-size:11px; font-weight:900; color:#0f172a; margin-bottom:8px;">OUTLINE / STROKE</div>

        <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
          <input id="brand-stroke-on" type="checkbox"> Włącz outline (stroke)
        </label>

        <div id="brand-stroke-box" style="display:none; margin-top:8px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div>
              <label>Grubość (px)</label>
              <input id="brand-stroke-w" type="number" min="0" max="10" step="0.2" value="1">
            </div>
            <div>
              <label>Kolor</label>
              <input id="brand-stroke-color" type="color" value="#0f172a">
            </div>
          </div>

          <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin-top:10px; text-transform:none; font-weight:800; color:#334155;">
            <input id="brand-stroke-match-fill" type="checkbox"> Stroke = kolor tekstu (per segment)
          </label>
        </div>
      </div>

      <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #e5e7eb;">
        <div style="font-size:11px; font-weight:900; color:#0f172a; margin-bottom:8px;">CIEŃ</div>

        <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
          <input id="brand-shadow-on" type="checkbox"> Włącz cień
        </label>

        <div id="brand-shadow-box" style="display:none; margin-top:8px;">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
            <div>
              <label>Blur</label>
              <input id="brand-shadow-blur" type="number" min="0" max="30" step="0.5" value="8">
            </div>
            <div>
              <label>Offset X</label>
              <input id="brand-shadow-x" type="number" min="-50" max="50" step="1" value="0">
            </div>
            <div>
              <label>Offset Y</label>
              <input id="brand-shadow-y" type="number" min="-50" max="50" step="1" value="4">
            </div>
          </div>
          <label>Kolor cienia</label>
          <input id="brand-shadow-color" type="text" value="rgba(0,0,0,0.25)">
        </div>
      </div>

      <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #e5e7eb;">
        <div style="font-size:11px; font-weight:900; color:#0f172a; margin-bottom:8px;">SEGMENTY TEKSTU</div>
        <div style="padding:10px; border:1px solid #e5e7eb; border-radius:10px; margin-bottom:10px;">
          <div style="font-size:11px; font-weight:900; color:#334155; margin-bottom:8px;">Segment 1</div>

          <label>Tekst</label>
          <input id="seg1-text" type="text" value="Nova">

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:8px;">
            <div>
              <label>Rozmiar</label>
              <input id="seg1-size" type="number" min="8" max="180" step="1" value="72">
            </div>
            <div>
              <label>Waga</label>
              <select id="seg1-weight">
                <option value="100">100</option><option value="200">200</option><option value="300">300</option>
                <option value="400">400</option><option value="500">500</option><option value="600">600</option>
                <option value="700" selected>700</option><option value="800">800</option><option value="900">900</option>
              </select>
            </div>
            <div>
              <label>Kolor</label>
              <input id="seg1-fill" type="color" value="#0f172a">
            </div>
          </div>

<div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:10px;">
  <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
    <input id="seg1-italic" type="checkbox"> italic
  </label>
  <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
    <input id="seg1-underline" type="checkbox"> underline
  </label>
  <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
    <input id="seg1-own-fill" type="checkbox"> własny kolor przy gradiencie
  </label>
</div>

<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
  <div>
    <label>Letter spacing</label>
    <input id="seg1-letter" type="number" min="-2" max="5" step="0.1" value="0">
  </div>
  <div>
    <label>DX do następnego</label>
    <input id="seg1-dx" type="number" min="-50" max="200" step="1" value="2">
  </div>
</div>

</div> 


        <div style="padding:10px; border:1px solid #e5e7eb; border-radius:10px; margin-bottom:10px;">
          <div style="font-size:11px; font-weight:900; color:#334155; margin-bottom:8px;">Segment 2</div>

          <label>Tekst</label>
          <input id="seg2-text" type="text" value="Labs">

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:8px;">
            <div>
              <label>Rozmiar</label>
              <input id="seg2-size" type="number" min="8" max="180" step="1" value="72">
            </div>
            <div>
              <label>Waga</label>
              <select id="seg2-weight">
                <option value="100">100</option><option value="200">200</option><option value="300">300</option>
                <option value="400">400</option><option value="500" selected>500</option><option value="600">600</option>
                <option value="700">700</option><option value="800">800</option><option value="900">900</option>
              </select>
            </div>
            <div>
              <label>Kolor</label>
              <input id="seg2-fill" type="color" value="#06b6d4">
            </div>
          </div>

          <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:10px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
              <input id="seg2-italic" type="checkbox"> italic
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
              <input id="seg2-underline" type="checkbox"> underline
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
              <input id="seg2-own-fill" type="checkbox"> własny kolor przy gradiencie
            </label>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
  <div>
    <label>Letter spacing</label>
    <input id="seg2-letter" type="number" min="-2" max="5" step="0.1" value="0">
  </div>
  <div>
    <label>DX do następnego</label>
    <input id="seg2-dx" type="number" min="-50" max="200" step="1" value="2">
  </div>
</div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin-top:4px; text-transform:none; font-weight:900; color:#334155;">
          <input id="seg3-enabled" type="checkbox"> Włącz segment 3
        </label>

        <div id="seg3-box" style="display:none; padding:10px; border:1px solid #e5e7eb; border-radius:10px; margin-top:8px;">
          <div style="font-size:11px; font-weight:900; color:#334155; margin-bottom:8px;">Segment 3</div>

          <label>Tekst</label>
          <input id="seg3-text" type="text" value="™">

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:8px;">
            <div>
              <label>Rozmiar</label>
              <input id="seg3-size" type="number" min="8" max="180" step="1" value="42">
            </div>
            <div>
              <label>Waga</label>
              <select id="seg3-weight">
                <option value="100">100</option><option value="200">200</option><option value="300">300</option>
                <option value="400">400</option><option value="500">500</option><option value="600">600</option>
                <option value="700">700</option><option value="800">800</option><option value="900" selected>900</option>
              </select>
            </div>
            <div>
              <label>Kolor</label>
              <input id="seg3-fill" type="color" value="#0f172a">
            </div>
          </div>

          <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:10px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
              <input id="seg3-italic" type="checkbox"> italic
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
              <input id="seg3-underline" type="checkbox"> underline
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin:0; text-transform:none; font-weight:800; color:#334155;">
              <input id="seg3-own-fill" type="checkbox"> własny kolor przy gradiencie
            </label>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
            <div>
              <label>Letter spacing</label>
              <input id="seg3-letter" type="number" min="-2" max="5" step="0.1" value="0">
            </div>
            <div>
              <label>DX (od segmentu 2)</label>
              <input id="seg3-dx" type="number" min="-50" max="200" step="1" value="6">
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #e5e7eb;">
        <div style="font-size:11px; font-weight:900; color:#0f172a; margin-bottom:8px;">DEKORACJE</div>

        <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin:0; text-transform:none; font-weight:900; color:#334155;">
          <input id="brand-line-on" type="checkbox"> Linia pod tekstem
        </label>

        <div id="brand-line-box" style="display:none; margin-top:8px;">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
            <div>
              <label>Start X</label>
              <input id="brand-line-x1" type="number" min="0" max="720" step="1" value="120">
            </div>
            <div>
              <label>End X</label>
              <input id="brand-line-x2" type="number" min="0" max="720" step="1" value="520">
            </div>
            <div>
              <label>Y</label>
              <input id="brand-line-y" type="number" min="0" max="160" step="1" value="118">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
            <div>
              <label>Grubość</label>
              <input id="brand-line-w" type="number" min="0" max="10" step="0.1" value="1.5">
            </div>
            <div>
              <label>Kolor</label>
              <input id="brand-line-color" type="color" value="#06b6d4">
            </div>
          </div>

          <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin-top:10px; text-transform:none; font-weight:900; color:#334155;">
            <input id="brand-line-use-text-paint" type="checkbox"> Linia ma kolor tekstu/gradient
          </label>

          <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin-top:6px; text-transform:none; font-weight:900; color:#334155;">
            <input id="brand-line-dash" type="checkbox"> Linia przerywana
          </label>
        </div>

        <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin-top:12px; text-transform:none; font-weight:900; color:#334155;">
          <input id="brand-dot-on" type="checkbox"> Kropka
        </label>

        <div id="brand-dot-box" style="display:none; margin-top:8px;">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
            <div>
              <label>R</label>
              <input id="brand-dot-r" type="number" min="0" max="40" step="0.1" value="4.2">
            </div>
            <div>
              <label>X</label>
              <input id="brand-dot-x" type="number" min="0" max="720" step="1" value="520">
            </div>
            <div>
              <label>Y</label>
              <input id="brand-dot-y" type="number" min="0" max="160" step="1" value="118">
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
            <div>
              <label>Kolor</label>
              <input id="brand-dot-color" type="color" value="#06b6d4">
            </div>
            <div>
              <label>Use text paint</label>
              <select id="brand-dot-use-text-paint">
                <option value="1">Tak</option>
                <option value="0">Nie</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #e5e7eb;">
        <div style="font-size:11px; font-weight:900; color:#0f172a; margin-bottom:8px;">TŁO ELEMENTU</div>

        <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin:0; text-transform:none; font-weight:900; color:#334155;">
          <input id="brand-bg-on" type="checkbox"> Włącz tło (div)
        </label>

        <div id="brand-bg-box" style="display:none; margin-top:8px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div>
              <label>Kolor</label>
              <input id="brand-bg-color" type="text" value="rgba(255,255,255,0.0)">
            </div>
            <div>
              <label>Radius (px)</label>
              <input id="brand-bg-radius" type="number" min="0" max="60" step="1" value="0">
            </div>
          </div>
          <label>Padding (CSS)</label>
          <input id="brand-bg-pad" type="text" value="0px">
        </div>
      </div>
    </div>

    <div id="brand-raw-box" style="display:none; margin-top:12px;">
      <label>Wklej swoje SVG</label>
      <textarea id="brand-raw" style="width:100%; min-height:180px; padding:10px; border:1px solid #d1d5db; border-radius:10px; font-size:12px;"></textarea>
      <div style="margin-top:8px; font-size:12px; color:#64748b;">
        .
      </div>
    </div>

    <div style="margin-top:10px; font-size:12px; color:#64748b;">
      .
    </div>
  </div>
</div>
