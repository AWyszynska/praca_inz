document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (typeof activeElement !== 'undefined' && activeElement && activeElement.dataset?.type === 'text' && activeElement.contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  });

  function isTextActive() {
    return (typeof activeElement !== 'undefined' && activeElement && activeElement.dataset && activeElement.dataset.type === 'text');
  }

  function getRangeFromSelectionOrSaved() {
    if (!isTextActive()) return null;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && activeElement.contains(sel.anchorNode)) return sel.getRangeAt(0);
    return savedRange || null;
  }

  function applySpanStyle(styles) {
    if (!isTextActive()) return;

    const sel = window.getSelection();
    const range = getRangeFromSelectionOrSaved();

    if (range && !range.collapsed) {
      const span = document.createElement('span');
      Object.assign(span.style, styles);

      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);

        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRange = newRange;
      } catch (e) {
        console.error(e);
      }
    } else {
      Object.assign(activeElement.style, styles);
    }

    if (typeof refreshLayers === 'function') refreshLayers();
    updateTextToolbarState();
  }

  function applyStyle(command, value) {
    if (!isTextActive()) return;

    const selection = window.getSelection();
    const range = (selection.rangeCount > 0 && activeElement.contains(selection.anchorNode))
      ? selection.getRangeAt(0)
      : savedRange;

    if (range && !range.collapsed) {
      const span = document.createElement('span');
      if (command === 'fontSize') span.style.fontSize = value + 'px';
      if (command === 'foreColor') span.style.color = value;
      if (command === 'fontName') span.style.fontFamily = value.replace(/"/g, "'");

      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(newRange);
        savedRange = newRange;
      } catch (e) { console.error(e); }
    } else {
      if (command === 'foreColor') activeElement.style.color = value;
      if (command === 'fontSize') activeElement.style.fontSize = value + 'px';
      if (command === 'fontName') activeElement.style.fontFamily = value.replace(/"/g, "'");
    }

    if (typeof refreshLayers === 'function') refreshLayers();
    updateTextToolbarState();
  }

  const colorInput = $('prop-color');
  if (colorInput) colorInput.addEventListener('input', (e) => applyStyle('foreColor', e.target.value));

  const sizeInput = $('prop-size');
  if (sizeInput) sizeInput.addEventListener('input', (e) => applyStyle('fontSize', e.target.value));

  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'prop-font-family') applyStyle('fontName', e.target.value);
  });

  const toggleBtn = $('toggle-fonts-btn');
  const options = $('font-options');
  if (toggleBtn && options) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = options.style.display === 'none' || options.style.display === '';
      options.style.display = isHidden ? 'block' : 'none';
      toggleBtn.innerText = isHidden ? '🔡 Ukryj opcje czcionki' : '🔡 Opcje czcionki (rozwiń)';
    });
  }

  const boldBtn = $('tool-bold');
  if (boldBtn) boldBtn.addEventListener('click', () => {
    const range = getRangeFromSelectionOrSaved();
    if (range && !range.collapsed) return applySpanStyle({ fontWeight: '700' });
    activeElement.style.fontWeight = (activeElement.style.fontWeight === '700') ? '400' : '700';
    updateTextToolbarState();
  });

  const italicBtn = $('tool-italic');
  if (italicBtn) italicBtn.addEventListener('click', () => {
    const range = getRangeFromSelectionOrSaved();
    if (range && !range.collapsed) return applySpanStyle({ fontStyle: 'italic' });
    activeElement.style.fontStyle = (activeElement.style.fontStyle === 'italic') ? 'normal' : 'italic';
    updateTextToolbarState();
  });

  function toggleDecoration(part) {
    const cur = (activeElement.style.textDecoration || 'none');
    if (cur.includes(part)) {
      const cleaned = cur.replace(part, '').replace(/\s+/g, ' ').trim();
      activeElement.style.textDecoration = cleaned === '' ? 'none' : cleaned;
    } else {
      activeElement.style.textDecoration = (cur === 'none' || cur === '') ? part : (cur + ' ' + part);
    }
  }

  const underBtn = $('tool-underline');
  if (underBtn) underBtn.addEventListener('click', () => {
    const range = getRangeFromSelectionOrSaved();
    if (range && !range.collapsed) return applySpanStyle({ textDecoration: 'underline' });
    toggleDecoration('underline');
    updateTextToolbarState();
  });

  const strikeBtn = $('tool-strike');
  if (strikeBtn) strikeBtn.addEventListener('click', () => {
    const range = getRangeFromSelectionOrSaved();
    if (range && !range.collapsed) return applySpanStyle({ textDecoration: 'line-through' });
    toggleDecoration('line-through');
    updateTextToolbarState();
  });

  const al = $('tool-align-left');     if (al) al.addEventListener('click', () => { if (isTextActive()) activeElement.style.textAlign = 'left'; updateTextToolbarState(); });
  const ac = $('tool-align-center');   if (ac) ac.addEventListener('click', () => { if (isTextActive()) activeElement.style.textAlign = 'center'; updateTextToolbarState(); });
  const ar = $('tool-align-right');    if (ar) ar.addEventListener('click', () => { if (isTextActive()) activeElement.style.textAlign = 'right'; updateTextToolbarState(); });
  const aj = $('tool-align-justify');  if (aj) aj.addEventListener('click', () => { if (isTextActive()) activeElement.style.textAlign = 'justify'; updateTextToolbarState(); });

  const lh = $('prop-line-height');
  if (lh) lh.addEventListener('change', (e) => { if (isTextActive()) activeElement.style.lineHeight = e.target.value; updateTextToolbarState(); });

  const ls = $('prop-letter-spacing');
  if (ls) ls.addEventListener('input', (e) => { if (isTextActive()) activeElement.style.letterSpacing = (e.target.value || 0) + 'px'; updateTextToolbarState(); });

  const ws = $('prop-word-spacing');
  if (ws) ws.addEventListener('input', (e) => { if (isTextActive()) activeElement.style.wordSpacing = (e.target.value || 0) + 'px'; updateTextToolbarState(); });

  const ti = $('prop-text-indent');
  if (ti) ti.addEventListener('input', (e) => { if (isTextActive()) activeElement.style.textIndent = (parseInt(e.target.value || '0', 10)) + 'px'; updateTextToolbarState(); });

  const tt = $('prop-text-transform');
  if (tt) tt.addEventListener('change', (e) => { if (isTextActive()) activeElement.style.textTransform = e.target.value; updateTextToolbarState(); });

  const hi = $('prop-highlight');
  if (hi) hi.addEventListener('input', (e) => {
    if (!isTextActive()) return;
    const range = getRangeFromSelectionOrSaved();
    if (range && !range.collapsed) return applySpanStyle({ backgroundColor: e.target.value });
    activeElement.style.backgroundColor = e.target.value;
    updateTextToolbarState();
  });

  const clearBtn = $('tool-clear-format');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (!isTextActive()) return;

    const txt = activeElement.innerText;
    activeElement.innerText = txt;

    activeElement.style.fontWeight = '400';
    activeElement.style.fontStyle = 'normal';
    activeElement.style.textDecoration = 'none';
    activeElement.style.letterSpacing = '0px';
    activeElement.style.wordSpacing = '0px';
    activeElement.style.textIndent = '0px';
    activeElement.style.textTransform = 'none';
    activeElement.style.textAlign = 'left';
    activeElement.style.lineHeight = '1.2';
    activeElement.style.backgroundColor = 'transparent';

    if (typeof refreshLayers === 'function') refreshLayers();
    updateTextToolbarState();
  });

  function setActive(id, on) {
    const b = $(id);
    if (b) b.classList.toggle('active', !!on);
  }

  function updateTextToolbarState() {
    if (!isTextActive()) return;

    const cs = getComputedStyle(activeElement);
    const fw = cs.fontWeight;
    const boldOn = (fw === 'bold' || parseInt(fw, 10) >= 600);
    setActive('tool-bold', boldOn);

    setActive('tool-italic', cs.fontStyle === 'italic');

    const td = (cs.textDecorationLine || activeElement.style.textDecoration || 'none');
    setActive('tool-underline', td.includes('underline'));
    setActive('tool-strike', td.includes('line-through'));

    if (sizeInput) sizeInput.value = parseInt(cs.fontSize, 10) || 20;
    if (colorInput) colorInput.value = rgbToHex(cs.color);

    if (lh) lh.value = activeElement.style.lineHeight || '1.2';
    if (ls) ls.value = parseFloat(activeElement.style.letterSpacing || '0') || 0;
    if (ws) ws.value = parseFloat(activeElement.style.wordSpacing || '0') || 0;
    if (ti) ti.value = parseInt(activeElement.style.textIndent || '0', 10) || 0;
    if (tt) tt.value = activeElement.style.textTransform || 'none';
  }

  window.updateTextToolbarState = updateTextToolbarState;
});
