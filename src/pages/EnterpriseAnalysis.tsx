
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Code, BarChart3 } from 'lucide-react';
import { fetchDatasets, executeQuery, ensureDefaultDatasets } from '@/lib/api-service';
import DatasetSelector from '@/components/DatasetSelector';
import QueryInput from '@/components/QueryInput';
import CodeDisplay from '@/components/CodeDisplay';
import VisualizationDisplay from '@/components/VisualizationDisplay';
import ExplanationDisplay from '@/components/ExplanationDisplay';
import DatasetUploader from '@/components/DatasetUploader';
import { DatasetType } from '@/types/dataset';

const EnterpriseAnalysis = () => {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [visualizationUrl, setVisualizationUrl] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  
  const { toast } = useToast();

  // Fetch datasets
  const { data: datasets, isLoading: datasetsLoading, error: datasetsError, refetch: refetchDatasets } = 
    useQuery({
      queryKey: ['datasets'],
      queryFn: fetchDatasets,
    });

  // Ensure default datasets are available
  useEffect(() => {
    ensureDefaultDatasets()
      .then(() => refetchDatasets())
      .catch(error => console.error("Failed to ensure default datasets:", error));
  }, [refetchDatasets]);

  // Set first dataset as default when data loads
  useEffect(() => {
    if (datasets && datasets.length > 0 && !selectedDataset) {
      setSelectedDataset(datasets[0].id);
    }
  }, [datasets, selectedDataset]);

  // Run query mutation
  const { mutate: runQuery, isPending: isQueryRunning } = useMutation({
    mutationFn: ({ datasetId, queryText }: { datasetId: string, queryText: string }) => 
      executeQuery(datasetId, queryText),
    onSuccess: (data) => {
      setCode(data.code || '');
      setVisualizationUrl(data.image ? `data:image/png;base64,${data.image}` : '');
      setExplanation(data.explanation || '');
      toast({ description: "Query executed successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Error running query", 
        description: error.message || "An error occurred during query execution"
      });
    }
  });

  const handleDatasetChange = (datasetId: string) => {
    setSelectedDataset(datasetId);
    // Reset previous results
    setCode('');
    setVisualizationUrl('');
    setExplanation('');
    setQuery('');
  };

  const handleQuerySubmit = (newQuery: string) => {
    if (!selectedDataset) {
      toast({
        variant: "destructive",
        description: "Please select a dataset first"
      });
      return;
    }
    
    setQuery(newQuery);
    runQuery({ datasetId: selectedDataset, queryText: newQuery });
  };

  const handleDatasetUploaded = () => {
    refetchDatasets();
    toast({ description: "Dataset uploaded successfully" });
  };

  if (datasetsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading datasets...</span>
      </div>
    );
  }

  if (datasetsError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h3 className="text-xl font-bold text-red-600 mb-2">Error Loading Datasets</h3>
        <p>Please try refreshing the page.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Refresh Page
        </Button>
      </div>
    );
  }

  const currentDataset = datasets?.find(d => d.id === selectedDataset);
  // Fix the type issue here - use currentDataset.name directly without casting to DatasetType
  const datasetName = currentDataset ? currentDataset.name : '';

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Panel */}
        <div className="w-full md:w-2/5 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Datasets</h2>
              <DatasetUploader onUploadComplete={handleDatasetUploaded} />
            </div>
            
            {datasets && datasets.length > 0 ? (
              <DatasetSelector 
                datasets={datasets} 
                selectedDataset={selectedDataset || ''} 
                onSelectDataset={handleDatasetChange} 
              />
            ) : (
              <p className="text-muted-foreground text-center py-4">No datasets available.</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Query Input</h2>
            <QueryInput
              dataset={datasetName}
              onSubmitQuery={handleQuerySubmit}
              isLoading={isQueryRunning}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-3/5">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-center mb-4">Analysis Results</h2>
            
            {(code || isQueryRunning) ? (
              <div className="space-y-6">
                <Tabs defaultValue="visualization" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="visualization">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Visualization
                    </TabsTrigger>
                    <TabsTrigger value="code">
                      <Code className="w-4 h-4 mr-2" />
                      Code
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="visualization" className="mt-4">
                    <div className="space-y-4">
                      <VisualizationDisplay 
                        imageUrl={visualizationUrl}
                        isLoading={isQueryRunning}
                        query={query}
                      />
                      
                      <ExplanationDisplay
                        explanation={explanation}
                        isLoading={isQueryRunning}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="code" className="mt-4">
                    <CodeDisplay code={code} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium mb-2">Ready to analyze your data</h3>
                <p className="text-muted-foreground">
                  Select a dataset and type a natural language query to get started.
                  Try something like "Plot a histogram of passenger ages" for the Titanic dataset.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default EnterpriseAnalysis;
