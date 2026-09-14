(function () {
  if (window.__vetmellMojTopbarLoaded === true) return;
  window.__vetmellMojTopbarLoaded = true;

  const script = document.createElement("script");
  script.src = "/praca_inz/projects/pulpit_pacjent_moj_topbar.js?v=" + Date.now();
  script.defer = true;
  document.head.appendChild(script);
})();

(function () {
  const API_URL = "/praca_inz/projects/profil_pacjent_main.php";

  const IDS = {
    profileText: "el_1778870979361",
    street: "form_1778871381521_4423",
    building: "el_1778877027856_325373",
    apartment: "el_1778877034579_218734",
    postal: "el_1778877039852_506711",
    city: "el_1778877042934_733982",
    isDefault: "form_1778872869664_4023",
    saveButton: "el_1778872931715",
    addressListBlock: "blk_1778870758598"
  };

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

  function fieldInput(id) {
    const host = byDataId(id);

    if (!host) return null;

    return host.querySelector("input, textarea, select");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function formatDate(value) {
    const raw = String(value || "").trim();

    if (!raw) return "-";

    const normalized = raw.replace(" ", "T");
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return raw.substring(0, 10);
    }

    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function setValue(id, value) {
    const input = fieldInput(id);

    if (!input) return;

    input.value = String(value || "");
  }

  function getValue(id) {
    const input = fieldInput(id);

    if (!input) return "";

    return String(input.value || "").trim();
  }

  function setChecked(id, checked) {
    const input = fieldInput(id);

    if (!input) return;

    input.checked = !!checked;
  }

  function getChecked(id) {
    const input = fieldInput(id);

    if (!input) return false;

    return !!input.checked;
  }

  function clearAddressForm() {
    setValue(IDS.street, "");
    setValue(IDS.building, "");
    setValue(IDS.apartment, "");
    setValue(IDS.postal, "");
    setValue(IDS.city, "");
    setChecked(IDS.isDefault, false);
  }

function findTextElementByLabel(label) {
  const wanted = String(label || "").toLowerCase();

  const elements = Array.from(document.querySelectorAll(".page-element, .canvas-element"));

  return elements.find(function (el) {
    const text = String(el.textContent || "").trim().toLowerCase();
    return text.startsWith(wanted);
  }) || null;
}

function setTextLineByIdOrLabel(id, label, value) {
  const byId = byDataId(id);
  const el = byId || findTextElementByLabel(label);

  if (!el) return;

  el.innerHTML = `<b>${escapeHtml(label)}</b> ${escapeHtml(value || "-")}`;
}

function setTextLineByLabel(label, value) {
  const el = findTextElementByLabel(label);

  if (!el) return;

  el.innerHTML = `<b>${escapeHtml(label)}</b> ${escapeHtml(value || "-")}`;
}

function renderProfile(profile) {
  const firstName = profile.first_name || "-";
  const lastName = profile.last_name || "-";
  const email = profile.email || "-";
  const phone = profile.phone || "-";
  const birthDate = formatDate(profile.birth_date);

  const el = byDataId(IDS.profileText);

  if (el) {
    el.style.overflow = "visible";
    el.style.whiteSpace = "normal";
    el.style.lineHeight = "1.45";
    el.style.height = "auto";
    el.style.minHeight = "130px";

    el.innerHTML = `
      <div style="font-size:17px; line-height:1.45; color:#0b2c63;">
        <div style="margin-bottom:4px;">
          <b style="color:#000; font-weight:900;">Imię:</b> ${escapeHtml(firstName)}
        </div>

        <div style="margin-bottom:4px;">
          <b style="color:#000; font-weight:900;">Nazwisko:</b> ${escapeHtml(lastName)}
        </div>

        <div style="margin-bottom:4px;">
          <b style="color:#000; font-weight:900;">Email:</b> ${escapeHtml(email)}
        </div>

        <div style="margin-bottom:4px;">
          <b style="color:#000; font-weight:900;">Telefon:</b> ${escapeHtml(phone)}
        </div>

        <div>
          <b style="color:#000; font-weight:900;">Data urodzenia:</b> ${escapeHtml(birthDate)}
        </div>
      </div>
    `;
  }

  const fullName = `${firstName} ${lastName}`.trim();

  document.querySelectorAll(".page-element, .canvas-element").forEach(function (node) {
    const text = String(node.textContent || "").trim();

    if (text === "Imię i nazwisko" && fullName !== "-") {
      node.textContent = fullName;
    }
  });
}

  function addressLine(address) {
    const apartment = address.apartment_number
      ? "/" + address.apartment_number
      : "";

    return `${address.street} ${address.building_number}${apartment}, ${address.postal_code} ${address.city}`;
  }

  function renderAddresses(addresses) {
    const block = byDataId(IDS.addressListBlock);

    if (!block) return;

    const list = Array.isArray(addresses) ? addresses : [];

    block.style.overflow = "hidden";
    block.style.boxSizing = "border-box";

    if (!document.getElementById("ppm-profile-style")) {
      injectCss();
    }

    if (!list.length) {
      block.innerHTML = `
        <div class="ppm-address-shell">
          <div class="ppm-address-title">Moje adresy</div>
          <div class="ppm-empty">Nie masz jeszcze zapisanego adresu. Uzupełnij formularz i kliknij „Zapisz adres”.</div>
        </div>
      `;
      return;
    }

    block.innerHTML = `
      <div class="ppm-address-shell">
        <div class="ppm-address-title">Moje adresy</div>

        <div class="ppm-address-list">
          ${list.map(function (address) {
            return `
              <article class="ppm-address-card">
                <div>
                  <div class="ppm-address-main">${escapeHtml(addressLine(address))}</div>
                  <div class="ppm-address-small">Adres #${escapeHtml(address.id)}</div>
                </div>

                ${
                  address.is_default
                    ? `<span class="ppm-default-badge">Domyślny</span>`
                    : `<span class="ppm-normal-badge">Zapisany</span>`
                }
              </article>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function fillFormWithDefaultAddress(addresses) {
    const list = Array.isArray(addresses) ? addresses : [];

    if (!list.length) return;

    const address = list.find(function (item) {
      return item.is_default;
    }) || list[0];

    setValue(IDS.street, address.street || "");
    setValue(IDS.building, address.building_number || "");
    setValue(IDS.apartment, address.apartment_number || "");
    setValue(IDS.postal, address.postal_code || "");
    setValue(IDS.city, address.city || "");
    setChecked(IDS.isDefault, !!address.is_default);
  }

  function injectCss() {
    if (document.getElementById("ppm-profile-style")) return;

    const style = document.createElement("style");
    style.id = "ppm-profile-style";

    style.textContent = `


      .ppm-address-shell {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 18px;
        font-family: "Segoe UI", system-ui, sans-serif;
        color: #0b2c63;
        overflow: hidden;
      }

      .ppm-address-title {
        font-size: 21px;
        font-weight: 900;
        color: #363535;
        margin-bottom: 12px;
      }

      .ppm-address-list {
        height: calc(100% - 42px);
        overflow-y: auto;
        padding-right: 8px;
        box-sizing: border-box;
      }

      .ppm-address-list::-webkit-scrollbar {
        width: 10px;
      }

      .ppm-address-list::-webkit-scrollbar-track {
        background: rgba(203, 213, 225, 0.35);
        border-radius: 999px;
      }

      .ppm-address-list::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.45);
        border-radius: 999px;
      }

      .ppm-address-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 14px 16px;
        margin-bottom: 10px;
        border-radius: 16px;
        background: #ffffff;
        border: 1px solid #d9e6f8;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
      }

      .ppm-address-main {
        font-size: 16px;
        font-weight: 900;
        color: #08285c;
      }

      .ppm-address-small {
        margin-top: 4px;
        font-size: 13px;
        color: #637999;
      }

      .ppm-default-badge,
      .ppm-normal-badge {
        flex-shrink: 0;
        padding: 8px 13px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 900;
      }

      .ppm-default-badge {
        background: #dcfce7;
        color: #13723c;
        border: 1px solid #91e5b2;
      }

      .ppm-normal-badge {
        background: #eef6ff;
        color: #1f56d8;
        border: 1px solid #c8ddff;
      }

      .ppm-empty {
        height: calc(100% - 42px);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        border: 1px dashed #cbd5e1;
        border-radius: 18px;
        background: #f8fbff;
        color: #526b8e;
        font-size: 15px;
        line-height: 1.45;
        padding: 20px;
        box-sizing: border-box;
      }

      .ppm-msg {
        position: fixed;
        right: 28px;
        bottom: 28px;
        z-index: 999999;
        padding: 13px 18px;
        border-radius: 999px;
        background: #dcfce7;
        color: #13723c;
        border: 1px solid #91e5b2;
        font-size: 14px;
        font-weight: 900;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
      }

      .ppm-msg.error {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fecaca;
      }
    `;

    document.head.appendChild(style);
  }

  function showMessage(message, type) {
    const old = document.querySelector(".ppm-msg");

    if (old) old.remove();

    const box = document.createElement("div");
    box.className = "ppm-msg" + (type === "error" ? " error" : "");
    box.textContent = message;
    document.body.appendChild(box);

    setTimeout(function () {
      box.remove();
    }, 3000);
  }

  async function apiGet() {
    const response = await fetch(API_URL, {
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
      console.error("PHP zwrócił tekst zamiast JSON:", text);
      throw new Error("PHP nie zwrócił poprawnego JSON.");
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Nie udało się pobrać danych.");
    }

    return data;
  }

  async function saveAddress() {
    const payload = {
      action: "save_address",
      street: getValue(IDS.street),
      building_number: getValue(IDS.building),
      apartment_number: getValue(IDS.apartment),
      postal_code: getValue(IDS.postal),
      city: getValue(IDS.city),
      is_default: getChecked(IDS.isDefault)
    };

    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    let data = null;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("PHP zwrócił tekst zamiast JSON:", text);
      throw new Error("PHP nie zwrócił poprawnego JSON.");
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Nie udało się zapisać adresu.");
    }

    return data;
  }

  async function reload(shouldFillForm) {
    const data = await apiGet();

    renderProfile(data.profile || {});
    renderAddresses(data.addresses || []);

    if (shouldFillForm) {
      fillFormWithDefaultAddress(data.addresses || []);
    }
  }

  function bindSaveButton() {
    const host = byDataId(IDS.saveButton);

    if (!host || host.dataset.ppmBound === "1") return;

    host.dataset.ppmBound = "1";

    host.addEventListener("click", async function (event) {
      event.preventDefault();
      event.stopPropagation();

      try {
        await saveAddress();
        showMessage("Adres został zapisany.");
        clearAddressForm();
        await reload(false);
      } catch (e) {
        showMessage(e.message || "Nie udało się zapisać adresu.", "error");
      }
    }, true);
  }

  async function init() {
    injectCss();
    bindSaveButton();

    try {
      await reload(true);
    } catch (e) {
      showMessage(e.message || "Nie udało się pobrać danych profilu.", "error");
      console.error(e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();