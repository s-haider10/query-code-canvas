
// Dark Mode + Modern Card for Dataset Selector
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatasetMetadata } from '@/types/dataset';

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
        <label htmlFor="dataset-select" className="text-sm font-medium text-zinc-200">
          Select Dataset
        </label>
        <Select 
          value={selectedDataset} 
          onValueChange={onSelectDataset}
        >
          <SelectTrigger className="w-full rounded-lg border-zinc-700 bg-[#191a23] text-white font-semibold focus:ring-2 focus:ring-primary">
            <SelectValue placeholder="Select a dataset" />
          </SelectTrigger>
          <SelectContent className="bg-[#191a23] border-zinc-800 text-white rounded-lg z-50">
            {datasets.map((dataset) => (
              <SelectItem
                key={dataset.id}
                value={dataset.id}
                className="rounded cursor-pointer px-3 py-2 font-medium focus:bg-zinc-800/80"
              >
                {dataset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {currentDataset && (
        <Card className="bg-[#23243c]/80 border-zinc-700 text-white shadow-md rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold">{currentDataset.name}</CardTitle>
            <CardDescription className="text-zinc-400">{currentDataset.description || 'No description available'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1 text-zinc-400">File Details</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-zinc-700/80 border-zinc-700 text-zinc-200">
                    Type: {currentDataset.file_type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-zinc-700/80 border-zinc-700 text-zinc-200">
                    {currentDataset.rows || 0} rows
                  </Badge>
                  <Badge variant="outline" className="bg-zinc-700/80 border-zinc-700 text-zinc-200">
                    {currentDataset.columns_count || columns.length || 0} columns
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-1 text-zinc-400">Columns</h4>
                <div className="flex flex-wrap gap-1.5">
                  {columns.map((column, index) => (
                    <Badge key={index} variant="outline" className="bg-zinc-800/80 border-zinc-700 text-zinc-100">
                      {column}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-1 text-zinc-400">Sample Data</h4>
                <div className="bg-zinc-800/50 rounded-md p-3 overflow-x-auto max-h-32">
                  <pre className="text-[13px] text-zinc-300">
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

