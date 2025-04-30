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
        # Check if image file is present in request
        if 'image' not in request.files:
            logger.error("No image file in request")
            return jsonify({"error": "No image file"}), 400
        
        file = request.files['image']
        method = request.form.get('method', '')
        
        # Validate file
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({"error": "No selected file"}), 400
        
        # Read image
        file_bytes = file.read()
        img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        if img is None:
            logger.error("Failed to decode image")
            return jsonify({"error": "Invalid image format"}), 400
        
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
    app.run(host='0.0.0.0', port=8000, debug=True)
