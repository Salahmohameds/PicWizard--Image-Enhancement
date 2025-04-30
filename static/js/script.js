// Global variables
let originalImage = null;
let currentImage = null;
let canvas = null;
let ctx = null;
let isDragging = false;
let sliderPosition = 50;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    canvas = document.getElementById('image-canvas');
    ctx = canvas.getContext('2d');
    
    // Setup upload functionality
    setupUploadHandler();
    
    // Setup enhancement buttons
    setupEnhancementButtons();
    
    // Setup sliders
    setupSliders();
    
    // Setup comparison slider
    setupComparisonSlider();
    
    // Setup download button
    document.getElementById('download-btn').addEventListener('click', downloadImage);
    
    // Setup reset button
    document.getElementById('reset-btn').addEventListener('click', resetImage);
});

// File Upload Handling
function setupUploadHandler() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    
    // Click on the upload area to trigger file input
    uploadArea.addEventListener('click', function(e) {
        if (e.target === uploadArea || e.target.closest('#upload-prompt')) {
            fileInput.click();
        }
    });
    
    // Browse button click
    browseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            processUploadedFile(this.files[0]);
        }
    });
    
    // Handle drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processUploadedFile(e.dataTransfer.files[0]);
        }
    });
}

// Process uploaded file
function processUploadedFile(file) {
    // Validate file type
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('Please upload a valid JPG or PNG image.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Show editor
            document.getElementById('editor-container').style.display = 'flex';
            
            // Update upload area
            const uploadArea = document.getElementById('upload-area');
            uploadArea.classList.add('has-image');
            document.getElementById('upload-prompt').innerHTML = `
                <i class="bi bi-check-circle-fill text-success fs-1"></i>
                <h5 class="mt-3">Image uploaded successfully</h5>
                <p class="small">Drag & drop or click to upload a different image</p>
            `;
            
            // Configure canvas
            setupCanvas(img);
            
            // Store original image
            originalImage = img;
            currentImage = img;
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Configure canvas with loaded image
function setupCanvas(img) {
    // Calculate aspect ratio
    const aspectRatio = img.width / img.height;
    
    // Set canvas dimensions based on image
    if (img.width > img.height) {
        // Landscape orientation
        canvas.width = Math.min(img.width, 1200);
        canvas.height = canvas.width / aspectRatio;
    } else {
        // Portrait or square orientation
        canvas.height = Math.min(img.height, 800);
        canvas.width = canvas.height * aspectRatio;
    }
    
    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Update comparison slider container size
    updateComparisonSlider();
}

// Enhancement Buttons Setup
function setupEnhancementButtons() {
    // Histogram Equalization
    document.getElementById('histogram-eq-btn').addEventListener('click', function() {
        applyEnhancement('histogram_equalization');
    });
    
    // Gamma Correction
    document.getElementById('gamma-btn').addEventListener('click', function() {
        const gamma = parseFloat(document.getElementById('gamma-slider').value);
        applyEnhancement('gamma_correction', { gamma });
    });
    
    // Unsharp Mask
    document.getElementById('unsharp-mask-btn').addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('unsharp-amount-slider').value);
        const radius = parseInt(document.getElementById('unsharp-radius-slider').value);
        applyEnhancement('unsharp_mask', { amount, radius });
    });
    
    // Gaussian Blur
    document.getElementById('gaussian-blur-btn').addEventListener('click', function() {
        const radius = parseInt(document.getElementById('blur-radius-slider').value);
        applyEnhancement('gaussian_blur', { radius });
    });
}

// Sliders Setup
function setupSliders() {
    // Gamma slider
    const gammaSlider = document.getElementById('gamma-slider');
    const gammaValue = document.getElementById('gamma-value');
    
    gammaSlider.addEventListener('input', function() {
        gammaValue.textContent = this.value;
    });
    
    // Unsharp mask sliders
    const unsharpAmountSlider = document.getElementById('unsharp-amount-slider');
    const unsharpAmountValue = document.getElementById('unsharp-amount-value');
    
    unsharpAmountSlider.addEventListener('input', function() {
        unsharpAmountValue.textContent = this.value;
    });
    
    const unsharpRadiusSlider = document.getElementById('unsharp-radius-slider');
    const unsharpRadiusValue = document.getElementById('unsharp-radius-value');
    
    unsharpRadiusSlider.addEventListener('input', function() {
        unsharpRadiusValue.textContent = this.value;
    });
    
    // Gaussian blur slider
    const blurRadiusSlider = document.getElementById('blur-radius-slider');
    const blurRadiusValue = document.getElementById('blur-radius-value');
    
    blurRadiusSlider.addEventListener('input', function() {
        blurRadiusValue.textContent = this.value;
    });
}

