<div id="image-edit-section" style="display: none; margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    <label style="color: #1e293b; font-size: 11px;">WYMIARY ZDJĘCIA (PX):</label>
    <div style="display: flex; gap: 5px;">
        <input type="number" id="img-width" placeholder="Szer.">
        <input type="number" id="img-height" placeholder="Wys.">
    </div>

    <label style="margin-top: 10px;">ZAOKRĄGLENIE ROGÓW (PX):</label>
    <input type="range" id="img-radius" min="0" max="100" value="0">

    <label style="margin-top: 10px;">INTENSYWNOŚĆ CIENIA:</label>
    <input type="range" id="img-shadow" min="0" max="50" value="0">
    
    <label style="margin-top: 10px;">OBRAMOWANIE (PX):</label>
    <input type="number" id="img-border-width" value="0">
    
    <label style="margin-top: 5px;">KOLOR OBRAMOWANIA:</label>
    <input type="color" id="img-border-color" value="#000000">

    <label style="margin-top: 10px;">PRZEŹROCZYSTOŚĆ:</label>
    <input type="range" id="img-opacity" min="0" max="100" value="100">
</div>