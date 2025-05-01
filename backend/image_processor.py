import cv2
import numpy as np
from backend.medical_processor import MedicalImageProcessor

class ImageProcessor:
    """Class for image enhancement operations using OpenCV"""
    
    def __init__(self):
        # Initialize medical image processor
        self.medical_processor = MedicalImageProcessor()
    
    def histogram_equalization(self, img):
        """
        Enhance contrast using histogram equalization
        
        Args:
            img: Input image (BGR format)
            
        Returns:
            Enhanced image
        """
        # Convert to YUV color space
        img_yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
        
        # Apply histogram equalization to the Y channel
        img_yuv[:,:,0] = cv2.equalizeHist(img_yuv[:,:,0])
        
        # Convert back to BGR
        return cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)
    
    def gamma_correction(self, img, gamma=1.0):
        """
        Apply gamma correction to adjust brightness non-linearly
        
        Args:
            img: Input image
            gamma: Gamma value (1.0 is unchanged)
            
        Returns:
            Gamma-corrected image
        """
        # Avoid division by zero
        if gamma <= 0:
            gamma = 0.01
            
        # Calculate inverse gamma
        inv_gamma = 1.0 / gamma
        
        # Create lookup table
        table = np.array([
            ((i / 255.0) ** inv_gamma) * 255 
            for i in np.arange(0, 256)
        ]).astype("uint8")
        
        # Apply lookup table
        return cv2.LUT(img, table)
    
    def unsharp_mask(self, img, kernel_size=(5, 5), sigma=1.0, amount=1.0, threshold=0):
        """
        Apply unsharp mask to sharpen the image
        
        Args:
            img: Input image
            kernel_size: Size of Gaussian blur kernel
            sigma: Standard deviation for Gaussian blur
            amount: Strength of sharpening effect
            threshold: Minimum brightness difference
            
        Returns:
            Sharpened image
        """
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(img, kernel_size, sigma)
        
        # Calculate sharpened image
        sharpened = float(amount + 1) * img - float(amount) * blurred
        
        # Clip values to valid range
        sharpened = np.maximum(np.minimum(sharpened, 255), 0).astype(np.uint8)
        
        # Apply threshold if specified
        if threshold > 0:
            low_contrast_mask = np.absolute(img - blurred) < threshold
            np.copyto(sharpened, img, where=low_contrast_mask)
            
        return sharpened
    
    def gaussian_blur(self, img, radius=3):
        """
        Apply Gaussian blur to smooth the image
        
        Args:
            img: Input image
            radius: Radius of blur (must be odd)
            
        Returns:
            Blurred image
        """
        # Ensure radius is odd
        if radius % 2 == 0:
            radius += 1
            
        return cv2.GaussianBlur(img, (radius, radius), 0)
        
    def edge_detection(self, img, method='sobel', threshold1=100, threshold2=200):
        """
        Apply edge detection to the image
        
        Args:
            img: Input image
            method: 'sobel' or 'canny'
            threshold1: First threshold for Canny detector
            threshold2: Second threshold for Canny detector
            
        Returns:
            Edge-detected image
        """
        # Convert to grayscale if needed
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()
        
        if method.lower() == 'sobel':
            # Apply Sobel operator
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            
            # Compute magnitude
            magnitude = np.sqrt(sobelx**2 + sobely**2).astype(np.uint8)
            
            # Create color edge image
            if len(img.shape) == 3:
                # Create a colored edge image
                edge_img = img.copy()
                edge_img[magnitude < 50] = 0  # Black out low-magnitude areas
                return edge_img
            else:
                return magnitude
                
        elif method.lower() == 'canny':
            # Apply Canny edge detector
            edges = cv2.Canny(gray, threshold1, threshold2)
            
            if len(img.shape) == 3:
                # Create a colored edge image
                edge_img = img.copy()
                edge_img[edges == 0] = 0  # Black out non-edge areas
                return edge_img
            else:
                return edges
                
        else:
            return img  # Return original if method not recognized
    
    def super_resolution(self, img, scale_factor=2):
        """
        Apply basic super resolution by resizing with better interpolation
        
        Args:
            img: Input image
            scale_factor: Factor to scale the image (2 = 2x size)
            
        Returns:
            Upscaled image
        """
        # Get dimensions
        h, w = img.shape[:2]
        
        # Calculate new dimensions
        new_h, new_w = h * scale_factor, w * scale_factor
        
        # Resize with cubic interpolation (better quality than linear)
        return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    
    def color_balance(self, img, r_factor=1.0, g_factor=1.0, b_factor=1.0):
        """
        Adjust RGB color channels independently
        
        Args:
            img: Input image (BGR format)
            r_factor: Red channel multiplier
            g_factor: Green channel multiplier
            b_factor: Blue channel multiplier
            
        Returns:
            Color balanced image
        """
        # Split the image into BGR channels
        b, g, r = cv2.split(img)
        
        # Apply multipliers to each channel
        r = np.clip(r * r_factor, 0, 255).astype(np.uint8)
        g = np.clip(g * g_factor, 0, 255).astype(np.uint8)
        b = np.clip(b * b_factor, 0, 255).astype(np.uint8)
        
        # Merge the channels back
        return cv2.merge([b, g, r])
    
    def sepia_filter(self, img, intensity=0.5):
        """
        Apply sepia tone effect for a vintage look
        
        Args:
            img: Input image
            intensity: Strength of sepia effect (0-1)
            
        Returns:
            Sepia-toned image
        """
        # Convert to float to avoid overflow
        img_float = img.astype(float) / 255.0
        
        # Sepia matrix
        sepia_matrix = np.array([
            [0.393, 0.769, 0.189],
            [0.349, 0.686, 0.168],
            [0.272, 0.534, 0.131]
        ])
        
        # Convert to sepia
        sepia_img = np.zeros_like(img_float)
        for i in range(3):
            sepia_img[:,:,i] = np.sum(img_float * sepia_matrix[i], axis=2)
        
        # Clip values to valid range
        sepia_img = np.clip(sepia_img, 0, 1)
        
        # Blend with original based on intensity
        blended = cv2.addWeighted(img_float, 1 - intensity, sepia_img, intensity, 0)
        
        # Convert back to uint8
        return (blended * 255).astype(np.uint8)
    
    def noise_reduction(self, img, strength=7):
        """
        Apply noise reduction using Non-Local Means Denoising
        
        Args:
            img: Input image
            strength: Strength of noise reduction (higher values = more smoothing)
            
        Returns:
            Denoised image
        """
        # Apply Non-Local Means Denoising
        return cv2.fastNlMeansDenoisingColored(img, None, strength, strength, 7, 21)
    
    def sharpen(self, img, strength=1.0):
        """
        Sharpen image using an unsharp mask with predefined parameters
        
        Args:
            img: Input image
            strength: Sharpen strength multiplier
            
        Returns:
            Sharpened image
        """
        # Define sharpening kernel
        kernel = np.array([[-1, -1, -1],
                          [-1, 9 + strength, -1],
                          [-1, -1, -1]], dtype=np.float32)
        
        # Apply kernel
        sharpened = cv2.filter2D(img, -1, kernel)
        
        # Ensure values are in valid range
        return np.clip(sharpened, 0, 255).astype(np.uint8)
        
    # Medical image processing methods
    
    def clahe_enhance(self, img, clip_limit=2.0, grid_size=8):
        """
        CLAHE (Contrast Limited Adaptive Histogram Equalization) for medical images
        
        Args:
            img: Input image
            clip_limit: Threshold for contrast limiting
            grid_size: Size of grid for histogram equalization
            
        Returns:
            CLAHE enhanced image
        """
        # Convert grid_size to tuple if it's a scalar
        if isinstance(grid_size, int):
            grid_size = (grid_size, grid_size)
            
        return self.medical_processor.clahe_enhance(img, clip_limit, grid_size)
    
    def dicom_window(self, img, window_width=400, window_level=50):
        """
        Apply DICOM windowing for medical images
        
        Args:
            img: Input image
            window_width: Window width (contrast)
            window_level: Window level (brightness)
            
        Returns:
            Windowed image
        """
        return self.medical_processor.dicom_window_level(img, window_width, window_level)
    
    def enhance_vessels(self, img, strength=1.5):
        """
        Enhance blood vessels visibility in angiograms
        
        Args:
            img: Input image
            strength: Enhancement strength
            
        Returns:
            Vessel-enhanced image
        """
        return self.medical_processor.enhance_vessels(img, strength)
