import os
import logging
import cv2
import numpy as np
import zipfile
import uuid
import time
import shutil
from flask import Flask, request, jsonify, send_file, render_template, session
from io import BytesIO
from backend.image_processor import ImageProcessor

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__, template_folder="../templates", static_folder="../static")
app.secret_key = os.environ.get("SESSION_SECRET", "pic_wizard_secret_key")

# Create temp directory for batch processing
TEMP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp')
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)
    
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
        # Medical image processing methods
        elif method == 'clahe_enhance':
            clip_limit = float(params.get('clip_limit', 2.0))
            grid_size = int(params.get('grid_size', 8))
            result = processor.clahe_enhance(img, clip_limit=clip_limit, grid_size=grid_size)
        elif method == 'dicom_window':
            window_width = int(params.get('window_width', 400))
            window_level = int(params.get('window_level', 50))
            result = processor.dicom_window(img, window_width=window_width, window_level=window_level)
        elif method == 'enhance_vessels':
            strength = float(params.get('strength', 1.5))
            result = processor.enhance_vessels(img, strength=strength)
        elif method == 'extract_palette':
            # Extract color palette
            num_colors = int(params.get('num_colors', 5))
            palette = processor.extract_color_palette(img, num_colors=num_colors)
            
            # Return palette as JSON without encoding image
            return jsonify({
                'method': method,
                'palette': palette
            })
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

@app.route('/batch-enhance', methods=['POST'])
def batch_enhance():
    """Process multiple images using the same enhancement method"""
    try:
        logger.debug("Received batch enhancement request")
        
        # Check if image files are present in request
        if 'images[]' not in request.files:
            logger.error("No image files in request")
            return jsonify({"error": "No image files provided"}), 400
        
        files = request.files.getlist('images[]')
        method = request.form.get('method', '')
        logger.debug(f"Batch enhancement method requested: {method}")
        
        # Create a unique session directory for this batch
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(TEMP_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Store the session ID
        session['batch_session'] = session_id
        
        # Track processed files
        processed_files = []
        
        # Process each image
        for i, file in enumerate(files):
            # Validate file
            if file.filename == '':
                continue
                
            # Read image
            file_bytes = file.read()
            
            try:
                img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
                if img is None:
                    logger.warning(f"Failed to decode image {file.filename}, skipping")
                    continue
            except Exception as e:
                logger.warning(f"Error decoding image {file.filename}: {str(e)}, skipping")
                continue
            
            # Get parameters and apply enhancement
            params = request.form.to_dict()
            
            try:
                # Apply the same enhancement as in the 'enhance' route
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
                # Medical image processing methods
                elif method == 'clahe_enhance':
                    clip_limit = float(params.get('clip_limit', 2.0))
                    grid_size = int(params.get('grid_size', 8))
                    result = processor.clahe_enhance(img, clip_limit=clip_limit, grid_size=grid_size)
                elif method == 'dicom_window':
                    window_width = int(params.get('window_width', 400))
                    window_level = int(params.get('window_level', 50))
                    result = processor.dicom_window(img, window_width=window_width, window_level=window_level)
                elif method == 'enhance_vessels':
                    strength = float(params.get('strength', 1.5))
                    result = processor.enhance_vessels(img, strength=strength)
                else:
                    logger.error(f"Unknown method: {method}")
                    return jsonify({"error": f"Unknown enhancement method: {method}"}), 400
                
                # Save processed image
                img_format = params.get('format', 'png')
                if img_format == 'jpg' or img_format == 'jpeg':
                    ext = '.jpg'
                    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), int(float(params.get('quality', 0.9)) * 100)]
                elif img_format == 'webp':
                    ext = '.webp'
                    encode_param = [int(cv2.IMWRITE_WEBP_QUALITY), int(float(params.get('quality', 0.9)) * 100)]
                else:
                    ext = '.png'
                    encode_param = []
                
                # Get original filename without extension and add new extension
                base_filename = os.path.splitext(file.filename)[0]
                output_filename = f"{base_filename}_enhanced{ext}"
                output_path = os.path.join(session_dir, output_filename)
                
                # Save the processed image
                if len(encode_param) > 0:
                    cv2.imwrite(output_path, result, encode_param)
                else:
                    cv2.imwrite(output_path, result)
                
                processed_files.append({
                    'original': file.filename,
                    'processed': output_filename,
                    'path': output_path
                })
                
            except Exception as e:
                logger.exception(f"Error processing image {file.filename}")
                continue
        
        # Check if any files were processed
        if not processed_files:
            shutil.rmtree(session_dir, ignore_errors=True)
            return jsonify({"error": "No images were successfully processed"}), 400
        
        # Store processed files info in session
        session['processed_files'] = processed_files
        
        return jsonify({
            "message": f"Successfully processed {len(processed_files)} images",
            "session_id": session_id,
            "count": len(processed_files)
        })
        
    except Exception as e:
        logger.exception("Error in batch processing")
        return jsonify({"error": str(e)}), 500


@app.route('/download-zip', methods=['GET'])
def download_zip():
    """Download all processed images as a ZIP file"""
    try:
        # Get session data
        session_id = session.get('batch_session')
        if not session_id:
            return jsonify({"error": "No active batch session"}), 400
        
        session_dir = os.path.join(TEMP_DIR, session_id)
        if not os.path.exists(session_dir):
            return jsonify({"error": "Session data not found"}), 404
        
        # Create a zip file in memory
        memory_file = BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(session_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, session_dir)
                    zipf.write(file_path, arcname)
        
        memory_file.seek(0)
        
        # Clean up the session directory after a delay to ensure download completes
        def cleanup_session_dir():
            time.sleep(60)  # Wait for 60 seconds
            if os.path.exists(session_dir):
                shutil.rmtree(session_dir, ignore_errors=True)
        
        # Start cleanup in a separate thread
        import threading
        cleanup_thread = threading.Thread(target=cleanup_session_dir)
        cleanup_thread.daemon = True
        cleanup_thread.start()
        
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'picwizard_enhanced_{session_id[:8]}.zip'
        )
        
    except Exception as e:
        logger.exception("Error creating ZIP file")
        return jsonify({"error": str(e)}), 500

        
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
