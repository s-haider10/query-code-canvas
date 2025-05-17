
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sampleQueries } from '@/lib/data-utils';
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface QueryInputProps {
  dataset: string;
  onSubmitQuery: (query: string) => void;
  isLoading: boolean;
}

const QueryInput = ({ dataset, onSubmitQuery, isLoading }: QueryInputProps) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmitQuery(query);
    }
  };
  
  // Default example queries for any dataset
  const defaultQueries = [
    "Give me a summary of this dataset",
    "Show a histogram of numeric columns",
    "What are the correlations between numerical variables?",
    "Create a scatter plot comparing two important variables",
    "Show the distribution of categorical variables",
    "Compare means across different groups",
    "Analyze patterns in the data and create appropriate visualizations",
    "Find outliers and explain their impact",
    "Identify key factors that influence the target variable"
  ];
  
  // Make sure we have example queries for the given dataset
  const datasetKey = dataset.toLowerCase();
  const exampleQueries = 
    (datasetKey.includes('titanic') && sampleQueries['titanic']) ||
    (datasetKey.includes('iris') && sampleQueries['iris']) ||
    (datasetKey.includes('gapminder') && sampleQueries['gapminder']) ||
    defaultQueries;
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your data analysis query..."
            className="pr-10"
            disabled={isLoading}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        </div>
        <Button type="submit" disabled={!query.trim() || isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </form>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Example queries:</h4>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="cursor-pointer hover:bg-muted transition-colors"
              onClick={() => {
                setQuery(example);
                onSubmitQuery(example);
              }}
            >
              {example}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QueryInput;
