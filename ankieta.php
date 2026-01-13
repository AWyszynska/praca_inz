<div id="form-edit-section" style="display: none; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    <label style="color: #1e293b; font-size: 11px;">TYP POLA:</label>
    <select id="form-type-select">
        <option value="text">Pole tekstowe (Input)</option>
        <option value="checkbox">Pole wyboru (Checkbox)</option>
        <option value="radio">Jednokrotny wybór (Radio)</option>
    </select>

    <label style="margin-top: 10px;">ETYKIETA / PLACEHOLDER:</label>
    <input type="text" id="form-label-text" placeholder="Wpisz treść...">

    <div id="form-options-container" style="display: none; margin-top: 10px;">
        <label style="font-size: 11px;">OPCJE (oddziel przecinkiem):</label>
        <textarea id="form-options-list" style="width: 100%; height: 60px; font-size: 12px;" placeholder="Opcja 1, Opcja 2, Opcja 3"></textarea>
    </div>

    <label style="margin-top: 10px;">ROZMIAR CZCIONKI (PX):</label>
    <input type="number" id="form-font-size" value="16">

    <label style="margin-top: 10px;">KOLOR ELEMENTU:</label>
    <input type="color" id="form-accent-color" value="#156fe5">
</div>