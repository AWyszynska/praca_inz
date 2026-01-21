(() => {
  const isEditor = () => !!document.getElementById('preview-canvas');

  const STYLE_ID = 'sg-toggle-style';
  const LAYERS_DEBOUNCE_MS = 60;

  const ui = {
    pickControllerId: '',
    pickTargetId: '',
    decorateTick: 0,
    layersObs: null,
    isDecorating: false,
  };

  function cssEscapeSafe(s) {
    if (window.CSS && CSS.escape) return CSS.escape(String(s));
    return String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');
  }

  function allElements() {
    return Array.from(document.querySelectorAll('.canvas-element, .page-element'));
  }

  function getId(el) {
    return String(el?.dataset?.id || el?.getAttribute?.('data-id') || '').trim();
  }

  function getType(el) {
    return String(el?.dataset?.type || el?.getAttribute?.('data-type') || '').trim();
  }

  function getElById(id) {
    if (!id) return null;
    const sel = `.canvas-element[data-id="${cssEscapeSafe(id)}"], .page-element[data-id="${cssEscapeSafe(id)}"]`;
    return document.querySelector(sel);
  }

function isButtonController(el) {
  if (!el) return false;
  const t = getType(el);
  if (t === 'button') return true;
  if (el.classList && el.classList.contains('type-button')) return true;
  return !!el.querySelector?.(':scope > .sgbtn');
}


  function ensureCss() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      .sgta-arrow{
        position:absolute;
        width:22px; height:22px;
        border-radius:999px;
        border:1px solid rgba(15,23,42,.2);
        background:rgba(255,255,255,.96);
        box-shadow:0 8px 16px rgba(2,6,23,.12);
        display:flex; align-items:center; justify-content:center;
        z-index:50;
        cursor:pointer;
        padding:0;
        pointer-events:auto;
        user-select:none;
      }
      .sgta-arrow:active{ transform:translate3d(0,1px,0) scale(.98); }
      .sgta-arrow .sgta-ico{
        font-size:13px;
        line-height:1;
        transform:rotate(0deg);
        transition:transform .14s ease;
        display:block;
      }
      .sgta-arrow[data-state="open"] .sgta-ico{ transform:rotate(90deg); }

      /* Pozycjonowanie strzałki względem elementu */
      .sgta-arrow[data-side="right"]{ top:50%; right:-11px; transform:translate3d(50%,-50%,0); }
      .sgta-arrow[data-side="left"]{ top:50%; left:-11px; transform:translate3d(-50%,-50%,0); }
      .sgta-arrow[data-side="top"]{ left:50%; top:-11px; transform:translate3d(-50%,-50%,0) rotate(-90deg); }
      .sgta-arrow[data-side="bottom"]{ left:50%; bottom:-11px; transform:translate3d(-50%,50%,0) rotate(90deg); }

      /* warstwy */
      .sgta-badge{ font-size:10px; font-weight:800; padding:2px 6px; border-radius:999px; }
      .sgta-badge.ctrl{ background:#e0f2fe; color:#075985; border:1px solid #bae6fd; }
      .sgta-badge.tgt{ background:#dcfce7; color:#166534; border:1px solid #bbf7d0; }
      .sgta-mini{ border:1px solid rgba(15,23,42,.18); background:#fff; border-radius:8px; padding:2px 6px;
        font-size:11px; cursor:pointer; line-height:1.2; }
      .sgta-mini:active{ transform:translateY(1px); }
      .sgta-mini[aria-pressed="true"]{ background:#0f172a; color:#fff; border-color:#0f172a; }
      .sgta-mini.danger{ background:#fff; color:#b91c1c; border-color:rgba(185,28,28,.25); }
    `;
    document.head.appendChild(st);
  }

  function normalizeDefaults(ctrlEl) {
    if (!ctrlEl.dataset.sgToggleTarget) return;

    const isBtn = isButtonController(ctrlEl);
    if (!ctrlEl.dataset.sgToggleTrigger) ctrlEl.dataset.sgToggleTrigger = isBtn ? 'self' : 'arrow';
    if (!ctrlEl.dataset.sgToggleArrow) ctrlEl.dataset.sgToggleArrow = isBtn ? '0' : '1';
    if (isBtn && String(ctrlEl.dataset.sgToggleTrigger || '') === 'self') {
      ctrlEl.dataset.sgToggleArrow = '0';
    }

    if (!ctrlEl.dataset.sgToggleInitial) ctrlEl.dataset.sgToggleInitial = 'open';
    if (!ctrlEl.dataset.sgToggleArrowSide) ctrlEl.dataset.sgToggleArrowSide = 'right';
  }

  function targetIsVisible(targetEl) {
    if (!targetEl) return false;
    return targetEl.style.display !== 'none' && targetEl.getAttribute('data-sg-toggle-hidden') !== '1';
  }

  function setTargetVisible(targetEl, visible) {
    if (!targetEl) return;
    if (visible) {
      targetEl.style.display = '';
      targetEl.removeAttribute('data-sg-toggle-hidden');
    } else {
      targetEl.style.display = 'none';
      targetEl.setAttribute('data-sg-toggle-hidden', '1');
    }
  }

  function ensureArrow(ctrlEl) {
    const trig = String(ctrlEl.dataset.sgToggleTrigger || 'arrow');
    const isBtn = isButtonController(ctrlEl);
    if (isBtn && trig === 'self') {
      const existing = ctrlEl.querySelector(':scope > .sgta-arrow');
      if (existing) existing.remove();
      return;
    }

    const want = String(ctrlEl.dataset.sgToggleArrow || '1') === '1';
    if (trig === 'self' && want) {

    }

    const existing = ctrlEl.querySelector(':scope > .sgta-arrow');
    if (!want) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sgta-arrow';
    btn.setAttribute('aria-label', 'Pokaż/ukryj');
    btn.title = 'Pokaż/ukryj';

    const ico = document.createElement('span');
    ico.className = 'sgta-ico';
    ico.textContent = '▶';
    btn.appendChild(ico);

    btn.dataset.side = String(ctrlEl.dataset.sgToggleArrowSide || 'right');
    btn.dataset.state = (ctrlEl.dataset.sgToggleState === 'closed') ? 'closed' : 'open';
    btn.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    }, true);
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      toggleByController(ctrlEl);
    }, true);

    ctrlEl.appendChild(btn);
  }

  function applyInitial(ctrlEl) {
    normalizeDefaults(ctrlEl);
    const targetId = String(ctrlEl.dataset.sgToggleTarget || '').trim();
    if (!targetId) return;
    const targetEl = getElById(targetId);
    if (!targetEl) return;

    const initial = String(ctrlEl.dataset.sgToggleInitial || 'open');
    if (initial === 'closed') {
      ctrlEl.dataset.sgToggleState = 'closed';
      setTargetVisible(targetEl, false);
    } else if (!ctrlEl.dataset.sgToggleState) {
      ctrlEl.dataset.sgToggleState = 'open';
    }
  }

  function syncArrowState(ctrlEl) {
    const a = ctrlEl.querySelector(':scope > .sgta-arrow');
    if (!a) return;
    a.dataset.state = (ctrlEl.dataset.sgToggleState === 'closed') ? 'closed' : 'open';
    a.dataset.side = String(ctrlEl.dataset.sgToggleArrowSide || 'right');
  }

  function toggleByController(ctrlEl, forceState ) {
    if (!ctrlEl) return;
    normalizeDefaults(ctrlEl);

    const targetId = String(ctrlEl.dataset.sgToggleTarget || '').trim();
    if (!targetId) return;
    const targetEl = getElById(targetId);
    if (!targetEl) return;

    const curVisible = targetIsVisible(targetEl);
    const nextVisible = (forceState === 'open') ? true : (forceState === 'closed') ? false : !curVisible;

    setTargetVisible(targetEl, nextVisible);
    ctrlEl.dataset.sgToggleState = nextVisible ? 'open' : 'closed';
    syncArrowState(ctrlEl);h
    if (isEditor()) scheduleDecorateLayers();
  }

  function attachSelfTrigger(ctrlEl) {
    const trig = String(ctrlEl.dataset.sgToggleTrigger || 'arrow');
    if (trig !== 'self') return;
    const targetId = String(ctrlEl.dataset.sgToggleTarget || '').trim();
    if (!targetId) return;
const innerBtn = ctrlEl.querySelector(':scope > .sgbtn, :scope > button, :scope > a');

    const clickEl = innerBtn || ctrlEl;

    if (clickEl.__sgToggleBound) return;
    clickEl.__sgToggleBound = true;
    if (isEditor()) {
      clickEl.addEventListener('pointerdown', (ev) => {
        if (ev.altKey || ev.shiftKey) return; 
        ev.stopPropagation();
      }, true);
    }

    clickEl.addEventListener('click', (ev) => {
      toggleByController(ctrlEl);
    }, true);
  }

  function scanControllers() {
    ensureCss();
    for (const el of allElements()) {
      if (!el || el.nodeType !== 1) continue;
      if (!String(el.dataset.sgToggleTarget || '').trim()) continue;
      applyInitial(el);
      ensureArrow(el);
      attachSelfTrigger(el);
      syncArrowState(el);
    }
  }

function scheduleDecorateLayers(immediate = false) {
  if (!isEditor()) return;
  clearTimeout(ui.decorateTick);
  if (immediate) {
    ui.decorateTick = 0;
    requestAnimationFrame(() => decorateLayers());
    return;
  }

  ui.decorateTick = setTimeout(decorateLayers, LAYERS_DEBOUNCE_MS);
}
  function extractLayerId(li) {
    const small = Array.from(li.querySelectorAll('div')).find((d) => {
      const st = (d.getAttribute('style') || '').toLowerCase();
      return st.includes('font-size:10px') && st.includes('color:#94a3b8');
    });
    return (small?.textContent || '').trim();
  }

  function getControllersAndTargets() {
    const ctrlToTgt = new Map();
    const tgtToCtrls = new Map();
    for (const el of allElements()) {
      const id = getId(el);
      const tgt = String(el.dataset.sgToggleTarget || '').trim();
      if (!id || !tgt) continue;
      ctrlToTgt.set(id, tgt);
      if (!tgtToCtrls.has(tgt)) tgtToCtrls.set(tgt, []);
      tgtToCtrls.get(tgt).push(id);
    }
    return { ctrlToTgt, tgtToCtrls };
  }

  function stop(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  function miniBtn(label, title, pressed) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sgta-mini';
    b.textContent = label;
    b.title = title;
    b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    b.addEventListener('mousedown', stop, true);
    b.addEventListener('click', stop, true);
    return b;
  }

  function decorateLayers() {
    if (!isEditor()) return;
    const list = document.getElementById('layers-list');
    if (!list) return;
    ui.isDecorating = true;
    if (ui.layersObs) ui.layersObs.disconnect();

    const { ctrlToTgt, tgtToCtrls } = getControllersAndTargets();
    const items = Array.from(list.querySelectorAll('li'));

    items.forEach((li) => {
      const id = extractLayerId(li);
      if (!id) return;

const row = li.querySelector('.layer-top-row') || li.querySelector('div');
if (!row) return;
const controls = row.querySelector('.layer-controls') || row;

let holder = controls.querySelector('.sgta-holder');
if (!holder) {
  holder = document.createElement('div');
  holder.className = 'sgta-holder';
  holder.style.display = 'inline-flex';
  holder.style.alignItems = 'center';
  holder.style.gap = '6px';
  holder.style.flexShrink = '0';
  controls.appendChild(holder);
}

      holder.innerHTML = '';
      const isCtrl = ctrlToTgt.has(id);
      const isTgt = tgtToCtrls.has(id);
      if (isCtrl) {
        const b = document.createElement('span');
        b.className = 'sgta-badge ctrl';
        b.textContent = 'CTRL';
        holder.appendChild(b);
      }
      if (isTgt) {
        const b = document.createElement('span');
        b.className = 'sgta-badge tgt';
        b.textContent = 'CEL';
        holder.appendChild(b);
      }
      const cBtn = miniBtn('C', 'Ustaw jako element główny (kontroler)', ui.pickControllerId === id);
      cBtn.addEventListener('click', (ev) => {
        stop(ev);
        ui.pickControllerId = id;
        ui.pickTargetId = '';
        scheduleDecorateLayers();
      }, true);
      holder.appendChild(cBtn);

      const tBtn = miniBtn('T', 'Ustaw jako element wyświetlany (cel)', ui.pickTargetId === id);
      tBtn.addEventListener('click', (ev) => {
        stop(ev);
        ui.pickTargetId = id;
        if (ui.pickControllerId && ui.pickControllerId !== id) {
          const ctrlEl = getElById(ui.pickControllerId);
          if (ctrlEl) {
            ctrlEl.dataset.sgToggleTarget = id;
            const isBtn = isButtonController(ctrlEl);
            if (!ctrlEl.dataset.sgToggleTrigger) ctrlEl.dataset.sgToggleTrigger = isBtn ? 'self' : 'arrow';
            if (!ctrlEl.dataset.sgToggleArrow) ctrlEl.dataset.sgToggleArrow = isBtn ? '0' : '1';
            if (isBtn && String(ctrlEl.dataset.sgToggleTrigger || '') === 'self') {
              ctrlEl.dataset.sgToggleArrow = '0';
            }
            if (!ctrlEl.dataset.sgToggleInitial) ctrlEl.dataset.sgToggleInitial = 'open';
            if (!ctrlEl.dataset.sgToggleArrowSide) ctrlEl.dataset.sgToggleArrowSide = 'right';
            scanControllers();
          }
          ui.pickControllerId = '';
          ui.pickTargetId = '';
        }
        scheduleDecorateLayers();
      }, true);
      holder.appendChild(tBtn);
      if (isCtrl) {
        const ctrlEl = getElById(id);
        if (ctrlEl) {
          const arrowOn = String(ctrlEl.dataset.sgToggleArrow || '1') === '1';
          const trig = String(ctrlEl.dataset.sgToggleTrigger || 'arrow');
          const isBtnType = (getType(ctrlEl) === 'button') || !!ctrlEl.querySelector('.sgbtn');
          if (!(isBtnType && trig === 'self')) {
            const aBtn = miniBtn('↗', 'Włącz/wyłącz strzałkę na elemencie głównym', arrowOn);
            aBtn.addEventListener('click', (ev) => {
              stop(ev);
              ctrlEl.dataset.sgToggleArrow = arrowOn ? '0' : '1';
              scanControllers();
              scheduleDecorateLayers();
            }, true);
            holder.appendChild(aBtn);
          }

          if (isBtnType) {
            const selfOn = trig === 'self';
            const bBtn = miniBtn('BTN', 'Kliknięcie guzika steruje celem (ALT/SHIFT = przeciąganie)', selfOn);
            bBtn.addEventListener('click', (ev) => {
              stop(ev);
              ctrlEl.dataset.sgToggleTrigger = selfOn ? 'arrow' : 'self';
              if (!selfOn) ctrlEl.dataset.sgToggleArrow = '0';
              scanControllers();
              scheduleDecorateLayers();
            }, true);
            holder.appendChild(bBtn);
          }

          const xBtn = document.createElement('button');
          xBtn.type = 'button';
          xBtn.className = 'sgta-mini danger';
          xBtn.textContent = '×';
          xBtn.title = 'Usuń powiązanie (kontroler → cel)';
          xBtn.addEventListener('mousedown', stop, true);
          xBtn.addEventListener('click', (ev) => {
            stop(ev);
            delete ctrlEl.dataset.sgToggleTarget;
            delete ctrlEl.dataset.sgToggleTrigger;
            delete ctrlEl.dataset.sgToggleArrow;
            delete ctrlEl.dataset.sgToggleInitial;
            delete ctrlEl.dataset.sgToggleArrowSide;
            delete ctrlEl.dataset.sgToggleState;
            const a = ctrlEl.querySelector(':scope > .sgta-arrow');
            if (a) a.remove();
            scheduleDecorateLayers();
          }, true);
          holder.appendChild(xBtn);
        }
      }
    });

    ui.isDecorating = false;
    if (ui.layersObs) ui.layersObs.observe(list, { childList: true, subtree: true });
  }

  function ensureLayersObserver() {
    if (!isEditor()) return;
    const list = document.getElementById('layers-list');
    if (!list) return;
    if (ui.layersObs) return;
    ui.layersObs = new MutationObserver(() => {
      if (ui.isDecorating) return;
      scheduleDecorateLayers();
    });
    ui.layersObs.observe(list, { childList: true, subtree: true });
  }

function wrapRefreshLayers() {
  if (!isEditor()) return;
  if (typeof window.refreshLayers !== 'function') return;
  const orig = window.refreshLayers;
  if (orig.__sgToggleWrapped) return;

  window.refreshLayers = function () {
    orig();
    scheduleDecorateLayers(true);
  };

  window.refreshLayers.__sgToggleWrapped = true;
}

  // API
  function exposeApi() {
    window.sgToggle = {
      link(controllerId, targetId, opts = {}) {
        const c = getElById(controllerId);
        const t = getElById(targetId);
        if (!c || !t) return false;
        const isBtn = isButtonController(c);

        const trigger = (opts.trigger != null && String(opts.trigger) !== '')
          ? String(opts.trigger)
          : (c.dataset.sgToggleTrigger || (isBtn ? 'self' : 'arrow'));

        let arrow = (opts.arrow != null)
          ? String(opts.arrow)
          : (c.dataset.sgToggleArrow != null ? String(c.dataset.sgToggleArrow) : (isBtn ? '0' : '1'));
        if (isBtn && trigger === 'self') arrow = '0';

        c.dataset.sgToggleTarget = targetId;
        c.dataset.sgToggleTrigger = trigger;
        c.dataset.sgToggleArrow = arrow;
        c.dataset.sgToggleInitial = String(opts.initial || c.dataset.sgToggleInitial || 'open');
        c.dataset.sgToggleArrowSide = String(opts.side || c.dataset.sgToggleArrowSide || 'right');
        scanControllers();
        scheduleDecorateLayers();
        return true;
      },
      unlink(controllerId) {
        const c = getElById(controllerId);
        if (!c) return;
        delete c.dataset.sgToggleTarget;
        delete c.dataset.sgToggleTrigger;
        delete c.dataset.sgToggleArrow;
        delete c.dataset.sgToggleInitial;
        delete c.dataset.sgToggleArrowSide;
        delete c.dataset.sgToggleState;
        const a = c.querySelector(':scope > .sgta-arrow');
        if (a) a.remove();
        scheduleDecorateLayers();
      },
      toggle(controllerId, force) {
        const c = getElById(controllerId);
        if (!c) return;
        toggleByController(c, force);
      },
      rescan() {
        scanControllers();
        scheduleDecorateLayers();
      }
    };
  }

  function boot() {
    ensureCss();
    exposeApi();
    scanControllers();
    ensureLayersObserver();
    wrapRefreshLayers();
    scheduleDecorateLayers();
    const canvas = document.getElementById('preview-canvas') || document.getElementById('page-canvas') || document.body;
    if (canvas && !canvas.__sgToggleObs) {
      const obs = new MutationObserver(() => {
        scanControllers();
        scheduleDecorateLayers();
      });
      obs.observe(canvas, { childList: true, subtree: true });
      canvas.__sgToggleObs = obs;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
