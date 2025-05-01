import cv2
import numpy as np

class MedicalImageProcessor:
    """Class for specialized medical image enhancement operations"""
    
    def clahe_enhance(self, img, clip_limit=2.0, grid_size=(8, 8)):
        """
        CLAHE (Contrast Limited Adaptive Histogram Equalization) for X-ray/MRI enhancement
        
        Args:
            img: Input image (BGR format)
            clip_limit: Threshold for contrast limiting
            grid_size: Size of grid for histogram equalization
            
        Returns:
            Enhanced image
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        
        # Split channels
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE to L-channel
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=grid_size)
        l_clahe = clahe.apply(l)
        
        # Merge channels and convert back to BGR
        return cv2.cvtColor(cv2.merge([l_clahe, a, b]), cv2.COLOR_LAB2BGR)
    
    def dicom_window_level(self, img, window_width=400, window_level=50):
        """
        Adjust DICOM windowing for medical images (CT/MRI)
        
        Args:
            img: Input image
            window_width: Width of the window (contrast)
            window_level: Center of the window (brightness)
            
        Returns:
            Windowed image
        """
        # Convert to grayscale if not already
        if len(img.shape) > 2:
            img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            img_gray = img.copy()
            
        # Calculate window boundaries
        lower = window_level - window_width // 2
        upper = window_level + window_width // 2
        
        # Apply windowing
        img_gray = np.clip(img_gray, lower, upper)
        
        # Normalize to 0-255
        img_normalized = cv2.normalize(img_gray, None, 0, 255, cv2.NORM_MINMAX)
        
        # Convert back to 3-channel if input was 3-channel
        if len(img.shape) > 2:
            return cv2.cvtColor(img_normalized.astype(np.uint8), cv2.COLOR_GRAY2BGR)
        else:
            return img_normalized.astype(np.uint8)
    
    def enhance_vessels(self, img, strength=1.5):
        """
        Edge enhancement optimized for blood vessels in angiograms
        
        Args:
            img: Input image
            strength: Enhancement strength
            
        Returns:
            Edge-enhanced image for vessel visualization
        """
        # Apply slight Gaussian blur
        blurred = cv2.GaussianBlur(img, (3, 3), 0)
        
        # Apply unsharp mask technique with strength parameter
        return cv2.addWeighted(img, 1.0 + strength, blurred, -strength, 0)