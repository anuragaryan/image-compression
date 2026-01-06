// src/ImageComparisonSlider.ts
class ImageComparisonSlider {
  container;
  beforeImage;
  afterImage;
  afterWrapper;
  handle;
  isDragging = false;
  currentPosition = 50;
  constructor(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.beforeImage = document.createElement("img");
    this.afterImage = document.createElement("img");
    this.afterWrapper = document.createElement("div");
    this.handle = document.createElement("div");
    this.setupStructure();
    this.attachEventListeners();
  }
  setupStructure() {
    this.container.className = "comparison-slider";
    this.container.innerHTML = "";
    const comparisonContainer = document.createElement("div");
    comparisonContainer.className = "comparison-container";
    this.beforeImage.className = "image-before";
    this.beforeImage.alt = "Compressed Image";
    this.afterWrapper.className = "image-after-wrapper";
    this.afterImage.className = "image-after";
    this.afterImage.alt = "Original Image";
    this.afterWrapper.appendChild(this.afterImage);
    this.handle.className = "slider-handle";
    this.handle.innerHTML = `
            <div class="handle-line"></div>
            <div class="handle-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 19l7-7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;
    comparisonContainer.appendChild(this.beforeImage);
    comparisonContainer.appendChild(this.afterWrapper);
    comparisonContainer.appendChild(this.handle);
    this.container.appendChild(comparisonContainer);
    this.updateSliderPosition(this.currentPosition);
  }
  attachEventListeners() {
    this.handle.addEventListener("mousedown", this.onDragStart.bind(this));
    document.addEventListener("mousemove", this.onDragMove.bind(this));
    document.addEventListener("mouseup", this.onDragEnd.bind(this));
    this.handle.addEventListener("touchstart", this.onDragStart.bind(this), { passive: false });
    document.addEventListener("touchmove", this.onDragMove.bind(this), { passive: false });
    document.addEventListener("touchend", this.onDragEnd.bind(this));
    this.container.addEventListener("click", this.onContainerClick.bind(this));
  }
  onDragStart(e) {
    e.preventDefault();
    this.isDragging = true;
    this.handle.classList.add("dragging");
  }
  onDragMove(e) {
    if (!this.isDragging)
      return;
    e.preventDefault();
    const position = this.calculatePosition(e);
    this.updateSliderPosition(position);
  }
  onDragEnd() {
    if (!this.isDragging)
      return;
    this.isDragging = false;
    this.handle.classList.remove("dragging");
  }
  onContainerClick(e) {
    if (e.target === this.handle || this.handle.contains(e.target)) {
      return;
    }
    const position = this.calculatePosition(e);
    this.updateSliderPosition(position);
  }
  calculatePosition(e) {
    const containerRect = this.container.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - containerRect.left;
    const percentage = x / containerRect.width * 100;
    return Math.max(0, Math.min(100, percentage));
  }
  updateSliderPosition(percentage) {
    this.currentPosition = percentage;
    this.handle.style.left = `${percentage}%`;
    const clipPercentage = 100 - percentage;
    this.afterWrapper.style.clipPath = `inset(0 ${clipPercentage}% 0 0)`;
  }
  loadImages(beforeSrc, afterSrc, beforeSize, afterSize) {
    this.beforeImage.src = beforeSrc;
    this.afterImage.src = afterSrc;
    this.addImageLabels(beforeSize, afterSize);
  }
  addImageLabels(beforeSize, afterSize) {
    const existingLabels = this.container.querySelectorAll(".image-label");
    existingLabels.forEach((label) => label.remove());
    const beforeLabel = document.createElement("div");
    beforeLabel.className = "image-label image-label-before";
    beforeLabel.innerHTML = `
            <span class="label-title">Original</span>
            <span class="label-size">${this.formatBytes(afterSize)}</span>
        `;
    const afterLabel = document.createElement("div");
    afterLabel.className = "image-label image-label-after";
    afterLabel.innerHTML = `
            <span class="label-title">Compressed</span>
            <span class="label-size">${this.formatBytes(beforeSize)}</span>
        `;
    const comparisonContainer = this.container.querySelector(".comparison-container");
    if (comparisonContainer) {
      comparisonContainer.appendChild(beforeLabel);
      comparisonContainer.appendChild(afterLabel);
    }
  }
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
      return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
  }
  getCompressionStats(originalSize, compressedSize) {
    const ratio = (originalSize / compressedSize).toFixed(1);
    const saved = this.formatBytes(originalSize - compressedSize);
    const percentage = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    return `${ratio}x compression • ${percentage}% smaller • ${saved} saved`;
  }
  destroy() {
    this.handle.removeEventListener("mousedown", this.onDragStart.bind(this));
    this.handle.removeEventListener("touchstart", this.onDragStart.bind(this));
    document.removeEventListener("mousemove", this.onDragMove.bind(this));
    document.removeEventListener("touchmove", this.onDragMove.bind(this));
    document.removeEventListener("mouseup", this.onDragEnd.bind(this));
    document.removeEventListener("touchend", this.onDragEnd.bind(this));
    this.container.removeEventListener("click", this.onContainerClick.bind(this));
    this.container.innerHTML = "";
  }
}

// src/script.ts
if (!("WebAssembly" in window)) {
  alert("Your browser doesn't support WebAssembly. Please use a modern browser.");
}
var originalImage = null;
var wasmReady = false;
var comparisonSlider = null;
var uploadArea = document.getElementById("upload-area");
var fileInput = document.getElementById("file-input");
var controls = document.getElementById("controls");
var qualityControl = document.getElementById("quality-control");
var qualitySlider = document.getElementById("quality");
var qualityValue = document.getElementById("quality-value");
var resizeSlider = document.getElementById("resize");
var resizeValue = document.getElementById("resize-value");
var algorithmSelect = document.getElementById("algorithm");
var compressBtn = document.getElementById("compress-btn");
var imagePreview = document.getElementById("image-preview");
var loading = document.getElementById("loading");
var statusElement = document.getElementById("status");
async function initWasm() {
  try {
    statusElement.textContent = "Loading WebAssembly module...";
    const go = new window.Go;
    const result = await WebAssembly.instantiateStreaming(fetch("image_compressor.wasm"), go.importObject);
    go.run(result.instance);
    wasmReady = true;
    statusElement.textContent = "WebAssembly module loaded successfully!";
  } catch (err) {
    console.error("Failed to load WASM:", err);
    statusElement.textContent = "Failed to load WebAssembly module. Check console for details.";
  }
}
function handleFileSelect(file) {
  if (!file || !file.type.match("image.*")) {
    alert("Please select a valid image file.");
    return;
  }
  originalImage = file;
  controls.style.display = "flex";
  const isJPEG = file.type === "image/jpeg" || file.type === "image/jpg";
  qualityControl.style.display = isJPEG ? "flex" : "none";
  if (comparisonSlider) {
    comparisonSlider.destroy();
    comparisonSlider = null;
  }
  const reader = new FileReader;
  reader.onload = function(e) {
    if (!e.target?.result)
      return;
    const formatInfo = isJPEG ? "JPEG (lossy)" : "PNG (lossless)";
    imagePreview.innerHTML = `
            <div class="preview-item">
                <h3>Original Image</h3>
                <img src="${e.target.result}" alt="Original Image">
                <div class="info">
                    <p>Format: ${formatInfo}</p>
                    <p>Size: ${formatBytes(file.size)}</p>
                </div>
            </div>
        `;
  };
  reader.readAsDataURL(file);
}
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0)
    return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}
async function compressImage() {
  if (!originalImage || !wasmReady) {
    alert("Please select an image and wait for WebAssembly to load.");
    return;
  }
  loading.style.display = "block";
  compressBtn.disabled = true;
  try {
    const quality = parseInt(qualitySlider.value, 10);
    const resize = parseInt(resizeSlider.value, 10);
    const algorithm = algorithmSelect.value;
    const fileArrayBuffer = await originalImage.arrayBuffer();
    const uint8Array = new Uint8Array(fileArrayBuffer);
    const result = window.compressImageWASM(uint8Array, quality, resize, algorithm);
    const arrayBuffer = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
    const blob = new Blob([arrayBuffer], { type: originalImage.type });
    const compressedUrl = URL.createObjectURL(blob);
    const originalReader = new FileReader;
    originalReader.onload = function(e) {
      if (!e.target?.result)
        return;
      imagePreview.innerHTML = "";
      const sliderContainer = document.createElement("div");
      sliderContainer.id = "comparison-slider-container";
      imagePreview.appendChild(sliderContainer);
      comparisonSlider = new ImageComparisonSlider("comparison-slider-container");
      comparisonSlider.loadImages(compressedUrl, e.target.result, blob.size, originalImage.size);
      const statsContainer = document.createElement("div");
      statsContainer.className = "stats-container";
      statsContainer.innerHTML = `
                <div class="compression-stats">
                    <p>${comparisonSlider.getCompressionStats(originalImage.size, blob.size)}</p>
                </div>
                <button class="download-btn" id="download-btn">Download Compressed Image</button>
            `;
      imagePreview.appendChild(statsContainer);
      const downloadBtn = document.getElementById("download-btn");
      downloadBtn.addEventListener("click", () => downloadImage(compressedUrl));
    };
    originalReader.readAsDataURL(originalImage);
    statusElement.textContent = "Image compressed successfully!";
  } catch (err) {
    console.error("Compression failed:", err);
    statusElement.textContent = "Compression failed. Check console for details.";
  } finally {
    loading.style.display = "none";
    compressBtn.disabled = false;
  }
}
function downloadImage(url) {
  if (!originalImage)
    return;
  const a = document.createElement("a");
  const fileName = originalImage.name.replace(/\.[^/.]+$/, "") + "_compressed." + originalImage.name.split(".").pop();
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
window.addEventListener("load", initWasm);
uploadArea.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const target = e.target;
  if (target.files && target.files.length > 0) {
    handleFileSelect(target.files[0]);
  }
});
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "#007bff";
});
uploadArea.addEventListener("dragleave", () => {
  uploadArea.style.borderColor = "#ccc";
});
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "#ccc";
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    handleFileSelect(e.dataTransfer.files[0]);
  }
});
qualitySlider.addEventListener("input", () => {
  qualityValue.textContent = `${qualitySlider.value}%`;
});
resizeSlider.addEventListener("input", () => {
  resizeValue.textContent = `${resizeSlider.value}%`;
});
compressBtn.addEventListener("click", compressImage);
