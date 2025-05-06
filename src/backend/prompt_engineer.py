
import string
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class PromptEngineer:
    def __init__(self):
        """Initialize with prompt templates"""
        # Example datasets for few-shot examples
        self.examples = self._load_examples()
    
    def _load_examples(self) -> Dict[str, List[Dict[str, str]]]:
        """Load example queries and code for few-shot prompting"""
        return {
            "titanic": [
                {
                    "query": "Plot survival rate by passenger class",
                    "code": """
# Calculate survival rate by passenger class
survival_by_class = df.groupby('pclass')['survived'].mean() * 100

# Create bar plot
plt.figure(figsize=(10, 6))
ax = survival_by_class.plot(kind='bar', color='skyblue')
plt.title('Survival Rate by Passenger Class')
plt.xlabel('Passenger Class')
plt.ylabel('Survival Rate (%)')
plt.xticks(rotation=0)

# Add percentage labels on bars
for i, v in enumerate(survival_by_class):
    ax.text(i, v + 1, f"{v:.1f}%", ha='center')

plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.tight_layout()
"""
                },
                {
                    "query": "Create a histogram of passenger ages",
                    "code": """
# Create histogram of passenger ages
plt.figure(figsize=(12, 6))
plt.hist(df['age'].dropna(), bins=30, color='skyblue', edgecolor='black', alpha=0.7)
plt.title('Distribution of Passenger Ages on Titanic')
plt.xlabel('Age (years)')
plt.ylabel('Count')
plt.grid(True, alpha=0.3, linestyle='--')
plt.axvline(df['age'].mean(), color='red', linestyle='dashed', linewidth=2, label=f'Mean Age: {df["age"].mean():.1f} years')
plt.legend()
plt.tight_layout()
"""
                }
            ],
            "iris": [
                {
                    "query": "Plot sepal length vs sepal width colored by species",
                    "code": """
# Create scatter plot of sepal dimensions colored by species
plt.figure(figsize=(10, 6))
species_colors = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}

for species in df['species'].unique():
    subset = df[df['species'] == species]
    plt.scatter(subset['sepal_length'], subset['sepal_width'], 
                label=species, color=species_colors[species], alpha=0.7)

plt.title('Sepal Length vs Sepal Width by Species')
plt.xlabel('Sepal Length (cm)')
plt.ylabel('Sepal Width (cm)')
plt.grid(True, alpha=0.3, linestyle='--')
plt.legend()
plt.tight_layout()
"""
                }
            ]
        }

    def zero_shot_prompt(self, query: str, columns: List[str]) -> str:
        """Generate a zero-shot prompt for the LLM"""
        columns_str = ", ".join(columns)
        
        return f"""Generate Python code to {query} using pandas and matplotlib.
        The data is in a pandas DataFrame named 'df' with columns: {columns_str}.
        Only include the Python code needed to create the visualization, nothing else.
        Use matplotlib or seaborn with clear labels, titles, and styling for the plot.
        The code should be complete and ready to execute with no imports needed.
        """

    def few_shot_prompt(self, query: str, columns: List[str], dataset_type: str = None) -> str:
        """Generate a few-shot prompt with examples for the LLM"""
        # Base prompt
        prompt = self.zero_shot_prompt(query, columns)
        
        # Add examples if available for the dataset type
        examples = []
        if dataset_type and dataset_type in self.examples:
            examples = self.examples[dataset_type]
        elif len(self.examples) > 0:
            # If no specific dataset type, use the first available example set
            examples = next(iter(self.examples.values()))
        
        if examples:
            prompt += "\n\nHere are some examples of queries and their corresponding code:\n"
            for i, example in enumerate(examples):
                prompt += f"\nExample {i+1}:\nQuery: {example['query']}\nCode:\n{example['code']}\n"
            
            prompt += f"\nNow, generate code for the query: {query}"
        
        return prompt
    
    def specialized_prompt(self, query: str, columns: List[str], chart_type: str = None) -> str:
        """Generate a prompt specialized for a specific chart type"""
        base_prompt = self.zero_shot_prompt(query, columns)
        
        if not chart_type:
            return base_prompt
        
        # Add specialized instructions based on chart type
        chart_instructions = {
            "histogram": """
            Create a histogram with appropriate bins. Include:
            - A title describing what is being shown
            - Labeled axes with units if applicable
            - Grid lines for better readability
            - Statistics like mean or median shown as vertical lines
            """,
            "scatter": """
            Create a scatter plot with clear point markers. Include:
            - A title describing the relationship being explored
            - Labeled axes with units if applicable
            - A legend if using colors to represent categories
            - Consider adding a trend line if appropriate
            """,
            "bar": """
            Create a bar chart with clear bars. Include:
            - A descriptive title
            - Labeled axes with units if applicable
            - Value labels on top of each bar
            - Organized bars (consider sorting if appropriate)
            """,
            "box": """
            Create a box plot that shows the distribution. Include:
            - A descriptive title
            - Labeled axes with units if applicable
            - Clear labels for each category being compared
            - Consider adding individual data points with jitter
            """
        }
        
        if chart_type.lower() in chart_instructions:
            return base_prompt + chart_instructions[chart_type.lower()]
        
        return base_prompt
