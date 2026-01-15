(() => {
  const SNAP_PX = 8;
  const style = document.createElement("style");
  style.textContent = `
    .sg-guides-layer{
      position:absolute;
      inset:0;
      pointer-events:none;
      z-index:999999;
    }
    .sg-guide-v, .sg-guide-h{
      position:absolute;
      pointer-events:none;
      opacity:0;
      transition:opacity .06s linear;
    }
    .sg-guide-v{
      top:0; bottom:0;
      width:0;
      border-left:2px dashed rgba(59,130,246,0.95);
      filter: drop-shadow(0 0 2px rgba(59,130,246,0.25));
    }
    .sg-guide-h{
      left:0; right:0;
      height:0;
      border-top:2px dashed rgba(59,130,246,0.95);
      filter: drop-shadow(0 0 2px rgba(59,130,246,0.25));
    }
  `;
  document.head.appendChild(style);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function isCanvasEl(el) {
    return el && el.classList && el.classList.contains("canvas-element");
  }

  function getParentContainer(el) {
    const p = el?.parentElement;
    return p || document.getElementById("preview-canvas");
  }

  function ensureLayer(parent) {
    if (!parent) return null;
    const cs = getComputedStyle(parent);
    if (cs.position === "static") parent.style.position = "relative";

    let layer = parent.querySelector(":scope > .sg-guides-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "sg-guides-layer";

      const v = document.createElement("div");
      v.className = "sg-guide-v";

      const h = document.createElement("div");
      h.className = "sg-guide-h";

      layer.appendChild(v);
      layer.appendChild(h);
      parent.appendChild(layer);
    }
    return layer;
  }

  function showV(parent, x) {
    const layer = ensureLayer(parent);
    if (!layer) return;
    const v = layer.querySelector(".sg-guide-v");
    v.style.left = `${Math.round(x)}px`;
    v.style.opacity = "1";
  }

  function showH(parent, y) {
    const layer = ensureLayer(parent);
    if (!layer) return;
    const h = layer.querySelector(".sg-guide-h");
    h.style.top = `${Math.round(y)}px`;
    h.style.opacity = "1";
  }

  function hideGuides(parent) {
    const layer = parent?.querySelector?.(":scope > .sg-guides-layer");
    if (!layer) return;
    const v = layer.querySelector(".sg-guide-v");
    const h = layer.querySelector(".sg-guide-h");
    if (v) v.style.opacity = "0";
    if (h) h.style.opacity = "0";
  }

function collectTargets(parent, movingEl) {
  const targetsX = [];
  const targetsY = [];

  const pw = parent.clientWidth;
  const ph = parent.clientHeight;
  targetsX.push({ x: 0,      kind: "container", point: "left" });
  targetsX.push({ x: pw / 2, kind: "container", point: "center" });
  targetsX.push({ x: pw,     kind: "container", point: "right" });
  targetsY.push({ y: 0,      kind: "container", point: "top" });
  targetsY.push({ y: ph / 2, kind: "container", point: "center" });
  targetsY.push({ y: ph,     kind: "container", point: "bottom" });
  const els = Array.from(parent.children).filter((c) => isCanvasEl(c) && c !== movingEl);

  els.forEach((el) => {
    const l = el.offsetLeft;
    const t = el.offsetTop;
    const w = el.offsetWidth;
    const h = el.offsetHeight;

    targetsX.push({ x: l,         kind: "el", point: "left" });
    targetsX.push({ x: l + w / 2, kind: "el", point: "center" });
    targetsX.push({ x: l + w,     kind: "el", point: "right" });

    targetsY.push({ y: t,         kind: "el", point: "top" });
    targetsY.push({ y: t + h / 2, kind: "el", point: "center" });
    targetsY.push({ y: t + h,     kind: "el", point: "bottom" });
  });

  return { targetsX, targetsY };
}


function findBestSnapX(left, w, targetsX) {
  const points = [
    { p: left,       point: "left" },
    { p: left + w/2, point: "center" },
    { p: left + w,   point: "right" },
  ];

  let best = { abs: Infinity, pr: 999, delta: 0, guideX: null };

  const priority = (a, b) => {
    if (a === "center" && b === "center") return 0;
    if (a === "center" || b === "center") return 1;
    return 2;
  };

  for (const pt of points) {
    for (const tg of targetsX) {
      const delta = tg.x - pt.p;
      const ad = Math.abs(delta);
      if (ad > SNAP_PX) continue;

      const pr = priority(pt.point, tg.point);
      if (pr < best.pr || (pr === best.pr && ad < best.abs)) {
        best = { abs: ad, pr, delta, guideX: tg.x };
      }
    }
  }

  return best.guideX == null ? null : best;
}


function findBestSnapY(top, h, targetsY) {
  const points = [
    { p: top,       point: "top" },
    { p: top + h/2, point: "center" },
    { p: top + h,   point: "bottom" },
  ];

  let best = { abs: Infinity, pr: 999, delta: 0, guideY: null };

  const priority = (a, b) => {
    if (a === "center" && b === "center") return 0;
    if (a === "center" || b === "center") return 1;
    return 2;
  };

  for (const pt of points) {
    for (const tg of targetsY) {
      const delta = tg.y - pt.p;
      const ad = Math.abs(delta);
      if (ad > SNAP_PX) continue;

      const pr = priority(pt.point, tg.point);

      if (pr < best.pr || (pr === best.pr && ad < best.abs)) {
        best = { abs: ad, pr, delta, guideY: tg.y };
      }
    }
  }

  return best.guideY == null ? null : best;
}
  function install() {
    if (typeof window.setupElementMovement !== "function") return;
    if (window.setupElementMovement.__sgGuidesInstalled) return;

    const original = window.setupElementMovement;

    window.setupElementMovement = function setupElementMovementWithGuides(div, type) {
      div.onmousedown = (e) => {
        e.stopPropagation();
        if (type === "text" && div.dataset.editing === "1") return;

        if (typeof window.selectElement === "function") window.selectElement(div);

        const parent = getParentContainer(div);
        ensureLayer(parent);

        const startX = e.clientX;
        const startY = e.clientY;
        const origX = div.offsetLeft;
        const origY = div.offsetTop;
        let isMoving = false;

        document.onmousemove = (me) => {
          if (!isMoving && (Math.abs(me.clientX - startX) > 5 || Math.abs(me.clientY - startY) > 5)) {
            isMoving = true;
          }
          if (!isMoving) return;

          const dx = me.clientX - startX;
          const dy = me.clientY - startY;

          let nextL = origX + dx;
          let nextT = origY + dy;

          const w = div.offsetWidth;
          const h = div.offsetHeight;

          const { targetsX, targetsY } = collectTargets(parent, div);

          const snapX = findBestSnapX(nextL, w, targetsX);
          const snapY = findBestSnapY(nextT, h, targetsY);

          if (snapX) {
            nextL = nextL + snapX.delta;
            showV(parent, snapX.guideX);
          } else {
            const layer = parent.querySelector(":scope > .sg-guides-layer");
            const v = layer?.querySelector?.(".sg-guide-v");
            if (v) v.style.opacity = "0";
          }

          if (snapY) {
            nextT = nextT + snapY.delta;
            showH(parent, snapY.guideY);
          } else {
            const layer = parent.querySelector(":scope > .sg-guides-layer");
            const hEl = layer?.querySelector?.(".sg-guide-h");
            if (hEl) hEl.style.opacity = "0";
          }

          div.style.left = Math.round(nextL) + "px";
          div.style.top  = Math.round(nextT) + "px";
          div.style.pointerEvents = "none";
        };

        document.onmouseup = (mu) => {
          document.onmousemove = null;
          div.style.pointerEvents = "auto";

          hideGuides(parent);
          if (isMoving) {
            let target = document.elementFromPoint(mu.clientX, mu.clientY);
            let parentFrame = target ? target.closest(".type-block") : null;

            if (parentFrame && parentFrame !== div) {
              if (div.parentElement !== parentFrame) {
                if (typeof window.nestElement === "function") {
                  window.nestElement(div.dataset.id, parentFrame.dataset.id);
                }
              }
            } else {
              const canvas = window.canvas || document.getElementById("preview-canvas");
              if (!parentFrame && div.parentElement !== canvas) {
                if (typeof window.unNestElement === "function") window.unNestElement(div);
              }
            }
          }

          document.onmouseup = null;
          if (typeof window.refreshLayers === "function") window.refreshLayers();
        };
      };
    };

    window.setupElementMovement.__sgGuidesInstalled = true;
    document.querySelectorAll(".canvas-element").forEach((el) => {
      const t = el.dataset.type || "";
      window.setupElementMovement(el, t);
    });
  }
  let tries = 0;
  const t = setInterval(() => {
    tries++;
    install();
    if (window.setupElementMovement?.__sgGuidesInstalled) clearInterval(t);
    if (tries > 80) clearInterval(t);
  }, 50);

})();
