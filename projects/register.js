(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = window.REGISTER_API_URL || "/praca_inz/projects/register.php";

  const IDS = {
    firstName: "form_1779018339752_1261",
    lastName: "el_1779018468656_486617",
    email: "el_1779018551402_119803",
    password: "el_1779018656326_973456",
    passwordRepeat: "el_1779018610858_366303",
    phone: "el_1779018700025_412519",
    birthDate: "el_1779018747018_710969",
    consent: "form_1779018814889_833",
    submit: "el_1779018887283"
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function byDataId(id) {
    const safe = cssEscape(id);

    return (
      document.getElementById(id) ||
      document.querySelector(`[data-id="${safe}"]`) ||
      document.querySelector(`.page-element[data-id="${safe}"]`) ||
      document.querySelector(`.canvas-element[data-id="${safe}"]`)
    );
  }

  function inputFromHost(id) {
    const host = byDataId(id);

    if (!host) return null;

    return host.querySelector("input, textarea, select") ||
      (host.matches && host.matches("input, textarea, select") ? host : null);
  }
function setupPasswordFields() {
  const passwordInput = inputFromHost(IDS.password);
  const repeatInput = inputFromHost(IDS.passwordRepeat);

  [passwordInput, repeatInput].forEach(function (input) {
    if (!input) return;

    input.type = "password";
    input.setAttribute("autocomplete", "new-password");
  });
}
  function findCreateButton() {
    const host = byDataId(IDS.submit);

    if (host) {
      return host.querySelector("button, .sgbtn") || host;
    }

    const buttons = Array.from(document.querySelectorAll("button, .sgbtn, .sgbtn-wrap"));

    return buttons.find(function (btn) {
      const txt = String(btn.textContent || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      return txt.includes("stwórz konto") || txt.includes("stworz konto") || txt.includes("zarejestruj");
    }) || null;
  }

  function getValue(id) {
    const input = inputFromHost(id);

    if (!input) return "";

    return String(input.value || "").trim();
  }

  function getChecked(id) {
    const input = inputFromHost(id);

    if (!input) return false;

    if (input.type === "checkbox" || input.type === "radio") {
      return !!input.checked;
    }

    const host = byDataId(id);
    const checked = host ? host.querySelector("input:checked") : null;

    return !!checked;
  }

  function setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
      button.dataset.oldText = button.textContent || "";
      button.textContent = "Tworzenie konta...";
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    } else {
      if (button.dataset.oldText) {
        button.textContent = button.dataset.oldText;
      }

      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }

  function normalizeBirthDate(value) {
    const raw = String(value || "").trim();

    if (!raw) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    const match = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);

    if (!match) return raw;

    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];

    return `${year}-${month}-${day}`;
  }

  function validate(payload) {
    if (!payload.first_name) return "Podaj imię.";
    if (!payload.last_name) return "Podaj nazwisko.";
    if (!payload.email) return "Podaj e-mail.";
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) return "Podaj poprawny e-mail.";
    if (!payload.password) return "Podaj hasło.";
    if (payload.password.length < 6) return "Hasło musi mieć minimum 6 znaków.";
    if (payload.password !== payload.password_repeat) return "Hasła nie są takie same.";
    if (!payload.privacy_consent) return "Musisz wyrazić zgodę z polityką prywatności.";

    return "";
  }

function bindBackToLogin() {
  const nodes = Array.from(document.querySelectorAll("a, button, .sgbtn"));

  nodes.forEach(function (node) {
    const txt = String(node.textContent || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    const isBackToLogin =
      txt.includes("wróć do panelu logowania") ||
      txt.includes("wroc do panelu logowania") ||
      txt.includes("zaloguj się") ||
      txt.includes("zaloguj sie");

    if (!isBackToLogin) {
      return;
    }

    if (node.dataset.loginBackBound === "1") return;
    node.dataset.loginBackBound = "1";
    node.style.cursor = "pointer";

    node.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      window.location.href = "/praca_inz/final_view.php?file=login.xml";
    }, true);
  });
}

  function bindRegister() {
    const button = findCreateButton();

    if (!button) return false;

    if (button.dataset.registerBound === "1") return true;
    button.dataset.registerBound = "1";
    button.style.cursor = "pointer";

    button.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      const payload = {
        first_name: getValue(IDS.firstName),
        last_name: getValue(IDS.lastName),
        email: getValue(IDS.email),
        password: getValue(IDS.password),
        password_repeat: getValue(IDS.passwordRepeat),
        phone: getValue(IDS.phone),
        birth_date: normalizeBirthDate(getValue(IDS.birthDate)),
        privacy_consent: getChecked(IDS.consent)
      };

      const error = validate(payload);

      if (error) {
        alert(error);
        return;
      }

      setButtonLoading(button, true);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(function () {
          return null;
        });

        if (!response.ok || !data || !data.ok) {
          alert((data && data.message) || "Nie udało się utworzyć konta.");
          setButtonLoading(button, false);
          return;
        }

alert(data.message || "Konto zostało utworzone. Możesz się teraz zalogować.");
window.location.href = data.redirect || "/praca_inz/final_view.php?file=login.xml";
      } catch (err) {
        console.error(err);
        alert("Błąd połączenia z serwerem.");
        setButtonLoading(button, false);
      }
    }, true);

    return true;
  }

ready(function () {
  let tries = 0;

  const timer = setInterval(function () {
    tries++;

    setupPasswordFields();
    bindBackToLogin();

    if (bindRegister() || tries > 50) {
      clearInterval(timer);
    }
  }, 100);
});
})();