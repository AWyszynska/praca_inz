(() => {
  "use strict";

  if (window.__workerPanelNavInstalled === true) return;
  window.__workerPanelNavInstalled = true;

  const ROUTES = {
    "panel glowny": "worker_panel_main.xml",
    "panel główny": "worker_panel_main.xml",

    "najblizsze wizyty": "Worker_panel_wizyty.xml",
    "najbliższe wizyty": "Worker_panel_wizyty.xml",

    "kalendarz": "Worker_panel_kalendarz.xml",
    "pacjenci": "worker_panel_pacjent.xml",
    "historia leczenia": "Worker_panel_historia.xml",
    "grafik pracy": "grafik_work.xml",
    "dodaj godziny pracy": "worker_panel_add_godziny.xml",
    "moje konto": "Worker_panel_konto.xml",
  };

  const PAGE_ROUTES = {
    home: "worker_panel_main.xml",
    main: "worker_panel_main.xml",
    wizyty: "Worker_panel_wizyty.xml",
    kal: "Worker_panel_kalendarz.xml",
    kalendarz: "Worker_panel_kalendarz.xml",
    pacj: "worker_panel_pacjent.xml",
    pacjenci: "worker_panel_pacjent.xml",
    historia: "Worker_panel_historia.xml",
    histori: "Worker_panel_historia.xml",
    grafik: "grafik_work.xml",
    godzinyadd: "worker_panel_add_godziny.xml",
    konto: "Worker_panel_konto.xml",
  };

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getPageFromHref(href) {
    const raw = String(href || "");

    try {
      const url = new URL(raw, window.location.origin);
      return normalize(url.searchParams.get("page") || "");
    } catch (e) {
      const match = raw.match(/[?&]page\s*=\s*([^&]+)/i);
      return match ? normalize(decodeURIComponent(match[1])) : "";
    }
  }

  function findFileForLink(link) {
    const text = normalize(link.textContent || "");
    const page = getPageFromHref(link.getAttribute("href") || "");
    const key = normalize(link.dataset.key || "");

    if (ROUTES[text]) return ROUTES[text];
    if (PAGE_ROUTES[page]) return PAGE_ROUTES[page];
    if (PAGE_ROUTES[key]) return PAGE_ROUTES[key];

    return "";
  }

  function finalUrl(file) {
    return "/praca_inz/final_view.php?file=" + encodeURIComponent(file);
  }

  function bindLinks() {
    const links = Array.from(document.querySelectorAll("a"));

    links.forEach((link) => {
      const file = findFileForLink(link);
      if (!file) return;

      link.href = finalUrl(file);
      link.target = "_self";
      link.style.cursor = "pointer";

      if (link.dataset.workerNavBound === "1") return;
      link.dataset.workerNavBound = "1";

      link.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation();
        }

        window.location.href = finalUrl(file);
      }, true);
    });
  }

  function boot() {
    bindLinks();
    setTimeout(bindLinks, 300);
    setTimeout(bindLinks, 800);
    setTimeout(bindLinks, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();