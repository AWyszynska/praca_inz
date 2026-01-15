(function () {
  const $ = (id) => document.getElementById(id);

  function must(el, name) {
    if (!el) console.warn("[sg_images] Brak elementu:", name);
    return el;
  }

  function hasGlobals() {
    return (window.canvas && window.selectElement && window.refreshLayers);
  }

  const pointer = { x: 120, y: 120 };
  function updatePointer(e) {
    if (!window.canvas) return;
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  }
  document.addEventListener("mousemove", updatePointer, true);
  document.addEventListener("mousedown", updatePointer, true);

  function buildFilterFromDataset(el) {
    const blur = Number(el.dataset.imgBlur || 0);
    const gray = Number(el.dataset.imgGray || 0);
    const sep  = Number(el.dataset.imgSepia || 0);
    const bri  = Number(el.dataset.imgBrightness || 100);
    const con  = Number(el.dataset.imgContrast || 100);
    const sat  = Number(el.dataset.imgSaturate || 100);
    return `grayscale(${gray}%) sepia(${sep}%) blur(${blur}px) brightness(${bri}%) contrast(${con}%) saturate(${sat}%)`;
  }

  function applyImageSettings(el) {
    const img = el.querySelector("img");
    if (!img) return;

    img.style.width = "100%";
    img.style.height = "100%";
    img.style.display = "block";
    img.style.objectFit = el.dataset.imgFit || "cover";
    img.style.objectPosition = `${Number(el.dataset.imgPosX || 50)}% ${Number(el.dataset.imgPosY || 50)}%`;

    const rot = parseFloat(el.dataset.imgRotate || 0);
    const scale = parseFloat(el.dataset.imgScale || 1);
    const fx = (el.dataset.imgFlipX === "1") ? -1 : 1;
    const fy = (el.dataset.imgFlipY === "1") ? -1 : 1;

    img.style.transformOrigin = "center";
    img.style.transform = `rotate(${rot}deg) scale(${fx * scale}, ${fy * scale})`;

    img.style.filter = buildFilterFromDataset(el);
  }

  function ensureDefaultImageDataset(el) {
    if (!el.dataset.imgFit) el.dataset.imgFit = "cover";
    if (!el.dataset.imgPosX) el.dataset.imgPosX = "50";
    if (!el.dataset.imgPosY) el.dataset.imgPosY = "50";
    if (!el.dataset.imgRotate) el.dataset.imgRotate = "0";
    if (!el.dataset.imgScale) el.dataset.imgScale = "1";
    if (!el.dataset.imgFlipX) el.dataset.imgFlipX = "0";
    if (!el.dataset.imgFlipY) el.dataset.imgFlipY = "0";

    if (!el.dataset.imgBlur) el.dataset.imgBlur = "0";
    if (!el.dataset.imgGray) el.dataset.imgGray = "0";
    if (!el.dataset.imgSepia) el.dataset.imgSepia = "0";
    if (!el.dataset.imgBrightness) el.dataset.imgBrightness = "100";
    if (!el.dataset.imgContrast) el.dataset.imgContrast = "100";
    if (!el.dataset.imgSaturate) el.dataset.imgSaturate = "100";

    if (el.dataset.imgLockRatio === undefined) el.dataset.imgLockRatio = "1";
  }

  function setNaturalSizeMeta(el, meta) {
    if (!meta) return;
    if (meta.width) el.dataset.imgNaturalW = String(meta.width);
    if (meta.height) el.dataset.imgNaturalH = String(meta.height);
  }

  function getRatio(el) {
    const w = Number(el.dataset.imgNaturalW || 0);
    const h = Number(el.dataset.imgNaturalH || 0);
    if (!w || !h) return 0;
    return h / w;
  }

  function maybeKeepRatioOnWidthChange(el) {
    if (el.dataset.imgLockRatio !== "1") return;
    const ratio = getRatio(el);
    if (!ratio) return;
    const w = parseInt(el.style.width) || 300;
    el.style.height = Math.max(10, Math.round(w * ratio)) + "px";
  }

  function maybeKeepRatioOnHeightChange(el) {
    if (el.dataset.imgLockRatio !== "1") return;
    const ratio = getRatio(el);
    if (!ratio) return;
    const h = parseInt(el.style.height) || 200;
    el.style.width = Math.max(10, Math.round(h / ratio)) + "px";
  }

  async function uploadImage(file) {
    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch("upload_image.php", { method: "POST", body: fd });
    const data = await res.json().catch(() => null);

    if (!data || !data.ok) {
      throw new Error((data && data.error) ? data.error : "Upload error");
    }
    return data; 
  }

  function createImageElement(url, meta) {
    if (!hasGlobals()) {
      alert("Brakuje globali (canvas/selectElement/refreshLayers).");
      return;
    }

    const el = document.createElement("div");
    el.className = "canvas-element type-image";
    el.dataset.type = "image";
    el.dataset.id = "img_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
    el.dataset.layerName = "Zdjęcie";

    el.style.overflow = "hidden";
    el.style.borderRadius = "0px";
    el.style.boxShadow = "none";
    el.style.opacity = "1";
    el.style.border = "none";

    const baseW = 320;
    el.style.left = Math.max(0, Math.round(pointer.x - baseW / 2)) + "px";
    el.style.top = Math.max(0, Math.round(pointer.y - 110)) + "px";
    el.style.width = baseW + "px";

    if (meta && meta.width && meta.height) {
      const ratio = meta.height / meta.width;
      el.style.height = Math.max(80, Math.round(baseW * ratio)) + "px";
      setNaturalSizeMeta(el, meta);
    } else {
      el.style.height = "220px";
    }

    el.style.zIndex = String(++window.zCounter);

    ensureDefaultImageDataset(el);

    const img = document.createElement("img");
    img.src = url;
    img.draggable = false;

    img.onload = () => {
      if (!el.dataset.imgNaturalW || !el.dataset.imgNaturalH) {
        el.dataset.imgNaturalW = String(img.naturalWidth || "");
        el.dataset.imgNaturalH = String(img.naturalHeight || "");
      }
    };

    el.appendChild(img);
    applyImageSettings(el);

    (window.activeContainer || window.canvas).appendChild(el);

    if (typeof window.setupElementMovement === "function") window.setupElementMovement(el);
    if (typeof window.enableResizeHandles === "function") window.enableResizeHandles(el);

    el.onclick = (ev) => { ev.stopPropagation(); window.selectElement(el); };
    window.refreshLayers();

    return el;
  }

  window.syncImageInputs = function (el) {
    ensureDefaultImageDataset(el);

    if ($("img-width")) $("img-width").value = parseInt(el.style.width) || 320;
    if ($("img-height")) $("img-height").value = parseInt(el.style.height) || 220;

    if ($("img-radius")) $("img-radius").value = parseInt(el.style.borderRadius) || 0;

    if ($("img-opacity")) $("img-opacity").value = Math.round((parseFloat(el.style.opacity) || 1) * 100);

    if ($("img-fit")) $("img-fit").value = el.dataset.imgFit || "cover";
    if ($("img-pos-x")) $("img-pos-x").value = el.dataset.imgPosX || 50;
    if ($("img-pos-y")) $("img-pos-y").value = el.dataset.imgPosY || 50;

    if ($("img-rotate")) $("img-rotate").value = el.dataset.imgRotate || 0;
    if ($("img-scale")) $("img-scale").value = Math.round((parseFloat(el.dataset.imgScale || 1)) * 100);

    if ($("img-flip-x")) $("img-flip-x").checked = (el.dataset.imgFlipX === "1");
    if ($("img-flip-y")) $("img-flip-y").checked = (el.dataset.imgFlipY === "1");
    if ($("img-lock-ratio")) $("img-lock-ratio").checked = (el.dataset.imgLockRatio === "1");

    if ($("img-blur")) $("img-blur").value = el.dataset.imgBlur || 0;
    if ($("img-gray")) $("img-gray").value = el.dataset.imgGray || 0;
    if ($("img-sepia")) $("img-sepia").value = el.dataset.imgSepia || 0;
    if ($("img-bright")) $("img-bright").value = el.dataset.imgBrightness || 100;
    if ($("img-contrast")) $("img-contrast").value = el.dataset.imgContrast || 100;
    if ($("img-saturate")) $("img-saturate").value = el.dataset.imgSaturate || 100;

    applyImageSettings(el);
  };

  function bindImageControls() {
    if ($("img-width")) $("img-width").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.style.width = $("img-width").value + "px";
      maybeKeepRatioOnWidthChange(window.activeElement);
    };

    if ($("img-height")) $("img-height").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.style.height = $("img-height").value + "px";
      maybeKeepRatioOnHeightChange(window.activeElement);
    };

    if ($("img-radius")) $("img-radius").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.style.borderRadius = $("img-radius").value + "px";
    };

    if ($("img-opacity")) $("img-opacity").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.style.opacity = (Number($("img-opacity").value) / 100).toString();
    };

    if ($("img-shadow")) $("img-shadow").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      const v = Number($("img-shadow").value || 0);
      window.activeElement.style.boxShadow = (v === 0) ? "none" : `0 ${Math.round(v/2)}px ${v}px rgba(0,0,0,0.25)`;
    };

    if ($("img-border-width")) $("img-border-width").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      const w = Number($("img-border-width").value || 0);
      const col = $("img-border-color") ? $("img-border-color").value : "#000000";
      window.activeElement.style.border = (w === 0) ? "none" : `${w}px solid ${col}`;
    };

    if ($("img-border-color")) $("img-border-color").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      const w = $("img-border-width") ? Number($("img-border-width").value || 0) : 0;
      if (w === 0) return;
      window.activeElement.style.border = `${w}px solid ${$("img-border-color").value}`;
    };

    const reapply = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      applyImageSettings(window.activeElement);
    };

    if ($("img-fit")) $("img-fit").onchange = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.dataset.imgFit = $("img-fit").value;
      reapply();
    };

    if ($("img-pos-x")) $("img-pos-x").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.dataset.imgPosX = $("img-pos-x").value;
      reapply();
    };

    if ($("img-pos-y")) $("img-pos-y").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.dataset.imgPosY = $("img-pos-y").value;
      reapply();
    };

    if ($("img-rotate")) $("img-rotate").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.dataset.imgRotate = $("img-rotate").value;
      reapply();
    };

    if ($("img-scale")) $("img-scale").oninput = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.dataset.imgScale = (Number($("img-scale").value) / 100).toString();
      reapply();
    };

    if ($("img-flip-x")) $("img-flip-x").onchange = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.dataset.imgFlipX = $("img-flip-x").checked ? "1" : "0";
      reapply();
    };

    if ($("img-flip-y")) $("img-flip-y").onchange = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.dataset.imgFlipY = $("img-flip-y").checked ? "1" : "0";
      reapply();
    };

    if ($("img-lock-ratio")) $("img-lock-ratio").onchange = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      window.activeElement.dataset.imgLockRatio = $("img-lock-ratio").checked ? "1" : "0";
    };

    const bindFilter = (id, key) => {
      if (!$(id)) return;
      $(id).oninput = () => {
        if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
        window.activeElement.dataset[key] = $(id).value;
        reapply();
      };
    };
    bindFilter("img-blur", "imgBlur");
    bindFilter("img-gray", "imgGray");
    bindFilter("img-sepia", "imgSepia");
    bindFilter("img-bright", "imgBrightness");
    bindFilter("img-contrast", "imgContrast");
    bindFilter("img-saturate", "imgSaturate");

    if ($("img-reset-btn")) $("img-reset-btn").onclick = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      const el = window.activeElement;
      el.dataset.imgFit = "cover";
      el.dataset.imgPosX = "50";
      el.dataset.imgPosY = "50";
      el.dataset.imgRotate = "0";
      el.dataset.imgScale = "1";
      el.dataset.imgFlipX = "0";
      el.dataset.imgFlipY = "0";
      el.dataset.imgBlur = "0";
      el.dataset.imgGray = "0";
      el.dataset.imgSepia = "0";
      el.dataset.imgBrightness = "100";
      el.dataset.imgContrast = "100";
      el.dataset.imgSaturate = "100";
      window.syncImageInputs(el);
    };
    if ($("img-replace-btn")) $("img-replace-btn").onclick = () => {
      if (!window.activeElement || window.activeElement.dataset.type !== "image") return;
      const input = $("image-upload-input");
      if (!input) return;
      input.value = "";
      input.click();
      window.__sgReplaceMode = true;
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = $("add-image-btn");
    const input = $("image-upload-input");

    must(btn, "add-image-btn");
    must(input, "image-upload-input");

    if (btn && input) {
      btn.onclick = () => { input.value = ""; window.__sgReplaceMode = false; input.click(); };

      input.onchange = async () => {
        if (!input.files || !input.files[0]) return;

        try {
          const res = await uploadImage(input.files[0]); 
          const url = res.url;

          if (window.__sgReplaceMode && window.activeElement && window.activeElement.dataset.type === "image") {
            const img = window.activeElement.querySelector("img");
            if (img) img.src = url;
            setNaturalSizeMeta(window.activeElement, res.meta);
            applyImageSettings(window.activeElement);
            window.syncImageInputs(window.activeElement);
          } else {
            createImageElement(url, res.meta);
          }

        } catch (err) {
          alert("Błąd uploadu: " + (err && err.message ? err.message : err));
        }
      };
    }

    bindImageControls();
  });
  window.applyImageSettings = applyImageSettings;
  window.createImageElement = createImageElement;
    window.updateImageVisuals = function updateImageVisuals(el) {
    if (!el) return;
    ensureDefaultImageDataset(el);
    applyImageSettings(el);
  };

})();
