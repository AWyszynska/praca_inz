(() => {

  const isEditor = () => !!document.getElementById('preview-canvas');
  if (!isEditor()) return;

  const STYLE_ID = 'sg-connect-style';
  const OVERLAY_ID = 'sg-connect-overlay';

  const SNAP_DIST = 12;    
  const MIN_OVERLAP = 18;  

  const colorPool = [
    '#22c55e', '#0ea5e9', '#a855f7', '#f97316',
    '#ef4444', '#eab308', '#14b8a6', '#3b82f6',
    '#f43f5e', '#10b981'
  ];

  const state = {
    draggingEl: null,
    draggingParent: null,
    dragGroup: [],
    lastLeft: 0,
    lastTop: 0,
    snapCandidate: null,
    rafId: 0,
    links: new Map(),
    colorIndex: 0,
isDecorating: false,

    overlay: null,
    svg: null,
    svgLinks: null,
    svgPreview: null,

    layersObs: null,
    layersTick: 0,
  };

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function nextColor() {
    const c = colorPool[state.colorIndex % colorPool.length];
    state.colorIndex++;
    return c;
  }

  function cssEscapeSafe(s) {
    if (window.CSS && CSS.escape) return CSS.escape(String(s));
    return String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');
  }

  function getElementId(el) {
    if (!el) return '';
    return String(el.dataset?.id || el.getAttribute('data-id') || '').trim();
  }

  function getElementById(id) {
    if (!id) return null;
    const sel = `.canvas-element[data-id="${cssEscapeSafe(id)}"]`;
    return document.querySelector(sel);
  }

  function getDirectParent(el) {
    return el ? el.parentElement : null;
  }

  function parsePx(v) {
    const n = parseFloat(String(v || '').replace('px', ''));
    return Number.isFinite(n) ? n : 0;
  }

  function readLeftTop(el) {
    const left = Number.isFinite(el.offsetLeft) ? el.offsetLeft : parsePx(el.style.left);
    const top = Number.isFinite(el.offsetTop) ? el.offsetTop : parsePx(el.style.top);
    return { left, top };
  }

  function setLeftTop(el, left, top) {
    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
  }

  function rectLocal(el) {
    const p = readLeftTop(el);
    return {
      x: p.left,
      y: p.top,
      w: el.offsetWidth,
      h: el.offsetHeight,
      r: p.left + el.offsetWidth,
      b: p.top + el.offsetHeight,
    };
  }

  function overlap1d(a0, a1, b0, b1) {
    const lo = Math.max(a0, b0);
    const hi = Math.min(a1, b1);
    return Math.max(0, hi - lo);
  }

  function isLocked(el) {
    return String(el?.dataset?.locked || '') === '1';
  }

  function injectCssOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .sgconn-dot{ width:10px; height:10px; border-radius:999px; box-shadow:0 0 0 2px rgba(255,255,255,0.8); }
      .sgconn-dot[data-off="1"]{ opacity:.55; filter:grayscale(1); }
      .sgconn-dot:hover{ transform:scale(1.08); }
.sgconn-dot-btn{
  border:0; background:transparent; padding:0; margin:0;
  cursor:pointer; display:flex; align-items:center; justify-content:center;
}
      .sgconn-dot{
  width:12px;
  height:12px;
  border-radius:999px;
  box-shadow:0 0 0 2px rgba(255,255,255,0.85);
  pointer-events:none;
}


.sgconn-dot-wrap{
  position:relative;
  width:20px;
  height:20px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}

.sgconn-x{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;

  font-size:14px;
  font-weight:900;
  line-height:1;

  border-radius:999px;
  background:rgba(255,255,255,0.96);
  box-shadow:0 0 0 1px rgba(15,23,42,0.22);
  color:#0f172a;

  opacity:0;
  transform:scale(.9);
  transition:opacity .12s ease, transform .12s ease;

  pointer-events:auto;
  cursor:pointer;
  z-index:2;
  user-select:none;
}

.sgconn-dot-btn:hover .sgconn-x{
  opacity:1;
  transform:scale(1);
}

.sgconn-dot-btn:hover .sgconn-dot{
  opacity:.25;
}

      #${OVERLAY_ID}{ position:fixed; inset:0; pointer-events:none; z-index:9999; display:none; }

      #${OVERLAY_ID} svg{ width:100%; height:100%; }
    `;
    document.head.appendChild(st);
  }

  function ensureOverlay() {
    if (state.overlay && document.body.contains(state.overlay)) return;

    const wrap = document.createElement('div');
    wrap.id = OVERLAY_ID;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('preserveAspectRatio', 'none');

    const gLinks = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const gPreview = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(gLinks);
    svg.appendChild(gPreview);

    wrap.appendChild(svg);
    document.body.appendChild(wrap);

    state.overlay = wrap;
    state.svg = svg;
    state.svgLinks = gLinks;
    state.svgPreview = gPreview;

window.addEventListener('resize', () => {
  if (!state.svg) return;
  state.svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  if (state.overlay && state.overlay.style.display !== 'none') drawAllLinks();
});

  }
function showOverlay() {
  ensureOverlay();
  if (state.overlay) state.overlay.style.display = 'block';
}

function hideOverlay() {
  if (!state.overlay) return;
  state.overlay.style.display = 'none';
  clearSvgGroup(state.svgLinks);
  clearSvgGroup(state.svgPreview);
}

  function linkKey(aId, bId) {
    return aId < bId ? `${aId}::${bId}` : `${bId}::${aId}`;
  }

  function oppositeSide(side) {
    if (side === 'left') return 'right';
    if (side === 'right') return 'left';
    if (side === 'top') return 'bottom';
    return 'top';
  }

  function pointOnSide(el, side) {
    const r = el.getBoundingClientRect();
    if (side === 'left') return { x: r.left, y: r.top + r.height / 2 };
    if (side === 'right') return { x: r.right, y: r.top + r.height / 2 };
    if (side === 'top') return { x: r.left + r.width / 2, y: r.top };
    return { x: r.left + r.width / 2, y: r.bottom };
  }

  function clearSvgGroup(g) {
    if (!g) return;
    while (g.firstChild) g.removeChild(g.firstChild);
  }

  function svgPath(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const bend = Math.min(120, Math.max(40, Math.hypot(dx, dy) * 0.35));

    const c1 = { x: a.x + (dx === 0 ? 0 : Math.sign(dx) * bend), y: a.y };
    const c2 = { x: b.x - (dx === 0 ? 0 : Math.sign(dx) * bend), y: b.y };

    return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
  }

  function drawLinkLine(aEl, bEl, aSide, bSide, color, dashed) {
    if (!state.svgLinks) return;
    const a = pointOnSide(aEl, aSide);
    const b = pointOnSide(bEl, bSide);

    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', svgPath(a, b));
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', '3');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('opacity', dashed ? '0.7' : '0.9');
    if (dashed) p.setAttribute('stroke-dasharray', '6 6');

    const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c1.setAttribute('cx', String(a.x));
    c1.setAttribute('cy', String(a.y));
    c1.setAttribute('r', '5');
    c1.setAttribute('fill', color);
    c1.setAttribute('opacity', dashed ? '0.65' : '0.95');

    const c2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c2.setAttribute('cx', String(b.x));
    c2.setAttribute('cy', String(b.y));
    c2.setAttribute('r', '5');
    c2.setAttribute('fill', color);
    c2.setAttribute('opacity', dashed ? '0.65' : '0.95');

    return { p, c1, c2 };
  }

  function drawAllLinks() {
    ensureOverlay();
    clearSvgGroup(state.svgLinks);

    for (const link of state.links.values()) {
      const aEl = getElementById(link.aId);
      const bEl = getElementById(link.bId);
      if (!aEl || !bEl) continue;
      if (getDirectParent(aEl) !== getDirectParent(bEl)) continue;

      const obj = drawLinkLine(aEl, bEl, link.aSide, link.bSide, link.color, false);
      if (!obj) continue;
      state.svgLinks.appendChild(obj.p);
      state.svgLinks.appendChild(obj.c1);
      state.svgLinks.appendChild(obj.c2);
    }

if (!state.draggingEl) scheduleLayersDecorate();
  }

  function drawPreview(candidate) {
    ensureOverlay();
    clearSvgGroup(state.svgPreview);
    if (!candidate) return;

    const aEl = candidate.aEl;
    const bEl = candidate.bEl;
    if (!aEl || !bEl) return;

    const color = candidate.color || '#0ea5e9';
    const obj = drawLinkLine(aEl, bEl, candidate.aSide, candidate.bSide, color, true);
    if (!obj) return;

    state.svgPreview.appendChild(obj.p);
    state.svgPreview.appendChild(obj.c1);
    state.svgPreview.appendChild(obj.c2);
  }

  function buildAdjacency(parentEl) {
    const adj = new Map();

    for (const link of state.links.values()) {
      const aEl = getElementById(link.aId);
      const bEl = getElementById(link.bId);
      if (!aEl || !bEl) continue;
      if (getDirectParent(aEl) !== parentEl || getDirectParent(bEl) !== parentEl) continue;

      if (!adj.has(link.aId)) adj.set(link.aId, []);
      if (!adj.has(link.bId)) adj.set(link.bId, []);

      adj.get(link.aId).push(link.bId);
      adj.get(link.bId).push(link.aId);
    }

    return adj;
  }

  function getComponentIds(startId, parentEl) {
    const adj = buildAdjacency(parentEl);
    const seen = new Set();
    const q = [startId];
    seen.add(startId);

    while (q.length) {
      const id = q.shift();
      const nxt = adj.get(id) || [];
      for (const nb of nxt) {
        if (seen.has(nb)) continue;
        seen.add(nb);
        q.push(nb);
      }
    }

    return Array.from(seen);
  }

  function removeLinksForElement(id) {
    if (!id) return;
    const keysToRemove = [];
    for (const [k, link] of state.links.entries()) {
      if (link.aId === id || link.bId === id) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => state.links.delete(k));
    if (state.overlay && state.overlay.style.display !== 'none') drawAllLinks();

  }
  function removeLinksForElementColor(id, color) {
    if (!id || !color) return;

    const keysToRemove = [];
    for (const [k, link] of state.links.entries()) {
      const touches = (link.aId === id || link.bId === id);
      if (touches && String(link.color) === String(color)) keysToRemove.push(k);
    }

    keysToRemove.forEach((k) => state.links.delete(k));
  }

  function addLink(aId, bId, aSide, bSide, color) {
    const key = linkKey(aId, bId);
    const existing = state.links.get(key);
    if (existing) {
      existing.aId = aId;
      existing.bId = bId;
      existing.aSide = aSide;
      existing.bSide = bSide;
      return;
    }

    state.links.set(key, { aId, bId, aSide, bSide, color });
  }

  function hasLinkBetween(aId, bId) {
    return state.links.has(linkKey(aId, bId));
  }

  function computeSnapCandidate(dragEl, parentEl, groupSet) {
    const dragId = getElementId(dragEl);
    if (!dragId) return null;

    const dragRect = rectLocal(dragEl);
    const siblings = Array.from(parentEl.children).filter((n) =>
      n && n.nodeType === 1 && n.classList && n.classList.contains('canvas-element')
    );

    let best = null;

    for (const other of siblings) {
      if (other === dragEl) continue;
      const otherId = getElementId(other);
      if (!otherId) continue;
      if (groupSet.has(otherId)) continue; 
      if (isLocked(other)) continue;

      const o = rectLocal(other);
      const overlapY = overlap1d(dragRect.y, dragRect.b, o.y, o.b);
      const overlapX = overlap1d(dragRect.x, dragRect.r, o.x, o.r);
      if (overlapY >= MIN_OVERLAP) {
        const dist = Math.abs(dragRect.x - o.r);
        if (dist <= SNAP_DIST) {
          const snapX = o.r;
          const score = dist;
          const cand = {
            aEl: dragEl,
            bEl: other,
            aId: dragId,
            bId: otherId,
            aSide: 'left',
            bSide: 'right',
            snapLeft: snapX,
            snapTop: dragRect.y,
            score,
          };
          if (!best || cand.score < best.score) best = cand;
        }
      }
      if (overlapY >= MIN_OVERLAP) {
        const dist = Math.abs(dragRect.r - o.x);
        if (dist <= SNAP_DIST) {
          const snapX = o.x - dragRect.w;
          const score = dist;
          const cand = {
            aEl: dragEl,
            bEl: other,
            aId: dragId,
            bId: otherId,
            aSide: 'right',
            bSide: 'left',
            snapLeft: snapX,
            snapTop: dragRect.y,
            score,
          };
          if (!best || cand.score < best.score) best = cand;
        }
      }
      if (overlapX >= MIN_OVERLAP) {
        const dist = Math.abs(dragRect.y - o.b);
        if (dist <= SNAP_DIST) {
          const snapY = o.b;
          const score = dist;
          const cand = {
            aEl: dragEl,
            bEl: other,
            aId: dragId,
            bId: otherId,
            aSide: 'top',
            bSide: 'bottom',
            snapLeft: dragRect.x,
            snapTop: snapY,
            score,
          };
          if (!best || cand.score < best.score) best = cand;
        }
      }
      if (overlapX >= MIN_OVERLAP) {
        const dist = Math.abs(dragRect.b - o.y);
        if (dist <= SNAP_DIST) {
          const snapY = o.y - dragRect.h;
          const score = dist;
          const cand = {
            aEl: dragEl,
            bEl: other,
            aId: dragId,
            bId: otherId,
            aSide: 'bottom',
            bSide: 'top',
            snapLeft: dragRect.x,
            snapTop: snapY,
            score,
          };
          if (!best || cand.score < best.score) best = cand;
        }
      }
    }

    if (!best) return null;
    const key = linkKey(best.aId, best.bId);
    const existing = state.links.get(key);
    best.color = existing?.color || '#0ea5e9';

    return best;
  }

  function scheduleLayersDecorate() {
    clearTimeout(state.layersTick);
    state.layersTick = setTimeout(decorateLayers, 40);
  }

  function extractLayerId(li) {
    const small = Array.from(li.querySelectorAll('div')).find((d) => {
      const st = (d.getAttribute('style') || '').toLowerCase();
      return st.includes('font-size:10px') && st.includes('color:#94a3b8');
    });
    const id = (small?.textContent || '').trim();
    return id;
  }

  function colorsForElement(id) {
    const colors = new Set();
    for (const link of state.links.values()) {
      if (link.aId === id || link.bId === id) colors.add(link.color);
    }
    return Array.from(colors);
  }

function decorateLayers() {
  const list = document.getElementById('layers-list');
  if (!list) return;

  state.isDecorating = true;
  if (state.layersObs) state.layersObs.disconnect();

  const items = Array.from(list.querySelectorAll('li'));

  items.forEach((li) => {
    const id = extractLayerId(li);
    if (!id) return;

    const row = li.querySelector('div');
    if (!row) return;

    let holder = row.querySelector('.sgconn-dots');

    const colors = colorsForElement(id);
    if (!colors.length) {
      if (holder) holder.remove();
      return;
    }

    const c = colors[0];

    if (!holder) {
      holder = document.createElement('div');
      holder.className = 'sgconn-dots';
      holder.style.display = 'flex';
      holder.style.alignItems = 'center';
      holder.style.gap = '6px';
      holder.style.marginLeft = '10px';
      holder.style.flexShrink = '0';
      row.appendChild(holder);
    }

    let btn = holder.querySelector('.sgconn-dot-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sgconn-dot-btn';
      btn.title = 'Najedź i kliknij × aby usunąć połączenie';

      const wrap = document.createElement('span');
      wrap.className = 'sgconn-dot-wrap';

      const dot = document.createElement('span');
      dot.className = 'sgconn-dot';

      const x = document.createElement('span');
      x.className = 'sgconn-x';
      x.textContent = '×';
      x.title = 'Usuń połączenie';
      x.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      }, true);
      x.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const hostBtn = ev.currentTarget.closest('.sgconn-dot-btn');
        const elId = hostBtn?.dataset?.sgconnId || '';
        const col = hostBtn?.dataset?.sgconnColor || '';
        if (!elId || !col) return;

        removeLinksForElementColor(elId, col);
        drawAllLinks();
        scheduleLayersDecorate();
      }, true);

      wrap.appendChild(dot);
      wrap.appendChild(x);
      btn.appendChild(wrap);
      holder.appendChild(btn);
    }
    btn.dataset.sgconnId = id;
    btn.dataset.sgconnColor = c;

    const dotEl = btn.querySelector('.sgconn-dot');
    if (dotEl) dotEl.style.background = c;
  });

  state.isDecorating = false;
  if (state.layersObs) state.layersObs.observe(list, { childList: true, subtree: false });
}


  function ensureLayersObserver() {
    const list = document.getElementById('layers-list');
    if (!list) return;

    if (state.layersObs) return;

    state.layersObs = new MutationObserver(() => {
  if (state.isDecorating) return;  
  scheduleLayersDecorate();
});

    state.layersObs.observe(list, { childList: true, subtree: false });

  }

  function dragStart(el) {
    showOverlay();
    drawAllLinks();
    if (!el || !el.classList?.contains('canvas-element')) return;
    if (isLocked(el)) return;

    state.draggingEl = el;
    state.draggingParent = getDirectParent(el);

    const id = getElementId(el);
    if (!id || !state.draggingParent) return;

    const comp = getComponentIds(id, state.draggingParent);
    state.dragGroup = comp;

    const p = readLeftTop(el);
    state.lastLeft = p.left;
    state.lastTop = p.top;

    state.snapCandidate = null;
    drawPreview(null);
  }

  function dragEnd() {
    if (!state.draggingEl) return;
    const cand = state.snapCandidate;
    if (cand && cand.aEl && cand.bEl) {
      const aId = cand.aId;
      const bId = cand.bId;

      const aEl = getElementById(aId);
      const bEl = getElementById(bId);

      if (aEl && bEl && getDirectParent(aEl) === getDirectParent(bEl) && !isLocked(aEl) && !isLocked(bEl)) {
        const key = linkKey(aId, bId);
        const existing = state.links.get(key);
        const color = existing?.color || nextColor();
        if (aId < bId) addLink(aId, bId, cand.aSide, cand.bSide, color);
        else addLink(bId, aId, oppositeSide(cand.bSide), oppositeSide(cand.aSide), color);
      }
    }

    state.draggingEl = null;
    state.draggingParent = null;
    state.dragGroup = [];
    state.snapCandidate = null;

    drawPreview(null);
hideOverlay();
scheduleLayersDecorate();
if (typeof window.refreshLayers === 'function') window.refreshLayers();

  }

  function applyGroupDelta(parentEl, baseId, dx, dy) {
    if (!dx && !dy) return;

    const compIds = getComponentIds(baseId, parentEl);
    for (const id of compIds) {
      if (id === baseId) continue;
      const el = getElementById(id);
      if (!el) continue;
      if (isLocked(el)) continue;
      const p = readLeftTop(el);
      setLeftTop(el, p.left + dx, p.top + dy);
    }
  }

  function tickMove() {
    state.rafId = 0;
    const el = state.draggingEl;
    if (!el) return;

    const id = getElementId(el);
    const parentEl = state.draggingParent;
    if (!id || !parentEl) return;
    const now = readLeftTop(el);
    const dx = now.left - state.lastLeft;
    const dy = now.top - state.lastTop;

    if (dx || dy) {
      applyGroupDelta(parentEl, id, dx, dy);
      state.lastLeft = now.left;
      state.lastTop = now.top;
    }
    const groupSet = new Set(getComponentIds(id, parentEl));
    const cand = computeSnapCandidate(el, parentEl, groupSet);

    if (cand) {
      const desiredLeft = cand.snapLeft;
      const desiredTop = cand.snapTop;

      const cur = readLeftTop(el);
      const sdx = desiredLeft - cur.left;
      const sdy = desiredTop - cur.top;

      if (sdx || sdy) {
        setLeftTop(el, desiredLeft, desiredTop);
        applyGroupDelta(parentEl, id, sdx, sdy);
        state.lastLeft = desiredLeft;
        state.lastTop = desiredTop;
      }
      state.snapCandidate = cand;
      drawPreview(cand);
    } else {
      if (state.snapCandidate) {
        state.snapCandidate = null;
        drawPreview(null);
      }
    }
    drawAllLinks();
  }

  function scheduleTick() {
    if (state.rafId) return;
    state.rafId = requestAnimationFrame(tickMove);
  }

  function shouldIgnoreMouseDown(target) {
    if (!target) return true;
    if (target.closest('#left-panel, #right-panel, #toolbar, .panel, .modal')) return true;
    const tag = String(target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return true;
    if (target.classList && (target.classList.contains('resize-handle') || target.classList.contains('resizer'))) return true;

    return false;
  }

  function hookDragEvents() {
const forceEnd = () => {
  if (!state.draggingEl) return;
  scheduleTick();                
  requestAnimationFrame(dragEnd); 
};

window.addEventListener("blur", forceEnd, true);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) forceEnd();
}, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") forceEnd();
}, true);
window.addEventListener("pointerup", forceEnd, true);
    document.addEventListener('mousedown', (ev) => {
      if (!isEditor()) return;
      if (ev.button !== 0) return;
      if (shouldIgnoreMouseDown(ev.target)) return;

      const el = ev.target?.closest?.('.canvas-element');
      if (!el) return;
      if (ev.target?.isContentEditable) return;

      dragStart(el);
    }, true);

    document.addEventListener('mousemove', () => {
      if (!state.draggingEl) return;
      scheduleTick();
    }, false);

document.addEventListener('mouseup', () => {
  if (!state.draggingEl) return;
  scheduleTick();
  requestAnimationFrame(dragEnd);
}, true);

  }

  function exposeApi() {
    window.sgConnect = {
      connect(aId, bId, sideA) {
        const aEl = getElementById(aId);
        const bEl = getElementById(bId);
        if (!aEl || !bEl) return false;
        if (getDirectParent(aEl) !== getDirectParent(bEl)) return false;
        if (isLocked(aEl) || isLocked(bEl)) return false;

        const aSide = sideA;
        const bSide = oppositeSide(aSide);
        const color = hasLinkBetween(aId, bId)
          ? (state.links.get(linkKey(aId, bId))?.color || '#0ea5e9')
          : nextColor();

        if (aId < bId) addLink(aId, bId, aSide, bSide, color);
        else addLink(bId, aId, oppositeSide(bSide), oppositeSide(aSide), color);

        drawAllLinks();
        if (typeof window.refreshLayers === 'function') window.refreshLayers();
        return true;
      },

      disconnect(id) {
        removeLinksForElement(id);
        if (typeof window.refreshLayers === 'function') window.refreshLayers();
      },

      clear() {
        state.links.clear();
        drawAllLinks();
        if (typeof window.refreshLayers === 'function') window.refreshLayers();
      },

      export() {
        return Array.from(state.links.values()).map((x) => ({ ...x }));
      },

      import(list) {
        state.links.clear();
        if (Array.isArray(list)) {
          list.forEach((x) => {
            if (!x || !x.aId || !x.bId) return;
            addLink(String(x.aId), String(x.bId), String(x.aSide || 'right'), String(x.bSide || 'left'), String(x.color || nextColor()));
          });
        }
        drawAllLinks();
        if (typeof window.refreshLayers === 'function') window.refreshLayers();
      }
    };
  }

  function boot() {
    injectCssOnce();
    ensureOverlay();
    ensureLayersObserver();
    hookDragEvents();
    exposeApi();
    if (typeof window.refreshLayers === 'function') {
      const orig = window.refreshLayers;
      if (!orig.__sgConnectWrapped) {
        window.refreshLayers = function () {
          orig();
          scheduleLayersDecorate();
        };
        window.refreshLayers.__sgConnectWrapped = true;
      }
    }

    scheduleLayersDecorate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