// Apply enhancement via API
async function applyEnhancement(method, params = {}) {
    if (!originalImage) return;
    
    // Show processing indicator
    const processingIndicator = document.getElementById('processing-indicator');
    processingIndicator.style.display = 'block';
    
    try {
        // Convert canvas to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        // Create form data
        const formData = new FormData();
        formData.append('image', blob, 'image.png');
        formData.append('method', method);
        
        // Add parameters
        Object.entries(params).forEach(([key, val]) => {
            formData.append(key, val);
        });
        
        // Send request
        const response = await fetch('/enhance', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process image');
        }
        
        // Get processed image
        const processedBlob = await response.blob();
        const img = await createImageBitmap(processedBlob);
        
        // Update current image
        currentImage = img;
        
        // Draw processed image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Update comparison slider
        updateComparisonSlider();
    } catch (error) {
        console.error('Error applying enhancement:', error);
        alert(`Error: ${error.message}`);
    } finally {
        // Hide processing indicator
        processingIndicator.style.display = 'none';
    }
}

// Comparison Slider Setup
function setupComparisonSlider() {
    const container = document.querySelector('.comparison-slider-container');
    const slider = document.querySelector('.comparison-slider');
    
    // Mouse events
    container.addEventListener('mousedown', startSliderDrag);
    document.addEventListener('mousemove', moveSlider);
    document.addEventListener('mouseup', endSliderDrag);
    
    // Touch events
    container.addEventListener('touchstart', startSliderDrag);
    document.addEventListener('touchmove', moveSlider);
    document.addEventListener('touchend', endSliderDrag);
    
    function startSliderDrag(e) {
        e.preventDefault();
        isDragging = true;
    }
    
    function endSliderDrag() {
        isDragging = false;
    }
    
    function moveSlider(e) {
        if (!isDragging) return;
        
        let clientX;
        
        // Get position from mouse or touch
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        
        // Get container bounds
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const position = Math.max(0, Math.min(100, ((clientX - rect.left) / containerWidth) * 100));
        
        // Update slider position
        sliderPosition = position;
        slider.style.width = `${position}%`;
        
        // Redraw with comparison
        if (originalImage && currentImage) {
            drawComparison();
        }
    }
}

// Update comparison slider dimensions
function updateComparisonSlider() {
    const container = document.querySelector('.comparison-slider-container');
    const slider = document.querySelector('.comparison-slider');
    
    // Set container dimensions to match canvas
    container.style.width = `${canvas.width}px`;
    container.style.height = `${canvas.height}px`;
    
    // Reset slider position
    sliderPosition = 50;
    slider.style.width = `${sliderPosition}%`;
    
    // Draw comparison if we have both images
    if (originalImage && currentImage) {
        drawComparison();
    }
}

// Draw comparison between original and enhanced image
function drawComparison() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw current (processed) image
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // Create clipping path for original image
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, (canvas.width * sliderPosition) / 100, canvas.height);
    ctx.clip();
    
    // Draw original image in clipped area
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// Reset image to original
function resetImage() {
    if (!originalImage) return;
    
    // Reset to original image
    currentImage = originalImage;
    
    // Clear canvas and draw original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Reset sliders
    document.getElementById('gamma-slider').value = 1;
    document.getElementById('gamma-value').textContent = '1.0';
    
    document.getElementById('unsharp-amount-slider').value = 1;
    document.getElementById('unsharp-amount-value').textContent = '1.0';
    
    document.getElementById('unsharp-radius-slider').value = 5;
    document.getElementById('unsharp-radius-value').textContent = '5';
    
    document.getElementById('blur-radius-slider').value = 3;
    document.getElementById('blur-radius-value').textContent = '3';
    
    // Update comparison slider
    updateComparisonSlider();
}

// Download processed image
function downloadImage() {
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'picwizard-enhanced.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
