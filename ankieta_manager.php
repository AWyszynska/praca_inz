<div id="form-edit-section" style="display:none; margin-top:15px; border-top:1px solid #e2e8f0; padding-top:15px;">

  <label style="color:#1e293b; font-size:12px;">ANKIETA / FORMULARZ (PRO)</label>

  <label style="color:#1e293b; font-size:11px; margin-top:10px;">TYP POLA</label>
  <select id="form-type-select">
    <option value="text">Pole tekstowe (Input)</option>
    <option value="textarea">Pole tekstowe (Textarea)</option>
    <option value="email">Email</option>
    <option value="password">Hasło (Password)</option>
    <option value="number">Liczba</option>
    <option value="date">Data</option>
    <option value="select">Lista rozwijana (Select)</option>
    <option value="radio">Jednokrotny wybór (Radio)</option>
    <option value="checkbox">Wielokrotny wybór (Checkbox)</option>
    <option value="yesno">Tak / Nie</option>
    <option value="rating">Ocena (Rating)</option>
    <option value="likert">Skala Likerta</option>
  </select>

  <label style="margin-top:10px;">PYTANIE / ETYKIETA</label>
  <input type="text" id="form-label-text" placeholder="Np. Jak oceniasz obsługę?">

  <label style="margin-top:10px;">TEKST POMOCNICZY (opcjonalnie)</label>
  <input type="text" id="form-help-text" placeholder="Np. Wybierz jedną odpowiedź.">

  <div id="form-placeholder-row" style="margin-top:10px;">
    <label>PLACEHOLDER (opcjonalnie)</label>
    <input type="text" id="form-placeholder" placeholder="Np. Wpisz odpowiedź...">
  </div>

  <div style="display:flex; gap:10px; margin-top:10px; align-items:center;">
    <label style="display:flex; gap:6px; align-items:center; margin:0; text-transform:none; font-weight:600; color:#1e293b;">
      <input type="checkbox" id="form-required"> Wymagane
    </label>

    <div id="form-inline-row" style="display:none;">
      <label style="display:flex; gap:6px; align-items:center; margin:0; text-transform:none; font-weight:600; color:#1e293b;">
        <input type="checkbox" id="form-inline"> Opcje w 1 linii
      </label>
    </div>
  </div>

  <label style="margin-top:10px;">NAME (nazwa pola) — opcjonalnie</label>
  <input type="text" id="form-name" placeholder="Np. email, ocena, komentarz">

  <div style="margin-top:12px; padding:10px; border:1px dashed #cbd5e1; border-radius:12px; background:#f8fafc;">
    <div style="font-size:11px; font-weight:900; color:#334155; letter-spacing:.3px;">ZNACZNIKI / IKONKA</div>

    <label style="margin-top:8px; font-size:11px;">ZNACZNIK (mała plakietka) — opcjonalnie</label>
    <input type="text" id="form-marker-text" placeholder="np. EMAIL, PRO, OPCJONALNE">

    <div style="display:flex; gap:8px; margin-top:8px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Styl znacznika</label>
        <select id="form-marker-style">
          <option value="none">Brak</option>
          <option value="chip">Chip (wypełniony)</option>
          <option value="outline">Chip (obrys)</option>
          <option value="muted">Muted</option>
        </select>
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Ikonka</label>
        <select id="form-icon">
          <option value="">Brak</option>
          <option value="mail">✉️ Mail</option>
          <option value="at">@ At</option>
          <option value="user">👤 User</option>
          <option value="lock">🔒 Lock</option>
          <option value="phone">📞 Phone</option>
          <option value="search">🔎s Search</option>
          <option value="pin">📍 Pin</option>
        </select>
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Strona ikonki</label>
        <select id="form-icon-side">
          <option value="left">Lewa</option>
          <option value="right">Prawa</option>
        </select>
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-top:8px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Tryb ikonki</label>
        <select id="form-icon-mode">
          <option value="split">W polu (podzielone)</option>
          <option value="bubble">Bąbelek (okrągły)</option>
        </select>
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Tło ikonki</label>
        <input type="color" id="form-icon-bg" value="#f1f5f9">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Kolor ikonki</label>
        <input type="color" id="form-icon-color" value="#0f172a">
      </div>
    </div>

    <div id="form-email-presets" style="display:none; margin-top:10px;">
      <div style="font-size:11px; font-weight:800; color:#334155;">PRESET EMAIL</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
        <button type="button" data-sg-email-preset="gmail" style="padding:6px 10px; border-radius:10px; border:1px solid #e2e8f0; background:#ffffff; color:#0f172a; cursor:pointer;">Gmail</button>
        <button type="button" data-sg-email-preset="outlook" style="padding:6px 10px; border-radius:10px; border:1px solid #e2e8f0; background:#eff6ff; color:#0f172a; cursor:pointer;">Outlook</button>
        <button type="button" data-sg-email-preset="minimal" style="padding:6px 10px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; color:#0f172a; cursor:pointer;">Minimal</button>
        <button type="button" data-sg-email-preset="dark" style="padding:6px 10px; border-radius:10px; border:1px solid #0f172a; background:#0f172a; color:#ffffff; cursor:pointer;">Dark</button>
      </div>
    </div>
  </div>

  <div id="form-options-container" style="display:none; margin-top:10px;">
    <label style="font-size:11px;">OPCJE (nowa linia lub przecinek)</label>
    <textarea id="form-options-list" style="width:100%; height:72px; font-size:12px;" placeholder="Opcja 1\nOpcja 2\nOpcja 3"></textarea>
    <div style="font-size:11px; color:#64748b; margin-top:6px; line-height:1.3;">
      Tip: możesz wkleić listę z Excela — każda opcja w osobnej linii.
    </div>
  </div>

  <div id="form-textarea-container" style="display:none; margin-top:10px;">
    <label>LICZBA WIERSZY (textarea)</label>
    <input type="number" id="form-rows" value="3" min="1" max="20">
  </div>

  <div id="form-number-container" style="display:none; margin-top:10px;">
    <label>ZAKRES (number)</label>
    <div style="display:flex; gap:8px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Min</label>
        <input type="number" id="form-min" placeholder="np. 0">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Max</label>
        <input type="number" id="form-max" placeholder="np. 100">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Krok</label>
        <input type="number" id="form-step" placeholder="np. 1">
      </div>
    </div>
  </div>
