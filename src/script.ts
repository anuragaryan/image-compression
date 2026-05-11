import { ImageComparisonSlider } from './ImageComparisonSlider.js';

// Extend the Window interface to include Go WASM types
declare global {
    interface Window {
        Go: any;
        compressImageWASM: (data: Uint8Array, quality: number, resize: number, algorithm: string) => Uint8Array;
    }
}

// Check for WASM support
if (!('WebAssembly' in window)) {
    alert('Your browser doesn\'t support WebAssembly. Please use a modern browser.');
}

// Global variables
let originalImage: File | null = null;
let wasmReady: boolean = false;
let comparisonSlider: ImageComparisonSlider | null = null;

// DOM elements
const uploadArea = document.getElementById('upload-area') as HTMLElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const controls = document.getElementById('controls') as HTMLElement;
const qualityControl = document.getElementById('quality-control') as HTMLElement;
const qualitySlider = document.getElementById('quality') as HTMLInputElement;
const qualityValue = document.getElementById('quality-value') as HTMLElement;
const resizeSlider = document.getElementById('resize') as HTMLInputElement;
const resizeValue = document.getElementById('resize-value') as HTMLElement;
const algorithmSelect = document.getElementById('algorithm') as HTMLSelectElement;
const compressBtn = document.getElementById('compress-btn') as HTMLButtonElement;
const imagePreview = document.getElementById('image-preview') as HTMLElement;
const loading = document.getElementById('loading') as HTMLElement;
const statusElement = document.getElementById('status') as HTMLElement;
const comparisonInfo = document.getElementById('comparison-info') as HTMLElement;
const uploadStatus = document.getElementById('upload-status') as HTMLElement;

function updateCompressButtonState(): void {
    compressBtn.disabled = !originalImage || !wasmReady;
}

function updateUploadStatus(): void {
    uploadStatus.textContent = wasmReady ? '' : 'Loading engine...';
    uploadStatus.style.display = wasmReady ? 'none' : 'inline-flex';
}

/**
 * Initialize WebAssembly module
 */
async function initWasm(): Promise<void> {
    try {
        statusElement.textContent = 'Loading compression engine...';
        updateCompressButtonState();
        updateUploadStatus();
        const wasmUrl = new URL('../image_compressor.wasm', import.meta.url);
        
        const go = new window.Go();
        const result = await WebAssembly.instantiateStreaming(
            fetch(wasmUrl), 
            go.importObject
        );
        
        go.run(result.instance);
        wasmReady = true;

        statusElement.textContent = '';
        updateCompressButtonState();
        updateUploadStatus();
    } catch (err) {
        console.error('Failed to load WASM:', err);
        statusElement.textContent = "Could not load the compression engine. Check the console for details.";
        updateCompressButtonState();
        updateUploadStatus();
    }
}

/**
 * Handle file selection
 */
function handleFileSelect(file: File): void {
    if (!file || !file.type.match('image.*')) {
        alert('Please select a valid image file.');
        return;
    }

    originalImage = file;
    controls.style.display = '';
    uploadArea.classList.remove('is-dragover');
    updateCompressButtonState();
    
    // Show/hide quality slider based on image type
    // PNG is lossless, so quality slider doesn't affect file size
    // Only show quality slider for JPEG images
    const isJPEG = file.type === 'image/jpeg' || file.type === 'image/jpg';
    qualityControl.style.display = isJPEG ? 'flex' : 'none';
    
    // Clear any existing comparison slider
    if (comparisonSlider) {
        comparisonSlider.destroy();
        comparisonSlider = null;
    }

    comparisonInfo.style.display = 'none';
    
    // Display original image preview
    const reader = new FileReader();
    reader.onload = function(e: ProgressEvent<FileReader>) {
        if (!e.target?.result) return;
        
        const formatInfo = isJPEG ? 'JPEG (lossy)' : 'PNG (lossless)';
        imagePreview.innerHTML = `
            <div class="preview-item">
                <h3>Selected image</h3>
                <img src="${e.target.result}" alt="Selected image preview">
                <div class="info">
                    <p>Format: ${formatInfo}</p>
                    <p>Size: ${formatBytes(file.size)}</p>
                </div>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Compress the image using WASM
 */
async function compressImage(): Promise<void> {
    if (!originalImage || !wasmReady) {
        alert('Please select an image and wait for WebAssembly to load.');
        return;
    }

    loading.style.display = 'block';
    compressBtn.disabled = true;

    try {
        const quality = parseInt(qualitySlider.value, 10);
        const resize = parseInt(resizeSlider.value, 10);
        const algorithm = algorithmSelect.value;
        
        // Read file as array buffer
        const fileArrayBuffer = await originalImage.arrayBuffer();
        const uint8Array = new Uint8Array(fileArrayBuffer);
        
        // Call our WASM function
        const result = window.compressImageWASM(uint8Array, quality, resize, algorithm);
        
        // Create a blob from the compressed data
        // Convert Uint8Array to ArrayBuffer for Blob compatibility
        const arrayBuffer = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: originalImage.type });
        const compressedUrl = URL.createObjectURL(blob);
        
        // Read original image as data URL for comparison
        const originalReader = new FileReader();
        originalReader.onload = function(e: ProgressEvent<FileReader>) {
            if (!e.target?.result) return;
            
            // Clear previous preview
            imagePreview.innerHTML = '';
            
            // Create comparison slider container
            const sliderContainer = document.createElement('div');
            sliderContainer.id = 'comparison-slider-container';
            imagePreview.appendChild(sliderContainer);
            
            // Initialize comparison slider
            comparisonSlider = new ImageComparisonSlider('comparison-slider-container');
            comparisonSlider.loadImages(
                compressedUrl,             // before (compressed) - LEFT SIDE
                e.target.result as string, // after (original) - RIGHT SIDE
                blob.size,                 // before size (compressed)
                originalImage!.size        // after size (original)
            );
            
            // Add stats and download button below slider
            const statsContainer = document.createElement('div');
            statsContainer.className = 'stats-container';
            statsContainer.innerHTML = `
                <div class="compression-stats">
                    <p>${comparisonSlider.getCompressionStats(originalImage!.size, blob.size)}</p>
                </div>
                <button class="download-btn" id="download-btn">Download Compressed Image</button>
            `;
            imagePreview.appendChild(statsContainer);
            comparisonInfo.style.display = 'block';
            
            // Add download functionality
            const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
            downloadBtn.addEventListener('click', () => downloadImage(compressedUrl));
        };
        originalReader.readAsDataURL(originalImage);
        
        statusElement.textContent = '';
    } catch (err) {
        console.error('Compression failed:', err);
        statusElement.textContent = "Compression failed. Check the console for details.";
    } finally {
        loading.style.display = 'none';
        updateCompressButtonState();
    }
}

/**
 * Download the compressed image
 */
function downloadImage(url: string): void {
    if (!originalImage) return;
    
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

fileInput.addEventListener('change', (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        handleFileSelect(target.files[0]);
    }
});

uploadArea.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
    uploadArea.classList.add('is-dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('is-dragover');
});

uploadArea.addEventListener('drop', (e: DragEvent) => {
    e.preventDefault();
    uploadArea.classList.remove('is-dragover');
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
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
