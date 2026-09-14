document.addEventListener("DOMContentLoaded", function () {
  
  const konto = document.querySelector(
    '#sgbtn_el_1778528282666, [data-id="el_1778528282666"]'
  );

  const menu = document.querySelector(
    '#nav_1778694770291_8972, [data-id="nav_1778694770291_8972"]'
  );

  if (!konto || !menu) return;

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

  const nextWidth = Math.min(Math.max(displayName.length * 9 + 50, 130), 280);
  konto.style.width = nextWidth + "px";
  menu.style.width = Math.max(nextWidth, 155) + "px";
  menu.style.zIndex = "9999";

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
      font-family: "Segoe UI", Arial, sans-serif;
    }
  `;

  document.head.appendChild(style);
}

  function renderNotificationBadge(count) {
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

  async function loadUnreadNotifications() {
    let unread = parseInt(user.unread_notifications || "0", 10) || 0;

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

    renderNotificationBadge(unread);
  }

  loadUnreadNotifications();

  function setMenu(open) {
    document.body.classList.toggle("sg-account-menu-open", open);
    menu.dataset.open = open ? "1" : "0";
  }

  setMenu(false);

  konto.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }

    const isOpen = menu.dataset.open === "1";
    setMenu(!isOpen);
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

  const links = Array.from(menu.querySelectorAll("a"));

  links.forEach(function (a) {
    const txt = String(a.textContent || "").toLowerCase().trim();

    if (txt.includes("moje konto")) {
      a.setAttribute("href", "/praca_inz/final_view.php?file=profil_pacjent_main.xml");

      a.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation();
        }

        window.location.href = "/praca_inz/final_view.php?file=profil_pacjent_main.xml";
      }, true);
    }

    if (txt.includes("wyloguj")) {
      a.setAttribute("href", "#");

      a.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation();
        }

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
});