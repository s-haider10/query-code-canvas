
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatasetType, datasets } from '@/lib/data-utils';
import { Badge } from "@/components/ui/badge";

interface DatasetSelectorProps {
  selectedDataset: DatasetType;
  onSelectDataset: (dataset: DatasetType) => void;
}

const DatasetSelector = ({ selectedDataset, onSelectDataset }: DatasetSelectorProps) => {
  const currentDataset = datasets[selectedDataset];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="dataset-select" className="text-sm font-medium">
          Select Dataset
        </label>
        <Select 
          value={selectedDataset} 
          onValueChange={(value) => onSelectDataset(value as DatasetType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a dataset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="titanic">Titanic Passenger Data</SelectItem>
            <SelectItem value="iris">Iris Flower Dataset</SelectItem>
            <SelectItem value="gapminder">Gapminder World Data</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{currentDataset.name}</CardTitle>
          <CardDescription>{currentDataset.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Columns</h4>
              <div className="flex flex-wrap gap-1.5">
                {currentDataset.columns.map((column) => (
                  <Badge key={column} variant="outline" className="bg-muted">
                    {column}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-1">Sample Data</h4>
              <div className="bg-muted rounded-md p-3 overflow-x-auto max-h-32">
                <pre className="text-xs">
                  {JSON.stringify(currentDataset.sample.slice(0, 3), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatasetSelector;
