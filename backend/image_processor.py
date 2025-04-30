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
