(() => {
  "use strict";

  if (document.getElementById("preview-canvas")) return;

  const API_URL = window.LOGIN_API_URL || "projects/login/login.php";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function findEmailInput() {
    return (
      document.querySelector('input[name="email"]') ||
      document.querySelector('input[name="username"]') ||
      document.querySelector('input[type="email"]')
    );
  }

  function findPasswordInput() {
    return (
      document.querySelector('input[name="password"]') ||
      document.querySelector("input.sg-pass-input") ||
      document.querySelector('input[type="password"]')
    );
  }

  function findLoginButton() {
    const buttons = Array.from(document.querySelectorAll("button, .sgbtn"));

    return buttons.find((btn) => {
      const txt = String(btn.textContent || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      return txt.includes("zaloguj");
    });
  }
  function findRegisterButton() {
    const buttons = Array.from(document.querySelectorAll("button, .sgbtn"));

    return buttons.find((btn) => {
      const txt = String(btn.textContent || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      return txt.includes("zarejestruj");
    });
  }

  function bindRegister() {
    const registerButton = findRegisterButton();

    if (!registerButton) {
      return false;
    }

    if (registerButton.dataset.registerBound === "1") {
      return true;
    }

    registerButton.dataset.registerBound = "1";
    registerButton.style.cursor = "pointer";

    registerButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      window.location.href = "/praca_inz/final_view.php?file=register.xml";
    }, true);

    return true;
  }
  function setLoading(btn, loading) {
    if (!btn) return;

    if (loading) {
      btn.dataset.oldText = btn.textContent || "";
      btn.textContent = "Logowanie...";
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
    } else {
      if (btn.dataset.oldText) {
        btn.textContent = btn.dataset.oldText;
      }

      btn.disabled = false;
      btn.removeAttribute("aria-busy");
    }
  }

  function bindLogin() {
    const emailInput = findEmailInput();
    const passwordInput = findPasswordInput();
    const loginButton = findLoginButton();

    if (!emailInput || !passwordInput || !loginButton) {
      return false;
    }

    if (loginButton.dataset.loginBound === "1") {
      return true;
    }

    loginButton.dataset.loginBound = "1";

    emailInput.setAttribute("autocomplete", "username");
    passwordInput.setAttribute("autocomplete", "current-password");

    async function submitLogin(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const email = String(emailInput.value || "").trim();
      const password = String(passwordInput.value || "");

      if (!email || !password) {
        alert("Uzupełnij e-mail i hasło.");
        return;
      }

      setLoading(loginButton, true);

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            username: email,
            password: password
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          alert(data.message || "Nie udało się zalogować.");
          setLoading(loginButton, false);
          return;
        }

        window.location.href = data.redirect || "/";

      } catch (err) {
        console.error(err);
        alert("Błąd połączenia z serwerem.");
        setLoading(loginButton, false);
      }
    }

    loginButton.addEventListener("click", submitLogin, true);

    [emailInput, passwordInput].forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          submitLogin(e);
        }
      });
    });

    return true;
  }

    ready(() => {
    let tries = 0;

    const timer = setInterval(() => {
      tries++;

      const loginReady = bindLogin();
      const registerReady = bindRegister();

      if ((loginReady && registerReady) || tries > 50) {
        clearInterval(timer);
      }
    }, 100);
  });
})();