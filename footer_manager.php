
<div id="footer-edit-section" style="display:none;">
  <label>Stopka: pozycja (dock)</label>
  <select id="footer-dock">
    <option value="bottom">Dół</option>
    <option value="top">Góra</option>
  </select>

  <label>Odstęp od krawędzi (px)</label>
  <input type="number" id="footer-offset" value="0" min="0">

  <label>Odstęp od lewej (px)</label>
  <input type="number" id="footer-left" value="0" min="0">

  <div style="margin-top:8px; font-size:12px; color:#64748b; line-height:1.3;">
    Stopka jest przypięta do okna (position: fixed). Zmiany zapisują się do XML jako:
    <b>isFooter, footerDock, footerBottom, footerLeft</b>.
  </div>
</div>
