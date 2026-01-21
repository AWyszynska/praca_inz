(() => {
  const $ = (id) => document.getElementById(id);

  const inEditor = () => !!document.getElementById("preview-canvas");

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function defaultCfg() {
    return {
      mode: "none",         
      solid: "#f3f4f6",

      gradType: "linear",   
      gradAngle: 180,

      gradFrom: "#0ea5e9",
      gradMid:  "#6366f1",
      gradTo:   "#111827",
      gradUseMid: "0",

      gradPosX: 50,
      gradPosY: 50,

      gradPreset: ""
    };
  }

  function normalizeCfg(raw) {
    const cfg = { ...defaultCfg(), ...(raw && typeof raw === "object" ? raw : {}) };

    cfg.mode = ["none", "solid", "gradient"].includes(cfg.mode) ? cfg.mode : "none";
    cfg.gradType = ["linear", "radial", "conic"].includes(cfg.gradType) ? cfg.gradType : "linear";

    cfg.gradAngle = clamp(parseInt(cfg.gradAngle, 10) || 0, 0, 360);
    cfg.gradPosX = clamp(parseInt(cfg.gradPosX, 10) || 50, 0, 100);
    cfg.gradPosY = clamp(parseInt(cfg.gradPosY, 10) || 50, 0, 100);

    cfg.gradUseMid = (String(cfg.gradUseMid) === "1") ? "1" : "0";

    cfg.solid = String(cfg.solid || "#f3f4f6");
    cfg.gradFrom = String(cfg.gradFrom || "#0ea5e9");
    cfg.gradMid  = String(cfg.gradMid  || "#6366f1");
    cfg.gradTo   = String(cfg.gradTo   || "#111827");

    cfg.gradPreset = String(cfg.gradPreset || "");

    return cfg;
  }

  function buildBgCss(cfg) {
    if (!cfg || cfg.mode === "none") return "";

    if (cfg.mode === "solid") {
      return cfg.solid;
    }

    const a = cfg.gradAngle;
    const x = cfg.gradPosX;
    const y = cfg.gradPosY;

    const c1 = cfg.gradFrom;
    const c2 = cfg.gradTo;

    if (cfg.gradUseMid === "1") {
      const cm = cfg.gradMid;

      if (cfg.gradType === "radial") {
        return `radial-gradient(circle at ${x}% ${y}%, ${c1}, ${cm}, ${c2})`;
      }
      if (cfg.gradType === "conic") {
        return `conic-gradient(from ${a}deg at ${x}% ${y}%, ${c1}, ${cm}, ${c2})`;
      }
      return `linear-gradient(${a}deg, ${c1}, ${cm}, ${c2})`;
    }

    if (cfg.gradType === "radial") {
      return `radial-gradient(circle at ${x}% ${y}%, ${c1}, ${c2})`;
    }
    if (cfg.gradType === "conic") {
      return `conic-gradient(from ${a}deg at ${x}% ${y}%, ${c1}, ${c2})`;
    }
    return `linear-gradient(${a}deg, ${c1}, ${c2})`;
  }

  function applyProjectBg(cfg) {
    const css = buildBgCss(cfg);

    const body = document.body;
    if (body) {
      body.style.background = css || "";
      body.style.backgroundAttachment = "fixed";
      body.style.backgroundRepeat = "no-repeat";
      body.style.backgroundSize = "cover";
    }

    const host = inEditor() ? $("preview-canvas") : $("sg-scroll");
    if (host) {
      host.style.background = css || "";
      host.style.backgroundRepeat = "no-repeat";
      host.style.backgroundSize = "cover";
      host.style.backgroundAttachment = "local";
    }
  }

  function parseXmlProjectBg(xmlText) {
    try {
      const doc = new DOMParser().parseFromString(xmlText, "application/xml");
      if (doc.querySelector("parsererror")) return null;

      const pb = doc.querySelector("customPage > projectBackground");
      if (!pb) return null;

      const hasTags = pb.querySelector("mode, solid, gradType, gradFrom, gradTo");
      if (hasTags) {
        const get = (tag, def = "") => (pb.querySelector(tag)?.textContent || def).trim();
        const asBool01 = (v) => {
          const s = String(v ?? "").trim().toLowerCase();
          return (s === "1" || s === "true") ? "1" : "0";
        };

        return normalizeCfg({
          mode: get("mode", "none"),
          solid: get("solid", "#f3f4f6"),

          gradType: get("gradType", "linear"),
          gradAngle: parseInt(get("gradAngle", "180"), 10) || 180,

          gradFrom: get("gradFrom", "#0ea5e9"),
          gradMid: get("gradMid", "#6366f1"),
          gradTo: get("gradTo", "#111827"),
          gradUseMid: asBool01(get("gradUseMid", "0")),

          gradPosX: parseInt(get("gradPosX", "50"), 10) || 50,
          gradPosY: parseInt(get("gradPosY", "50"), 10) || 50,

          gradPreset: get("gradPreset", "")
        });
      }

      const raw = (pb.textContent || "").trim();
      if (raw && raw[0] === "{") {
        const decoded = raw;
        const tmp = JSON.parse(decoded);
        return normalizeCfg(tmp);
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  function syncUi(cfg) {
    const modeSel = $("proj-bg-mode");
    const solidWrap = $("proj-bg-solid-wrap");
    const solidInp = $("proj-bg-solid");

    const gradWrap = $("proj-bg-grad-wrap");
    const typeSel = $("proj-grad-type");
    const angleWrap = $("proj-grad-angle-wrap");
    const angleInp = $("proj-grad-angle");

    const fromInp = $("proj-grad-from");
    const midInp = $("proj-grad-mid");
    const toInp = $("proj-grad-to");
    const useMid = $("proj-grad-use-mid");

    const posX = $("proj-grad-posx");
    const posY = $("proj-grad-posy");

    const presetSel = $("proj-grad-preset");

    if (modeSel) modeSel.value = cfg.mode;

    if (solidInp) solidInp.value = cfg.solid || "#f3f4f6";

    if (typeSel) typeSel.value = cfg.gradType || "linear";
    if (angleInp) angleInp.value = String(cfg.gradAngle ?? 180);

    if (fromInp) fromInp.value = cfg.gradFrom || "#0ea5e9";
    if (midInp) midInp.value = cfg.gradMid || "#6366f1";
    if (toInp) toInp.value = cfg.gradTo || "#111827";
    if (useMid) useMid.checked = (String(cfg.gradUseMid) === "1");

    if (posX) posX.value = String(cfg.gradPosX ?? 50);
    if (posY) posY.value = String(cfg.gradPosY ?? 50);

    if (presetSel) presetSel.value = cfg.gradPreset || "";

    if (solidWrap) solidWrap.style.display = (cfg.mode === "solid") ? "block" : "none";
    if (gradWrap) gradWrap.style.display = (cfg.mode === "gradient") ? "block" : "none";

    if (angleWrap) {
      angleWrap.style.display = (cfg.gradType === "linear" || cfg.gradType === "conic") ? "block" : "none";
    }
  }

  function setHidden(cfg) {
    const h = $("sgProjectBgJson");
    if (h) h.value = JSON.stringify(cfg);
  }

  const presets = {
    ocean:   { gradType: "linear", gradAngle: 135, gradFrom: "#0ea5e9", gradTo: "#1d4ed8", gradUseMid: "0" },
    sunset:  { gradType: "linear", gradAngle: 135, gradFrom: "#fb7185", gradMid: "#f59e0b", gradTo: "#7c3aed", gradUseMid: "1" },
    forest:  { gradType: "linear", gradAngle: 135, gradFrom: "#22c55e", gradTo: "#065f46", gradUseMid: "0" },
    night:   { gradType: "linear", gradAngle: 180, gradFrom: "#0b1220", gradTo: "#111827", gradUseMid: "0" },
    candy:   { gradType: "linear", gradAngle: 135, gradFrom: "#38bdf8", gradMid: "#a78bfa", gradTo: "#fb7185", gradUseMid: "1" }
  };

  function bindUiOnce() {
    const modeSel = $("proj-bg-mode");
    if (!modeSel) return;
    if (modeSel.dataset.bound === "1") return;
    modeSel.dataset.bound = "1";

    const readCfg = () => {
      const raw = $("sgProjectBgJson")?.value || "{}";
      let tmp = null;
      try { tmp = JSON.parse(raw); } catch (e) {}
      return normalizeCfg(tmp);
    };

    const writeApply = (cfg) => {
      const next = normalizeCfg(cfg);
      window.sgProjectBgConfig = next;
      setHidden(next);
      syncUi(next);
      applyProjectBg(next);
    };

    const onAny = () => {
      const cfg = readCfg();

      cfg.mode = $("proj-bg-mode")?.value || "none";
      cfg.solid = $("proj-bg-solid")?.value || cfg.solid;

      cfg.gradType = $("proj-grad-type")?.value || cfg.gradType;
      cfg.gradAngle = parseInt($("proj-grad-angle")?.value || cfg.gradAngle, 10) || cfg.gradAngle;

      cfg.gradFrom = $("proj-grad-from")?.value || cfg.gradFrom;
      cfg.gradMid  = $("proj-grad-mid")?.value || cfg.gradMid;
      cfg.gradTo   = $("proj-grad-to")?.value || cfg.gradTo;

      cfg.gradUseMid = $("proj-grad-use-mid")?.checked ? "1" : "0";

      cfg.gradPosX = parseInt($("proj-grad-posx")?.value || cfg.gradPosX, 10) || cfg.gradPosX;
      cfg.gradPosY = parseInt($("proj-grad-posy")?.value || cfg.gradPosY, 10) || cfg.gradPosY;

      cfg.gradPreset = $("proj-grad-preset")?.value || "";

      writeApply(cfg);
    };

    const presetSel = $("proj-grad-preset");
    if (presetSel) {
      presetSel.addEventListener("change", () => {
        const cfg = readCfg();
        const key = presetSel.value || "";
        cfg.gradPreset = key;

        if (key && presets[key]) {
          Object.assign(cfg, presets[key]);
        }
        writeApply(cfg);
      });
    }

    [
      "proj-bg-mode",
      "proj-bg-solid",
      "proj-grad-type",
      "proj-grad-angle",
      "proj-grad-from",
      "proj-grad-mid",
      "proj-grad-to",
      "proj-grad-use-mid",
      "proj-grad-posx",
      "proj-grad-posy"
    ].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", onAny);
      el.addEventListener("change", onAny);
    });
    const initCfg = readCfg();
    writeApply(initCfg);
  }
  window.sgProjectBgDefault = defaultCfg;
  window.sgProjectBgParse = parseXmlProjectBg;
  window.sgProjectBgApply = (cfg) => applyProjectBg(normalizeCfg(cfg));
  window.sgProjectBgSyncUI = (cfg) => syncUi(normalizeCfg(cfg));
  window.sgProjectBgBindUI = bindUiOnce;

  document.addEventListener("DOMContentLoaded", () => {
    if (!inEditor() && window.sgProjectBgConfig) {
      applyProjectBg(normalizeCfg(window.sgProjectBgConfig));
    }
    if (inEditor()) bindUiOnce();
  });
})();