<div id="form-password-container" style="display:none; margin-top:10px;">
  <label>HASŁO (password) — opcje</label>

  <div style="display:flex; gap:8px;">
    <div style="flex:1;">
      <label style="text-transform:none; font-weight:600; color:#475569;">Min długość</label>
      <input type="number" id="pass-minlen" value="0" min="0" max="128">
    </div>

    <div style="flex:1;">
      <label style="text-transform:none; font-weight:600; color:#475569;">Autocomplete</label>
      <select id="pass-autocomplete">
        <option value="">(auto)</option>
        <option value="new-password">new-password</option>
        <option value="current-password">current-password</option>
        <option value="one-time-code">one-time-code</option>
      </select>
    </div>
  </div>

  <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:8px;">
    <label style="display:flex; gap:6px; align-items:center; margin:0; text-transform:none; font-weight:600; color:#1e293b;">
      <input type="checkbox" id="pass-reveal" checked> Przycisk 👁 (pokaż/ukryj)
    </label>
    <label style="display:flex; gap:6px; align-items:center; margin:0; text-transform:none; font-weight:600; color:#1e293b;">
      <input type="checkbox" id="pass-meter" checked> Pasek siły hasła
    </label>
  </div>

  <div style="font-size:11px; color:#64748b; margin-top:6px; line-height:1.3;">
    Tip: 👁 i pasek siły działają tylko w <b>final_view</b> (w edytorze wszystko jest zablokowane).
  </div>
