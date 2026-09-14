<?php

if (!function_exists('sidescroll_menager_block')) {
  function sidescroll_menager_block(): void { ?>
    <div id="sgScrollBlockPanel" style="display:none; margin-top:14px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:12px 0 8px;">
        <h3 style="margin:0; font-size:13px; color:#0f172a;">Scroll ramki</h3>
        <span style="font-size:11px; color:#64748b;">BLOCK</span>
      </div>

      <div style="border:1px solid #e2e8f0; border-radius:12px; padding:10px; background:#f8fafc;">
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
          <button type="button" id="sgAddBlockScrollBtn"
            style="padding:7px 10px; border-radius:10px; border:1px solid #cbd5e1; background:#fff; cursor:pointer;">
            Dodaj scroll do ramki
          </button>

          <label style="display:flex; gap:6px; align-items:center; font-size:12px; color:#334155;">
            <input type="checkbox" id="sgBlockScrollEnabled" checked>
            aktywny
          </label>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <label style="font-size:12px; color:#334155;">
            Oś
            <select id="sgBlockScrollAxis" style="width:100%; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
              <option value="y">Y (pion)</option>
              <option value="x">X (poziom)</option>
              <option value="xy">X + Y</option>
            </select>
          </label>

          <label style="font-size:12px; color:#334155;">
            Pozycja Y
            <select id="sgBlockScrollYSide" style="width:100%; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
              <option value="right">Prawa strona</option>
              <option value="left">Lewa strona</option>
            </select>
          </label>

          <label style="font-size:12px; color:#334155;">
            Pozycja X
            <select id="sgBlockScrollXSide" style="width:100%; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
              <option value="bottom">Dół</option>
              <option value="top">Góra</option>
            </select>
          </label>

          <label style="font-size:12px; color:#334155;">
            Grubość
            <input id="sgBlockScrollThickness" type="number" min="6" max="28" value="10"
              style="width:100%; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>

          <label style="font-size:12px; color:#334155;">
            Odstęp od ramki
            <input id="sgBlockScrollGap" type="number" min="0" max="24" value="6"
              style="width:100%; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>

          <label style="font-size:12px; color:#334155;">
            Zaokrąglenie
            <input id="sgBlockScrollRadius" type="number" min="0" max="999" value="10"
              style="width:100%; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>

          <label style="font-size:12px; color:#334155;">
            Kolor track
            <input id="sgBlockScrollTrack" type="color" value="#cbd5e1"
              style="width:100%; height:34px; padding:0; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>

          <label style="font-size:12px; color:#334155;">
            Kolor thumb
            <input id="sgBlockScrollThumb" type="color" value="#0f172a"
              style="width:100%; height:34px; padding:0; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
          <label style="display:flex; gap:6px; align-items:center; font-size:12px; color:#334155;">
            <input type="checkbox" id="sgBlockScrollAutoHide" checked> auto-hide
          </label>
          <label style="display:flex; gap:6px; align-items:center; font-size:12px; color:#334155;">
            <input type="checkbox" id="sgBlockScrollSmooth" checked> smooth
          </label>
          <label style="display:flex; gap:6px; align-items:center; font-size:12px; color:#334155;">
            <input type="checkbox" id="sgBlockScrollWheel" checked> wheel
          </label>
          <label style="display:flex; gap:6px; align-items:center; font-size:12px; color:#334155;">
            krok wheel
            <input id="sgBlockScrollWheelStep" type="number" min="10" max="400" value="70"
              style="width:80px; padding:6px; border-radius:10px; border:1px solid #cbd5e1; background:#fff;">
          </label>
          <label style="display:flex; gap:6px; align-items:center; font-size:12px; color:#334155;">
            <input type="checkbox" id="sgBlockScrollFadeHint" checked> hint (fade)
          </label>
        </div>

        <div style="margin-top:10px; font-size:11px; color:#64748b;">

        </div>
      </div>
    </div>

    <script>
      (() => {
        const panel = document.getElementById("sgScrollBlockPanel");
        if (!panel) return;

        const ui = {
          addBtn: document.getElementById("sgAddBlockScrollBtn"),
          enabled: document.getElementById("sgBlockScrollEnabled"),
          axis: document.getElementById("sgBlockScrollAxis"),
          ySide: document.getElementById("sgBlockScrollYSide"),
          xSide: document.getElementById("sgBlockScrollXSide"),
          thickness: document.getElementById("sgBlockScrollThickness"),
          gap: document.getElementById("sgBlockScrollGap"),
          radius: document.getElementById("sgBlockScrollRadius"),
          track: document.getElementById("sgBlockScrollTrack"),
          thumb: document.getElementById("sgBlockScrollThumb"),
          autoHide: document.getElementById("sgBlockScrollAutoHide"),
          smooth: document.getElementById("sgBlockScrollSmooth"),
          wheel: document.getElementById("sgBlockScrollWheel"),
          wheelStep: document.getElementById("sgBlockScrollWheelStep"),
          fadeHint: document.getElementById("sgBlockScrollFadeHint"),
        };

        let currentFrame = null;

        function pickFrameFromClick(e) {
          const el = e.target.closest('[data-type="block"], [data-el-type="block"], .sg-block, .sg-frame');
          return el || null;
        }

        function isFrame(el) {
          if (!el || el.nodeType !== 1) return false;
          const t = (el.dataset.type || el.dataset.elType || "").toLowerCase();
          if (t === "block" || t === "frame") return true;
          if (el.classList.contains("sg-block") || el.classList.contains("sg-frame")) return true;
          return false;
        }

        function getCfg(el) {
          if (!el) return null;
          const raw = el.dataset.sgScrollBlock || "";
          try { return raw ? JSON.parse(raw) : null; } catch { return null; }
        }

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

        function buildCfgFromUi() {
          return {
            enabled: !!ui.enabled.checked,
            axis: ui.axis.value,
            ySide: ui.ySide.value,
            xSide: ui.xSide.value,
            thickness: +ui.thickness.value || 10,
            gap: +ui.gap.value || 6,
            radius: +ui.radius.value || 10,
            track: rgbaFromHex(ui.track.value, 0.35),
            thumb: rgbaFromHex(ui.thumb.value, 0.55),
            thumbHover: rgbaFromHex(ui.thumb.value, 0.75),
            autoHide: !!ui.autoHide.checked,
            smooth: !!ui.smooth.checked,
            wheel: !!ui.wheel.checked,
            wheelStep: +ui.wheelStep.value || 70,
            fadeHint: !!ui.fadeHint.checked,
            fadeOpacity: 0.22
          };
        }

        function loadUi(cfg) {
          const c = cfg || {};
          ui.enabled.checked = c.enabled !== false;
          ui.axis.value = c.axis || "y";
          ui.ySide.value = c.ySide || "right";
          ui.xSide.value = c.xSide || "bottom";
          ui.thickness.value = c.thickness ?? 10;
          ui.gap.value = c.gap ?? 6;
          ui.radius.value = c.radius ?? 10;
          ui.autoHide.checked = c.autoHide !== false;
          ui.smooth.checked = c.smooth !== false;
          ui.wheel.checked = c.wheel !== false;
          ui.wheelStep.value = c.wheelStep ?? 70;
          ui.fadeHint.checked = c.fadeHint !== false;
        }

        function applyToFrame() {
          if (!currentFrame) return;
          const cfg = buildCfgFromUi();
          currentFrame.dataset.sgScrollBlock = JSON.stringify(cfg);

          if (window.sg_sidescroll_blok) {
            window.sg_sidescroll_blok(currentFrame, cfg);
          }
        }

        function setCurrentFrame(el) {
          if (!isFrame(el)) return;
          currentFrame = el;
          panel.style.display = "";

          const cfg = getCfg(currentFrame);
          loadUi(cfg);
          if (cfg && cfg.enabled && window.sg_sidescroll_blok) {
            window.sg_sidescroll_blok(currentFrame, cfg);
          }
        }
        document.addEventListener("click", (e) => {
          const frame = pickFrameFromClick(e);
          if (frame) setCurrentFrame(frame);
        }, true);
        document.addEventListener("sg:selected", (e) => {
          if (e.detail && e.detail.el) setCurrentFrame(e.detail.el);
        });

        ui.addBtn.addEventListener("click", () => {
          if (!currentFrame) return;
          ui.enabled.checked = true;
          applyToFrame();
        });

        Object.values(ui).forEach((el) => {
          if (!el || el === ui.addBtn) return;
          el.addEventListener("input", applyToFrame);
          el.addEventListener("change", applyToFrame);
        });

      })();
    </script>
  <?php }
}
