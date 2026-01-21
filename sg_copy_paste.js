(() => {

  if (window.__SG_COPY_PASTE_READY__) return;
  window.__SG_COPY_PASTE_READY__ = true;

  window.sgCopyBuffer = null;

  function sg_walkCanvasElements(root, fn) {
    if (!root) return;
    if (root.classList && root.classList.contains("canvas-element")) fn(root);
    Array.from(root.children || []).forEach((ch) => sg_walkCanvasElements(ch, fn));
  }

  function sg_makeId(type) {
    return "el_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
  }

  function sg_packSelection(el) {
    const parent = el.parentElement;
    return {
      v: 1,
      html: el.outerHTML,
      left: parseInt(el.style.left || "0", 10) || 0,
      top: parseInt(el.style.top || "0", 10) || 0,
      zIndex: parseInt(el.style.zIndex || "0", 10) || 0,
      parentId: parent && parent.dataset ? parent.dataset.id || "" : "",
      parentIsCanvas: parent === window.canvas,
      ts: Date.now(),
    };
  }

  function sg_unpackToNode(pack) {
    const tmp = document.createElement("div");
    tmp.innerHTML = pack.html;
    const node = tmp.firstElementChild;
    if (!node || !node.classList || !node.classList.contains("canvas-element")) return null;
    return node;
  }
  function sg_reassignIds(srcEl, clonedEl) {
    const srcNodes = [];
    const cloneNodes = [];
    sg_walkCanvasElements(srcEl, (n) => srcNodes.push(n));
    sg_walkCanvasElements(clonedEl, (n) => cloneNodes.push(n));

    const map = {};
    const n = Math.min(srcNodes.length, cloneNodes.length);

    for (let i = 0; i < n; i++) {
      const oldId = srcNodes[i].dataset?.id || "";
      const newId = sg_makeId(cloneNodes[i].dataset?.type || "el");
      if (oldId) map[oldId] = newId;

      cloneNodes[i].dataset.id = newId;

      cloneNodes[i].classList.remove("active");
      delete cloneNodes[i].dataset.locked;
      delete cloneNodes[i].dataset.origin;

      if (cloneNodes[i].dataset.htmlId) cloneNodes[i].dataset.htmlId = "";
      cloneNodes[i].removeAttribute("id");
    }

    cloneNodes.forEach((nod) => {
      const t = String(nod.dataset.sgToggleTarget || "").trim();
      if (t && map[t]) nod.dataset.sgToggleTarget = map[t];

      const s = String(nod.dataset.btnScrollTargetId || "").trim();
      if (s && map[s]) nod.dataset.btnScrollTargetId = map[s];
    });

    return map;
  }

  function sg_bindBehaviors(root) {
    sg_walkCanvasElements(root, (el) => {
      const type = el.dataset.type || "";
      el.style.pointerEvents = "auto";
      el.contentEditable = "false";

      if (type === "text") {
        el.dataset.editing = "0";
        el.ondblclick = (e) => {
          e.stopPropagation();
          if (el.dataset.locked !== "1") window.enterTextEdit?.(el);
        };
      }

      window.setupElementMovement?.(el, type);
      window.afterCreateFromXml?.(el);
    });
  }

  function sg_pastePack(pack) {
    if (!pack || !pack.html) return;

    const canvas = window.canvas;
    if (!canvas) return;

    const target =
      window.activeContainer && window.activeContainer !== canvas
        ? window.activeContainer
        : canvas;
    if (target?.dataset?.locked === "1" || target?.dataset?.origin === "base") return;

    const clone = sg_unpackToNode(pack);
    if (!clone) return;

    const srcTmp = document.createElement("div");
    srcTmp.innerHTML = pack.html;
    const srcRoot = srcTmp.firstElementChild;

    if (srcRoot) sg_reassignIds(srcRoot, clone);
    else sg_reassignIds(clone, clone);

    let left = (pack.left || 0) + 20;
    let top = (pack.top || 0) + 20;

    if (target !== canvas) {
      const rect = clone.getBoundingClientRect();
      const w = rect.width || parseInt(clone.style.width || "0", 10) || 0;
      const h = rect.height || parseInt(clone.style.height || "0", 10) || 0;

      const maxX = Math.max(0, target.clientWidth - w);
      const maxY = Math.max(0, target.clientHeight - h);

      left = Math.min(Math.max(0, left), maxX);
      top = Math.min(Math.max(0, top), maxY);
    }

    clone.style.left = left + "px";
    clone.style.top = top + "px";

    const newZ = (parseInt(pack.zIndex || "0", 10) || 0) + 1;
    clone.style.zIndex = String(newZ);
    if (typeof window.zCounter !== "undefined") window.zCounter = Math.max(window.zCounter, newZ);

    target.appendChild(clone);
    sg_bindBehaviors(clone);

    window.selectElement?.(clone);
    window.refreshLayers?.();
  }

  function sg_copyActive() {
    const el = window.activeElement;
    if (!el) return false;
    if (el.dataset.locked === "1" || el.dataset.origin === "base") return false;

    const pack = sg_packSelection(el);
    window.sgCopyBuffer = pack;

    try {
      navigator.clipboard?.writeText?.("SG_ELEMENT:" + JSON.stringify(pack));
    } catch (e) {}

    return true;
  }

  async function sg_paste() {
    if (window.sgCopyBuffer) {
      sg_pastePack(window.sgCopyBuffer);
      return;
    }
    try {
      const t = await navigator.clipboard?.readText?.();
      if (t && t.startsWith("SG_ELEMENT:")) {
        const pack = JSON.parse(t.slice("SG_ELEMENT:".length));
        sg_pastePack(pack);
      }
    } catch (e) {}
  }

  function sg_cutActive() {
    const ok = sg_copyActive();
    if (!ok) return;
    if (window.activeElement) {
      window.activeElement.remove();
      window.deselectAll?.();
      window.refreshLayers?.();
    }
  }

  document.addEventListener(
    "keydown",
    (e) => {
      const el = window.activeElement;
      if (!el) return;

      const focused = document.activeElement;
      const tag = focused && focused.tagName ? focused.tagName.toUpperCase() : "";
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (focused && focused.isContentEditable) return;

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const k = (e.key || "").toLowerCase();
      if (k === "c") {
        e.preventDefault();
        sg_copyActive();
      } else if (k === "v") {
        e.preventDefault();
        sg_paste();
      } else if (k === "x") {
        e.preventDefault();
        sg_cutActive();
      }
    },
    true
  );
  document.addEventListener("copy", (e) => {
    if (!window.activeElement) return;
    if (!sg_copyActive()) return;
    try {
      e.clipboardData.setData("text/plain", "SG_ELEMENT:" + JSON.stringify(window.sgCopyBuffer));
      e.preventDefault();
    } catch (err) {}
  });

  document.addEventListener("paste", (e) => {
    try {
      const t = e.clipboardData.getData("text/plain");
      if (t && t.startsWith("SG_ELEMENT:")) {
        const pack = JSON.parse(t.slice("SG_ELEMENT:".length));
        sg_pastePack(pack);
        e.preventDefault();
      }
    } catch (err) {}
  });
})();
