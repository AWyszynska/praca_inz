<div id="form-edit-section" style="display:none; margin-top:15px; border-top:1px solid #e2e8f0; padding-top:15px;">

  <label style="color:#1e293b; font-size:12px;">ANKIETA / FORMULARZ (PRO)</label>

  <label style="color:#1e293b; font-size:11px; margin-top:10px;">TYP POLA</label>
  <select id="form-type-select">
    <option value="text">Pole tekstowe (Input)</option>
    <option value="textarea">Pole tekstowe (Textarea)</option>
    <option value="email">Email</option>
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

  <label style="margin-top:10px;">ZAOKRĄGLENIE INPUTA (PX)</label>
  <input type="range" id="form-input-radius" min="0" max="30" value="10">

  <label style="margin-top:10px;">SZEROKOŚĆ ELEMENTU (PX)</label>
  <input type="number" id="form-width" value="320" min="140" max="1200">

</div>
