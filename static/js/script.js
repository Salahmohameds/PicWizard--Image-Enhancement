// Global variables
let originalImage = null;
let currentImage = null;
let canvas = null;
let ctx = null;
let isDragging = false;
let sliderPosition = 50;
let images = []; // Array to store multiple uploaded images
let originalImages = []; // Array to store original versions of all images
let currentImageIndex = 0; // Index of the currently displayed image

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
    
    // Setup social sharing
    setupSocialSharing();
    
    // Setup comparison slider
    setupComparisonSlider();
    
    // Setup image navigation
    setupImageNavigation();
    
    // Setup download buttons
    document.getElementById('download-btn').addEventListener('click', downloadImage);
    document.getElementById('download-all-btn').addEventListener('click', downloadAllImages);
    
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
        if (this.files && this.files.length > 0) {
            // Reset image arrays when new files are uploaded
            images = [];
            originalImages = [];
            currentImageIndex = 0;
            
            // Process each file
            const totalFiles = this.files.length;
            let loadedCount = 0;
            
            for (let i = 0; i < totalFiles; i++) {
                processUploadedFile(this.files[i], i === 0, () => {
                    loadedCount++;
                    // When all files are loaded, update navigation
                    if (loadedCount === totalFiles) {
                        console.log(`All ${totalFiles} files loaded successfully`);
                        // Update navigation controls visibility
                        document.getElementById('images-navigation').style.display = totalFiles > 1 ? 'block' : 'none';
                        updateImageCounter();
                        updateNavigationButtons();
                    }
                });
            }
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
        
        // Add animation for drop effect
        uploadArea.classList.add('drop-animation');
        setTimeout(() => {
            uploadArea.classList.remove('drop-animation');
        }, 500);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Reset image arrays when new files are dropped
            images = [];
            originalImages = [];
            currentImageIndex = 0;
            
            // Process each file
            const totalFiles = e.dataTransfer.files.length;
            let loadedCount = 0;
            
            // Show loading indicator
            document.getElementById('upload-prompt').innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h5 class="mt-3">Loading ${totalFiles} image${totalFiles > 1 ? 's' : ''}...</h5>
            `;
            
            for (let i = 0; i < totalFiles; i++) {
                processUploadedFile(e.dataTransfer.files[i], i === 0, () => {
                    loadedCount++;
                    // When all files are loaded, update navigation
                    if (loadedCount === totalFiles) {
                        console.log(`All ${totalFiles} files loaded successfully`);
                        
                        // Update upload prompt message
                        document.getElementById('upload-prompt').innerHTML = `
                            <i class="bi bi-check-circle-fill text-success fs-1"></i>
                            <h5 class="mt-3">${totalFiles} image${totalFiles > 1 ? 's' : ''} uploaded</h5>
                            <p class="small">Drag & drop or click to upload different images</p>
                        `;
                        
                        // Update navigation controls visibility
                        document.getElementById('images-navigation').style.display = totalFiles > 1 ? 'block' : 'none';
                        updateImageCounter();
                        updateNavigationButtons();
                    }
                });
            }
        }
    });
}

// Process uploaded file
function processUploadedFile(file, displayImage = true, callback = null) {
    console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size);
    
    // Validate file type
    if (!file.type.match('image/jpeg') && !file.type.match('image/png') && 
        !file.type.match('image/webp') && !file.type.match('image/bmp') && 
        !file.type.match('image/gif') && !file.type.match('image/tiff')) {
        alert(`File ${file.name} is not a supported image format. Skipping.`);
        if (callback) callback();
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log("File loaded successfully, creating image");
        
        const img = new Image();
        
        // Handle errors
        img.onerror = function() {
            console.error(`Failed to load image: ${file.name}`);
            alert(`Failed to load the image: ${file.name}. Please try another file.`);
        };
        
        img.onload = function() {
            console.log("Image loaded, dimensions:", img.width, "x", img.height);
            
            // Show editor
            document.getElementById('editor-container').style.display = 'flex';
            
            // Update upload area
            const uploadArea = document.getElementById('upload-area');
            uploadArea.classList.add('has-image');
            
            // Update upload prompt message based on number of files uploaded
            if (images.length > 0) {
                document.getElementById('upload-prompt').innerHTML = `
                    <i class="bi bi-check-circle-fill text-success fs-1"></i>
                    <h5 class="mt-3">${images.length + 1} images uploaded</h5>
                    <p class="small">Drag & drop or click to upload different images</p>
                `;
            } else {
                document.getElementById('upload-prompt').innerHTML = `
                    <i class="bi bi-check-circle-fill text-success fs-1"></i>
                    <h5 class="mt-3">Image uploaded successfully</h5>
                    <p class="small">Drag & drop or click to upload more images</p>
                `;
            }
            
            // Add this image to our arrays
            images.push({
                img: img,
                filename: file.name,
                originalSrc: e.target.result,
                currentSrc: e.target.result
            });
            
            // Create a clone of the original image to store
            const originalImg = new Image();
            originalImg.src = e.target.result;
            originalImages.push(originalImg);
            
            // If this is the image we want to display, set it up
            if (displayImage) {
                // Configure canvas
                setupCanvas(img);
                
                // Store as current active image
                originalImage = img;
                currentImage = img;
                
                // Update current filename display
                document.getElementById('current-filename').textContent = file.name;
            }
            
            // Execute the callback if provided
            if (callback) callback();
        };
        
        // Set image source from FileReader result
        img.src = e.target.result;
    };
    
    reader.onerror = function() {
        console.error("FileReader error:", reader.error);
        alert(`Failed to read the file: ${file.name}. Please try again.`);
    };
    
    // Read file as data URL
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
    // Color Palette Extraction
    document.getElementById('palette-colors-slider').addEventListener('input', function() {
        document.getElementById('palette-colors-value').textContent = this.value;
    });
    
    document.getElementById('extract-palette-btn').addEventListener('click', function() {
        const numColors = parseInt(document.getElementById('palette-colors-slider').value);
        applyEnhancement('extract_palette', { num_colors: numColors });
    });
    
    // Hide palette when resetting image 
    // (This is now handled directly in the resetImage function)
    
    // Histogram Equalization
    document.getElementById('histogram-eq-btn').addEventListener('click', function() {
        applyEnhancement('histogram_equalization');
    });
    
    // Gamma Correction
    document.getElementById('gamma-btn').addEventListener('click', function() {
        const gamma = parseFloat(document.getElementById('gamma-slider').value);
        applyEnhancement('gamma_correction', { gamma });
    });
    
    // Real-time gamma correction
    document.getElementById('gamma-slider').addEventListener('input', function() {
        const gamma = parseFloat(this.value);
        document.getElementById('gamma-value').textContent = gamma.toFixed(1);
        debounce(() => applyEnhancement('gamma_correction', { gamma }), 300)();
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
    
    // Real-time gaussian blur
    document.getElementById('blur-radius-slider').addEventListener('input', function() {
        const radius = parseInt(this.value);
        document.getElementById('blur-radius-value').textContent = radius;
        debounce(() => applyEnhancement('gaussian_blur', { radius }), 300)();
    });
    
    // Edge Detection
    document.getElementById('edge-detection-btn').addEventListener('click', function() {
        const detectionMethod = document.querySelector('input[name="edge-method"]:checked').value;
        const threshold1 = parseInt(document.getElementById('edge-threshold1-slider').value);
        const threshold2 = parseInt(document.getElementById('edge-threshold2-slider').value);
        applyEnhancement('edge_detection', { 
            detection_method: detectionMethod,
            threshold1,
            threshold2
        });
    });
    
    // Toggle Canny options when method changes
    document.querySelectorAll('input[name="edge-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const cannyOptions = document.querySelector('.canny-options');
            if (this.value === 'canny') {
                cannyOptions.style.display = 'block';
            } else {
                cannyOptions.style.display = 'none';
            }
        });
    });
    
    // Update threshold values
    document.getElementById('edge-threshold1-slider').addEventListener('input', function() {
        document.getElementById('edge-threshold1-value').textContent = this.value;
    });
    
    document.getElementById('edge-threshold2-slider').addEventListener('input', function() {
        document.getElementById('edge-threshold2-value').textContent = this.value;
    });
    
    // Super Resolution
    document.getElementById('super-resolution-btn').addEventListener('click', function() {
        const scaleFactor = parseInt(document.querySelector('input[name="scale-factor"]:checked').value);
        applyEnhancement('super_resolution', { scale_factor: scaleFactor });
    });
    
    // Color Balance
    document.getElementById('color-balance-btn').addEventListener('click', function() {
        const rFactor = parseFloat(document.getElementById('red-slider').value);
        const gFactor = parseFloat(document.getElementById('green-slider').value);
        const bFactor = parseFloat(document.getElementById('blue-slider').value);
        applyEnhancement('color_balance', { 
            r_factor: rFactor,
            g_factor: gFactor,
            b_factor: bFactor
        });
    });
    
    // Update color balance slider values
    document.getElementById('red-slider').addEventListener('input', function() {
        document.getElementById('red-value').textContent = this.value;
    });
    
    document.getElementById('green-slider').addEventListener('input', function() {
        document.getElementById('green-value').textContent = this.value;
    });
    
    document.getElementById('blue-slider').addEventListener('input', function() {
        document.getElementById('blue-value').textContent = this.value;
    });
    
    // Real-time color balance (preview as the user adjusts sliders)
    const colorBalanceDebounce = debounce(() => {
        const rFactor = parseFloat(document.getElementById('red-slider').value);
        const gFactor = parseFloat(document.getElementById('green-slider').value);
        const bFactor = parseFloat(document.getElementById('blue-slider').value);
        applyEnhancement('color_balance', { 
            r_factor: rFactor,
            g_factor: gFactor,
            b_factor: bFactor
        });
    }, 300);
    
    document.getElementById('red-slider').addEventListener('input', colorBalanceDebounce);
    document.getElementById('green-slider').addEventListener('input', colorBalanceDebounce);
    document.getElementById('blue-slider').addEventListener('input', colorBalanceDebounce);
    
    // Sepia Filter
    document.getElementById('sepia-btn').addEventListener('click', function() {
        const intensity = parseFloat(document.getElementById('sepia-slider').value);
        applyEnhancement('sepia_filter', { intensity });
    });
    
    // Update sepia slider value
    document.getElementById('sepia-slider').addEventListener('input', function() {
        document.getElementById('sepia-value').textContent = this.value;
        
        // Real-time sepia preview
        debounce(() => {
            const intensity = parseFloat(this.value);
            applyEnhancement('sepia_filter', { intensity });
        }, 300)();
    });
    
    // Noise Reduction
    document.getElementById('noise-reduction-btn').addEventListener('click', function() {
        const strength = parseInt(document.getElementById('noise-slider').value);
        applyEnhancement('noise_reduction', { strength });
    });
    
    // Update noise slider value
    document.getElementById('noise-slider').addEventListener('input', function() {
        document.getElementById('noise-value').textContent = this.value;
    });
    
    // Sharpen
    document.getElementById('sharpen-btn').addEventListener('click', function() {
        const strength = parseFloat(document.getElementById('sharpen-slider').value);
        applyEnhancement('sharpen', { strength });
    });
    
    // Update sharpen slider value
    document.getElementById('sharpen-slider').addEventListener('input', function() {
        document.getElementById('sharpen-value').textContent = this.value;
        
        // Real-time sharpen preview
        debounce(() => {
            const strength = parseFloat(this.value);
            applyEnhancement('sharpen', { strength });
        }, 300)();
    });
    
    // Set up download format change handler
    const formatSelect = document.getElementById('download-format');
    const qualityControl = document.getElementById('quality-control');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    
    // Show/hide quality slider based on format
    formatSelect.addEventListener('change', function() {
        const format = this.value;
        if (format === 'image/jpeg' || format === 'image/webp') {
            qualityControl.classList.remove('d-none');
            qualityControl.classList.add('d-flex');
        } else {
            qualityControl.classList.add('d-none');
            qualityControl.classList.remove('d-flex');
        }
    });
    
    // Update quality value display
    qualitySlider.addEventListener('input', function() {
        const value = Math.round(this.value * 100);
        qualityValue.textContent = `${value}%`;
    });
    
    // Medical image processing tools
    
    // CLAHE Enhancement
    document.getElementById('clahe-clip-slider').addEventListener('input', function() {
        document.getElementById('clahe-clip-value').textContent = this.value;
    });
    
    document.getElementById('clahe-grid-slider').addEventListener('input', function() {
        document.getElementById('clahe-grid-value').textContent = this.value;
    });
    
    document.getElementById('clahe-btn').addEventListener('click', function() {
        const clipLimit = parseFloat(document.getElementById('clahe-clip-slider').value);
        const gridSize = parseInt(document.getElementById('clahe-grid-slider').value);
        applyEnhancement('clahe_enhance', { 
            clip_limit: clipLimit,
            grid_size: gridSize
        });
    });
    
    // DICOM Windowing
    document.getElementById('window-width-slider').addEventListener('input', function() {
        document.getElementById('window-width-value').textContent = this.value;
    });
    
    document.getElementById('window-level-slider').addEventListener('input', function() {
        document.getElementById('window-level-value').textContent = this.value;
    });
    
    document.getElementById('dicom-window-btn').addEventListener('click', function() {
        const windowWidth = parseInt(document.getElementById('window-width-slider').value);
        const windowLevel = parseInt(document.getElementById('window-level-slider').value);
        applyEnhancement('dicom_window', { 
            window_width: windowWidth,
            window_level: windowLevel
        });
    });
    
    // Real-time DICOM windowing
    const dicomWindowDebounce = debounce(() => {
        const windowWidth = parseInt(document.getElementById('window-width-slider').value);
        const windowLevel = parseInt(document.getElementById('window-level-slider').value);
        applyEnhancement('dicom_window', { 
            window_width: windowWidth,
            window_level: windowLevel
        });
    }, 300);
    
    document.getElementById('window-width-slider').addEventListener('input', dicomWindowDebounce);
    document.getElementById('window-level-slider').addEventListener('input', dicomWindowDebounce);
    
    // Vessel Enhancement
    document.getElementById('vessel-slider').addEventListener('input', function() {
        document.getElementById('vessel-value').textContent = this.value;
    });
    
    document.getElementById('enhance-vessels-btn').addEventListener('click', function() {
        const strength = parseFloat(document.getElementById('vessel-slider').value);
        applyEnhancement('enhance_vessels', { strength });
    });
    
    // Point Processing Techniques
    
    // Bit-Plane Slicing
    document.getElementById('bit-plane-slider').addEventListener('input', function() {
        document.getElementById('bit-plane-value').textContent = this.value;
    });
    
    document.getElementById('bit-plane-btn').addEventListener('click', function() {
        const bitPlane = parseInt(document.getElementById('bit-plane-slider').value);
        applyEnhancement('bit_plane_slicing', { bit_plane: bitPlane });
    });
    
    // Log Transformation
    document.getElementById('log-c-slider').addEventListener('input', function() {
        document.getElementById('log-c-value').textContent = parseFloat(this.value).toFixed(1);
    });
    
    document.getElementById('log-transform-btn').addEventListener('click', function() {
        const c = parseFloat(document.getElementById('log-c-slider').value);
        applyEnhancement('log_transformation', { c });
    });
    
    // Gray-Level Slicing
    document.getElementById('gray-min-slider').addEventListener('input', function() {
        const minVal = parseInt(this.value);
        document.getElementById('gray-min-value').textContent = minVal;
        
        // Ensure max slider is always greater than min
        const maxSlider = document.getElementById('gray-max-slider');
        if (parseInt(maxSlider.value) <= minVal) {
            maxSlider.value = minVal + 1;
            document.getElementById('gray-max-value').textContent = minVal + 1;
        }
    });
    
    document.getElementById('gray-max-slider').addEventListener('input', function() {
        const maxVal = parseInt(this.value);
        document.getElementById('gray-max-value').textContent = maxVal;
        
        // Ensure min slider is always less than max
        const minSlider = document.getElementById('gray-min-slider');
        if (parseInt(minSlider.value) >= maxVal) {
            minSlider.value = maxVal - 1;
            document.getElementById('gray-min-value').textContent = maxVal - 1;
        }
    });
    
    document.getElementById('gray-level-btn').addEventListener('click', function() {
        const minVal = parseInt(document.getElementById('gray-min-slider').value);
        const maxVal = parseInt(document.getElementById('gray-max-slider').value);
        const highlightOnly = document.getElementById('highlight-only-switch').checked;
        
        applyEnhancement('gray_level_slicing', { 
            min_val: minVal,
            max_val: maxVal,
            highlight_only: highlightOnly
        });
    });
    
    // Piecewise Linear Transform
    // Initialize the preset transforms
    const PRESETS = {
        negative: [[0, 255], [255, 0]],  // Invert image
        threshold: [[0, 0], [127, 0], [128, 255], [255, 255]],  // Binary thresholding
        posterize: [[0, 0], [63, 20], [127, 100], [191, 180], [255, 255]],  // Posterization effect
        solarize: [[0, 255], [127, 0], [255, 255]]  // Solarization effect
    };
    
    // Set up preset buttons
    document.querySelectorAll('[data-preset]').forEach(button => {
        button.addEventListener('click', function() {
            const presetName = this.dataset.preset;
            if (PRESETS[presetName]) {
                updateControlPoints(PRESETS[presetName]);
            }
        });
    });
    
    // Apply piecewise linear transform
    document.getElementById('piecewise-linear-btn').addEventListener('click', function() {
        // Collect all point coordinates
        const points = [];
        const pointInputs = document.querySelectorAll('#piecewise-control-points .d-flex');
        
        pointInputs.forEach(div => {
            const xInput = div.querySelector('.point-x');
            const yInput = div.querySelector('.point-y');
            
            if (xInput && yInput) {
                const x = parseInt(xInput.value);
                const y = parseInt(yInput.value);
                points.push([x, y]);
            }
        });
        
        // Sort points by x-coordinate
        points.sort((a, b) => a[0] - b[0]);
        
        // Apply the transform - make sure to use 'piecewise_linear' to match backend route
        applyEnhancement('piecewise_linear', { 
            points: JSON.stringify(points)
        });
    });
}

// Debounce function to limit the rate of function calls
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Sliders Setup
function setupSliders() {
    // Unsharp mask sliders - setup interactive values without applying filter immediately
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
    
    // Real-time unsharp mask application as user adjusts sliders
    unsharpAmountSlider.addEventListener('change', function() {
        const amount = parseFloat(this.value);
        const radius = parseInt(document.getElementById('unsharp-radius-slider').value);
        applyEnhancement('unsharp_mask', { amount, radius });
    });
    
    unsharpRadiusSlider.addEventListener('change', function() {
        const radius = parseInt(this.value);
        const amount = parseFloat(document.getElementById('unsharp-amount-slider').value);
        applyEnhancement('unsharp_mask', { amount, radius });
    });
    
    // Edge detection sliders with real-time value updates
    const edgeThreshold1Slider = document.getElementById('edge-threshold1-slider');
    const edgeThreshold1Value = document.getElementById('edge-threshold1-value');
    
    edgeThreshold1Slider.addEventListener('input', function() {
        edgeThreshold1Value.textContent = this.value;
    });
    
    const edgeThreshold2Slider = document.getElementById('edge-threshold2-slider');
    const edgeThreshold2Value = document.getElementById('edge-threshold2-value');
    
    edgeThreshold2Slider.addEventListener('input', function() {
        edgeThreshold2Value.textContent = this.value;
    });
}

// Apply enhancement via API
async function applyEnhancement(method, params = {}) {
    if (!originalImage) return;
    
    // Show processing indicator
    const processingIndicator = document.getElementById('processing-indicator');
    processingIndicator.style.display = 'block';
    
    try {
        console.log(`Applying enhancement: ${method} with params:`, params);
        
        // Convert canvas to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        if (!blob) {
            throw new Error("Failed to create image blob from canvas");
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('image', blob, 'uploaded_image.png');
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
        
        // Handle color palette differently than regular image enhancements
        if (method === 'extract_palette') {
            // Get JSON with palette data instead of image
            const paletteData = await response.json();
            
            // Display the color palette
            displayColorPalette(paletteData.palette);
        } else {
            // Regular image processing - get the image blob as before
            const processedBlob = await response.blob();
            const img = await createImageBitmap(processedBlob);
            
            // Update current image
            currentImage = img;
            
            // Draw processed image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Update comparison slider
            updateComparisonSlider();
        }
    } catch (error) {
        console.error('Error applying enhancement:', error);
        let errorMessage = error.message || 'Unknown error occurred';
        
        try {
            // Try to parse the error if it's a JSON string
            const errorObj = JSON.parse(errorMessage);
            if (errorObj.error) {
                errorMessage = errorObj.error;
            }
        } catch (e) {
            // Not a JSON string, use as is
        }
        
        // Display error message
        alert(`Error: ${errorMessage}`);
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
    if (images.length > 0 && currentImageIndex >= 0 && currentImageIndex < images.length) {
        // When multiple images are uploaded, reset to the original for the current image
        currentImage = originalImages[currentImageIndex];
    } else {
        currentImage = originalImage;
    }
    
    // Clear canvas and draw original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    
    // Reset basic adjustment sliders
    document.getElementById('gamma-slider').value = 1;
    document.getElementById('gamma-value').textContent = '1.0';
    
    // Reset unsharp mask sliders
    document.getElementById('unsharp-amount-slider').value = 1;
    document.getElementById('unsharp-amount-value').textContent = '1.0';
    document.getElementById('unsharp-radius-slider').value = 5;
    document.getElementById('unsharp-radius-value').textContent = '5';
    
    // Reset gaussian blur slider
    document.getElementById('blur-radius-slider').value = 3;
    document.getElementById('blur-radius-value').textContent = '3';
    
    // Reset edge detection options
    document.getElementById('edge-sobel').checked = true;
    document.getElementById('edge-threshold1-slider').value = 100;
    document.getElementById('edge-threshold1-value').textContent = '100';
    document.getElementById('edge-threshold2-slider').value = 200;
    document.getElementById('edge-threshold2-value').textContent = '200';
    document.querySelector('.canny-options').style.display = 'none';
    
    // Reset super resolution options
    document.getElementById('scale-2x').checked = true;
    
    // Reset color balance
    document.getElementById('red-slider').value = 1;
    document.getElementById('red-value').textContent = '1.0';
    document.getElementById('green-slider').value = 1;
    document.getElementById('green-value').textContent = '1.0';
    document.getElementById('blue-slider').value = 1;
    document.getElementById('blue-value').textContent = '1.0';
    
    // Reset sepia
    document.getElementById('sepia-slider').value = 0.5;
    document.getElementById('sepia-value').textContent = '0.5';
    
    // Reset noise reduction
    document.getElementById('noise-slider').value = 7;
    document.getElementById('noise-value').textContent = '7';
    
    // Reset sharpen
    document.getElementById('sharpen-slider').value = 1;
    document.getElementById('sharpen-value').textContent = '1.0';
    
    // Reset CLAHE
    document.getElementById('clahe-clip-slider').value = 2;
    document.getElementById('clahe-clip-value').textContent = '2.0';
    document.getElementById('clahe-grid-slider').value = 8;
    document.getElementById('clahe-grid-value').textContent = '8';
    
    // Reset DICOM windowing
    document.getElementById('window-width-slider').value = 400;
    document.getElementById('window-width-value').textContent = '400';
    document.getElementById('window-level-slider').value = 50;
    document.getElementById('window-level-value').textContent = '50';
    
    // Reset vessel enhancement
    document.getElementById('vessel-slider').value = 1.5;
    document.getElementById('vessel-value').textContent = '1.5';
    
    // Reset point processing technique sliders
    document.getElementById('bit-plane-slider').value = 7;
    document.getElementById('bit-plane-value').textContent = '7';
    
    document.getElementById('log-c-slider').value = 1;
    document.getElementById('log-c-value').textContent = '1.0';
    
    document.getElementById('gray-min-slider').value = 100;
    document.getElementById('gray-min-value').textContent = '100';
    document.getElementById('gray-max-slider').value = 200;
    document.getElementById('gray-max-value').textContent = '200';
    document.getElementById('highlight-only-switch').checked = false;
    
    // Reset piecewise linear transform control points to default
    updateControlPoints([[0, 0], [50, 100], [200, 150], [255, 255]]);
    
    // Reset color palette
    document.getElementById('palette-colors-slider').value = 5;
    document.getElementById('palette-colors-value').textContent = '5';
    document.getElementById('color-palette-container').style.display = 'none';
    
    // Update comparison slider
    updateComparisonSlider();
}

// Download processed image

// Display the extracted color palette
function displayColorPalette(paletteColors) {
    // Get container elements
    const paletteContainer = document.getElementById('color-palette-container');
    const paletteDisplay = document.getElementById('color-palette-display');
    
    // Show the container
    paletteContainer.style.display = 'block';
    
    // Clear any previous palette
    paletteDisplay.innerHTML = '';
    
    // Create swatches for each color
    paletteColors.forEach(hexColor => {
        // Create color swatch
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = hexColor;
        
        // Add hex code label
        const hexLabel = document.createElement('div');
        hexLabel.className = 'hex-code';
        hexLabel.textContent = hexColor;
        swatch.appendChild(hexLabel);
        
        // Click to copy hex code
        swatch.addEventListener('click', function() {
            navigator.clipboard.writeText(hexColor)
                .then(() => {
                    // Show feedback
                    const originalText = hexLabel.textContent;
                    hexLabel.textContent = 'Copied!';
                    hexLabel.style.opacity = 1;
                    
                    // Reset after a short delay
                    setTimeout(() => {
                        hexLabel.textContent = originalText;
                        hexLabel.style.opacity = '';
                    }, 1500);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        });
        
        // Add to palette display
        paletteDisplay.appendChild(swatch);
    });
}

// Image navigation setup
function setupImageNavigation() {
    const prevBtn = document.getElementById('prev-image-btn');
    const nextBtn = document.getElementById('next-image-btn');
    
    // Previous image button
    prevBtn.addEventListener('click', function() {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            displayImage(currentImageIndex);
            updateImageCounter();
            updateNavigationButtons();
        }
    });
    
    // Next image button
    nextBtn.addEventListener('click', function() {
        if (currentImageIndex < images.length - 1) {
            currentImageIndex++;
            displayImage(currentImageIndex);
            updateImageCounter();
            updateNavigationButtons();
        }
    });
}

// Display image at specified index
function displayImage(index) {
    if (index >= 0 && index < images.length) {
        const imageData = images[index];
        
        // Load the image
        const img = imageData.img;
        
        // Setup canvas with this image
        setupCanvas(img);
        
        // Update the current and original image references
        currentImage = img;
        originalImage = originalImages[index];
        
        // Update filename display
        document.getElementById('current-filename').textContent = imageData.filename;
        
        // Hide color palette display when changing images
        document.getElementById('color-palette-container').style.display = 'none';
    }
}

// Update image counter display
function updateImageCounter() {
    if (images.length > 0) {
        document.getElementById('image-counter').textContent = `${currentImageIndex + 1}/${images.length}`;
    } else {
        document.getElementById('image-counter').textContent = '0/0';
    }
}

// Update navigation buttons enabled/disabled state
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-image-btn');
    const nextBtn = document.getElementById('next-image-btn');
    
    prevBtn.disabled = currentImageIndex <= 0;
    nextBtn.disabled = currentImageIndex >= images.length - 1;
}

// Function to update control points in the UI for piecewise linear transform
function updateControlPoints(points) {
    // Clear existing points (except first and last)
    const pointInputs = document.querySelectorAll('#piecewise-control-points .d-flex');
    
    // Keep only the first and last points (0,0 and 255,255)
    for (let i = 1; i < pointInputs.length - 1; i++) {
        pointInputs[i].remove();
    }
    
    // Add new points
    const container = document.getElementById('piecewise-control-points');
    const lastPoint = pointInputs[pointInputs.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
        const [x, y] = points[i];
        
        const pointDiv = document.createElement('div');
        pointDiv.className = 'd-flex align-items-center mb-1';
        pointDiv.innerHTML = `
            <small class="me-2">Point ${i+1}:</small>
            <input type="number" class="form-control form-control-sm me-1 point-x" min="0" max="255" value="${x}">
            <input type="number" class="form-control form-control-sm point-y" min="0" max="255" value="${y}">
        `;
        
        container.insertBefore(pointDiv, lastPoint);
    }
}

// Download current image - simplified version that only downloads as PNG
function downloadImage() {
    if (!canvas) {
        alert('No image to download. Please upload an image first.');
        return;
    }
    
    try {
        // Get base filename without extension
        let filename = 'picwizard-enhanced';
        if (images.length > 0 && currentImageIndex >= 0 && currentImageIndex < images.length) {
            const currentFilename = images[currentImageIndex].filename;
            filename = currentFilename.substring(0, currentFilename.lastIndexOf('.')) || currentFilename;
        }
        
        // Create download link for PNG format
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${filename}-enhanced.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        
        // Clean up the link after a delay
        setTimeout(() => {
            document.body.removeChild(link);
            console.log(`Downloaded image as PNG`);
        }, 100);
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Failed to download image: ' + error.message);
    }
}

// Download all images as ZIP
function downloadAllImages() {
    if (images.length === 0) {
        alert('No images to download. Please upload and process images first.');
        return;
    }
    
    // Get format and quality settings
    const formatSelect = document.getElementById('download-format');
    const format = formatSelect.value;
    const quality = parseFloat(document.getElementById('quality-slider').value);
    
    // Show processing indicator
    const processingIndicator = document.getElementById('processing-indicator');
    processingIndicator.style.display = 'block';
    
    // Create FormData for the batch request
    const formData = new FormData();
    
    // Process each image and add to the batch
    const currentIndex = currentImageIndex;
    let batchPromises = [];
    
    // For each image, create a blob and add to formData
    for (let i = 0; i < images.length; i++) {
        // Switch to this image to capture its current state
        displayImage(i);
        
        // Create a promise to process this image
        batchPromises.push(new Promise((resolve) => {
            // Get the canvas data for this image
            const blob = dataURLToBlob(canvas.toDataURL(format, quality));
            const file = new File([blob], images[i].filename, { type: format });
            formData.append('images[]', file);
            resolve();
        }));
    }
    
    // When all images are prepared, send the batch request
    Promise.all(batchPromises).then(() => {
        // Add format and quality parameters
        formData.append('format', format.split('/')[1]); // 'png', 'jpeg', etc.
        formData.append('quality', quality.toString());
        formData.append('method', 'gamma_correction'); // Default method for batch processing
        formData.append('gamma', '1.0'); // Identity transform (no change)
        
        // Restore the previously displayed image
        displayImage(currentIndex);
        
        // First send batch processing request
        fetch('/batch-enhance', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to process images for batch download');
            }
            return response.json();
        })
        .then(data => {
            console.log('Batch processing complete, downloading ZIP...');
            
            // Then download the ZIP file
            return fetch('/download-zip', {
                method: 'GET'
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to download ZIP file');
            }
            return response.blob();
        })
        .then(blob => {
            // Create download link for the ZIP
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'picwizard-enhanced-images.zip';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            processingIndicator.style.display = 'none';
        })
        .catch(error => {
            console.error('Error downloading ZIP:', error);
            alert('Failed to download ZIP file: ' + error.message);
            processingIndicator.style.display = 'none';
        });
    });
}

// Helper function to convert data URL to Blob
function dataURLToBlob(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

// Social Media Sharing Functions
function setupSocialSharing() {
    // Twitter Share
    document.getElementById('twitter-share').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Get current canvas image
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Since we can't upload the image directly to Twitter through the API,
        // we'll provide a text with a link to the app
        const text = 'Check out this image I enhanced with PicWizard!';
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        
        // Open a new window to share on Twitter
        window.open(shareUrl, '_blank', 'width=550,height=420');
    });
    
    // Facebook Share
    document.getElementById('facebook-share').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Facebook sharing URL (needs a publicly accessible URL for the image)
        const shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + 
                          encodeURIComponent(window.location.href);
        
        // Open a new window to share on Facebook
        window.open(shareUrl, '_blank', 'width=550,height=420');
    });
    
    // Pinterest Share
    document.getElementById('pinterest-share').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Pinterest needs both an image URL and a page URL
        // For demo purposes, we'll just share the page URL with a description
        const description = 'Image enhanced with PicWizard';
        const shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&description=${encodeURIComponent(description)}`;
        
        // Open a new window to share on Pinterest
        window.open(shareUrl, '_blank', 'width=750,height=550');
    });
    
    // LinkedIn Share
    document.getElementById('linkedin-share').addEventListener('click', function(e) {
        e.preventDefault();
        
        // LinkedIn sharing URL
        const shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + 
                          encodeURIComponent(window.location.href);
        
        // Open a new window to share on LinkedIn
        window.open(shareUrl, '_blank', 'width=550,height=420');
    });
}

// Social sharing is now integrated into the main DOMContentLoaded handler
