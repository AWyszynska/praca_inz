(function () {
  const APPOINTMENT_URL = "final_view.php?file=main_make_appointment.xml&page=appointment";

  const BUTTON_IDS = [
    "el_1772293176714",
    "el_1773073090426"
  ];

  function goToAppointment(event) {
    event.preventDefault();
    event.stopPropagation();

    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    window.location.href = APPOINTMENT_URL;
  }

  function bindAppointmentButtons() {
    BUTTON_IDS.forEach((id) => {
      const buttonWrap = document.querySelector(
        '.page-element[data-id="' + id + '"]'
      );

      if (!buttonWrap || buttonWrap.dataset.appointmentBound === "1") {
        return;
      }

      buttonWrap.dataset.appointmentBound = "1";

      const realButton = buttonWrap.querySelector(".sgbtn") || buttonWrap;
      realButton.style.cursor = "pointer";

      realButton.addEventListener("click", goToAppointment, true);
    });
  }

  function injectNotificationBadgeCss() {
    if (document.getElementById("vetmell-notification-badge-style")) return;

    const style = document.createElement("style");
    style.id = "vetmell-notification-badge-style";

    style.textContent = `
      .vetmell-notification-badge {
        position: fixed;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 999px;
        background: #dc2626;
        color: #ffffff;
        border: 2px solid #ffffff;
        font-size: 11px;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        z-index: 2147483647;
        pointer-events: none;
        font-family: Arial, Helvetica, sans-serif;
      }
    `;

    document.head.appendChild(style);
  }

  function renderNotificationBadge(konto, btn, count) {
    let badge = document.querySelector(".vetmell-notification-badge");
    const unread = parseInt(count || "0", 10) || 0;

    if (unread <= 0) {
      if (badge) badge.remove();
      return;
    }

    injectNotificationBadgeCss();

    if (!badge) {
      badge = document.createElement("span");
      badge.className = "vetmell-notification-badge";
      document.body.appendChild(badge);
    }

    badge.textContent = unread > 99 ? "99+" : String(unread);

    const title = unread === 1
      ? "Masz 1 nieodczytane powiadomienie"
      : "Masz " + unread + " nieodczytanych powiadomień";

    badge.title = title;
    btn.title = title;

    function positionBadge() {
      const rect = konto.getBoundingClientRect();

      badge.style.left = (rect.right - 10) + "px";
      badge.style.top = (rect.top - 6) + "px";
    }

    positionBadge();

    window.addEventListener("resize", positionBadge);
    window.addEventListener("scroll", positionBadge, true);
  }

  async function loadUnreadNotifications(konto, btn) {
    let unread = 0;

    try {
      const response = await fetch("/praca_inz/projects/pulpit_pacjent_moj_powiadomienia.php", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        }
      });

      const text = await response.text();

      let data = null;

      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Powiadomienia PHP nie zwróciły JSON:", text);
      }

      if (response.ok && data && data.success) {
        unread = parseInt(data.unread || "0", 10) || 0;
      }
    } catch (e) {
      console.error("Nie udało się pobrać powiadomień:", e);
    }

    renderNotificationBadge(konto, btn, unread);
  }

  function bindAccountMenu() {
    const konto = document.querySelector(
      '#sgbtn_el_1778528282666, [data-id="el_1778528282666"]'
    );

    const menu = document.querySelector(
      '#nav_1778694770291_8972, [data-id="nav_1778694770291_8972"]'
    );

    if (!konto) return;

    const user = window.VETMELL_LOGGED_USER || {};
    const displayName = String(user.name || "KONTO").trim() || "KONTO";

    const btn = konto.querySelector("button.sgbtn") || konto.querySelector("button") || konto;
    const textSpan = btn.querySelector(".sgbtn__text");

    if (textSpan) {
      textSpan.textContent = displayName;
    } else {
      btn.textContent = displayName;
    }

    konto.style.cursor = "pointer";
    btn.style.cursor = "pointer";

    const nextWidth = Math.min(Math.max(displayName.length * 9 + 50, 130), 290);
    konto.style.width = nextWidth + "px";

    if (menu) {
      menu.style.zIndex = "9999";
      menu.style.width = Math.max(nextWidth, 155) + "px";
    }

    // TO JEST NAJWAŻNIEJSZE:
    // od razu po wejściu na stronę główną sprawdza bazę notification
    // i pokazuje czerwone kółeczko, jeśli są nieodczytane.
    loadUnreadNotifications(konto, btn);

    function setMenu(open) {
      if (!menu) return;

      document.body.classList.toggle("sg-account-menu-open", open);
      menu.dataset.open = open ? "1" : "0";
    }

    if (menu) {
      setMenu(false);
    }

    konto.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      if (!menu) return;

      const isOpen = menu.dataset.open === "1";
      setMenu(!isOpen);
    }, true);

    if (menu) {
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
    }

    const links = menu ? Array.from(menu.querySelectorAll("a")) : [];

    links.forEach(function (a) {
      const txt = String(a.textContent || "").toLowerCase().trim();

      if (txt.includes("moje konto")) {
        a.setAttribute("href", "/praca_inz/final_view.php?file=pulpit_pacjent.xml");
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

            const data = await res.json().catch(() => ({}));
            window.location.href = data.redirect || "/praca_inz/final_view.php?file=login.xml";

          } catch (err) {
            console.error(err);
            window.location.href = "/praca_inz/final_view.php?file=login.xml";
          }
        }, true);
      }
    });
  }

  function boot() {
    bindAppointmentButtons();
    bindAccountMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();