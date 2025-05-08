
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import ChatPanel from '@/components/ChatPanel';
import CodeDisplay from '@/components/CodeDisplay';
import VisualizationDisplay from '@/components/VisualizationDisplay';
import ExplanationDisplay from '@/components/ExplanationDisplay';
import DatasetUploader from '@/components/DatasetUploader';
import { Dataset } from '@/types/dataset';

const EnterpriseAnalysis = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const { toast } = useToast();
  
  // Load datasets on component mount
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/datasets');
      if (!response.ok) throw new Error('Failed to fetch datasets');
      
      const data = await response.json();
      setDatasets(data.datasets || []);
      
      // Select first dataset by default if available
      if (data.datasets && data.datasets.length > 0) {
        setSelectedDataset(data.datasets[0].id);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load datasets. Please try again.",
      });
    }
  };

  const handleQuerySubmit = async (query: string) => {
    if (!selectedDataset) {
      toast({
        variant: "destructive",
        description: "Please select a dataset first",
      });
      return;
    }

    setCurrentQuery(query);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          dataset: selectedDataset,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze data');
      }

      const result = await response.json();
      
      if (result.success) {
        setGeneratedCode(result.code || '');
        setImageUrl(`data:image/png;base64,${result.image}`);
        setExplanation(result.explanation || '');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error analyzing data:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatasetUploaded = (newDataset: Dataset) => {
    setDatasets((prevDatasets) => [...prevDatasets, newDataset]);
    setSelectedDataset(newDataset.id);
    toast({
      description: `Dataset ${newDataset.name} successfully uploaded`,
    });
  };

  return (
    <div className="flex h-screen bg-[#343541] text-[#ECECF1]">
      {/* Left: Chat Interface (40% width) */}
      <div className="w-2/5 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Data Analysis Assistant</h2>
          <p className="text-sm text-gray-400">
            Upload datasets and ask questions in natural language
          </p>
        </div>
        
        <div className="p-4 border-b border-gray-700">
          <DatasetUploader 
            onDatasetUploaded={handleDatasetUploaded}
          />
        </div>
        
        <div className="flex-1 overflow-auto">
          <ChatPanel 
            datasets={datasets}
            selectedDataset={selectedDataset}
            onSelectDataset={setSelectedDataset}
            onQuerySubmit={handleQuerySubmit}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Right: Dashboard (60% width) */}
      <div className="w-3/5 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Analysis Results</h2>
          <Tabs defaultValue="visualization" className="w-[400px]">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="visualization" className="data-[state=active]:bg-[#10A37F]">Visualization</TabsTrigger>
              <TabsTrigger value="code" className="data-[state=active]:bg-[#10A37F]">Code</TabsTrigger>
              <TabsTrigger value="explanation" className="data-[state=active]:bg-[#10A37F]">Explanation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visualization" className="mt-4">
              <div className="p-4 h-[calc(100vh-180px)]">
                <VisualizationDisplay 
                  imageUrl={imageUrl} 
                  isLoading={isLoading} 
                  query={currentQuery} 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="mt-4">
              <div className="p-4 h-[calc(100vh-180px)]">
                <CodeDisplay code={generatedCode} />
              </div>
            </TabsContent>
            
            <TabsContent value="explanation" className="mt-4">
              <div className="p-4 h-[calc(100vh-180px)]">
                <ExplanationDisplay explanation={explanation} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {(!imageUrl && !isLoading) && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gray-800 rounded-lg p-8 max-w-md">
                <h3 className="text-xl font-medium mb-2">Ready to analyze your data</h3>
                <p className="text-gray-400">
                  Select a dataset and ask a question to generate visualizations and insights.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseAnalysis;
