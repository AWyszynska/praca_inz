<?php


if (!function_exists('sidescroll_menager_window')) {
  function sidescroll_menager_window(): void { ?>
    <div id="sgWindowScrollPanel" style="margin-top:14px; display:none;">

      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:12px 0 8px;">
        <h3 style="margin:0; font-size:13px; color:#0f172a;">Scroll przeglądarki</h3>
        <span style="font-size:11px; color:#64748b;">WINDOW</span>
      </div>

      <div style="border:1px solid #e2e8f0; border-radius:12px; padding:10px; background:#f8fafc;">
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
          <label style="display:flex; gap:6px; align-items:center; font-size:12px; color:#334155;">
            <input type="checkbox" id="sgWinScrollEnabled" checked>
            aktywny
          </label>

          <label style="display:flex; gap:6px; align-items:center; font-size:12px; color:#334155;">
            Firefox thin
            <input type="checkbox" id="sgWinScrollFirefoxThin">
          </label>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <label style="font-size:12px; color:#334155;">
            Szerokość
            <input id="sgWinScrollWidth" type="number" min="6" max="22" value="12"
              style="width:100%; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>

          <label style="font-size:12px; color:#334155;">
            Zaokrąglenie
            <input id="sgWinScrollRadius" type="number" min="0" max="999" value="10"
              style="width:100%; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>

          <label style="font-size:12px; color:#334155;">
            Track
            <input id="sgWinScrollTrack" type="color" value="#cbd5e1"
              style="width:100%; height:34px; padding:0; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>

          <label style="font-size:12px; color:#334155;">
            Thumb
            <input id="sgWinScrollThumb" type="color" value="#0f172a"
              style="width:100%; height:34px; padding:0; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>
        </div>

        <div style="display:flex; gap:8px; margin-top:10px;">
          <button type="button" id="sgWinScrollApplyBtn"
            style="padding:7px 10px; border-radius:10px; border:1px solid #cbd5e1; background:#fff; cursor:pointer;">
            Zastosuj podgląd
          </button>
        </div>
        <input type="hidden" id="sgWinScrollJson" value="{}">
        <div style="margin-top:10px; font-size:11px; color:#64748b;">
          Konfiguracja siedzi w <code>window.sgWindowScrollConfig</code> i w <code>#sgWinScrollJson</code>.
        </div>
      </div>
    </div>

    <script>
      (() => {
        const ui = {
          enabled: document.getElementById("sgWinScrollEnabled"),
          firefoxThin: document.getElementById("sgWinScrollFirefoxThin"),
          width: document.getElementById("sgWinScrollWidth"),
          radius: document.getElementById("sgWinScrollRadius"),
          track: document.getElementById("sgWinScrollTrack"),
          thumb: document.getElementById("sgWinScrollThumb"),
          apply: document.getElementById("sgWinScrollApplyBtn"),
          json: document.getElementById("sgWinScrollJson")
        };

        function rgbaFromHex(hex, alpha) {
          if (!hex || hex[0] !== "#" || (hex.length !== 7 && hex.length !== 4)) return hex;
          let r, g, b;
          if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
          } else {
            r = parseInt(hex.slice(1,3), 16);
            g = parseInt(hex.slice(3,5), 16);
            b = parseInt(hex.slice(5,7), 16);
          }
          return `rgba(${r},${g},${b},${alpha})`;
        }

        function buildCfg() {
          return {
            enabled: !!ui.enabled.checked,
            firefoxThin: !!ui.firefoxThin.checked,
            width: +ui.width.value || 12,
            radius: +ui.radius.value || 10,
            track: rgbaFromHex(ui.track.value, 0.25),
            thumb: rgbaFromHex(ui.thumb.value, 0.55),
            thumbHover: rgbaFromHex(ui.thumb.value, 0.75),
          };
        }

        function commitCfg() {
          const cfg = buildCfg();
          window.sgWindowScrollConfig = cfg;
          ui.json.value = JSON.stringify(cfg);
          return cfg;
        }

        function applyPreview() {
          const cfg = commitCfg();
          if (window.sg_sideblock_window) window.sg_sideblock_window(cfg);
        }

        ui.apply.addEventListener("click", applyPreview);
        ["input","change"].forEach((evt) => {
          ui.enabled.addEventListener(evt, commitCfg);
          ui.firefoxThin.addEventListener(evt, commitCfg);
          ui.width.addEventListener(evt, commitCfg);
          ui.radius.addEventListener(evt, commitCfg);
          ui.track.addEventListener(evt, commitCfg);
          ui.thumb.addEventListener(evt, commitCfg);
        });

        commitCfg();
        function rgbaToHex(rgba){
  const m = String(rgba || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return "";
  const r = (+m[1]).toString(16).padStart(2,"0");
  const g = (+m[2]).toString(16).padStart(2,"0");
  const b = (+m[3]).toString(16).padStart(2,"0");
  return "#" + r + g + b;
}

window.sgWinScrollLoad = (cfg) => {
  if (!cfg) return;

  ui.enabled.checked = cfg.enabled !== false;
  ui.firefoxThin.checked = !!cfg.firefoxThin;
  ui.width.value = cfg.width ?? 12;
  ui.radius.value = cfg.radius ?? 10;

  const trackHex = rgbaToHex(cfg.track);
  const thumbHex = rgbaToHex(cfg.thumb);
  if (trackHex) ui.track.value = trackHex;
  if (thumbHex) ui.thumb.value = thumbHex;

  commitCfg();
  if (window.sg_sideblock_window) window.sg_sideblock_window(window.sgWindowScrollConfig);
};

      })();
    </script>
  <?php }
}