</div>

  <div id="form-rating-container" style="display:none; margin-top:10px;">
    <label>OCENA (rating)</label>
    <div style="display:flex; gap:8px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Min</label>
        <input type="number" id="rating-min" value="1" min="0">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Max</label>
        <input type="number" id="rating-max" value="5" min="1">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Krok</label>
        <input type="number" id="rating-step" value="1" min="1">
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-top:8px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Etykieta min (opc.)</label>
        <input type="text" id="rating-min-label" placeholder="np. Słabo">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Etykieta max (opc.)</label>
        <input type="text" id="rating-max-label" placeholder="np. Super">
      </div>
    </div>
  </div>

  <div id="form-likert-container" style="display:none; margin-top:10px;">
    <label>SKALA LIKERTA</label>
    <div style="display:flex; gap:8px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Min</label>
        <input type="number" id="likert-min" value="1" min="0">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Max</label>
        <input type="number" id="likert-max" value="5" min="1">
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-top:8px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Etykieta lewo</label>
        <input type="text" id="likert-left" placeholder="np. Zdecydowanie nie">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Etykieta prawo</label>
        <input type="text" id="likert-right" placeholder="np. Zdecydowanie tak">
      </div>
    </div>
  </div>

  <hr style="margin:14px 0; border:none; border-top:1px solid #e2e8f0;">

  <label style="color:#1e293b; font-size:12px;">WYGLĄD</label>

  <label style="margin-top:10px;">ROZMIAR CZCIONKI (PX)</label>
  <input type="number" id="form-font-size" value="16" min="10" max="60">

  <label style="margin-top:10px;">KOLOR TEKSTU</label>
  <input type="color" id="form-text-color" value="#0f172a">

  <label style="margin-top:10px;">KOLOR AKCENTU (checkbox/radio/rating)</label>
  <input type="color" id="form-accent-color" value="#156fe5">
<div id="form-no-bg-row" style="display:none; margin-top:10px;">
  <label style="display:flex; gap:8px; align-items:center; margin:0; text-transform:none; font-weight:700; color:#1e293b;">
    <input type="checkbox" id="form-no-bg"> Bez tła (przezroczyste)
  </label>
</div>

  <div style="margin-top:10px; padding:10px; border:1px dashed #e2e8f0; border-radius:12px; background:#f8fafc;">
    <div style="font-size:11px; font-weight:900; color:#334155; letter-spacing:.3px;">INPUT — PRO</div>

    <label style="margin-top:8px;">STYL INPUTA</label>
    <select id="form-input-style">
      <option value="box">Box (klasyczny)</option>
      <option value="underline">Tylko linia (underline)</option>
      <option value="soft">Soft (delikatny)</option>
      <option value="pill">Pill (mocno zaokrąglony)</option>
    </select>

    <label style="margin-top:10px;">TŁO INPUTA</label>
    <input type="color" id="form-input-bg" value="#ffffff">

    <label style="margin-top:10px;">KOLOR RAMKI / LINII</label>
    <input type="color" id="form-input-border" value="#d1d5db">

    <label style="margin-top:10px;">RODZAJ RAMKI</label>
    <select id="form-input-border-style">
      <option value="solid">Solid</option>
      <option value="dashed">Dashed</option>
      <option value="dotted">Dotted</option>
    </select>

    <label style="margin-top:10px;">GRUBOŚĆ RAMKI / LINII (PX)</label>
    <input type="range" id="form-input-border-w" min="0" max="6" value="1">

    <label style="margin-top:10px;">CIEŃ INPUTA</label>
    <select id="form-input-shadow">
      <option value="none">Brak</option>
      <option value="soft">Soft</option>
      <option value="strong">Strong</option>
    </select>

    <label style="margin-top:10px;">ZAOKRĄGLENIE INPUTA (PX)</label>
    <input type="range" id="form-input-radius" min="0" max="60" value="10">

    <div style="display:flex; gap:10px; margin-top:10px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Padding X</label>
        <input type="range" id="form-input-pad-x" min="4" max="28" value="10">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Padding Y</label>
        <input type="range" id="form-input-pad-y" min="4" max="22" value="9">
      </div>
    </div>

    <label style="margin-top:10px;">KOLOR PLACEHOLDER</label>
    <input type="color" id="form-placeholder-color" value="#94a3b8">

    <div style="display:flex; gap:10px; margin-top:10px;">
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Focus ring (px)</label>
        <input type="range" id="form-focus-ring" min="0" max="12" value="4">
      </div>
      <div style="flex:1;">
        <label style="text-transform:none; font-weight:600; color:#475569;">Focus opacity (%)</label>
        <input type="range" id="form-focus-opacity" min="0" max="40" value="18">
      </div>
    </div>
  </div>

  <label style="margin-top:10px;">SZEROKOŚĆ ELEMENTU (PX)</label>
  <input type="number" id="form-width" value="320" min="140" max="1200">

</div>
