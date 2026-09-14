(() => {
  "use strict";

  if (window.__adminPanelNavInstalled === true) return;
  window.__adminPanelNavInstalled = true;

  const ROUTES = {
    "panel glowny": "admin_panel_glowny.xml",
    "panel główny": "admin_panel_glowny.xml",

    "przeglad wizyt": "admin_panel_wizyty.xml",
    "przegląd wizyt": "admin_panel_wizyty.xml",

    "kalendarz wizyt": "admin_panel_kalendarz.xml",

    "lista pacjentow": "admin_panel_pacjenci.xml",
    "lista pacjentów": "admin_panel_pacjenci.xml",
    "pacjenci": "admin_panel_pacjenci.xml",

    "pracownicy": "admin_panel_pracownicy.xml",

    "uslugi i cennik": "admin_panel_uslugi.xml",
    "usługi i cennik": "admin_panel_uslugi.xml",
    "uslugi": "admin_panel_uslugi.xml",
    "usługi": "admin_panel_uslugi.xml",

    "platnosci": "admin_panel_platnosci.xml",
    "płatności": "admin_panel_platnosci.xml",

    "statystyki": "admin_panel_statystki.xml",
    "statystki": "admin_panel_statystki.xml",

    "ustawienia systemu": "admin_panel_ustawienia.xml"
  };

  const PAGE_ROUTES = {
    admin: "admin_panel_glowny.xml",
    admin_home: "admin_panel_glowny.xml",
    admin_glowny: "admin_panel_glowny.xml",
    admin_główny: "admin_panel_glowny.xml",

    admin_wizyty: "admin_panel_wizyty.xml",
    wizyty_admin: "admin_panel_wizyty.xml",

    admin_kalendarz: "admin_panel_kalendarz.xml",
    kalendarz_admin: "admin_panel_kalendarz.xml",

    admin_pacjenci: "admin_panel_pacjenci.xml",
    pacjenci_admin: "admin_panel_pacjenci.xml",

    admin_pracownicy: "admin_panel_pracownicy.xml",
    pracownicy_admin: "admin_panel_pracownicy.xml",

    admin_uslugi: "admin_panel_uslugi.xml",
    admin_usługi: "admin_panel_uslugi.xml",
    uslugi_admin: "admin_panel_uslugi.xml",

    admin_platnosci: "admin_panel_platnosci.xml",
    admin_płatności: "admin_panel_platnosci.xml",
    platnosci_admin: "admin_panel_platnosci.xml",

    admin_statystyki: "admin_panel_statystki.xml",
    admin_statystki: "admin_panel_statystki.xml",
    statystyki_admin: "admin_panel_statystki.xml",

    admin_ustawienia: "admin_panel_ustawienia.xml",
    ustawienia_admin: "admin_panel_ustawienia.xml"
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

  function getFileFromHref(href) {
    const raw = String(href || "");

    try {
      const url = new URL(raw, window.location.origin);
      return String(url.searchParams.get("file") || "").trim();
    } catch (e) {
      const match = raw.match(/[?&]file\s*=\s*([^&]+)/i);
      return match ? decodeURIComponent(match[1]).trim() : "";
    }
  }

  function findFileForLink(link) {
    const text = normalize(link.textContent || "");
    const page = getPageFromHref(link.getAttribute("href") || "");
    const file = getFileFromHref(link.getAttribute("href") || "");
    const key = normalize(link.dataset.key || "");

    if (file && /\.xml$/i.test(file)) return file;
    if (ROUTES[text]) return ROUTES[text];
    if (PAGE_ROUTES[page]) return PAGE_ROUTES[page];
    if (PAGE_ROUTES[key]) return PAGE_ROUTES[key];

    return "";
  }

  function finalUrl(file) {
    return "/praca_inz/final_view.php?file=" + encodeURIComponent(file);
  }

  function markActiveLink(link, file) {
    const qs = new URLSearchParams(window.location.search || "");
    const currentFile = String(qs.get("file") || "").trim();

    if (!currentFile || currentFile.toLowerCase() !== String(file).toLowerCase()) {
      return;
    }

    link.classList.add("admin-nav-active");

    link.style.fontWeight = "800";
    link.style.color = "#0f172a";
    link.style.textDecorationThickness = "2px";
  }

  function bindLinks() {
    const links = Array.from(document.querySelectorAll("a"));

    links.forEach((link) => {
      const file = findFileForLink(link);
      if (!file) return;

      link.href = finalUrl(file);
      link.target = "_self";
      link.style.cursor = "pointer";

      markActiveLink(link, file);

      if (link.dataset.adminNavBound === "1") return;
      link.dataset.adminNavBound = "1";

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

  function injectStyle() {
    if (document.getElementById("admin-panel-nav-style")) return;

    const style = document.createElement("style");
    style.id = "admin-panel-nav-style";

    style.textContent = `
      .admin-nav-active {
        font-weight: 800 !important;
        color: #0f172a !important;
        text-decoration-thickness: 2px !important;
      }

      a.admin-nav-active {
        opacity: 1 !important;
      }
    `;

    document.head.appendChild(style);
  }

  function boot() {
    injectStyle();

    bindLinks();

    setTimeout(bindLinks, 300);
    setTimeout(bindLinks, 800);
    setTimeout(bindLinks, 1500);
    setTimeout(bindLinks, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();