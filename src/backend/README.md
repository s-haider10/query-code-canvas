
# Automated Data Analysis Agent Backend

This Python backend processes natural language queries, generates Python code using LLMs, executes it safely, and returns visualizations.

## Setup Instructions

### Prerequisites
- Python 3.9+
- Required Python libraries: flask, flask-cors, pandas, matplotlib, numpy, openai, seaborn

### Installation

1. Create a Python virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install required packages:
```bash
pip install flask flask-cors pandas matplotlib numpy openai seaborn
```

3. Set up your OpenAI API key as an environment variable:
```bash
# Linux/MacOS
export OPENAI_API_KEY=your_api_key_here

# Windows
set OPENAI_API_KEY=your_api_key_here
```

### Running the Server

1. Navigate to the backend directory:
```bash
cd src/backend
```

2. Start the Flask server:
```bash
python app.py
```

The server will run on http://localhost:5001 by default.

## API Endpoints

- `GET /api/datasets` - List all available datasets
- `GET /api/datasets/<dataset_id>` - Get information about a specific dataset
- `POST /api/analyze` - Process a query and return code/visualization
- `POST /api/upload` - Upload a custom dataset (max 10MB)

## Security Notes

- The code executor uses a sandboxed environment to prevent malicious code execution
- Blacklisted modules include: os, sys, subprocess, shutil, pathlib, etc.
- Maximum code execution time is limited to 15 seconds
