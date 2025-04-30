import os
import logging
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_file, render_template
from io import BytesIO
from backend.image_processor import ImageProcessor

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__, template_folder="../templates", static_folder="../static")
app.secret_key = os.environ.get("SESSION_SECRET", "pic_wizard_secret_key")

# Initialize image processor
processor = ImageProcessor()

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/enhance', methods=['POST'])
def enhance():
    """Process an image using the specified enhancement method"""
    try:
        logger.debug("Received enhancement request")
        
        # Check if image file is present in request
        if 'image' not in request.files:
            logger.error("No image file in request")
            return jsonify({"error": "No image file"}), 400
        
        file = request.files['image']
        method = request.form.get('method', '')
        logger.debug(f"Enhancement method requested: {method}")
        
        # Validate file
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({"error": "No selected file"}), 400
        
        # Read image
        file_bytes = file.read()
        logger.debug(f"Read {len(file_bytes)} bytes from uploaded file")
        
        try:
            img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                logger.error("Failed to decode image")
                return jsonify({"error": "Invalid image format"}), 400
            
            logger.debug(f"Image successfully decoded. Shape: {img.shape}")
        except Exception as e:
            logger.exception("Error during image decoding")
            return jsonify({"error": f"Image decoding error: {str(e)}"}), 400
        
        # Get parameters and apply enhancement
        params = request.form.to_dict()
        logger.debug(f"Applying {method} with params: {params}")
        
        if method == 'histogram_equalization':
            result = processor.histogram_equalization(img)
        elif method == 'gamma_correction':
            gamma = float(params.get('gamma', 1.0))
            result = processor.gamma_correction(img, gamma)
        elif method == 'unsharp_mask':
            amount = float(params.get('amount', 1.0))
            radius = int(params.get('radius', 5))
            result = processor.unsharp_mask(img, kernel_size=(radius, radius), amount=amount)
        elif method == 'gaussian_blur':
            radius = int(params.get('radius', 5))
            result = processor.gaussian_blur(img, radius)
        elif method == 'edge_detection':
            detection_method = params.get('detection_method', 'sobel')
            threshold1 = int(params.get('threshold1', 100))
            threshold2 = int(params.get('threshold2', 200))
            result = processor.edge_detection(img, method=detection_method, threshold1=threshold1, threshold2=threshold2)
        elif method == 'super_resolution':
            scale_factor = int(params.get('scale_factor', 2))
            result = processor.super_resolution(img, scale_factor=scale_factor)
        elif method == 'color_balance':
            r_factor = float(params.get('r_factor', 1.0))
            g_factor = float(params.get('g_factor', 1.0))
            b_factor = float(params.get('b_factor', 1.0))
            result = processor.color_balance(img, r_factor=r_factor, g_factor=g_factor, b_factor=b_factor)
        elif method == 'sepia_filter':
            intensity = float(params.get('intensity', 0.5))
            result = processor.sepia_filter(img, intensity=intensity)
        elif method == 'noise_reduction':
            strength = int(params.get('strength', 7))
            result = processor.noise_reduction(img, strength=strength)
        elif method == 'sharpen':
            strength = float(params.get('strength', 1.0))
            result = processor.sharpen(img, strength=strength)
        else:
            logger.error(f"Unknown method: {method}")
            return jsonify({"error": f"Unknown enhancement method: {method}"}), 400
            
        # Return processed image
        img_buffer = BytesIO()
        _, img_encoded = cv2.imencode('.png', result)
        img_buffer.write(img_encoded)
        img_buffer.seek(0)
        
        return send_file(img_buffer, mimetype='image/png')
        
    except Exception as e:
        logger.exception("Error processing image")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
