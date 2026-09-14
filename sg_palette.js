(() => {
  const $ = (id) => document.getElementById(id);

  const PANEL_ID = "sgPalettePanel";
  const KEY_PREFIX = "sg_palette_v1__";

  function getProjectKey() {
const qs = new URLSearchParams(location.search);
const file =
  String(window.sgCurrentFile || qs.get("file") || "generated_page.xml").trim() || "generated_page.xml";
return KEY_PREFIX + file;

  }

  function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function rgbToHex(rgb) {
    const m = String(rgb || "").match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (!m) return null;
    const r = clamp(Math.round(parseFloat(m[1])), 0, 255);
    const g = clamp(Math.round(parseFloat(m[2])), 0, 255);
    const b = clamp(Math.round(parseFloat(m[3])), 0, 255);
    const toHex = (v) => v.toString(16).padStart(2, "0");
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  function normalizeHex(c) {
    const s = String(c || "").trim();
    if (!s) return "#000000";
    if (s.startsWith("#")) {
      if (s.length === 4) {
        return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
      }
      if (s.length >= 7) return s.slice(0, 7);
      return s;
    }
    const asHex = rgbToHex(s);
    return asHex || "#000000";
  }

  function loadPalette() {
    const key = getProjectKey();
    const raw = localStorage.getItem(key);
    const data = safeJsonParse(raw, []);
    return Array.isArray(data) ? data : [];
  }

  function savePalette(list) {
    const key = getProjectKey();
    localStorage.setItem(key, JSON.stringify(list || []));
  }

  function uniqName(list, baseName) {
    const name = (baseName || "").trim() || "Color";
    const used = new Set(list.map(x => (x && x.name ? String(x.name) : "").toLowerCase()));
    if (!used.has(name.toLowerCase())) return name;
    let i = 2;
    while (used.has((name + " " + i).toLowerCase())) i++;
    return name + " " + i;
  }

  let lastTargetInput = null;

  function setTargetInput(el) {
    lastTargetInput = el || null;
  }

  function applyToTarget(colorHex) {
    if (!lastTargetInput) return;

    const v = normalizeHex(colorHex);
    if (lastTargetInput.tagName === "INPUT" && lastTargetInput.type === "color") {
      lastTargetInput.value = v;
      lastTargetInput.dispatchEvent(new Event("input", { bubbles: true }));
      lastTargetInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    if (
      (lastTargetInput.tagName === "INPUT" && lastTargetInput.type !== "file") ||
      lastTargetInput.tagName === "TEXTAREA"
    ) {
      lastTargetInput.value = v;
      lastTargetInput.dispatchEvent(new Event("input", { bubbles: true }));
      lastTargetInput.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
  }

  function renderList() {
    const listWrap = $("sg-pal-list");
    if (!listWrap) return;

    const palette = loadPalette();
    listWrap.innerHTML = "";

    palette.forEach((item, idx) => {
      const colorHex = normalizeHex(item?.color);
      const name = String(item?.name || "").trim() || `Color ${idx + 1}`;

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "sg-pal-chip";
      chip.title = `${name} • ${colorHex}`;
      chip.innerHTML = `
        <span class="sg-pal-swatch" style="background:${colorHex}"></span>
        <span class="sg-pal-label">${escapeHtml(name)}</span>
      `;

      chip.addEventListener("click", () => {
        const colorInput = $("sg-pal-color");
        if (colorInput) colorInput.value = colorHex;
        applyToTarget(colorHex);
      });

      chip.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const p = loadPalette();
        p.splice(idx, 1);
        savePalette(p);
        renderList();
      });

      listWrap.appendChild(chip);
    });

    if (!palette.length) {
      const empty = document.createElement("div");
      empty.style.fontSize = "12px";
      empty.style.color = "#64748b";
      empty.textContent = "Nie masz dodanych kolorów";
      listWrap.appendChild(empty);
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function pickFromScreen() {
    if (window.EyeDropper) {
      try {
        const eye = new EyeDropper();
        const res = await eye.open();
        return normalizeHex(res?.sRGBHex || "#000000");
      } catch {
        return null;
      }
    }
    return new Promise((resolve) => {
      let done = false;

      const hint = document.createElement("div");
      hint.className = "sg-pal-hint";
      hint.textContent = "Kliknij element na ekranie, żeby pobrać kolor (ESC anuluj)";
      document.body.appendChild(hint);

      const cleanup = () => {
        if (done) return;
        done = true;
        hint.remove();
        window.removeEventListener("keydown", onKey, true);
        document.removeEventListener("click", onClick, true);
        resolve(null);
      };

      const onKey = (e) => {
        if (e.key === "Escape") cleanup();
      };

      const onClick = (e) => {
        const panel = $(PANEL_ID);
        if (panel && panel.contains(e.target)) return; 
        e.preventDefault();
        e.stopPropagation();

        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el) return cleanup();

        const st = getComputedStyle(el);
        const bg = st.backgroundColor;
        const fg = st.color;

        const picked = (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") ? bg : fg;
        const hex = normalizeHex(picked);

        hint.remove();
        window.removeEventListener("keydown", onKey, true);
        document.removeEventListener("click", onClick, true);
        resolve(hex);
      };

      window.addEventListener("keydown", onKey, true);
      document.addEventListener("click", onClick, true);
    });
  }

  function bindUi() {
    const panel = $(PANEL_ID);
    if (!panel) return;

    const colorInput = $("sg-pal-color");
    const nameInput = $("sg-pal-name");
    const saveBtn = $("sg-pal-save");
    const pickBtn = $("sg-pal-pick");
    const clearBtn = $("sg-pal-clear");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const palette = loadPalette();
        const colorHex = normalizeHex(colorInput?.value || "#000000");
        const name = uniqName(palette, (nameInput?.value || "").trim() || "Color");

        palette.push({ name, color: colorHex, t: Date.now() });
        savePalette(palette);

        if (nameInput) nameInput.value = "";
        renderList();
      });
    }

    if (pickBtn) {
      pickBtn.addEventListener("click", async () => {
        const hex = await pickFromScreen();
        if (!hex) return;

        if (colorInput) colorInput.value = hex;
        const typedName = (nameInput?.value || "").trim();
        if (typedName) {
          const palette = loadPalette();
          const name = uniqName(palette, typedName);
          palette.push({ name, color: hex, t: Date.now() });
          savePalette(palette);
          nameInput.value = "";
          renderList();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (!confirm("Wyczyścić całą paletę kolorów dla tego projektu?")) return;
        savePalette([]);
        renderList();
      });
    }
document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (!el) return;

  const panel = document.getElementById("sgPalettePanel");
  if (panel && panel.contains(el)) return; 
      if (el.tagName === "INPUT" && el.type === "color") {
        setTargetInput(el);
        return;
      }
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        const id = (el.id || "").toLowerCase();
        const nm = (el.name || "").toLowerCase();
        const isLikely =
          id.includes("color") || id.includes("bg") || id.includes("border") ||
          nm.includes("color") || nm.includes("bg") || nm.includes("border");

        if (isLikely) setTargetInput(el);
      }
    }, true);

    renderList();
  }

  function injectCss() {
    if (document.getElementById("sg-pal-css")) return;
    const st = document.createElement("style");
    st.id = "sg-pal-css";
    st.textContent = `
      #${PANEL_ID} .sg-pal-row{display:flex;gap:8px;margin-top:8px;}
      #${PANEL_ID} .sg-pal-chip{
        display:flex;align-items:center;gap:8px;
        border:1px solid #e5e7eb;border-radius:12px;
        padding:8px 10px;background:#fff;cursor:pointer;
        max-width:100%;
      }
      #${PANEL_ID} .sg-pal-chip:hover{border-color:#94a3b8;box-shadow:0 0 0 3px rgba(148,163,184,0.20);}
      #${PANEL_ID} .sg-pal-swatch{
        width:18px;height:18px;border-radius:6px;border:1px solid rgba(15,23,42,0.18);
        flex:0 0 auto;
      }
      #${PANEL_ID} .sg-pal-label{font-size:12px;color:#0f172a;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      #${PANEL_ID} .sg-pal-help{margin-top:8px;font-size:11px;color:#64748b;line-height:1.25;}
      .sg-pal-hint{
        position:fixed;left:50%;top:14px;transform:translateX(-50%);
        background:#0f172a;color:#fff;padding:10px 12px;border-radius:12px;
        font-size:12px;font-weight:800;z-index:999999;
        box-shadow:0 10px 26px rgba(2,6,23,0.30);
      }
    `;
    document.head.appendChild(st);
  }

  function init() {
    injectCss();
    bindUi();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
