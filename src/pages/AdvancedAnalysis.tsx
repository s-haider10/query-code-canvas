
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Upload, RefreshCw, ArrowLeft, MonitorSmartphone, Code, BarChart3, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import CodeDisplay from '@/components/CodeDisplay';
import VisualizationDisplay from '@/components/VisualizationDisplay';
import ExplanationDisplay from '@/components/ExplanationDisplay';

interface Dataset {
  id: string;
  name: string;
  description: string;
  predefined: boolean;
  rows: number;
  columns_count: number;
}

interface DatasetInfo {
  name: string;
  description: string;
  columns: string[];
  sample: Record<string, unknown>[];
  rows: number;
  columns_count: number;
}

interface AnalysisResult {
  code: string;
  image: string;
  explanation?: string;
  success: boolean;
}

const API_BASE_URL = 'http://localhost:5001/api';

const AdvancedAnalysis = () => {
  const { toast } = useToast();
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [query, setQuery] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [resultData, setResultData] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('visualization');

  // Fetch available datasets
  const { data: datasets, isLoading: isLoadingDatasets, refetch: refetchDatasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/datasets`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch datasets');
      }
      return response.json().then(data => data.datasets as Dataset[]);
    }
  });

  // Fetch dataset info when a dataset is selected
  const fetchDatasetInfo = useMutation({
    mutationFn: async (datasetId: string) => {
      const response = await fetch(`${API_BASE_URL}/datasets/${datasetId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to fetch dataset info for ${datasetId}`);
      }
      return response.json() as Promise<DatasetInfo>;
    },
    onSuccess: (data) => {
      setDatasetInfo(data);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  });

  // Handle dataset selection
  const handleDatasetChange = (datasetId: string) => {
    setSelectedDataset(datasetId);
    fetchDatasetInfo.mutate(datasetId);
    // Reset query and results
    setQuery('');
    setResultData(null);
  };

  // Handle file selection for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Upload dataset
  const uploadDataset = useMutation({
    mutationFn: async () => {
      if (!file) return;
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload dataset');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Dataset uploaded with ID: ${data.dataset_id}`,
      });
      setFile(null);
      refetchDatasets();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'An error occurred during upload',
      });
    }
  });

  // Handle query submission
  const analyzeData = useMutation({
    mutationFn: async () => {
      if (!selectedDataset || !query) return;
      
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset: selectedDataset,
          query: query,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setResultData({
        code: data.code,
        image: `data:image/png;base64,${data.image}`,
        explanation: data.explanation || "No explanation available for this visualization.",
        success: data.success
      });
      // Automatically switch to visualization tab when result is ready
      setActiveTab('visualization');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'An error occurred during analysis',
      });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <header className="bg-gray-800 shadow-lg border-b border-blue-500/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Advanced Data Analysis</h1>
            <p className="text-gray-400">Generate data visualizations with AI</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2 border-blue-500/50 text-blue-400 hover:bg-blue-900/30">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6 bg-gray-800 border border-blue-500/20">
            <TabsTrigger value="analyze" className="data-[state=active]:bg-blue-900 data-[state=active]:text-blue-300">
              <MonitorSmartphone className="h-4 w-4 mr-2" />
              Analyze Data
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-900 data-[state=active]:text-blue-300">
              <Upload className="h-4 w-4 mr-2" />
              Upload Dataset
            </TabsTrigger>
          </TabsList>

          {/* Analyze Data Tab */}
          <TabsContent value="analyze">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dataset Selection */}
              <Card className="lg:col-span-1 bg-gray-800 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-blue-400">Select Dataset</CardTitle>
                  <CardDescription className="text-gray-400">Choose a dataset to analyze</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Select 
                      value={selectedDataset} 
                      onValueChange={handleDatasetChange}
                    >
                      <SelectTrigger className="bg-gray-900 border-blue-500/20 text-gray-300">
                        <SelectValue placeholder="Select a dataset" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-blue-500/20">
                        {isLoadingDatasets ? (
                          <SelectItem value="loading" disabled>Loading datasets...</SelectItem>
                        ) : datasets && datasets.length > 0 ? (
                          datasets.map(dataset => (
                            <SelectItem key={dataset.id} value={dataset.id} className="text-gray-300">
                              {dataset.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No datasets available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => refetchDatasets()}
                      className="border-blue-500/20 text-blue-400 hover:bg-blue-900/30"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {fetchDatasetInfo.isPending && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  )}

                  {datasetInfo && (
                    <div className="space-y-3 mt-4">
                      <div>
                        <h3 className="font-medium text-blue-300">Description</h3>
                        <p className="text-sm text-gray-400">{datasetInfo.description}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-300">Stats</h3>
                        <p className="text-sm text-gray-400">
                          {datasetInfo.rows.toLocaleString()} rows × {datasetInfo.columns_count} columns
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-300">Columns</h3>
                        <div className="text-sm text-gray-400 max-h-32 overflow-y-auto border rounded-md p-2 mt-1 bg-gray-900 border-blue-500/20">
                          {datasetInfo.columns.map((column, index) => (
                            <div key={index} className="py-0.5">{column}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Query Input and Results */}
              <Card className="lg:col-span-2 bg-gray-800 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-blue-400">Natural Language Query</CardTitle>
                  <CardDescription className="text-gray-400">
                    Describe what visualization you want to generate
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder={
                        selectedDataset 
                          ? "E.g., 'Create a histogram of passenger ages' or 'Plot survival rate by gender'"
                          : "Please select a dataset first"
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-h-[100px] bg-gray-900 border-blue-500/20 text-gray-300 placeholder:text-gray-500"
                      disabled={!selectedDataset}
                    />
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!selectedDataset || !query || analyzeData.isPending}
                      onClick={() => analyzeData.mutate()}
                    >
                      {analyzeData.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : 'Generate Visualization'}
                    </Button>
                  </div>

                  {/* Results Section */}
                  {resultData && (
                    <div className="space-y-4 mt-4">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full bg-gray-900 border border-blue-500/20">
                          <TabsTrigger value="visualization" className="flex-1 data-[state=active]:bg-blue-900 data-[state=active]:text-blue-300">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Visualization
                          </TabsTrigger>
                          <TabsTrigger value="code" className="flex-1 data-[state=active]:bg-blue-900 data-[state=active]:text-blue-300">
                            <Code className="h-4 w-4 mr-2" />
                            Code
                          </TabsTrigger>
                          <TabsTrigger value="explanation" className="flex-1 data-[state=active]:bg-blue-900 data-[state=active]:text-blue-300">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Explanation
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="visualization" className="mt-4">
                          <VisualizationDisplay 
                            imageUrl={resultData.image} 
                            isLoading={false}
                            query={query}
                          />
                        </TabsContent>
                        
                        <TabsContent value="code" className="mt-4">
                          <CodeDisplay code={resultData.code} />
                        </TabsContent>

                        <TabsContent value="explanation" className="mt-4">
                          <ExplanationDisplay explanation={resultData.explanation || ""} />
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload Dataset Tab */}
          <TabsContent value="upload">
            <Card className="max-w-xl mx-auto bg-gray-800 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-blue-400">Upload Custom Dataset</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload a CSV file to analyze with our tools (max 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="file" className="text-gray-300">Select CSV File</Label>
                  <Input 
                    id="file" 
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="bg-gray-900 border-blue-500/20 text-gray-300"
                  />
                  <p className="text-xs text-gray-400">
                    File should be in CSV format with headers in the first row
                  </p>
                </div>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!file || uploadDataset.isPending}
                  onClick={() => uploadDataset.mutate()}
                >
                  {uploadDataset.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Dataset
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-blue-500/20 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-400">
          <p>Automated Data Analysis Agent - Powered by AI</p>
          <p className="text-xs mt-1">
            Backend processing requires running the Python Flask server
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdvancedAnalysis;
