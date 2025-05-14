
import os
import openai
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LLMClient:
    def __init__(self):
        """Initialize the OpenAI client"""
        self.api_key = os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            logger.warning("OPENAI_API_KEY environment variable not set")
        else:
            openai.api_key = self.api_key
    
    def generate_code(self, prompt: str) -> Optional[str]:
        """Generate code from the given prompt using OpenAI API"""
        if not self.api_key:
            logger.error("Cannot generate code: OpenAI API key not set")
            return None
            
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a data science assistant that generates Python code for data analysis and visualization. Only respond with code, no explanations or comments."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,  # Lower temperature for more deterministic outputs
                max_tokens=1000
            )
            
            # Extract generated code
            generated_text = response.choices[0].message.content
            return self._extract_code(generated_text)
            
        except Exception as e:
            logger.error(f"Error generating code with OpenAI API: {str(e)}")
            return None
    
    def generate_explanation(self, prompt: str) -> str:
        """Generate an explanation for a visualization"""
        if not self.api_key:
            logger.warning("Cannot generate explanation: OpenAI API key not set")
            return "No explanation available (API key not configured)."
            
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a data visualization expert. Explain visualizations in a clear, concise way that highlights the key insights."},
                    {"role": "user", "content": f"Generate executable Python code using pandas/matplotlib to: {prompt}. Dataset: {{dataset_name}} (Columns: {{columns}}). Return ONLY valid code with no explanations or comments."}
                ],
                temperature=0.7,  # Higher temperature for more creative explanations
                max_tokens=500
            )
            
            # Extract explanation
            explanation = response.choices[0].message.content
            return explanation
            
        except Exception as e:
            logger.error(f"Error generating explanation with OpenAI API: {str(e)}")
            return f"Could not generate explanation: {str(e)}"
    
    def _extract_code(self, text: str) -> str:
        """Extract code blocks from the response text"""
        # Look for code blocks surrounded by triple backticks
        code_pattern = r"```(?:python)?(.*?)```"
        matches = re.findall(code_pattern, text, re.DOTALL)
        
        if matches:
            # Join all code blocks if multiple are found
            return "\n".join(match.strip() for match in matches)
        else:
            # If no code blocks are found, use the entire text
            return text.strip()

    def mock_generate_code(self, prompt: str) -> str:
        """Mock implementation for testing without API calls"""
        logger.info(f"Using mock LLM with prompt: {prompt[:50]}...")
        
        # Extract query intent from prompt
        if "histogram" in prompt.lower() and "age" in prompt.lower():
            return """
# Create histogram of passenger ages
plt.figure(figsize=(10, 6))
plt.hist(df['age'].dropna(), bins=20, color='skyblue', edgecolor='black')
plt.title('Distribution of Passenger Ages')
plt.xlabel('Age (years)')
plt.ylabel('Frequency')
plt.grid(True, alpha=0.3)
plt.axvline(df['age'].mean(), color='red', linestyle='--', label=f'Mean: {df["age"].mean():.1f}')
plt.legend()
"""
        elif "survival" in prompt.lower() and "gender" in prompt.lower():
            return """
# Calculate survival rate by gender
survival_by_gender = df.groupby('sex')['survived'].mean() * 100

# Create bar plot
plt.figure(figsize=(8, 6))
bars = plt.bar(survival_by_gender.index, survival_by_gender.values, color=['blue', 'pink'])
plt.title('Survival Rate by Gender')
plt.xlabel('Gender')
plt.ylabel('Survival Rate (%)')
plt.ylim(0, 100)
plt.grid(axis='y', linestyle='--', alpha=0.7)

# Add percentage labels on bars
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height + 1,
             f'{height:.1f}%', ha='center', va='bottom')
"""
        else:
            # Default mock response
            return """
# Create a simple visualization
plt.figure(figsize=(10, 6))
plt.plot(df.iloc[:, 0], df.iloc[:, 1], 'o-', color='blue', alpha=0.7)
plt.title('Data Visualization')
plt.xlabel(df.columns[0])
plt.ylabel(df.columns[1])
plt.grid(True, alpha=0.3)
"""

    def mock_generate_explanation(self, prompt: str) -> str:
        """Mock implementation for explanation generation"""
        logger.info(f"Using mock explanation generator with prompt: {prompt[:50]}...")
        
        if "histogram" in prompt.lower() and "age" in prompt.lower():
            return """
This histogram shows the distribution of passenger ages on the Titanic. The x-axis represents age ranges, while the y-axis shows the count of passengers within each age range.

Key observations:
1. Most passengers were young to middle-aged adults (20-40 years old).
2. There's a noticeable group of children under 10 years old.
3. The red dashed line indicates the mean age of passengers.
4. There were very few elderly passengers (over 70 years old).

This visualization helps understand the demographic makeup of the Titanic's passengers and could be useful for analyzing survival rates across different age groups.
"""
        elif "survival" in prompt.lower() and "gender" in prompt.lower():
            return """
This bar chart illustrates the stark difference in survival rates between genders on the Titanic. 

Key insights:
1. Female passengers had a significantly higher survival rate (approximately 74%) compared to male passengers (about 19%).
2. This disparity reflects the "women and children first" protocol followed during the evacuation.
3. The nearly four-fold difference in survival probability based solely on gender was one of the most decisive factors determining one's chance of survival.

This visualization confirms the historical accounts that priority was given to female passengers when lifeboats were being loaded.
"""
        else:
            return """
This visualization displays the relationship between two variables in the dataset. The points represent individual data points, while the line shows the overall trend.

Some observations:
1. There appears to be a correlation between the two variables.
2. The data points show some scatter around the trend line, indicating variability.
3. This visualization helps identify patterns that might not be apparent from looking at raw numbers.

Further analysis would be needed to determine statistical significance and causality between these variables.
"""
