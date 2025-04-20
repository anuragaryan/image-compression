// Check for WASM support
if (!('WebAssembly' in window)) {
    alert('Your browser doesn\'t support WebAssembly. Please use a modern browser.');
}

// Global variables
let originalImage = null;
let wasmReady = false;
let compressModule = null;

// DOM elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const controls = document.getElementById('controls');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const resizeSlider = document.getElementById('resize');
const resizeValue = document.getElementById('resize-value');
const compressBtn = document.getElementById('compress-btn');
const imagePreview = document.getElementById('image-preview');
const loading = document.getElementById('loading');
const statusElement = document.getElementById('status');

// Initialize WebAssembly module
async function initWasm() {
    try {
        statusElement.textContent = "Loading WebAssembly module...";
        
        const go = new Go();
        const result = await WebAssembly.instantiateStreaming(
            fetch('image_compressor.wasm'), 
            go.importObject
        );
        
        go.run(result.instance);
        wasmReady = true;
        
        statusElement.textContent = "WebAssembly module loaded successfully!";
    } catch (err) {
        console.error('Failed to load WASM:', err);
        statusElement.textContent = "Failed to load WebAssembly module. Check console for details.";
    }
}

// Handle file uploads
function handleFileSelect(file) {
    if (!file || !file.type.match('image.*')) {
        alert('Please select a valid image file.');
        return;
    }

    originalImage = file;
    controls.style.display = 'flex';
    
    // Display original image
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.innerHTML = `
            <div class="preview-item">
                <h3>Original Image</h3>
                <img src="${e.target.result}" alt="Original Image">
                <div class="info">
                    <p>Size: ${formatBytes(file.size)}</p>
                </div>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Compress the image using WASM
async function compressImage() {
    if (!originalImage || !wasmReady) {
        alert('Please select an image and wait for WebAssembly to load.');
        return;
    }

    loading.style.display = 'block';
    compressBtn.disabled = true;

    try {
        const quality = parseInt(qualitySlider.value, 10);
        const resize = parseInt(resizeSlider.value, 10);
        
        // Read file as array buffer
        const fileArrayBuffer = await originalImage.arrayBuffer();
        const uint8Array = new Uint8Array(fileArrayBuffer);
        
        // Call our WASM function
        const result = compressImageWASM(uint8Array, quality, resize);
        
        // Create a blob from the compressed data
        const blob = new Blob([result], { type: originalImage.type });
        const compressedUrl = URL.createObjectURL(blob);
        
        // Display comparison
        const compressedPreview = document.createElement('div');
        compressedPreview.className = 'preview-item';
        compressedPreview.innerHTML = `
            <h3>Compressed Image</h3>
            <img src="${compressedUrl}" alt="Compressed Image">
            <div class="info">
                <p>Size: ${formatBytes(blob.size)}</p>
                <p>Compression ratio: ${Math.round(originalImage.size / blob.size * 10) / 10}x</p>
                <p>Saved: ${formatBytes(originalImage.size - blob.size)}</p>
            </div>
            <button class="download-btn" onclick="downloadImage('${compressedUrl}')">Download</button>
        `;
        
        if (imagePreview.children.length > 1) {
            imagePreview.replaceChild(compressedPreview, imagePreview.children[1]);
        } else {
            imagePreview.appendChild(compressedPreview);
        }
        
        statusElement.textContent = "Image compressed successfully!";
    } catch (err) {
        console.error('Compression failed:', err);
        statusElement.textContent = "Compression failed. Check console for details.";
    } finally {
        loading.style.display = 'none';
        compressBtn.disabled = false;
    }
}

// Download the compressed image
function downloadImage(url) {
    const a = document.createElement('a');
    const fileName = originalImage.name.replace(/\.[^/.]+$/, '') + '_compressed.' + 
                     originalImage.name.split('.').pop();
    
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Event listeners
window.addEventListener('load', initWasm);

uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#007bff';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#ccc';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#ccc';
    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = `${qualitySlider.value}%`;
});

resizeSlider.addEventListener('input', () => {
    resizeValue.textContent = `${resizeSlider.value}%`;
});

compressBtn.addEventListener('click', compressImage);

// This function will be defined by our WASM module
function compressImageWASM(data, quality, resize) {
    // This is just a placeholder - the actual implementation comes from WASM
    console.error("WASM function not loaded yet");
    throw new Error("WASM module not loaded");
} 