
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatasetMetadata } from '@/lib/api-service';

interface DatasetSelectorProps {
  datasets: DatasetMetadata[];
  selectedDataset: string;
  onSelectDataset: (dataset: string) => void;
}

const DatasetSelector = ({ datasets, selectedDataset, onSelectDataset }: DatasetSelectorProps) => {
  const currentDataset = datasets.find(dataset => dataset.id === selectedDataset);
  
  // Parse columns from JSON string
  const columns = currentDataset?.columns ? 
    (typeof currentDataset.columns === 'string' ? 
      JSON.parse(currentDataset.columns) : currentDataset.columns) : [];
  
  // Parse sample data from JSON string
  const sampleData = currentDataset?.sample ? 
    (typeof currentDataset.sample === 'string' ? 
      JSON.parse(currentDataset.sample) : currentDataset.sample) : [];
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="dataset-select" className="text-sm font-medium">
          Select Dataset
        </label>
        <Select 
          value={selectedDataset} 
          onValueChange={onSelectDataset}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a dataset" />
          </SelectTrigger>
          <SelectContent>
            {datasets.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id}>
                {dataset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {currentDataset && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{currentDataset.name}</CardTitle>
            <CardDescription>{currentDataset.description || 'No description available'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">File Details</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-muted">
                    Type: {currentDataset.file_type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    {currentDataset.rows || 0} rows
                  </Badge>
                  <Badge variant="outline" className="bg-muted">
                    {currentDataset.columns_count || columns.length || 0} columns
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-1">Columns</h4>
                <div className="flex flex-wrap gap-1.5">
                  {columns.map((column, index) => (
                    <Badge key={index} variant="outline" className="bg-muted">
                      {column}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-1">Sample Data</h4>
                <div className="bg-muted rounded-md p-3 overflow-x-auto max-h-32">
                  <pre className="text-xs">
                    {JSON.stringify(sampleData.slice(0, 3), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatasetSelector;
