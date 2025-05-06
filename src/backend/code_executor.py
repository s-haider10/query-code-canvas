
import ast
import builtins
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Set non-interactive backend for server
import matplotlib.pyplot as plt
import seaborn as sns
import io
from typing import Union, Any, Dict, Set
import logging

logger = logging.getLogger(__name__)

class RestrictedGlobals:
    """Define a restricted subset of globals for code execution"""
    def __init__(self, dataset: pd.DataFrame):
        # Safe modules and functions
        self.globals = {
            'pd': pd,
            'np': np,
            'plt': plt,
            'sns': sns,
            'df': dataset,  # The dataset to work with
            
            # Built-in functions that are safe
            'len': len,
            'range': range,
            'enumerate': enumerate,
            'zip': zip,
            'list': list,
            'dict': dict,
            'set': set,
            'tuple': tuple,
            'sum': sum,
            'min': min,
            'max': max,
            'sorted': sorted,
            'round': round,
            'abs': abs,
            'all': all,
            'any': any,
            'filter': filter,
            'map': map,
            
            # Constants
            'True': True,
            'False': False,
            'None': None,
        }

class CodeAnalyzer(ast.NodeVisitor):
    """AST visitor to check for potentially dangerous operations"""
    def __init__(self):
        self.errors = []
        
        # Disallowed modules and attributes
        self.blacklist_modules = {'os', 'sys', 'subprocess', 'shutil', 'pathlib', 
                                 'requests', 'urllib', 'socket', 'builtins', 'eval', 
                                 'exec', '__import__'}
        
        self.blacklist_functions = {'eval', 'exec', 'compile', '__import__', 'open', 
                                   'input', '__builtins__', 'globals', 'locals', 
                                   'getattr', 'setattr', 'delattr', 'isinstance',
                                   'file', 'write', 'read'}
    
    def visit_Import(self, node):
        """Check import statements"""
        for name in node.names:
            if name.name.split('.')[0] in self.blacklist_modules:
                self.errors.append(f"Importing disallowed module: {name.name}")
        self.generic_visit(node)
    
    def visit_ImportFrom(self, node):
        """Check from-import statements"""
        if node.module and node.module.split('.')[0] in self.blacklist_modules:
            self.errors.append(f"Importing from disallowed module: {node.module}")
        self.generic_visit(node)
    
    def visit_Call(self, node):
        """Check function calls"""
        if isinstance(node.func, ast.Name) and node.func.id in self.blacklist_functions:
            self.errors.append(f"Call to disallowed function: {node.func.id}")
        elif isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name) and node.func.value.id in self.blacklist_modules:
                self.errors.append(f"Access to disallowed module: {node.func.value.id}")
            if node.func.attr in self.blacklist_functions:
                self.errors.append(f"Call to disallowed function: {node.func.attr}")
        self.generic_visit(node)


class CodeExecutor:
    def __init__(self):
        self.timeout_seconds = 15  # Maximum execution time in seconds
    
    def check_code_safety(self, code: str) -> list:
        """Check code for potentially unsafe operations"""
        try:
            tree = ast.parse(code)
            analyzer = CodeAnalyzer()
            analyzer.visit(tree)
            return analyzer.errors
        except SyntaxError as e:
            return [f"Syntax error: {str(e)}"]
    
    def safe_execute(self, code: str, dataset: pd.DataFrame) -> Union[matplotlib.figure.Figure, str]:
        """Safely execute code and return the result or error message"""
        # First check code safety
        safety_issues = self.check_code_safety(code)
        if safety_issues:
            error_msg = "Safety issues detected:\n" + "\n".join(safety_issues)
            logger.warning(f"Code safety check failed: {error_msg}")
            return f"Error: {error_msg}"
        
        # Close any existing figures
        plt.close('all')
        
        # Prepare restricted globals
        restricted_globals = RestrictedGlobals(dataset).globals
        
        # Execute in try-except block
        try:
            # Execute the code with timeout
            exec(compile(code, '<string>', 'exec'), restricted_globals)
            
            # Get the current figure
            if plt.get_fignums():
                fig = plt.gcf()
                return fig
            else:
                return "Error: No figure was created"
            
        except Exception as e:
            logger.error(f"Error executing code: {str(e)}")
            return f"Error: {str(e)}"
