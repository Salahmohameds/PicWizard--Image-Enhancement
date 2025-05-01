# PicWizard: Image Enhancement Toolkit

PicWizard is a comprehensive web-based image enhancement toolkit that leverages advanced image processing techniques to provide users with a wide range of image manipulation capabilities. Built with Flask, JavaScript, and OpenCV, PicWizard offers an intuitive interface for applying various filters and enhancements to images.

## Features

- **Multiple Image Support**: Upload and process multiple images with easy navigation between them.
- **Real-time Previews**: See changes in real-time with an interactive slider for before/after comparison.
- **Basic Adjustments**: Histogram equalization, gamma correction, and more.
- **Detail Enhancement**: Unsharp mask, Gaussian blur, edge detection.
- **Point Processing Techniques**: Bit-plane slicing, log transformation, gray-level slicing, piecewise linear transform.
- **Color Adjustments**: Color balance, sepia effect, and color palette extraction.
- **Medical Image Enhancements**: CLAHE enhancement, DICOM windowing, and vessel enhancement for medical images.
- **Batch Processing**: Process multiple images at once and download as a zip file.
- **Social Media Sharing**: Share enhanced images directly to social media platforms.
- **Multiple Export Formats**: Download images in PNG, JPEG, WebP, or BMP format with quality control options.

## Project Structure

```
PicWizard/
├── backend/
│   ├── app.py            # Main Flask application and route handlers
│   ├── image_processor.py # Core image processing functionality
│   └── medical_processor.py # Specialized medical image processing
├── static/
│   ├── css/
│   │   └── style.css     # Custom styling for the application
│   └── js/
│       └── script.js     # Frontend JavaScript functionality
├── templates/
│   └── index.html        # Main page HTML template
├── temp/                 # Temporary directory for batch processing
└── main.py               # Entry point for the application
```

## Technology Stack

- **Backend**: Flask (Python)
- **Image Processing**: OpenCV, NumPy
- **Frontend**: Vanilla JavaScript, Bootstrap CSS
- **File Handling**: Python standard libraries for file operations
- **API**: RESTful approach for image processing requests

## Mathematical Foundations of Implemented Techniques

### Basic Adjustments

#### Histogram Equalization
Redistributes pixel intensity values to enhance contrast by spreading out the most frequent intensity values.

**Mathematical Formula:**
For a discrete grayscale image with intensity levels in range [0, L-1]:
1. Calculate histogram H(i) for each intensity level i.
2. Compute cumulative distribution function: CDF(i) = Σ(H(j)) for j=0 to i.
3. Transform: g(i,j) = round((L-1) * CDF(f(i,j)) / (width * height))

Where f(i,j) is the input image intensity at position (i,j) and g(i,j) is the output image.

#### Gamma Correction
Applies a non-linear operation to adjust image brightness.

**Mathematical Formula:**
I_out = 255 * (I_in/255)^γ

Where:
- I_in is the input pixel intensity
- I_out is the output pixel intensity
- γ is the gamma value (γ<1 brightens, γ>1 darkens)

### Detail Enhancement

#### Unsharp Mask
Enhances edge details by subtracting a blurred version from the original image.

**Mathematical Formula:**
I_out = I_in + amount * (I_in - G_σ * I_in)

Where:
- G_σ is a Gaussian blur operation with radius σ
- amount controls the strength of enhancement

#### Edge Detection

**Sobel Operator:**
Approximates image gradient by computing horizontal and vertical derivatives.

Horizontal gradient: Gx = [[-1,0,1],[-2,0,2],[-1,0,1]] * I
Vertical gradient: Gy = [[-1,-2,-1],[0,0,0],[1,2,1]] * I
Magnitude: G = √(Gx² + Gy²)

**Canny Edge Detection:**
1. Apply Gaussian filter to smooth the image
2. Calculate gradient magnitude and direction
3. Apply non-maximum suppression to thin edges
4. Apply double threshold to determine potential edges
5. Track edges by hysteresis (suppress weak edges not connected to strong ones)

### Point Processing Techniques

#### Bit-Plane Slicing
Extracts specific bit positions from each pixel to visualize the contribution of that bit to the overall image.

**Mathematical Formula:**
For an 8-bit grayscale image, the bit plane k (0-7) is:
B_k(x,y) = (f(x,y) >> k) & 1

Where:
- f(x,y) is the pixel value at position (x,y)
- >> is the bit-wise right shift operator
- & is the bit-wise AND operator

#### Log Transformation
Expands dark pixel values while compressing bright values, useful for enhancing details in dark regions.

**Mathematical Formula:**
g(x,y) = c * log(1 + f(x,y))

