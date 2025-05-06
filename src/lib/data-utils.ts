
// Types for our datasets
export type DatasetType = 'titanic' | 'iris' | 'gapminder';

export interface DatasetInfo {
  id: DatasetType;
  name: string;
  description: string;
  url: string;
  columns: string[];
  sample: Record<string, unknown>[];
  preview: string;
}

// Mock datasets for the frontend
export const datasets: Record<DatasetType, DatasetInfo> = {
  titanic: {
    id: 'titanic',
    name: 'Titanic Passenger Data',
    description: 'Information about passengers aboard the RMS Titanic, including survival status, class, sex, age, etc.',
    url: 'https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv',
    columns: [
      'PassengerId', 'Survived', 'Pclass', 'Name', 'Sex', 'Age', 
      'SibSp', 'Parch', 'Ticket', 'Fare', 'Cabin', 'Embarked'
    ],
    sample: [
      { PassengerId: 1, Survived: 0, Pclass: 3, Name: 'Braund, Mr. Owen Harris', Sex: 'male', Age: 22, SibSp: 1, Parch: 0, Ticket: 'A/5 21171', Fare: 7.25, Cabin: null, Embarked: 'S' },
      { PassengerId: 2, Survived: 1, Pclass: 1, Name: 'Cumings, Mrs. John Bradley', Sex: 'female', Age: 38, SibSp: 1, Parch: 0, Ticket: 'PC 17599', Fare: 71.2833, Cabin: 'C85', Embarked: 'C' },
      { PassengerId: 3, Survived: 1, Pclass: 3, Name: 'Heikkinen, Miss. Laina', Sex: 'female', Age: 26, SibSp: 0, Parch: 0, Ticket: 'STON/O2. 3101282', Fare: 7.925, Cabin: null, Embarked: 'S' },
      { PassengerId: 4, Survived: 1, Pclass: 1, Name: 'Futrelle, Mrs. Jacques Heath', Sex: 'female', Age: 35, SibSp: 1, Parch: 0, Ticket: '113803', Fare: 53.1, Cabin: 'C123', Embarked: 'S' },
      { PassengerId: 5, Survived: 0, Pclass: 3, Name: 'Allen, Mr. William Henry', Sex: 'male', Age: 35, SibSp: 0, Parch: 0, Ticket: '373450', Fare: 8.05, Cabin: null, Embarked: 'S' },
    ],
    preview: '/titanic-preview.png'
  },
  iris: {
    id: 'iris',
    name: 'Iris Flower Dataset',
    description: 'Classic dataset containing measurements for three iris flower species.',
    url: 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv',
    columns: [
      'sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'
    ],
    sample: [
      { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
      { sepal_length: 4.9, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
      { sepal_length: 7.0, sepal_width: 3.2, petal_length: 4.7, petal_width: 1.4, species: 'versicolor' },
      { sepal_length: 6.3, sepal_width: 3.3, petal_length: 6.0, petal_width: 2.5, species: 'virginica' },
      { sepal_length: 5.8, sepal_width: 2.7, petal_length: 5.1, petal_width: 1.9, species: 'virginica' },
    ],
    preview: '/iris-preview.png'
  },
  gapminder: {
    id: 'gapminder',
    name: 'Gapminder World Data',
    description: 'Economic, social and demographic data for countries around the world.',
    url: 'https://raw.githubusercontent.com/plotly/datasets/master/gapminderDataFiveYear.csv',
    columns: [
      'country', 'continent', 'year', 'lifeExp', 'pop', 'gdpPercap'
    ],
    sample: [
      { country: 'Afghanistan', continent: 'Asia', year: 1952, lifeExp: 28.801, pop: 8425333, gdpPercap: 779.4453 },
      { country: 'United States', continent: 'Americas', year: 2007, lifeExp: 78.242, pop: 301139947, gdpPercap: 42951.65 },
      { country: 'China', continent: 'Asia', year: 2007, lifeExp: 72.961, pop: 1318683096, gdpPercap: 4959.115 },
      { country: 'Germany', continent: 'Europe', year: 2007, lifeExp: 79.406, pop: 82400996, gdpPercap: 32170.37 },
      { country: 'Nigeria', continent: 'Africa', year: 2007, lifeExp: 46.859, pop: 135031164, gdpPercap: 2013.977 },
    ],
    preview: '/gapminder-preview.png'
  }
};

// Sample predefined queries for each dataset
export const sampleQueries: Record<DatasetType, string[]> = {
  titanic: [
    'Plot survival rate by passenger class',
    'Create a histogram of passenger ages',
    'Show survival rate by gender',
    'Create a scatter plot of age vs fare',
    'Plot passenger count by embarkation point'
  ],
  iris: [
    'Plot sepal length vs sepal width colored by species',
    'Create a histogram of petal length',
    'Show box plots of petal dimensions by species',
    'Create pair plots of all features',
    'Calculate mean measurements by species'
  ],
  gapminder: [
    'Plot life expectancy vs GDP per capita for 2007',
    'Show population growth over time for top 5 countries',
    'Create a bar chart of life expectancy by continent',
    'Plot GDP per capita trends over time by continent',
    'Create a bubble chart of population vs GDP with life expectancy as size'
  ]
};

// Sample generated code for each query type
export const generateSampleCode = (dataset: DatasetType, query: string): string => {
  // In a real implementation, this would call the LLM API
  
  // Simple mapping of keywords to code examples
  if (query.toLowerCase().includes('histogram') && dataset === 'titanic') {
    return `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the Titanic dataset
df = pd.read_csv('titanic.csv')

# Create histogram of passenger ages
plt.figure(figsize=(10, 6))
sns.histplot(data=df, x='Age', bins=20, kde=True)
plt.title('Distribution of Passenger Ages on Titanic')
plt.xlabel('Age')
plt.ylabel('Count')
plt.grid(True, alpha=0.3)
plt.show()`;
  } 
  
  else if (query.toLowerCase().includes('survival') && query.toLowerCase().includes('gender')) {
    return `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the Titanic dataset
df = pd.read_csv('titanic.csv')

# Calculate survival rate by gender
survival_by_gender = df.groupby('Sex')['Survived'].mean() * 100

# Create bar plot
plt.figure(figsize=(8, 6))
sns.barplot(x=survival_by_gender.index, y=survival_by_gender.values)
plt.title('Survival Rate by Gender on Titanic')
plt.xlabel('Gender')
plt.ylabel('Survival Rate (%)')
plt.grid(True, alpha=0.3)
plt.show()`;
  }
  
  else if (query.toLowerCase().includes('scatter') || (query.toLowerCase().includes('age') && query.toLowerCase().includes('fare'))) {
    return `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the Titanic dataset
df = pd.read_csv('titanic.csv')

# Create scatter plot of Age vs Fare
plt.figure(figsize=(10, 8))
sns.scatterplot(data=df, x='Age', y='Fare', hue='Survived', size='Pclass',
                sizes=(50, 200), alpha=0.7)
plt.title('Age vs Fare with Survival Status')
plt.xlabel('Age (years)')
plt.ylabel('Fare (£)')
plt.grid(True, alpha=0.3)
plt.legend(title='Survived')
plt.show()`;
  } 
  
  else if (dataset === 'iris') {
    return `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the iris dataset
df = pd.read_csv('iris.csv')

# Create a scatter plot of sepal dimensions colored by species
plt.figure(figsize=(10, 8))
sns.scatterplot(data=df, x='sepal_length', y='sepal_width', hue='species')
plt.title('Sepal Length vs Sepal Width by Species')
plt.xlabel('Sepal Length (cm)')
plt.ylabel('Sepal Width (cm)')
plt.grid(True, alpha=0.3)
plt.legend(title='Species')
plt.show()`;
  } 
  
  else if (dataset === 'gapminder') {
    return `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the gapminder dataset
df = pd.read_csv('gapminder.csv')

# Filter for the year 2007
df_2007 = df[df['year'] == 2007]

# Create scatter plot of GDP per capita vs life expectancy
plt.figure(figsize=(12, 8))
sns.scatterplot(data=df_2007, x='gdpPercap', y='lifeExp', 
                hue='continent', size='pop', sizes=(20, 500),
                alpha=0.7)

plt.title('GDP per Capita vs Life Expectancy by Country (2007)')
plt.xlabel('GDP per Capita (USD)')
plt.ylabel('Life Expectancy (years)')
plt.grid(True, alpha=0.3)
plt.xscale('log')
plt.legend(title='Continent')
plt.show()`;
  }
  
  // Default code if no specific match
  return `import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the dataset
df = pd.read_csv('${dataset}.csv')

# Explore the data
print(df.head())
print(df.info())
print(df.describe())

# Create a visualization based on the query: "${query}"
plt.figure(figsize=(10, 6))
# [Generated code would appear here in a real implementation]
plt.title('${query}')
plt.grid(True, alpha=0.3)
plt.show()`;
};

// Sample visualization images for each dataset + query combination
export const getVisualizationImage = (dataset: DatasetType, query: string): string => {
  // In a real implementation, this would render a proper chart with a library
  
  // Simple mapping of keywords to sample images
  if (dataset === 'titanic') {
    if (query.toLowerCase().includes('histogram') && query.toLowerCase().includes('age')) {
      return '/titanic-age-histogram.png';
    } else if (query.toLowerCase().includes('survival') && query.toLowerCase().includes('gender')) {
      return '/titanic-gender-survival.png';
    } else if (query.toLowerCase().includes('scatter')) {
      return '/titanic-age-fare-scatter.png';
    } else if (query.toLowerCase().includes('class')) {
      return '/titanic-class-survival.png';
    }
    return '/titanic-default.png';
  } 
  else if (dataset === 'iris') {
    if (query.toLowerCase().includes('sepal')) {
      return '/iris-sepal-scatter.png';
    } else if (query.toLowerCase().includes('histogram')) {
      return '/iris-petal-histogram.png';
    } else if (query.toLowerCase().includes('box')) {
      return '/iris-boxplot.png';
    }
    return '/iris-default.png';
  }
  else if (dataset === 'gapminder') {
    if (query.toLowerCase().includes('life') && query.toLowerCase().includes('gdp')) {
      return '/gapminder-gdp-life.png';
    } else if (query.toLowerCase().includes('population')) {
      return '/gapminder-population.png';
    } else if (query.toLowerCase().includes('continent')) {
      return '/gapminder-continent.png';
    }
    return '/gapminder-default.png';
  }
  
  // Default fallback image
  return '/default-chart.png';
};
