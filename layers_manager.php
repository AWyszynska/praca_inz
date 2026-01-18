<aside id="layers-panel" style="position: absolute; top: 20px; left: 20px; width: 260px; background: white; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; display: flex; flex-direction: column;">
    <div class="panel-header" id="layers-drag-handle" style="background: #334155; color: white; padding: 10px 15px; cursor: move; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: bold;">
         Warstwy i Struktura
    </div>
    <div style="padding: 8px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        Dodaj do: <b id="current-target-display" style="color: #2bb021;">Główny ekran</b>
        <button onclick="resetToCanvas()" style="float:right; border:none; background:#cbd5e1; border-radius:3px; cursor:pointer; padding:1px 5px;">Reset</button>
    </div>
    <div class="panel-content" style="padding: 10px; max-height: 60vh; overflow-y: auto;">
        <div id="layers-empty-msg" style="font-size: 11px; color: #94a3b8; text-align: center; padding: 10px;">Brak elementów</div>
        <ul id="layers-list" style="list-style: none; padding: 0; margin: 0;"></ul>
    </div>
    <div style="padding: 8px; border-top: 1px solid #f1f5f9; background: #f8fafc; border-radius: 0 0 8px 8px;">
        <button id="delete-element-btn" class="btn" style="background: #ef4444; color: white; font-size: 11px; margin: 0; display: none;">🗑 USUŃ WYBRANE</button>
    </div>
</aside>

<style>
    .layer-item { display: flex; flex-direction: column; padding: 6px; margin-bottom: 4px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; }
    .layer-item.active { border-color: #156fe5; background: #eff6ff; }
    .layer-item.is-target { 
        border: 2px solid #2bb021 !important; 
        background: #f0fdf4 !important; 
        box-shadow: inset 0 0 8px rgba(43, 176, 33, 0.2);
    }
    .layer-top-row { display: flex; align-items: center; justify-content: space-between; width: 100%; font-size: 12px; }
    
    .layer-color-preview {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid #cbd5e1;
    margin-right: 8px;
    display: inline-block;
    flex-shrink: 0;
}
.layer-btn-target {
        margin-top: 5px;
        background: #334155; 
        color: white;
        border: none;
        border-radius: 3px;
        padding: 6px;
        font-size: 10px;
        cursor: pointer;
    }
    .layer-item.is-target .layer-btn-target {
        background: #156fe5; 
        content: "ZAMKNIJ WARSTWĘ";
    }
    .layer-controls { display:flex; gap:6px; align-items:center; }

.layer-btn{
  width:22px; height:22px;
  border:none; border-radius:6px;
  background:#2563eb; color:#fff;
  cursor:pointer; font-size:12px; line-height:1;
  display:inline-flex; align-items:center; justify-content:center;
}
.layer-btn:hover{ background:#1d4ed8; }

.layer-btn-edit{ background:#0ea5e9; }
.layer-btn-edit:hover{ background:#0284c7; }

</style>