/**
 * ImageComparisonSlider - A before/after image comparison slider with curtain effect
 * Supports mouse and touch interactions for dragging the divider
 */
export class ImageComparisonSlider {
    private container: HTMLElement;
    private beforeImage: HTMLImageElement;
    private afterImage: HTMLImageElement;
    private afterWrapper: HTMLElement;
    private handle: HTMLElement;
    private isDragging: boolean = false;
    private currentPosition: number = 50; // Percentage (0-100)

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }
        this.container = container;
        
        // Initialize elements
        this.beforeImage = document.createElement('img');
        this.afterImage = document.createElement('img');
        this.afterWrapper = document.createElement('div');
        this.handle = document.createElement('div');
        
        this.setupStructure();
        this.attachEventListeners();
    }

    /**
     * Set up the HTML structure for the comparison slider
     */
    private setupStructure(): void {
        this.container.className = 'comparison-slider';
        this.container.innerHTML = '';

        // Create comparison container
        const comparisonContainer = document.createElement('div');
        comparisonContainer.className = 'comparison-container';

        // Setup before image (background layer - Compressed)
        this.beforeImage.className = 'image-before';
        this.beforeImage.alt = 'Compressed Image';
        
        // Setup after image wrapper (overlay layer with clip-path - Original)
        this.afterWrapper.className = 'image-after-wrapper';
        this.afterImage.className = 'image-after';
        this.afterImage.alt = 'Original Image';
        this.afterWrapper.appendChild(this.afterImage);

        // Setup slider handle
        this.handle.className = 'slider-handle';
        this.handle.innerHTML = `
            <div class="handle-line"></div>
            <div class="handle-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 19l7-7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;

        // Assemble the structure
        comparisonContainer.appendChild(this.beforeImage);
        comparisonContainer.appendChild(this.afterWrapper);
        comparisonContainer.appendChild(this.handle);
        this.container.appendChild(comparisonContainer);

        // Set initial position
        this.updateSliderPosition(this.currentPosition);
    }

    /**
     * Attach mouse and touch event listeners
     */
    private attachEventListeners(): void {
        // Mouse events
        this.handle.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));

        // Touch events
        this.handle.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onDragEnd.bind(this));

        // Click on container to move slider
        this.container.addEventListener('click', this.onContainerClick.bind(this));
    }

    /**
     * Handle drag start (mouse down or touch start)
     */
    private onDragStart(e: MouseEvent | TouchEvent): void {
        e.preventDefault();
        this.isDragging = true;
        this.handle.classList.add('dragging');
    }

    /**
     * Handle drag move (mouse move or touch move)
     */
    private onDragMove(e: MouseEvent | TouchEvent): void {
        if (!this.isDragging) return;
        
        e.preventDefault();
        const position = this.calculatePosition(e);
        this.updateSliderPosition(position);
    }

    /**
     * Handle drag end (mouse up or touch end)
     */
    private onDragEnd(): void {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.handle.classList.remove('dragging');
    }

    /**
     * Handle click on container to move slider to that position
     */
    private onContainerClick(e: MouseEvent): void {
        // Don't handle if clicking on the handle itself
        if (e.target === this.handle || this.handle.contains(e.target as Node)) {
            return;
        }
        
        const position = this.calculatePosition(e);
        this.updateSliderPosition(position);
    }

    /**
     * Calculate slider position from mouse/touch event
     */
    private calculatePosition(e: MouseEvent | TouchEvent): number {
        const containerRect = this.container.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        
        // Calculate position relative to container
        const x = clientX - containerRect.left;
        const percentage = (x / containerRect.width) * 100;
        
        // Clamp between 0 and 100
        return Math.max(0, Math.min(100, percentage));
    }

    /**
     * Update the slider position and apply visual changes
     */
    private updateSliderPosition(percentage: number): void {
        this.currentPosition = percentage;
        
        // Update handle position
        this.handle.style.left = `${percentage}%`;
        
        // Update clip-path to reveal the after image
        // clip-path: inset(top right bottom left)
        // We want to clip from the right side based on position
        const clipPercentage = 100 - percentage;
        this.afterWrapper.style.clipPath = `inset(0 ${clipPercentage}% 0 0)`;
    }

    /**
     * Load images into the slider
     */
    public loadImages(beforeSrc: string, afterSrc: string, beforeSize: number, afterSize: number): void {
        this.beforeImage.src = beforeSrc;
        this.afterImage.src = afterSrc;

        // Add labels and info
        this.addImageLabels(beforeSize, afterSize);
    }

    /**
     * Add labels showing which image is which and their sizes
     */
    private addImageLabels(beforeSize: number, afterSize: number): void {
        // Remove existing labels if any
        const existingLabels = this.container.querySelectorAll('.image-label');
        existingLabels.forEach(label => label.remove());

        // Create labels
        // Before image (original) is on the left
        const beforeLabel = document.createElement('div');
        beforeLabel.className = 'image-label image-label-before';
        beforeLabel.innerHTML = `
            <span class="label-title">Original</span>
            <span class="label-size">${this.formatBytes(afterSize)}</span>
        `;

        // After image (compressed) is on the right
        const afterLabel = document.createElement('div');
        afterLabel.className = 'image-label image-label-after';
        afterLabel.innerHTML = `
            <span class="label-title">Compressed</span>
            <span class="label-size">${this.formatBytes(beforeSize)}</span>
        `;

        const comparisonContainer = this.container.querySelector('.comparison-container');
        if (comparisonContainer) {
            comparisonContainer.appendChild(beforeLabel);
            comparisonContainer.appendChild(afterLabel);
        }
    }

    /**
     * Format bytes to human-readable format
     */
    private formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    /**
     * Get compression statistics
     */
    public getCompressionStats(originalSize: number, compressedSize: number): string {
        const ratio = (originalSize / compressedSize).toFixed(1);
        const saved = this.formatBytes(originalSize - compressedSize);
        const percentage = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        return `${ratio}x compression • ${percentage}% smaller • ${saved} saved`;
    }

    /**
     * Destroy the slider and clean up event listeners
     */
    public destroy(): void {
        this.handle.removeEventListener('mousedown', this.onDragStart.bind(this));
        this.handle.removeEventListener('touchstart', this.onDragStart.bind(this));
        document.removeEventListener('mousemove', this.onDragMove.bind(this));
        document.removeEventListener('touchmove', this.onDragMove.bind(this));
        document.removeEventListener('mouseup', this.onDragEnd.bind(this));
        document.removeEventListener('touchend', this.onDragEnd.bind(this));
        this.container.removeEventListener('click', this.onContainerClick.bind(this));
        
        this.container.innerHTML = '';
    }
}