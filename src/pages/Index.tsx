import { useState } from 'react';
import { DatasetType, generateSampleCode, getVisualizationImage } from '@/lib/data-utils';
import DatasetSelector from '@/components/DatasetSelector';
import QueryInput from '@/components/QueryInput';
import CodeDisplay from '@/components/CodeDisplay';
import VisualizationDisplay from '@/components/VisualizationDisplay';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Rocket } from 'lucide-react';
import { fetchDatasets } from '@/lib/api-service';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const [selectedDataset, setSelectedDataset] = useState<DatasetType>('titanic');
  const [query, setQuery] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [visualizationUrl, setVisualizationUrl] = useState<string>('');
  const { toast } = useToast();
  
  // Fetch datasets
  const { data: datasets = [] } = useQuery({
    queryKey: ['datasets'],
    queryFn: fetchDatasets,
  });

  const handleDatasetChange = (dataset: DatasetType) => {
    setSelectedDataset(dataset);
    // Reset the query and results when dataset changes
    setQuery('');
    setCode('');
    setVisualizationUrl('');
  };

  const handleQuerySubmit = (newQuery: string) => {
    setQuery(newQuery);
    setIsLoading(true);
    
    // Simulate API call to LLM
    setTimeout(() => {
      try {
        const generatedCode = generateSampleCode(selectedDataset, newQuery);
        setCode(generatedCode);
        
        // Get a visualization URL (in a real app, this would be generated from the code)
        const vizUrl = getVisualizationImage(selectedDataset, newQuery);
        setVisualizationUrl(vizUrl);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error generating code:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process your query. Please try again.",
        });
        setIsLoading(false);
      }
    }, 2000); // Simulate processing time
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Automated Data Analysis Agent</h1>
            <p className="text-muted-foreground">Generate data visualizations using natural language queries</p>
          </div>
          <Link to="/advanced">
            <Button className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Advanced Analysis
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <DatasetSelector 
              datasets={datasets}
              selectedDataset={selectedDataset}
              onSelectDataset={handleDatasetChange}
            />
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            <QueryInput 
              dataset={selectedDataset} 
              onSubmitQuery={handleQuerySubmit} 
              isLoading={isLoading} 
            />
            
            {(code || isLoading) && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <CodeDisplay code={code} />
                <VisualizationDisplay 
                  imageUrl={visualizationUrl || '/default-chart.png'} 
                  isLoading={isLoading} 
                  query={query} 
                />
              </div>
            )}
            
            {!code && !isLoading && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <h3 className="text-lg font-medium mb-2">Ready to analyze your data</h3>
                <p className="text-muted-foreground">
                  Select a dataset and type a natural language query to get started.
                  Try something like "Plot a histogram of passenger ages" for the Titanic dataset.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Automated Data Analysis Agent - Powered by AI</p>
          <p className="text-xs mt-1">This is a simulation for demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
