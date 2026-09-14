(function () {
  "use strict";

  const KONTO_SELECTOR = '#sgbtn_el_1778528282666, [data-id="el_1778528282666"]';
  const MENU_SELECTOR = '#nav_1778694770291_8972, [data-id="nav_1778694770291_8972"]';
  const PROFILE_URL = "/praca_inz/projects/profil_pacjent_main.php";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }
function injectPatientMojBackgroundCss() {
  if (document.getElementById("vetmell-patient-moj-background-css")) return;

  const style = document.createElement("style");
  style.id = "vetmell-patient-moj-background-css";

  style.textContent = `
    html,
    body {
      background: linear-gradient(180deg, #dcebfa 0%, #edf6ff 55%, #ffffff 100%) !important;
      min-height: 100%;
    }

    #preview-canvas,
    .preview-canvas,
    .final-view,
    .page-canvas,
    .canvas,
    .canvas-page {
      background: linear-gradient(180deg, #dcebfa 0%, #edf6ff 55%, #ffffff 100%) !important;
    }
  `;

  document.head.appendChild(style);
}
  function injectHomeLikeMenuCss() {
    if (document.getElementById("vetmell-home-like-menu-css")) return;

    const style = document.createElement("style");
    style.id = "vetmell-home-like-menu-css";

    style.textContent = `
      #nav_1778694770291_8972,
      [data-id="nav_1778694770291_8972"] {
        display: none !important;
      }

      body.sg-account-menu-open #nav_1778694770291_8972,
      body.sg-account-menu-open [data-id="nav_1778694770291_8972"] {
        display: block !important;
      }
    `;

    document.head.appendChild(style);
  }

  function setMenu(open) {
    const menu = document.querySelector(MENU_SELECTOR);
    if (!menu) return;

    document.body.classList.toggle("sg-account-menu-open", open);
    menu.dataset.open = open ? "1" : "0";
  }

  function setAccountName(name) {
    const konto = document.querySelector(KONTO_SELECTOR);
    const menu = document.querySelector(MENU_SELECTOR);

    if (!konto) return;

    const finalName = String(name || "KONTO").trim() || "KONTO";
    const btn = konto.querySelector("button.sgbtn") || konto.querySelector("button") || konto;
    const textSpan = btn.querySelector(".sgbtn__text");

    if (textSpan) {
      textSpan.textContent = finalName;
    } else {
      btn.textContent = finalName;
    }

    konto.style.cursor = "pointer";
    btn.style.cursor = "pointer";

    const nextWidth = Math.min(Math.max(finalName.length * 9 + 50, 130), 290);
    konto.style.width = nextWidth + "px";

    if (menu) {
      menu.style.width = Math.max(nextWidth, 155) + "px";
      menu.style.zIndex = "9999";
    }

    document.querySelectorAll(".page-element, .canvas-element").forEach(function (node) {
      if (String(node.textContent || "").trim() === "Imię i nazwisko") {
        node.textContent = finalName;
      }
    });
  }

async function loadPatientName() {
  const cacheKey = "vetmell_patient_full_name";

  const cachedName = sessionStorage.getItem(cacheKey);
  const user = window.VETMELL_LOGGED_USER || {};
  const windowName = String(user.name || "").trim();

  if (cachedName) {
    setAccountName(cachedName);
  } else if (windowName) {
    setAccountName(windowName);
  } else {
    setAccountName("KONTO");
  }

  try {
    const response = await fetch(PROFILE_URL, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json"
      }
    });

    const data = await response.json().catch(function () {
      return null;
    });

    if (response.ok && data && data.success && data.profile) {
      const firstName = String(data.profile.first_name || "").trim();
      const lastName = String(data.profile.last_name || "").trim();
      const fullName = `${firstName} ${lastName}`.trim();

      if (fullName) {
        sessionStorage.setItem(cacheKey, fullName);
        setAccountName(fullName);
      }
    }
  } catch (e) {
    console.error("Nie udało się pobrać danych pacjenta:", e);
  }
}

  function bindHomeLikeMenu() {
    const konto = document.querySelector(KONTO_SELECTOR);
    const menu = document.querySelector(MENU_SELECTOR);

    if (!konto || !menu) return;
    if (konto.dataset.homeLikeMenuBound === "1") return;

    konto.dataset.homeLikeMenuBound = "1";

    setMenu(false);

    konto.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      setMenu(menu.dataset.open !== "1");
    }, true);

    menu.addEventListener("click", function (e) {
      e.stopPropagation();
    }, true);

    document.addEventListener("click", function (e) {
      if (!konto.contains(e.target) && !menu.contains(e.target)) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        setMenu(false);
      }
    });

    Array.from(menu.querySelectorAll("a")).forEach(function (a) {
      const txt = String(a.textContent || "").toLowerCase().trim();

      if (txt.includes("moje konto")) {
        a.setAttribute("href", "/praca_inz/final_view.php?file=profil_pacjent_main.xml");
      }

      if (txt.includes("wyloguj")) {
        a.setAttribute("href", "#");

        a.addEventListener("click", async function (e) {
          e.preventDefault();
          e.stopPropagation();

          try {
            const res = await fetch(window.VETMELL_LOGOUT_URL || "/praca_inz/projects/login/login.php", {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                action: "logout"
              })
            });

            const data = await res.json().catch(function () {
              return {};
            });

            window.location.href = data.redirect || "/praca_inz/final_view.php?file=login.xml";
          } catch (err) {
            console.error(err);
            window.location.href = "/praca_inz/final_view.php?file=login.xml";
          }
        }, true);
      }
    });
  }

  ready(function () {
    injectHomeLikeMenuCss();
    bindHomeLikeMenu();
    loadPatientName();
  });
})();