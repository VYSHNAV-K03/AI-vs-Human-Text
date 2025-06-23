from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
from model import predict_generated
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def extract_text_from_pdf(pdf_path):
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

@app.route('/predict', methods=['POST'])
def predict_text():
    input_text = request.json.get('text', '')
    if not input_text.strip():
        return jsonify({'error': 'No input text provided'}), 400

    result = predict_generated(input_text)
    return jsonify({'prediction': result})

@app.route('/predict-pdf', methods=['POST'])
def predict_pdf():
    pdf_file = request.files.get('file', None)

    if not pdf_file:
        return jsonify({'error': 'No PDF file provided'}), 400

    filename = secure_filename(pdf_file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    pdf_file.save(filepath)

    try:
        extracted_text = extract_text_from_pdf(filepath)
        result = predict_generated(extracted_text)
    finally:
        os.remove(filepath)  # Clean up after use

    return jsonify({'prediction': result})

if __name__ == '__main__':
    app.run(debug=True)
