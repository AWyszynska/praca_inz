document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  let savedRange = null;

  function isTextActive() {
    return (
      typeof activeElement !== "undefined" &&
      activeElement &&
      activeElement.dataset &&
      activeElement.dataset.type === "text"
    );
  }

  function getRangeFromSelectionOrSaved() {
    if (!isTextActive()) return null;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && activeElement.contains(sel.anchorNode)) {
      return sel.getRangeAt(0);
    }
    return savedRange || null;
  }

  function styleKey(node) {
    if (!node || node.nodeType !== 1) return "";
    const raw = (node.getAttribute("style") || "").trim();
    if (!raw) return "";
    return raw
      .replace(/\s*;\s*/g, ";")
      .replace(/\s*:\s*/g, ":")
      .replace(/;$/g, "");
  }

  function unwrap(node) {
    if (!node || !node.parentNode) return;
    const parent = node.parentNode;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    parent.removeChild(node);
  }

  function cleanupTextMarkup(root) {
    if (!root) return;

    let changed = true;
    let guard = 0;

    while (changed && guard < 30) {
      guard++;
      changed = false;
      root.querySelectorAll("span").forEach((sp) => {
        if (!sp.textContent && sp.children.length === 0) {
          sp.remove();
          changed = true;
        }
      });
      root.querySelectorAll("span").forEach((sp) => {
        const key = styleKey(sp);
        if (!key) {
          unwrap(sp);
          changed = true;
        }
      });
      root.querySelectorAll("span span").forEach((inner) => {
        const outer = inner.parentElement;
        if (!outer || outer.tagName !== "SPAN") return;

        const a = styleKey(outer);
        const b = styleKey(inner);
        if (a && b && a === b) {
          while (inner.firstChild) outer.insertBefore(inner.firstChild, inner);
          inner.remove();
          changed = true;
        }
      });
      root.querySelectorAll("span").forEach((sp) => {
        const next = sp.nextSibling;
        if (!next || next.nodeType !== 1 || next.tagName !== "SPAN") return;

        const a = styleKey(sp);
        const b = styleKey(next);
        if (a && b && a === b) {
          while (next.firstChild) sp.appendChild(next.firstChild);
          next.remove();
          changed = true;
        }
      });
    }
  }

  function wrapRangeWithSpan(range, styles) {
    const span = document.createElement("span");
    Object.assign(span.style, styles);

    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);

    return span;
  }

  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    if (
      typeof activeElement !== "undefined" &&
      activeElement &&
      activeElement.dataset?.type === "text" &&
      activeElement.contains(sel.anchorNode)
    ) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  });

  function applySpanStyle(styles) {
    if (!isTextActive()) return;

    const sel = window.getSelection();
    const range = getRangeFromSelectionOrSaved();

    if (range && !range.collapsed) {
      try {
        const sp = wrapRangeWithSpan(range, styles);

        const newRange = document.createRange();
        newRange.selectNodeContents(sp);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRange = newRange;
      } catch (e) {
        console.error(e);
      }
    } else {
      Object.assign(activeElement.style, styles);
    }

    cleanupTextMarkup(activeElement);

    if (typeof refreshLayers === "function") refreshLayers();
    updateTextToolbarState();
  }

  function applyStyle(command, value) {
    if (!isTextActive()) return;

    const sel = window.getSelection();
    const range =
      sel && sel.rangeCount > 0 && activeElement.contains(sel.anchorNode)
        ? sel.getRangeAt(0)
        : savedRange;

    const styles = {};
    if (command === "fontSize") {
      const px = Math.max(1, parseInt(value, 10) || 20);
      styles.fontSize = px + "px";
    }
    if (command === "foreColor") {
      styles.color = value;
    }
    if (command === "fontName") {
      styles.fontFamily = String(value || "").replace(/"/g, "'");
    }

    if (range && !range.collapsed) {
      try {
        const sp = wrapRangeWithSpan(range, styles);

        const newRange = document.createRange();
        newRange.selectNodeContents(sp);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRange = newRange;
      } catch (e) {
        console.error(e);
      }
    } else {
      Object.assign(activeElement.style, styles);

      if (command === "fontSize") {
        const px = styles.fontSize;
        activeElement.querySelectorAll("span").forEach((sp) => {
          if (sp.style && sp.style.fontSize) sp.style.fontSize = px;
        });
      }

      if (command === "foreColor") {
        activeElement.querySelectorAll("span").forEach((sp) => {
          if (sp.style && sp.style.color) sp.style.color = styles.color;
        });
      }

      if (command === "fontName") {
        activeElement.querySelectorAll("span").forEach((sp) => {
          if (sp.style && sp.style.fontFamily) sp.style.fontFamily = styles.fontFamily;
        });
      }
    }

    cleanupTextMarkup(activeElement);

    if (typeof refreshLayers === "function") refreshLayers();
    updateTextToolbarState();
  }

  const colorInput = $("prop-color");
  if (colorInput) {
    colorInput.addEventListener("input", (e) => applyStyle("foreColor", e.target.value));
  }

  const sizeInput = $("prop-size");
  if (sizeInput) {
    const onSize = (e) => applyStyle("fontSize", e.target.value);
    sizeInput.addEventListener("input", onSize);
    sizeInput.addEventListener("change", onSize);
  }

  document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "prop-font-family") {
      applyStyle("fontName", e.target.value);
    }
  });

  const toggleBtn = $("toggle-fonts-btn");
  const options = $("font-options");
  if (toggleBtn && options) {
    toggleBtn.addEventListener("click", () => {
      const hidden = options.style.display === "none" || options.style.display === "";
      options.style.display = hidden ? "block" : "none";
      toggleBtn.innerText = hidden ? "🔡 Ukryj opcje czcionki" : "🔡 Opcje czcionki (rozwiń)";
    });
  }

  const boldBtn = $("tool-bold");
  if (boldBtn) {
    boldBtn.addEventListener("click", () => {
      const range = getRangeFromSelectionOrSaved();
      if (range && !range.collapsed) return applySpanStyle({ fontWeight: "700" });

      activeElement.style.fontWeight = activeElement.style.fontWeight === "700" ? "400" : "700";
      cleanupTextMarkup(activeElement);
      updateTextToolbarState();
    });
  }

  const italicBtn = $("tool-italic");
  if (italicBtn) {
    italicBtn.addEventListener("click", () => {
      const range = getRangeFromSelectionOrSaved();
      if (range && !range.collapsed) return applySpanStyle({ fontStyle: "italic" });

      activeElement.style.fontStyle = activeElement.style.fontStyle === "italic" ? "normal" : "italic";
      cleanupTextMarkup(activeElement);
      updateTextToolbarState();
    });
  }

  function toggleDecoration(part) {
    const cur = activeElement.style.textDecoration || "none";
    if (cur.includes(part)) {
      const cleaned = cur.replace(part, "").replace(/\s+/g, " ").trim();
      activeElement.style.textDecoration = cleaned === "" ? "none" : cleaned;
    } else {
      activeElement.style.textDecoration = cur === "none" || cur === "" ? part : cur + " " + part;
    }
  }

  const underBtn = $("tool-underline");
  if (underBtn) {
    underBtn.addEventListener("click", () => {
      const range = getRangeFromSelectionOrSaved();
      if (range && !range.collapsed) return applySpanStyle({ textDecoration: "underline" });

      toggleDecoration("underline");
      cleanupTextMarkup(activeElement);
      updateTextToolbarState();
    });
  }

  const strikeBtn = $("tool-strike");
  if (strikeBtn) {
    strikeBtn.addEventListener("click", () => {
      const range = getRangeFromSelectionOrSaved();
      if (range && !range.collapsed) return applySpanStyle({ textDecoration: "line-through" });

      toggleDecoration("line-through");
      cleanupTextMarkup(activeElement);
      updateTextToolbarState();
    });
  }

  const al = $("tool-align-left");
  if (al) al.addEventListener("click", () => { if (isTextActive()) activeElement.style.textAlign = "left"; updateTextToolbarState(); });

  const ac = $("tool-align-center");
  if (ac) ac.addEventListener("click", () => { if (isTextActive()) activeElement.style.textAlign = "center"; updateTextToolbarState(); });

  const ar = $("tool-align-right");
  if (ar) ar.addEventListener("click", () => { if (isTextActive()) activeElement.style.textAlign = "right"; updateTextToolbarState(); });

  const aj = $("tool-align-justify");
  if (aj) aj.addEventListener("click", () => { if (isTextActive()) activeElement.style.textAlign = "justify"; updateTextToolbarState(); });

  const lh = $("prop-line-height");
  if (lh) lh.addEventListener("change", (e) => { if (isTextActive()) activeElement.style.lineHeight = e.target.value; updateTextToolbarState(); });

  const ls = $("prop-letter-spacing");
  if (ls) ls.addEventListener("input", (e) => { if (isTextActive()) activeElement.style.letterSpacing = (e.target.value || 0) + "px"; updateTextToolbarState(); });

  const ws = $("prop-word-spacing");
  if (ws) ws.addEventListener("input", (e) => { if (isTextActive()) activeElement.style.wordSpacing = (e.target.value || 0) + "px"; updateTextToolbarState(); });

  const ti = $("prop-text-indent");
  if (ti) ti.addEventListener("input", (e) => { if (isTextActive()) activeElement.style.textIndent = parseInt(e.target.value || "0", 10) + "px"; updateTextToolbarState(); });

  const tt = $("prop-text-transform");
  if (tt) tt.addEventListener("change", (e) => { if (isTextActive()) activeElement.style.textTransform = e.target.value; updateTextToolbarState(); });

  const hi = $("prop-highlight");
  if (hi) {
    hi.addEventListener("input", (e) => {
      if (!isTextActive()) return;
      const range = getRangeFromSelectionOrSaved();
      if (range && !range.collapsed) return applySpanStyle({ backgroundColor: e.target.value });

      activeElement.style.backgroundColor = e.target.value;
      cleanupTextMarkup(activeElement);
      updateTextToolbarState();
    });
  }

  const linkBtn = $("tool-link");
  const unlinkBtn = $("tool-unlink");
  const linkHref = $("prop-link-href");
  const linkTarget = $("prop-link-target");

  function nodeToElement(n) {
    if (!n) return null;
    return n.nodeType === 1 ? n : n.parentElement;
  }

  function linkAtCaret(range) {
    if (!range) return null;
    const el = nodeToElement(range.startContainer);
    if (!el) return null;
    return el.closest ? el.closest("a") : null;
  }

  function normalizeHref(v) {
    const s = String(v || "").trim();
    if (!s) return "";
    return s;
  }

  function applyLink(url, target) {
    if (!isTextActive()) return;

    url = normalizeHref(url);
    if (!url) return;

    const range = getRangeFromSelectionOrSaved();
    if (!range) return;

    const rel = target === "_blank" ? "noopener noreferrer" : "";
    if (range.collapsed) {
      const aHere = linkAtCaret(range);
      if (aHere) {
        aHere.setAttribute("href", url);
        aHere.setAttribute("target", target || "_self");
        if (rel) aHere.setAttribute("rel", rel);
        aHere.classList.add("link");
        cleanupTextMarkup(activeElement);
        if (typeof refreshLayers === "function") refreshLayers();
        updateTextToolbarState();
        return;
      }

      if (activeElement.querySelector("a")) {
        alert("Zaznacz fragment tekstu, który ma być linkiem (bo już masz linki w tym polu).");
        return;
      }

      const wrap = document.createElement("a");
      wrap.setAttribute("href", url);
      wrap.setAttribute("target", target || "_self");
      if (rel) wrap.setAttribute("rel", rel);
      wrap.className = "link";

      while (activeElement.firstChild) wrap.appendChild(activeElement.firstChild);
      activeElement.appendChild(wrap);

      cleanupTextMarkup(activeElement);
      if (typeof refreshLayers === "function") refreshLayers();
      updateTextToolbarState();
      return;
    }
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("target", target || "_self");
    if (rel) a.setAttribute("rel", rel);
    a.className = "link";

    const frag = range.extractContents();
    a.appendChild(frag);
    range.insertNode(a);

    try {
      const sel = window.getSelection();
      const nr = document.createRange();
      nr.selectNodeContents(a);
      sel.removeAllRanges();
      sel.addRange(nr);
      savedRange = nr.cloneRange();
    } catch (e) {}

    cleanupTextMarkup(activeElement);
    if (typeof refreshLayers === "function") refreshLayers();
    updateTextToolbarState();
  }

  function removeLinks() {
    if (!isTextActive()) return;

    const range = getRangeFromSelectionOrSaved();
    if (!range) return;

    if (range.collapsed) {
      const aHere = linkAtCaret(range);
      if (aHere) unwrap(aHere);
      cleanupTextMarkup(activeElement);
      if (typeof refreshLayers === "function") refreshLayers();
      updateTextToolbarState();
      return;
    }

    const anchors = Array.from(activeElement.querySelectorAll("a"));
    anchors.forEach((a) => {
      try {
        if (range.intersectsNode(a)) unwrap(a);
      } catch (e) {}
    });

    cleanupTextMarkup(activeElement);
    if (typeof refreshLayers === "function") refreshLayers();
    updateTextToolbarState();
  }

  if (linkBtn) {
    linkBtn.addEventListener("click", () => {
      if (!isTextActive()) return;
      let url = linkHref ? linkHref.value : "";
      url = normalizeHref(url);

      if (!url) {
        url = normalizeHref(prompt("Podaj URL linku (np. https://..., #sekcja, mailto:...):", "https://") || "");
        if (linkHref) linkHref.value = url;
      }
      if (!url) return;

      const target = linkTarget ? linkTarget.value : "_self";
      applyLink(url, target);
    });
  }

  if (unlinkBtn) {
    unlinkBtn.addEventListener("click", () => {
      if (!isTextActive()) return;
      removeLinks();
    });
  }

  document.addEventListener(
    "click",
    (e) => {
      if (!window.SG_MODE || window.SG_MODE !== "builder") return;
      const a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      const inText = a.closest && a.closest('.canvas-element[data-type="text"]');
      if (!inText) return;
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );

  const clearBtn = $("tool-clear-format");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!isTextActive()) return;

      const txt = activeElement.innerText;
      activeElement.innerText = txt;

      activeElement.style.fontWeight = "400";
      activeElement.style.fontStyle = "normal";
      activeElement.style.textDecoration = "none";
      activeElement.style.letterSpacing = "0px";
      activeElement.style.wordSpacing = "0px";
      activeElement.style.textIndent = "0px";
      activeElement.style.textTransform = "none";
      activeElement.style.textAlign = "left";
      activeElement.style.lineHeight = "1.2";
      activeElement.style.backgroundColor = "transparent";

      if (typeof refreshLayers === "function") refreshLayers();
      updateTextToolbarState();
    });
  }

  function setActive(id, on) {
    const btn = $(id);
    if (btn) btn.classList.toggle("active", !!on);
  }

  function safeRgbToHex(rgb) {
    if (typeof rgbToHex === "function") return rgbToHex(rgb);
    return "#000000";
  }

  function updateTextToolbarState() {
    if (!isTextActive()) return;

    const cs = getComputedStyle(activeElement);
    const fw = cs.fontWeight;
    const boldOn = fw === "bold" || parseInt(fw, 10) >= 600;

    setActive("tool-bold", boldOn);
    setActive("tool-italic", cs.fontStyle === "italic");

    const td = cs.textDecorationLine || activeElement.style.textDecoration || "none";
    setActive("tool-underline", td.includes("underline"));
    setActive("tool-strike", td.includes("line-through"));

    if (sizeInput) sizeInput.value = parseInt(cs.fontSize, 10) || 20;
    if (colorInput) colorInput.value = safeRgbToHex(cs.color);

    if (lh) lh.value = activeElement.style.lineHeight || "1.2";
    if (ls) ls.value = parseFloat(activeElement.style.letterSpacing || "0") || 0;
    if (ws) ws.value = parseFloat(activeElement.style.wordSpacing || "0") || 0;
    if (ti) ti.value = parseInt(activeElement.style.textIndent || "0", 10) || 0;
    if (tt) tt.value = activeElement.style.textTransform || "none";
        const r = getRangeFromSelectionOrSaved();
    const aHere = r ? linkAtCaret(r) : null;
    if (linkHref) linkHref.value = aHere ? (aHere.getAttribute("href") || "") : "";
    if (linkTarget) linkTarget.value = aHere ? (aHere.getAttribute("target") || "_self") : "_self";

  }

  window.updateTextToolbarState = updateTextToolbarState;
});
