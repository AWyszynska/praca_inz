
(() => {
  const STYLE_ID = "sg-window-scroll-style-v3";

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function normalizeCfg(cfg) {
    const out = Object.assign({
      enabled: true,
      width: 12,
      track: "rgba(148,163,184,.25)",
      thumb: "rgba(15,23,42,.55)",
      thumbHover: "rgba(15,23,42,.75)",
      radius: 10,
      firefoxThin: false
    }, cfg || {});

    out.width = clamp(+out.width || 12, 6, 22);
    out.radius = clamp(+out.radius || 10, 0, 999);
    return out;
  }

  function resolveTarget(target) {
    if (!target) return { selector: "html", el: document.documentElement };

    if (typeof target === "string") {
      const el = document.querySelector(target);
      if (el) return { selector: target, el };
      return { selector: "html", el: document.documentElement };
    }

    if (target instanceof Element) {
      target.setAttribute("data-sg-win-scroll", "1");
      return { selector: '[data-sg-win-scroll="1"]', el: target };
    }

    return { selector: "html", el: document.documentElement };
  }

  function apply(cfgRaw, target) {
    const cfg = normalizeCfg(cfgRaw);
    const tgt = resolveTarget(target);

    let tag = document.getElementById(STYLE_ID);
    if (!tag) {
      tag = document.createElement("style");
      tag.id = STYLE_ID;
      document.head.appendChild(tag);
    }

    if (!cfg.enabled) {
      tag.textContent = "";
      if (tgt.el) tgt.el.classList.remove("sg-win-scroll");
      return cfg;
    }

    if (tgt.el) tgt.el.classList.add("sg-win-scroll");

    const ffWidth = cfg.firefoxThin ? "thin" : "auto";
    const sel = `${tgt.selector}.sg-win-scroll`;

    tag.textContent = `
      ${sel}{
        scrollbar-color: ${cfg.thumb} ${cfg.track};
        scrollbar-width: ${ffWidth};
      }

      ${sel}::-webkit-scrollbar{
        width: ${cfg.width}px;
        height: ${cfg.width}px;
      }
      ${sel}::-webkit-scrollbar-track{
        background: ${cfg.track};
        border-radius: ${cfg.radius}px;
      }
      ${sel}::-webkit-scrollbar-thumb{
        background: ${cfg.thumb};
        border-radius: ${cfg.radius}px;
      }
      ${sel}::-webkit-scrollbar-thumb:hover{
        background: ${cfg.thumbHover};
      }
    `;

    return cfg;
  }
  window.sg_sideblock_window = function(cfg, target) {
    return apply(cfg || {}, target);
  };
})();
