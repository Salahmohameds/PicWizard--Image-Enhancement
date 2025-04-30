import cv2
import numpy as np

class ImageProcessor:
    """Class for image enhancement operations using OpenCV"""
    
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
