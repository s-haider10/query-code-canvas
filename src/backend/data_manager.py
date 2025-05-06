
import pandas as pd
import numpy as np
import os
import uuid
from typing import Dict, List, Optional, Any
import logging
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

class DataManager:
    def __init__(self):
        """Initialize with predefined datasets and create necessary directories"""
        self.datasets_dir = os.path.join(os.path.dirname(__file__), "datasets")
        self.uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
        
        # Create directories if they don't exist
        os.makedirs(self.datasets_dir, exist_ok=True)
        os.makedirs(self.uploads_dir, exist_ok=True)
        
        # Dataset metadata
        self.dataset_info = {
            "titanic": {
                "name": "Titanic Passenger Data",
                "description": "Information about passengers aboard the RMS Titanic",
                "url": "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv",
                "sample_size": 5
            },
            "iris": {
                "name": "Iris Flower Dataset",
                "description": "Classic dataset containing measurements for three iris flower species",
                "url": "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv",
                "sample_size": 5
            },
            "gapminder": {
                "name": "Gapminder World Data",
                "description": "Economic, social and demographic data for countries around the world",
                "url": "https://raw.githubusercontent.com/plotly/datasets/master/gapminderDataFiveYear.csv",
                "sample_size": 5
            }
        }
        
        # Cache for loaded datasets
        self.loaded_datasets = {}
        
        # Load predefined datasets
        self.load_predefined_datasets()
    
    def load_predefined_datasets(self):
        """Load predefined datasets from URLs or local cache"""
        for dataset_id, info in self.dataset_info.items():
            try:
                # Check if dataset file exists locally
                local_path = os.path.join(self.datasets_dir, f"{dataset_id}.csv")
                if os.path.exists(local_path):
                    logger.info(f"Loading {dataset_id} from local file")
                    df = pd.read_csv(local_path)
                else:
                    # Download and save dataset
                    logger.info(f"Downloading {dataset_id} from URL: {info['url']}")
                    df = pd.read_csv(info['url'])
                    df.to_csv(local_path, index=False)
                
                # Preprocess dataset
                df = self.preprocess(df)
                
                # Cache dataset info with sample and columns
                self.dataset_info[dataset_id].update({
                    "columns": list(df.columns),
                    "sample": df.head(info["sample_size"]).to_dict(orient="records"),
                    "rows": len(df),
                    "columns_count": len(df.columns)
                })
            except Exception as e:
                logger.error(f"Error loading dataset {dataset_id}: {str(e)}")
    
    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and preprocess the dataframe"""
        # Make a copy to avoid modifying the original
        df = df.copy()
        
        # Lowercase column names and replace spaces with underscores
        df.columns = [col.lower().replace(' ', '_') for col in df.columns]
        
        # Fill missing numeric values with median
        numeric_cols = df.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            if df[col].isna().any():
                df[col] = df[col].fillna(df[col].median())
        
        # Fill missing categorical values with mode
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if df[col].isna().any():
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "unknown")
        
        return df
    
    def get_dataset(self, dataset_id: str) -> Optional[pd.DataFrame]:
        """Load and return a dataset by ID"""
        # Check if it's a predefined dataset
        if dataset_id in self.dataset_info:
            try:
                # Load from cache or file
                if dataset_id not in self.loaded_datasets:
                    file_path = os.path.join(self.datasets_dir, f"{dataset_id}.csv")
                    self.loaded_datasets[dataset_id] = pd.read_csv(file_path)
                return self.loaded_datasets[dataset_id]
            except Exception as e:
                logger.error(f"Error loading dataset {dataset_id}: {str(e)}")
                return None
        
        # Check if it's a user-uploaded dataset
        upload_path = os.path.join(self.uploads_dir, f"{dataset_id}.csv")
        if os.path.exists(upload_path):
            try:
                if dataset_id not in self.loaded_datasets:
                    self.loaded_datasets[dataset_id] = pd.read_csv(upload_path)
                return self.loaded_datasets[dataset_id]
            except Exception as e:
                logger.error(f"Error loading user dataset {dataset_id}: {str(e)}")
                return None
        
        return None
    
    def list_datasets(self) -> List[Dict[str, Any]]:
        """Return a list of all available datasets with basic info"""
        datasets = []
        
        # Add predefined datasets
        for dataset_id, info in self.dataset_info.items():
            datasets.append({
                "id": dataset_id,
                "name": info["name"],
                "description": info["description"],
                "predefined": True,
                "rows": info.get("rows", 0),
                "columns_count": info.get("columns_count", 0)
            })
        
        # Add user-uploaded datasets
        for filename in os.listdir(self.uploads_dir):
            if filename.endswith('.csv'):
                dataset_id = filename[:-4]  # Remove .csv extension
                if dataset_id not in self.dataset_info:
                    try:
                        df = pd.read_csv(os.path.join(self.uploads_dir, filename), nrows=5)
                        datasets.append({
                            "id": dataset_id,
                            "name": f"User dataset: {filename}",
                            "description": "User uploaded dataset",
                            "predefined": False,
                            "rows": len(pd.read_csv(os.path.join(self.uploads_dir, filename), usecols=[0])),
                            "columns_count": len(df.columns)
                        })
                    except Exception as e:
                        logger.error(f"Error processing uploaded dataset {filename}: {str(e)}")
        
        return datasets
    
    def get_dataset_info(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific dataset"""
        # Check if it's a predefined dataset
        if dataset_id in self.dataset_info:
            return self.dataset_info[dataset_id]
        
        # Check if it's a user-uploaded dataset
        upload_path = os.path.join(self.uploads_dir, f"{dataset_id}.csv")
        if os.path.exists(upload_path):
            try:
                df = pd.read_csv(upload_path)
                return {
                    "name": f"User dataset: {dataset_id}",
                    "description": "User uploaded dataset",
                    "columns": list(df.columns),
                    "sample": df.head(5).to_dict(orient="records"),
                    "rows": len(df),
                    "columns_count": len(df.columns),
                    "predefined": False
                }
            except Exception as e:
                logger.error(f"Error getting info for user dataset {dataset_id}: {str(e)}")
        
        return None
    
    def upload_dataset(self, file):
        """Process an uploaded dataset file"""
        # Secure filename to prevent directory traversal
        filename = secure_filename(file.filename)
        
        # Generate a unique ID for this dataset
        dataset_id = str(uuid.uuid4())[:8]
        
        # Save the file
        upload_path = os.path.join(self.uploads_dir, f"{dataset_id}.csv")
        file.save(upload_path)
        
        # Load and preprocess
        try:
            df = pd.read_csv(upload_path)
            df = self.preprocess(df)
            df.to_csv(upload_path, index=False)
            
            # Clear from cache if it exists
            if dataset_id in self.loaded_datasets:
                del self.loaded_datasets[dataset_id]
            
            return dataset_id
        except Exception as e:
            # If there's an error, delete the uploaded file
            if os.path.exists(upload_path):
                os.remove(upload_path)
            logger.error(f"Error processing uploaded file: {str(e)}")
            raise e
