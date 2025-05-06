
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
import { Loader2, Upload, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CodeDisplay from '@/components/CodeDisplay';

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

const API_BASE_URL = 'http://localhost:5001/api';

const AdvancedAnalysis = () => {
  const { toast } = useToast();
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [query, setQuery] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [resultCode, setResultCode] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');

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
    setResultCode('');
    setResultImage('');
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
      setResultCode(data.code);
      setResultImage(`data:image/png;base64,${data.image}`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Advanced Data Analysis</h1>
            <p className="text-muted-foreground">Generate data visualizations with AI</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="analyze">Analyze Data</TabsTrigger>
            <TabsTrigger value="upload">Upload Dataset</TabsTrigger>
          </TabsList>

          {/* Analyze Data Tab */}
          <TabsContent value="analyze">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dataset Selection */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Select Dataset</CardTitle>
                  <CardDescription>Choose a dataset to analyze</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Select 
                      value={selectedDataset} 
                      onValueChange={handleDatasetChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingDatasets ? (
                          <SelectItem value="loading" disabled>Loading datasets...</SelectItem>
                        ) : datasets && datasets.length > 0 ? (
                          datasets.map(dataset => (
                            <SelectItem key={dataset.id} value={dataset.id}>
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
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {fetchDatasetInfo.isPending && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {datasetInfo && (
                    <div className="space-y-3 mt-4">
                      <div>
                        <h3 className="font-medium">Description</h3>
                        <p className="text-sm text-muted-foreground">{datasetInfo.description}</p>
                      </div>
                      <div>
                        <h3 className="font-medium">Stats</h3>
                        <p className="text-sm text-muted-foreground">
                          {datasetInfo.rows.toLocaleString()} rows × {datasetInfo.columns_count} columns
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium">Columns</h3>
                        <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto border rounded-md p-2 mt-1 bg-slate-50">
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
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Natural Language Query</CardTitle>
                  <CardDescription>
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
                      className="min-h-[100px]"
                      disabled={!selectedDataset}
                    />
                    <Button 
                      className="w-full"
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
                  {(resultCode || resultImage) && (
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="font-medium">Generated Code</h3>
                          <CodeDisplay code={resultCode} />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-medium">Visualization</h3>
                          <div className="border rounded-md overflow-hidden bg-white p-2">
                            {resultImage ? (
                              <img 
                                src={resultImage} 
                                alt="Generated visualization" 
                                className="w-full h-auto"
                              />
                            ) : (
                              <div className="w-full h-64 flex items-center justify-center bg-slate-100 text-slate-400">
                                No visualization generated yet
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload Dataset Tab */}
          <TabsContent value="upload">
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>Upload Custom Dataset</CardTitle>
                <CardDescription>
                  Upload a CSV file to analyze with our tools (max 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="file">Select CSV File</Label>
                  <Input 
                    id="file" 
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange} 
                  />
                  <p className="text-xs text-muted-foreground">
                    File should be in CSV format with headers in the first row
                  </p>
                </div>
                
                <Button 
                  className="w-full"
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

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
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
