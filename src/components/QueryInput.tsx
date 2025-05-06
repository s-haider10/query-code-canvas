
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatasetType, sampleQueries } from '@/lib/data-utils';
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface QueryInputProps {
  dataset: DatasetType;
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
          {sampleQueries[dataset].map((example, index) => (
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
