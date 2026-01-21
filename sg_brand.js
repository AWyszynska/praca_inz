(() => {
  const $ = (id) => document.getElementById(id);
  const isEditor = () => !!document.getElementById("preview-canvas");
const setVal = (id, val) => {
  const n = $(id);
  if (n) n.value = String(val ?? "");
};

const setChk = (id, on) => {
  const n = $(id);
  if (n) n.checked = !!on;
};

const setDisp = (id, show) => {
  const n = $(id);
  if (n) n.style.display = show ? "block" : "none";
};

const setDis = (id, dis) => {
  const n = $(id);
  if (n) n.disabled = !!dis;
};

  function safeJson(raw, fallback) {
    try {
      const v = JSON.parse(raw);
      return (v && typeof v === "object") ? v : fallback;
    } catch (_) {
      return fallback;
    }
  }
const getVal = (id, fallback = "") => {
  const n = $(id);
  return n ? String(n.value ?? "") : String(fallback ?? "");
};

const getChk = (id, fallback = false) => {
  const n = $(id);
  return n ? !!n.checked : !!fallback;
};

  function defaultCfg() {
    return {
      mode: "builder", 

      heightPx: 44,
      autoWidth: "1",
      widthPx: 280,

      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      anchor: "end",
      textX: 520,
      textY: 104,

      gradOn: "0",
      gradFrom: "#7c3aed",
      gradTo: "#06b6d4",
      gradAngle: 0,
      gradAffectsStroke: "0",

      strokeOn: "0",
      strokeW: 1,
      strokeColor: "#0f172a",
      strokeMatchFill: "1",

      shadowOn: "0",
      shadowBlur: 8,
      shadowX: 0,
      shadowY: 4,
      shadowColor: "rgba(0,0,0,0.25)",

      lineOn: "0",
      lineX1: 120,
      lineX2: 520,
      lineY: 118,
      lineW: 1.5,
      lineColor: "#06b6d4",
      lineUseTextPaint: "1",
      lineDash: "0",

      dotOn: "0",
      dotR: 4.2,
      dotX: 520,
      dotY: 118,
      dotColor: "#06b6d4",
      dotUseTextPaint: "1",

      bgOn: "0",
      bgColor: "rgba(255,255,255,0)",
      bgRadius: 0,
      bgPad: "0px",

      seg: [
        {
          text: "Nova",
          size: 72,
          weight: 700,
          italic: "0",
          underline: "0",
          fill: "#0f172a",
          ownFillOnGradient: "0",
          letter: 0.2,
          dx: 6
        },
        {
          text: "Labs",
          size: 72,
          weight: 500,
          italic: "0",
          underline: "0",
          fill: "#06b6d4",
          ownFillOnGradient: "1",
          letter: 0,
          dx: 2
        },
        {
          enabled: "0",
          text: "™",
          size: 42,
          weight: 900,
          italic: "0",
          underline: "0",
          fill: "#0f172a",
          ownFillOnGradient: "0",
          letter: 0,
          dx: 6
        }
      ],

      rawSvg: ""
    };
  }

  function clamp(n, a, b) {
    const x = Number(n);
    if (Number.isNaN(x)) return a;
    return Math.max(a, Math.min(b, x));
  }

  function normalizeCfg(raw) {
    const base = defaultCfg();
    const cfg = { ...base, ...(raw || {}) };

    // backwards compatibility (old: textA/textB etc.)
    if (!cfg.seg && (raw?.textA || raw?.textB || raw?.color)) {
      cfg.seg = [
        {
          text: String(raw.textA ?? "Brand"),
          size: clamp(raw.sizeA ?? 70, 8, 180),
          weight: 700,
          italic: "1",
          underline: "0",
          fill: String(raw.color ?? "#5c99e6"),
          ownFillOnGradient: "0",
          letter: 0.2,
          dx: clamp(raw.dx ?? 2, -50, 200)
        },
        {
          text: String(raw.textB ?? "Logo"),
          size: clamp(raw.sizeB ?? 72, 8, 180),
          weight: 500,
          italic: "0",
          underline: "0",
          fill: String(raw.color ?? "#5c99e6"),
          ownFillOnGradient: "0",
          letter: 0,
          dx: clamp(raw.dx ?? 2, -50, 200)
        },
        { enabled: "0", text: "", size: 40, weight: 700, italic: "0", underline: "0", fill: "#0f172a", ownFillOnGradient: "0", letter: 0, dx: 6 }
      ];
    }

    cfg.mode = (cfg.mode === "raw") ? "raw" : "builder";

    cfg.heightPx = clamp(parseInt(cfg.heightPx, 10) || 44, 20, 240);
    cfg.autoWidth = (String(cfg.autoWidth) === "0") ? "0" : "1";
    cfg.widthPx = clamp(parseInt(cfg.widthPx, 10) || 280, 80, 1200);

    cfg.fontFamily = String(cfg.fontFamily ?? base.fontFamily);
    cfg.anchor = ["start", "middle", "end"].includes(cfg.anchor) ? cfg.anchor : "end";
    cfg.textX = clamp(parseInt(cfg.textX, 10) || 520, 0, 720);
    cfg.textY = clamp(parseInt(cfg.textY, 10) || 104, 0, 160);

    cfg.gradOn = (String(cfg.gradOn) === "1") ? "1" : "0";
    cfg.gradFrom = String(cfg.gradFrom ?? base.gradFrom);
    cfg.gradTo = String(cfg.gradTo ?? base.gradTo);
    cfg.gradAngle = clamp(parseInt(cfg.gradAngle, 10) || 0, 0, 360);
    cfg.gradAffectsStroke = (String(cfg.gradAffectsStroke) === "1") ? "1" : "0";

    cfg.strokeOn = (String(cfg.strokeOn) === "1") ? "1" : "0";
    cfg.strokeW = clamp(parseFloat(cfg.strokeW) || 1, 0, 10);
    cfg.strokeColor = String(cfg.strokeColor ?? base.strokeColor);
    cfg.strokeMatchFill = (String(cfg.strokeMatchFill) === "1") ? "1" : "0";

    cfg.shadowOn = (String(cfg.shadowOn) === "1") ? "1" : "0";
    cfg.shadowBlur = clamp(parseFloat(cfg.shadowBlur) || 8, 0, 30);
    cfg.shadowX = clamp(parseFloat(cfg.shadowX) || 0, -50, 50);
    cfg.shadowY = clamp(parseFloat(cfg.shadowY) || 4, -50, 50);
    cfg.shadowColor = String(cfg.shadowColor ?? base.shadowColor);

    cfg.lineOn = (String(cfg.lineOn) === "1") ? "1" : "0";
    cfg.lineX1 = clamp(parseInt(cfg.lineX1, 10) || 120, 0, 720);
    cfg.lineX2 = clamp(parseInt(cfg.lineX2, 10) || 520, 0, 720);
    cfg.lineY = clamp(parseInt(cfg.lineY, 10) || 118, 0, 160);
    cfg.lineW = clamp(parseFloat(cfg.lineW) || 1.5, 0, 10);
    cfg.lineColor = String(cfg.lineColor ?? base.lineColor);
    cfg.lineUseTextPaint = (String(cfg.lineUseTextPaint) === "1") ? "1" : "0";
    cfg.lineDash = (String(cfg.lineDash) === "1") ? "1" : "0";

    cfg.dotOn = (String(cfg.dotOn) === "1") ? "1" : "0";
    cfg.dotR = clamp(parseFloat(cfg.dotR) || 4.2, 0, 40);
    cfg.dotX = clamp(parseInt(cfg.dotX, 10) || 520, 0, 720);
    cfg.dotY = clamp(parseInt(cfg.dotY, 10) || 118, 0, 160);
    cfg.dotColor = String(cfg.dotColor ?? base.dotColor);
    cfg.dotUseTextPaint = (String(cfg.dotUseTextPaint) === "0") ? "0" : "1";

    cfg.bgOn = (String(cfg.bgOn) === "1") ? "1" : "0";
    cfg.bgColor = String(cfg.bgColor ?? base.bgColor);
    cfg.bgRadius = clamp(parseInt(cfg.bgRadius, 10) || 0, 0, 60);
    cfg.bgPad = String(cfg.bgPad ?? "0px");

    const seg = Array.isArray(cfg.seg) ? cfg.seg : base.seg;
    cfg.seg = [0, 1, 2].map((i) => {
      const s0 = seg[i] || {};
      const d0 = base.seg[i] || {};
      const out = {
        text: String(s0.text ?? d0.text ?? ""),
        size: clamp(parseInt(s0.size, 10) || d0.size || 60, 8, 180),
        weight: clamp(parseInt(s0.weight, 10) || d0.weight || 500, 100, 900),
        italic: (String(s0.italic) === "1") ? "1" : "0",
        underline: (String(s0.underline) === "1") ? "1" : "0",
        fill: String(s0.fill ?? d0.fill ?? "#0f172a"),
        ownFillOnGradient: (String(s0.ownFillOnGradient) === "1") ? "1" : "0",
        letter: clamp(parseFloat(s0.letter) || d0.letter || 0, -2, 5),
        dx: clamp(parseInt(s0.dx, 10) || d0.dx || 0, -50, 200)
      };
      if (i === 2) out.enabled = (String(s0.enabled) === "1") ? "1" : "0";
      return out;
    });

    cfg.rawSvg = String(cfg.rawSvg ?? "");
    return cfg;
  }

  function escHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escAttr(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function cfgFromEl(el) {
    const raw = (el?.dataset?.brandCfg || "").trim();
    if (!raw) return defaultCfg();
    return normalizeCfg(safeJson(raw, defaultCfg()));
  }

  function cfgToEl(el, cfg) {
    el.dataset.brandCfg = JSON.stringify(cfg);
  }

  function buildSvg(cfg, elId) {
    const viewBox = "0 0 720 160";
    const safeId = String(elId || "x").replace(/[^a-zA-Z0-9_]/g, "_");
    const gradId = `sgBrandGrad_${safeId}`;
    const shadowId = `sgBrandShadow_${safeId}`;

    const hasGrad = (cfg.gradOn === "1");
    const textPaint = hasGrad ? `url(#${gradId})` : null;

    const defs = [];

    if (hasGrad) {
      defs.push(`
<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse"
  x1="0" y1="0" x2="720" y2="0"
  gradientTransform="rotate(${cfg.gradAngle} 360 80)">
  <stop offset="0%" stop-color="${escAttr(cfg.gradFrom)}"/>
  <stop offset="100%" stop-color="${escAttr(cfg.gradTo)}"/>
</linearGradient>`.trim());
    }

    if (cfg.shadowOn === "1") {
      defs.push(`
<filter id="${shadowId}" x="-50%" y="-50%" width="200%" height="200%">
  <feDropShadow dx="${cfg.shadowX}" dy="${cfg.shadowY}" stdDeviation="${cfg.shadowBlur}"
    flood-color="${escAttr(cfg.shadowColor)}" flood-opacity="1"/>
</filter>`.trim());
    }

    const defsBlock = defs.length ? `<defs>\n${defs.join("\n")}\n</defs>` : "";

    const strokeEnabled = (cfg.strokeOn === "1" && cfg.strokeW > 0);
    const groupFilter = (cfg.shadowOn === "1") ? ` filter="url(#${shadowId})"` : "";

    const segText = [];
    const labelParts = [];
    const segList = cfg.seg || [];

    const segCount = (segList[2]?.enabled === "1") ? 3 : 2;

    for (let i = 0; i < segCount; i++) {
      const s = segList[i];
      if (!s) continue;

      const t = String(s.text || "");
      labelParts.push(t);

      const italic = (s.italic === "1") ? "italic" : "normal";
      const deco = (s.underline === "1") ? ` text-decoration="underline"` : "";
      const letter = (typeof s.letter === "number") ? s.letter : parseFloat(s.letter) || 0;

      const dxAttr = (i === 0) ? "" : ` dx="${s.dx}"`;
      let fillAttr = "";
      if (hasGrad) {
        if (s.ownFillOnGradient === "1") fillAttr = ` fill="${escAttr(s.fill)}"`;
      } else {
        fillAttr = ` fill="${escAttr(s.fill)}"`;
      }
      let strokeAttr = "";
      if (strokeEnabled) {
        if (cfg.strokeMatchFill === "1") {
          if (hasGrad && s.ownFillOnGradient !== "1") {
            strokeAttr = ` stroke="${cfg.gradAffectsStroke === "1" ? `url(#${gradId})` : escAttr(cfg.strokeColor)}"`;
          } else {
            strokeAttr = ` stroke="${escAttr(s.fill)}"`;
          }
        } else {
          strokeAttr = ` stroke="${escAttr(cfg.strokeColor)}"`;
        }
      }

      const tspan = `
<tspan font-size="${s.size}" font-weight="${s.weight}" font-style="${italic}"
  letter-spacing="${letter}"${dxAttr}${fillAttr}${strokeAttr}${deco}>${escHtml(t)}</tspan>`.trim();

      segText.push(tspan);
    }
    const textFill = hasGrad ? ` fill="${textPaint}"` : "";
    const textStrokeBase = strokeEnabled ? ` stroke-width="${cfg.strokeW}" paint-order="stroke fill"` : "";
    const textStrokeLinecap = strokeEnabled ? ` stroke-linecap="round" stroke-linejoin="round"` : "";

    const linePaint = (cfg.lineUseTextPaint === "1")
      ? (hasGrad ? textPaint : (cfg.seg[0]?.fill || "#0f172a"))
      : cfg.lineColor;

    const lineDash = (cfg.lineDash === "1") ? ` stroke-dasharray="6 6"` : "";

    const line = (cfg.lineOn === "1")
      ? `<path d="M${cfg.lineX1} ${cfg.lineY}H${cfg.lineX2}" fill="none" stroke="${escAttr(linePaint)}" stroke-width="${cfg.lineW}"${lineDash}/>`
      : "";

    const dotPaint = (cfg.dotUseTextPaint === "1")
      ? (hasGrad ? textPaint : (cfg.seg[0]?.fill || "#0f172a"))
      : cfg.dotColor;

    const dot = (cfg.dotOn === "1")
      ? `<circle cx="${cfg.dotX}" cy="${cfg.dotY}" r="${cfg.dotR}" fill="${escAttr(dotPaint)}" stroke="none"/>`
      : "";

    return `
<svg class="brand-logo" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg"
  aria-label="${escAttr(labelParts.join(""))}" role="img">
  ${defsBlock}
  <g${groupFilter}>
    <text x="${cfg.textX}" y="${cfg.textY}" text-anchor="${cfg.anchor}" font-family="${escAttr(cfg.fontFamily)}"
      ${textFill}${textStrokeBase}${textStrokeLinecap}>
      ${segText.join("\n      ")}
    </text>
    ${line}
    ${dot}
  </g>
</svg>`.trim();
  }

  function applyBrandVisuals(el) {
    if (!el || el.dataset.type !== "brand") return;

    const cfg = cfgFromEl(el);
    el.style.border = "none";
    el.style.overflow = "hidden";
    el.style.boxSizing = "border-box";

    if (cfg.bgOn === "1") {
      el.style.background = cfg.bgColor;
      el.style.borderRadius = cfg.bgRadius + "px";
      el.style.padding = cfg.bgPad;
    } else {
      el.style.background = "transparent";
      el.style.borderRadius = "0px";
      el.style.padding = "0px";
    }

    const svg = (cfg.mode === "raw" && cfg.rawSvg.trim())
      ? cfg.rawSvg.trim()
      : buildSvg(cfg, el.dataset.id);

    el.innerHTML = svg;

    el.style.height = cfg.heightPx + "px";

    if (cfg.autoWidth === "1") {
      const w = Math.max(140, Math.round(cfg.heightPx * 4.5));
      el.style.width = w + "px";
    } else {
      el.style.width = cfg.widthPx + "px";
    }
  }

  function activeBrandEl() {
    const el = window.activeElement;
    if (!el || el.dataset.type !== "brand") return null;
    return el;
  }

function syncUiFromCfg(cfg) {
  if (!$("brand-mode")) return;
  setVal("brand-mode", cfg.mode);

  const builderBox = $("brand-builder-box");
  const rawBox = $("brand-raw-box");
  if (builderBox) builderBox.style.display = (cfg.mode === "builder") ? "block" : "none";
  if (rawBox) rawBox.style.display = (cfg.mode === "raw") ? "block" : "none";
  setVal("brand-height", cfg.heightPx);
  setChk("brand-auto-width", cfg.autoWidth === "1");
  setVal("brand-width", cfg.widthPx);
  setDis("brand-width", cfg.autoWidth === "1");

  setVal("brand-font", cfg.fontFamily);
  setVal("brand-anchor", cfg.anchor);
  setVal("brand-text-x", cfg.textX);
  setVal("brand-text-y", cfg.textY);
  setChk("brand-grad-on", cfg.gradOn === "1");
  setDisp("brand-grad-box", cfg.gradOn === "1");
  setVal("brand-grad-from", cfg.gradFrom);
  setVal("brand-grad-to", cfg.gradTo);
  setVal("brand-grad-angle", cfg.gradAngle);
  setChk("brand-grad-affects-stroke", cfg.gradAffectsStroke === "1");
  setChk("brand-stroke-on", cfg.strokeOn === "1");
  setDisp("brand-stroke-box", cfg.strokeOn === "1");
  setVal("brand-stroke-w", cfg.strokeW);
  setVal("brand-stroke-color", cfg.strokeColor);
  setChk("brand-stroke-match-fill", cfg.strokeMatchFill === "1");
  setChk("brand-shadow-on", cfg.shadowOn === "1");
  setDisp("brand-shadow-box", cfg.shadowOn === "1");
  setVal("brand-shadow-blur", cfg.shadowBlur);
  setVal("brand-shadow-x", cfg.shadowX);
  setVal("brand-shadow-y", cfg.shadowY);
  setVal("brand-shadow-color", cfg.shadowColor);
  setChk("brand-line-on", cfg.lineOn === "1");
  setDisp("brand-line-box", cfg.lineOn === "1");
  setVal("brand-line-x1", cfg.lineX1);
  setVal("brand-line-x2", cfg.lineX2);
  setVal("brand-line-y", cfg.lineY);
  setVal("brand-line-w", cfg.lineW);
  setVal("brand-line-color", cfg.lineColor);
  setChk("brand-line-use-text-paint", cfg.lineUseTextPaint === "1");
  setChk("brand-line-dash", cfg.lineDash === "1");
  setChk("brand-dot-on", cfg.dotOn === "1");
  setDisp("brand-dot-box", cfg.dotOn === "1");
  setVal("brand-dot-r", cfg.dotR);
  setVal("brand-dot-x", cfg.dotX);
  setVal("brand-dot-y", cfg.dotY);
  setVal("brand-dot-color", cfg.dotColor);
  setVal("brand-dot-use-text-paint", cfg.dotUseTextPaint);
  setChk("brand-bg-on", cfg.bgOn === "1");
  setDisp("brand-bg-box", cfg.bgOn === "1");
  setVal("brand-bg-color", cfg.bgColor);
  setVal("brand-bg-radius", cfg.bgRadius);
  setVal("brand-bg-pad", cfg.bgPad);
  const s1 = cfg.seg[0], s2 = cfg.seg[1], s3 = cfg.seg[2];

  setVal("seg1-text", s1.text);
  setVal("seg1-size", s1.size);
  setVal("seg1-weight", s1.weight);
  setVal("seg1-fill", s1.fill);
  setChk("seg1-italic", s1.italic === "1");
  setChk("seg1-underline", s1.underline === "1");
  setChk("seg1-own-fill", s1.ownFillOnGradient === "1");
  setVal("seg1-letter", s1.letter);
  setVal("seg1-dx", s1.dx);

  setVal("seg2-text", s2.text);
  setVal("seg2-size", s2.size);
  setVal("seg2-weight", s2.weight);
  setVal("seg2-fill", s2.fill);
  setChk("seg2-italic", s2.italic === "1");
  setChk("seg2-underline", s2.underline === "1");
  setChk("seg2-own-fill", s2.ownFillOnGradient === "1");
  setVal("seg2-letter", s2.letter);
  setVal("seg2-dx", s2.dx);

  setChk("seg3-enabled", s3.enabled === "1");
  setDisp("seg3-box", s3.enabled === "1");
  setVal("seg3-text", s3.text);
  setVal("seg3-size", s3.size);
  setVal("seg3-weight", s3.weight);
  setVal("seg3-fill", s3.fill);
  setChk("seg3-italic", s3.italic === "1");
  setChk("seg3-underline", s3.underline === "1");
  setChk("seg3-own-fill", s3.ownFillOnGradient === "1");
  setVal("seg3-letter", s3.letter);
  setVal("seg3-dx", s3.dx);
  setVal("brand-raw", cfg.rawSvg || "");
}

  function readCfgFromUi(prev) {
    const cfg = { ...prev };

    cfg.mode = getVal("brand-mode", "builder") || "builder";

    cfg.heightPx = parseInt(getVal("brand-height", 44), 10) || 44;
    cfg.autoWidth = getChk("brand-auto-width", true) ? "1" : "0";
    cfg.widthPx = parseInt($("brand-width").value, 10) || 280;

    cfg.fontFamily = $("brand-font").value || defaultCfg().fontFamily;
    cfg.anchor = $("brand-anchor").value || "end";
    cfg.textX = parseInt($("brand-text-x").value, 10) || 520;
    cfg.textY = parseInt($("brand-text-y").value, 10) || 104;

    cfg.gradOn = $("brand-grad-on").checked ? "1" : "0";
    cfg.gradFrom = $("brand-grad-from").value || "#7c3aed";
    cfg.gradTo = $("brand-grad-to").value || "#06b6d4";
    cfg.gradAngle = parseInt($("brand-grad-angle").value, 10) || 0;
    cfg.gradAffectsStroke = $("brand-grad-affects-stroke").checked ? "1" : "0";

    cfg.strokeOn = $("brand-stroke-on").checked ? "1" : "0";
    cfg.strokeW = parseFloat($("brand-stroke-w").value) || 1;
    cfg.strokeColor = $("brand-stroke-color").value || "#0f172a";
    cfg.strokeMatchFill = $("brand-stroke-match-fill").checked ? "1" : "0";

    cfg.shadowOn = $("brand-shadow-on").checked ? "1" : "0";
    cfg.shadowBlur = parseFloat($("brand-shadow-blur").value) || 8;
    cfg.shadowX = parseFloat($("brand-shadow-x").value) || 0;
    cfg.shadowY = parseFloat($("brand-shadow-y").value) || 4;
    cfg.shadowColor = $("brand-shadow-color").value || "rgba(0,0,0,0.25)";

    cfg.lineOn = $("brand-line-on").checked ? "1" : "0";
    cfg.lineX1 = parseInt($("brand-line-x1").value, 10) || 120;
    cfg.lineX2 = parseInt($("brand-line-x2").value, 10) || 520;
    cfg.lineY = parseInt($("brand-line-y").value, 10) || 118;
    cfg.lineW = parseFloat($("brand-line-w").value) || 1.5;
    cfg.lineColor = $("brand-line-color").value || "#06b6d4";
    cfg.lineUseTextPaint = $("brand-line-use-text-paint").checked ? "1" : "0";
    cfg.lineDash = $("brand-line-dash").checked ? "1" : "0";

    cfg.dotOn = $("brand-dot-on").checked ? "1" : "0";
    cfg.dotR = parseFloat($("brand-dot-r").value) || 4.2;
    cfg.dotX = parseInt($("brand-dot-x").value, 10) || 520;
    cfg.dotY = parseInt($("brand-dot-y").value, 10) || 118;
    cfg.dotColor = $("brand-dot-color").value || "#06b6d4";
    cfg.dotUseTextPaint = $("brand-dot-use-text-paint").value === "0" ? "0" : "1";

    cfg.bgOn = $("brand-bg-on").checked ? "1" : "0";
    cfg.bgColor = $("brand-bg-color").value || "rgba(255,255,255,0)";
    cfg.bgRadius = parseInt($("brand-bg-radius").value, 10) || 0;
    cfg.bgPad = $("brand-bg-pad").value || "0px";

    const s1 = cfg.seg[0], s2 = cfg.seg[1], s3 = cfg.seg[2];

    s1.text = $("seg1-text").value || "";
    s1.size = parseInt($("seg1-size").value, 10) || 60;
    s1.weight = parseInt($("seg1-weight").value, 10) || 700;
    s1.fill = $("seg1-fill").value || "#0f172a";
    s1.italic = $("seg1-italic").checked ? "1" : "0";
    s1.underline = $("seg1-underline").checked ? "1" : "0";
    s1.ownFillOnGradient = $("seg1-own-fill").checked ? "1" : "0";
    s1.letter = parseFloat($("seg1-letter").value) || 0;
    s1.dx = parseInt($("seg1-dx").value, 10) || 0;

    s2.text = $("seg2-text").value || "";
    s2.size = parseInt($("seg2-size").value, 10) || 60;
    s2.weight = parseInt($("seg2-weight").value, 10) || 500;
    s2.fill = $("seg2-fill").value || "#06b6d4";
    s2.italic = $("seg2-italic").checked ? "1" : "0";
    s2.underline = $("seg2-underline").checked ? "1" : "0";
    s2.ownFillOnGradient = $("seg2-own-fill").checked ? "1" : "0";
    s2.letter = parseFloat($("seg2-letter").value) || 0;
    s2.dx = parseInt($("seg2-dx").value, 10) || 0;

    s3.enabled = $("seg3-enabled").checked ? "1" : "0";
    s3.text = $("seg3-text").value || "";
    s3.size = parseInt($("seg3-size").value, 10) || 42;
    s3.weight = parseInt($("seg3-weight").value, 10) || 900;
    s3.fill = $("seg3-fill").value || "#0f172a";
    s3.italic = $("seg3-italic").checked ? "1" : "0";
    s3.underline = $("seg3-underline").checked ? "1" : "0";
    s3.ownFillOnGradient = $("seg3-own-fill").checked ? "1" : "0";
    s3.letter = parseFloat($("seg3-letter").value) || 0;
    s3.dx = parseInt($("seg3-dx").value, 10) || 6;

    cfg.rawSvg = $("brand-raw").value || "";

    return normalizeCfg(cfg);
  }

  function syncBrandInputs(el) {
    const cfg = cfgFromEl(el);
    syncUiFromCfg(cfg);
  }

  function bindUi() {
    if (!isEditor()) return;
    if (!$("brand-mode")) return;
    if ($("brand-mode").dataset.bound === "1") return;
    $("brand-mode").dataset.bound = "1";

    const onAny = () => {
      const el = activeBrandEl();
      if (!el) return;

      const prev = cfgFromEl(el);
      const next = readCfgFromUi(prev);

      cfgToEl(el, next);
      applyBrandVisuals(el);

    setDisp("brand-grad-box", next.gradOn === "1");
setDisp("brand-stroke-box", next.strokeOn === "1");
setDisp("brand-shadow-box", next.shadowOn === "1");
setDisp("brand-line-box", next.lineOn === "1");
setDisp("brand-dot-box", next.dotOn === "1");
setDisp("brand-bg-box", next.bgOn === "1");
setDisp("seg3-box", next.seg[2].enabled === "1");
setDis("brand-width", next.autoWidth === "1");
    };

    const bind = (id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", onAny);
      el.addEventListener("change", onAny);
    };

    [
      "brand-mode",
      "brand-height", "brand-auto-width", "brand-width",
      "brand-font", "brand-anchor", "brand-text-x", "brand-text-y",
      "brand-grad-on", "brand-grad-from", "brand-grad-to", "brand-grad-angle", "brand-grad-affects-stroke",
      "brand-stroke-on", "brand-stroke-w", "brand-stroke-color", "brand-stroke-match-fill",
      "brand-shadow-on", "brand-shadow-blur", "brand-shadow-x", "brand-shadow-y", "brand-shadow-color",
      "brand-line-on", "brand-line-x1", "brand-line-x2", "brand-line-y", "brand-line-w", "brand-line-color", "brand-line-use-text-paint", "brand-line-dash",
      "brand-dot-on", "brand-dot-r", "brand-dot-x", "brand-dot-y", "brand-dot-color", "brand-dot-use-text-paint",
      "brand-bg-on", "brand-bg-color", "brand-bg-radius", "brand-bg-pad",
      "seg1-text", "seg1-size", "seg1-weight", "seg1-fill", "seg1-italic", "seg1-underline", "seg1-own-fill", "seg1-letter", "seg1-dx",
      "seg2-text", "seg2-size", "seg2-weight", "seg2-fill", "seg2-italic", "seg2-underline", "seg2-own-fill", "seg2-letter", "seg2-dx",
      "seg3-enabled", "seg3-text", "seg3-size", "seg3-weight", "seg3-fill", "seg3-italic", "seg3-underline", "seg3-own-fill", "seg3-letter", "seg3-dx",
      "brand-raw"
    ].forEach(bind);

    $("brand-preset-clean")?.addEventListener("click", () => {
      const el = activeBrandEl();
      if (!el) return;
      const cfg = normalizeCfg({
        ...defaultCfg(),
        seg: [
          { text: "NOVA", size: 74, weight: 900, italic: "0", underline: "0", fill: "#0f172a", ownFillOnGradient: "0", letter: 0.6, dx: 10 },
          { text: "STUDIO", size: 56, weight: 600, italic: "0", underline: "0", fill: "#0f172a", ownFillOnGradient: "0", letter: 2.2, dx: 0 },
          { enabled: "0", text: "", size: 42, weight: 900, italic: "0", underline: "0", fill: "#0f172a", ownFillOnGradient: "0", letter: 0, dx: 6 }
        ],
        gradOn: "0",
        strokeOn: "0",
        shadowOn: "0",
        lineOn: "0",
        dotOn: "0",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        anchor: "end",
        textX: 560,
        textY: 106
      });
      cfgToEl(el, cfg);
      syncUiFromCfg(cfg);
      applyBrandVisuals(el);
    });

    $("brand-preset-underline")?.addEventListener("click", () => {
      const el = activeBrandEl();
      if (!el) return;
      const cfg = normalizeCfg({
        ...defaultCfg(),
        fontFamily: "Merriweather, Georgia, 'Times New Roman', serif",
        seg: [
          { text: "Silver", size: 70, weight: 700, italic: "1", underline: "0", fill: "#5c99e6", ownFillOnGradient: "0", letter: 0.2, dx: 2 },
          { text: "Wave", size: 72, weight: 500, italic: "0", underline: "0", fill: "#5c99e6", ownFillOnGradient: "0", letter: 0, dx: 0 },
          { enabled: "0", text: "", size: 42, weight: 900, italic: "0", underline: "0", fill: "#0f172a", ownFillOnGradient: "0", letter: 0, dx: 6 }
        ],
        lineOn: "1",
        lineX1: 120,
        lineX2: 560,
        lineY: 118,
        lineW: 1.6,
        lineUseTextPaint: "1",
        dotOn: "1",
        dotR: 4.2,
        dotX: 560,
        dotY: 118,
        dotUseTextPaint: "1",
        anchor: "end",
        textX: 560,
        textY: 104
      });
      cfgToEl(el, cfg);
      syncUiFromCfg(cfg);
      applyBrandVisuals(el);
    });

    $("brand-preset-vetmell")?.addEventListener("click", () => {
      const el = activeBrandEl();
      if (!el) return;
      const cfg = normalizeCfg({
        ...defaultCfg(),
        fontFamily: "Merriweather, Georgia, 'Times New Roman', serif",
        seg: [
          { text: "Vet", size: 70, weight: 700, italic: "1", underline: "0", fill: "#5c99e6", ownFillOnGradient: "0", letter: 0.2, dx: 2 },
          { text: "Mell", size: 72, weight: 500, italic: "0", underline: "0", fill: "#5c99e6", ownFillOnGradient: "0", letter: 0, dx: 0 },
          { enabled: "0", text: "", size: 42, weight: 900, italic: "0", underline: "0", fill: "#0f172a", ownFillOnGradient: "0", letter: 0, dx: 6 }
        ],
        gradOn: "0",
        lineOn: "1",
        lineX1: 100,
        lineX2: 560,
        lineY: 118,
        lineW: 1.5,
        lineUseTextPaint: "1",
        dotOn: "1",
        dotR: 4.2,
        dotX: 560,
        dotY: 118,
        dotUseTextPaint: "1",
        anchor: "end",
        textX: 560,
        textY: 102
      });
      cfgToEl(el, cfg);
      syncUiFromCfg(cfg);
      applyBrandVisuals(el);
    });

    $("brand-randomize")?.addEventListener("click", () => {
      const el = activeBrandEl();
      if (!el) return;

      const palettes = [
        ["#0f172a", "#06b6d4"],
        ["#111827", "#a855f7"],
        ["#1d4ed8", "#22c55e"],
        ["#ef4444", "#0f172a"],
        ["#f59e0b", "#2563eb"]
      ];
      const p = palettes[Math.floor(Math.random() * palettes.length)];

      const cfg = normalizeCfg({
        ...cfgFromEl(el),
        gradOn: Math.random() > 0.5 ? "1" : "0",
        gradFrom: p[0],
        gradTo: p[1],
        strokeOn: Math.random() > 0.65 ? "1" : "0",
        shadowOn: Math.random() > 0.7 ? "1" : "0",
        lineOn: Math.random() > 0.6 ? "1" : "0",
        dotOn: Math.random() > 0.6 ? "1" : "0",
      });
      cfg.seg[0].fill = p[0];
      cfg.seg[1].fill = p[1];
      cfg.seg[0].italic = Math.random() > 0.6 ? "1" : "0";
      cfg.seg[1].italic = Math.random() > 0.7 ? "1" : "0";
      cfg.seg[0].weight = [600, 700, 800, 900][Math.floor(Math.random() * 4)];
      cfg.seg[1].weight = [400, 500, 600, 700][Math.floor(Math.random() * 4)];

      cfgToEl(el, cfg);
      syncUiFromCfg(cfg);
      applyBrandVisuals(el);
    });

    $("brand-copy-svg")?.addEventListener("click", async () => {
      const el = activeBrandEl();
      if (!el) return;
      const svg = (el.querySelector("svg")?.outerHTML || "").trim();
      if (!svg) return;

      try {
        await navigator.clipboard.writeText(svg);
        alert("Skopiowano SVG ✅");
      } catch (_) {
        alert("Nie mogę skopiować (blokada przeglądarki). Skopiuj ręcznie z podglądu HTML.");
      }
    });

    $("brand-export-png")?.addEventListener("click", async () => {
      const el = activeBrandEl();
      if (!el) return;
      const svg = (el.querySelector("svg")?.outerHTML || "").trim();
      if (!svg) return;

      const cfg = cfgFromEl(el);
      const w = (cfg.autoWidth === "1") ? Math.max(140, Math.round(cfg.heightPx * 4.5)) : cfg.widthPx;
      const h = cfg.heightPx;

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const a = document.createElement("a");
        a.download = (el.dataset.id || "logo") + ".png";
        a.href = c.toDataURL("image/png");
        a.click();

        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
    $("brand-mode")?.addEventListener("change", () => {
      const el = activeBrandEl();
      if (!el) return;
      const cfg = cfgFromEl(el);
      syncUiFromCfg(cfg);
    });
  }

  function createBrandElement(x, y) {
    const canvas = document.getElementById("preview-canvas");
    if (!canvas) return;

    const el = document.createElement("div");
    el.className = "canvas-element type-brand";
    el.dataset.id = "brand_" + Date.now();
    el.dataset.type = "brand";

    // z index
    const zNow = (window.zCounter = (window.zCounter || 10) + 1);
    el.style.zIndex = zNow;

    const cfg = defaultCfg();
    cfgToEl(el, cfg);

    el.style.width = "280px";
    el.style.height = cfg.heightPx + "px";

    const rect = (window.activeContainer || canvas).getBoundingClientRect();
    el.style.left = (x - rect.left) + "px";
    el.style.top = (y - rect.top) + "px";

    el.contentEditable = "false";
    applyBrandVisuals(el);

    if (typeof window.setupElementMovement === "function") {
      window.setupElementMovement(el, "brand");
    }

    (window.activeContainer || canvas).appendChild(el);

    if (typeof window.selectElement === "function") window.selectElement(el);
    if (typeof window.refreshLayers === "function") window.refreshLayers();
  }

  function injectCssOnce() {
    if (document.getElementById("sg-brand-css")) return;
    const st = document.createElement("style");
    st.id = "sg-brand-css";
    st.textContent = `
      .type-brand{ display:block; }
      .type-brand .brand-logo{ width:100%; height:100%; display:block; }
    `;
    document.head.appendChild(st);
  }
  window.createBrandElement = createBrandElement;
  window.updateBrandVisuals = applyBrandVisuals;
  window.syncBrandInputs = syncBrandInputs;

  document.addEventListener("DOMContentLoaded", () => {
    injectCssOnce();
    bindUi();
  });
})();
