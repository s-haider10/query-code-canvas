
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use Agg backend to avoid GUI issues
import matplotlib.pyplot as plt
import io
import base64
import os
import json
import logging
from data_manager import DataManager
from prompt_engineer import PromptEngineer
from llm_client import LLMClient
from code_executor import CodeExecutor

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS

# Initialize components
data_manager = DataManager()
prompt_engineer = PromptEngineer()
llm_client = LLMClient()
code_executor = CodeExecutor()

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    """Return a list of available datasets"""
    try:
        datasets = data_manager.list_datasets()
        return jsonify({"datasets": datasets})
    except Exception as e:
        logger.error(f"Error listing datasets: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/datasets/<dataset_id>', methods=['GET'])
def get_dataset_info(dataset_id):
    """Return information about a specific dataset"""
    try:
        info = data_manager.get_dataset_info(dataset_id)
        if info:
            return jsonify(info)
        return jsonify({"error": "Dataset not found"}), 404
    except Exception as e:
        logger.error(f"Error getting dataset info: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    """Process a natural language query and return code, visualization, and explanation"""
    try:
        data = request.json
        if not data or 'query' not in data or 'dataset' not in data:
            return jsonify({"error": "Missing required parameters"}), 400
        
        query = data['query']
        dataset_id = data['dataset']
        
        # Load and preprocess dataset
        df = data_manager.get_dataset(dataset_id)
        if df is None:
            return jsonify({"error": f"Dataset '{dataset_id}' not found"}), 404
        
        # Generate prompt for code
        columns = list(df.columns)
        code_prompt = prompt_engineer.zero_shot_prompt(query, columns)
        
        # Generate code from LLM
        generated_code = llm_client.generate_code(code_prompt)
        if not generated_code:
            return jsonify({"error": "Failed to generate code"}), 500
        
        # Execute code safely
        result = code_executor.safe_execute(generated_code, df)
        
        # Check if result is an error message
        if isinstance(result, str) and result.startswith("Error:"):
            return jsonify({"error": result, "code": generated_code}), 400
        
        # Generate explanation for the visualization
        explanation_prompt = f"Explain this data visualization in plain English. The query was: '{query}'. The code is: {generated_code}"
        explanation = llm_client.generate_explanation(explanation_prompt)
        
        # Convert plot to base64 image
        img_data = io.BytesIO()
        plt.savefig(img_data, format='png')
        img_data.seek(0)
        encoded_img = base64.b64encode(img_data.getvalue()).decode('utf-8')
        plt.close()  # Close the figure to free memory
        
        return jsonify({
            "code": generated_code,
            "image": encoded_img,
            "explanation": explanation,
            "success": True
        })
        
    except Exception as e:
        logger.error(f"Error analyzing data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_dataset():
    """Handle user dataset uploads"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        # Check file size (limit to 10MB)
        if len(file.read()) > 10 * 1024 * 1024:  # 10MB in bytes
            return jsonify({"error": "File too large (max 10MB)"}), 400
        file.seek(0)  # Reset file pointer after reading
            
        # Process the upload
        dataset_id = data_manager.upload_dataset(file)
        return jsonify({"success": True, "dataset_id": dataset_id})
        
    except Exception as e:
        logger.error(f"Error uploading dataset: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