Where:
- f(x,y) is the input pixel value
- g(x,y) is the output pixel value
- c is a scaling constant

#### Gray-Level Slicing
Highlights a specific range of gray levels in an image, making them stand out from the rest.

**Mathematical Formula:**
If highlight_only is true:
g(x,y) = {255 if min_val ≤ f(x,y) ≤ max_val, 0 otherwise}

If highlight_only is false:
g(x,y) = {255 if min_val ≤ f(x,y) ≤ max_val, f(x,y) otherwise}

#### Piecewise Linear Transform
Applies different linear transformations to different ranges of pixel intensities, allowing custom intensity mapping.

**Mathematical Formula:**
For a set of control points (r_k, s_k) where k = 0, 1, ..., n-1:
g(x,y) = s_j + (f(x,y) - r_j) * (s_j+1 - s_j) / (r_j+1 - r_j)

Where r_j ≤ f(x,y) ≤ r_j+1

### Color Adjustments

#### Color Balance
Adjusts the strength of individual RGB channels.

**Mathematical Formula:**
R_out = R_in * r_factor
G_out = G_in * g_factor
B_out = B_in * b_factor

#### Sepia Filter
Applies a vintage sepia tone effect to the image.

**Mathematical Formula:**
R_out = (R_in * 0.393 + G_in * 0.769 + B_in * 0.189) * intensity + R_in * (1 - intensity)
G_out = (R_in * 0.349 + G_in * 0.686 + B_in * 0.168) * intensity + G_in * (1 - intensity)
B_out = (R_in * 0.272 + G_in * 0.534 + B_in * 0.131) * intensity + B_in * (1 - intensity)

#### Color Palette Extraction
Uses K-means clustering to identify the dominant colors in the image.

**Algorithm:**
1. Convert image to a set of pixel values in L*a*b* color space
2. Apply K-means clustering with k=num_colors
3. Find the centroid colors of each cluster
4. Convert centroids back to RGB and then to HEX format

### Medical Image Enhancements

#### CLAHE (Contrast Limited Adaptive Histogram Equalization)
Enhances contrast in small regions (tiles) of the image while limiting noise amplification.

**Algorithm:**
1. Divide the image into small tiles
2. Apply histogram equalization to each tile
3. Limit the amplification by clipping the histogram at a predefined value
4. Interpolate tile boundaries to eliminate artificial boundaries

**Parameters:**
- clip_limit: Threshold for contrast limiting
- grid_size: Size of grid for histogram equalization

#### DICOM Windowing
Adjusts the contrast and brightness of medical images (similar to windowing in radiology).

**Mathematical Formula:**
g(x,y) = 255 * (f(x,y) - (window_level - window_width/2)) / window_width

Where:
- window_width controls the contrast
- window_level controls the brightness
- Values outside the window range are clamped to 0 or 255

#### Vessel Enhancement
Enhances blood vessels in angiograms using a combination of unsharp masking and contrast stretching.

**Algorithm:**
1. Apply Gaussian blur to reduce noise
2. Apply unsharp masking to enhance edges
3. Apply local contrast enhancement
4. Apply non-linear intensity transformation to emphasize vessel structures

### Image Processing and Spatial Transformations

#### Super Resolution
Applies bicubic interpolation to scale the image while maintaining details.

**Algorithm:**
Bicubic interpolation uses a weighted average of a 4x4 pixel neighborhood to determine the output pixel value, providing smoother results than bilinear or nearest-neighbor interpolation.

#### Noise Reduction
Reduces image noise while preserving details using Non-Local Means Denoising.

**Algorithm:**
For each pixel, the algorithm finds similar patches in the image and computes a weighted average based on patch similarity.

## API Endpoints

- `/enhance` (POST): Processes a single image with the specified enhancement method and parameters
- `/batch-enhance` (POST): Processes multiple images with the same enhancement method
- `/download-zip` (GET): Downloads all processed images as a ZIP file

## Usage

1. Upload one or more images by dragging and dropping or using the file browser
2. Select an enhancement technique from the sidebar
3. Adjust parameters if available
4. View the before/after comparison using the slider
5. Download the enhanced image or process additional images
6. Use the navigation controls to switch between multiple images

## Installation and Setup

1. Clone the repository
2. Install required packages: `pip install flask opencv-python numpy pillow`
3. Run the application: `python main.py`
4. Access the web interface at `http://localhost:5000`

## Extending PicWizard

To add new image processing techniques:

1. Add the processing function to `image_processor.py` or `medical_processor.py`
2. Update `app.py` to include a new route or method parameter
3. Add the UI controls to `index.html`
4. Implement the JavaScript event handlers in `script.js`

## License

This project is released under the MIT License.