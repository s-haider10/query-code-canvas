
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatasetMetadata } from '@/types/dataset';
import { Trash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface DatasetSelectorProps {
  datasets: DatasetMetadata[];
  selectedDataset: string;
  onSelectDataset: (dataset: string) => void;
  onDeleteDataset?: (datasetId: string) => void;
}

const DatasetSelector = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  onDeleteDataset,
}: DatasetSelectorProps) => {
  const currentDataset = datasets.find((dataset) => dataset.id === selectedDataset);

  // Parse columns from JSON string
  const columns =
    currentDataset?.columns
      ? typeof currentDataset.columns === "string"
        ? JSON.parse(currentDataset.columns)
        : currentDataset.columns
      : [];

  // Parse sample data from JSON string
  const sampleData =
    currentDataset?.sample
      ? typeof currentDataset.sample === "string"
        ? JSON.parse(currentDataset.sample)
        : currentDataset.sample
      : [];

  const { user } = useAuth();

  // Helper: Determine if dataset belongs to the current user
  const canDelete = (dataset: DatasetMetadata) =>
    !!onDeleteDataset && user && dataset.user_id === user.id;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="dataset-select" className="text-sm font-medium text-zinc-200">
          Select Dataset
        </label>
        <div className="relative">
          <select
            id="dataset-select"
            value={selectedDataset}
            onChange={(e) => onSelectDataset(e.target.value)}
            className="w-full rounded-lg border-zinc-700 bg-[#191a23] text-white font-semibold focus:ring-2 focus:ring-primary px-4 py-2 pr-10 appearance-none"
          >
            <option value="" disabled>
              Select a dataset
            </option>
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id} className="bg-[#191a23] text-white">
                {dataset.name}
              </option>
            ))}
          </select>
          {/* Add native arrow */}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            ▼
          </span>
        </div>
        <ul className="mt-1 max-h-40 overflow-y-auto">
          {datasets.map((dataset) => (
            <li key={dataset.id} className="flex items-center group px-2 py-1 rounded hover:bg-zinc-800/70 transition-all mb-1">
              <button
                className="flex-1 text-left text-sm font-medium text-white truncate"
                onClick={() => onSelectDataset(dataset.id)}
                aria-current={selectedDataset === dataset.id}
                style={{
                  fontWeight: selectedDataset === dataset.id ? 600 : 400,
                  color: selectedDataset === dataset.id ? "#8be9fd" : undefined,
                }}
              >
                {dataset.name}
              </button>
              {canDelete(dataset) && (
                <button
                  title="Delete dataset"
                  className="ml-3 opacity-60 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this dataset? This cannot be undone."
                      )
                    ) {
                      onDeleteDataset?.(dataset.id);
                    }
                  }}
                >
                  <Trash size={17} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {currentDataset && (
        <Card className="bg-[#23243c]/80 border-zinc-700 text-white shadow-md rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-semibold">{currentDataset.name}</CardTitle>
            <CardDescription className="text-zinc-400">
              {currentDataset.description || "No description available"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1 text-zinc-400">File Details</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-zinc-700/80 border-zinc-700 text-zinc-200">
                    Type: {currentDataset.file_type?.toUpperCase()}
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
                {/* Horizontal scroll for columns, showing 5 at a time */}
                <div
                  className="flex gap-1.5 overflow-x-auto no-scrollbar"
                  style={{
                    maxWidth: "100%",
                    paddingBottom: 2,
                  }}
                >
                  {columns.map((column: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-zinc-800/80 border-zinc-700 text-zinc-100 min-w-[80px] text-center whitespace-nowrap flex-shrink-0"
                      style={{ flexBasis: "80px" }}
                    >
                      {column}
                    </Badge>
                  ))}
                </div>
                {/* Optional: hint for more columns */}
                {columns.length > 5 && (
                  <div className="mt-1 text-xs text-zinc-500">
                    Scroll horizontally to see more columns
                  </div>
                )}
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

