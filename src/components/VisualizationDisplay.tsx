
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VisualizationDisplayProps {
  imageUrl: string;
  isLoading: boolean;
  query: string;
}

const VisualizationDisplay = ({ imageUrl, isLoading, query }: VisualizationDisplayProps) => {
  const [liked, setLiked] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset feedback when a new visualization is loaded
    setLiked(null);
  }, [imageUrl]);

  const handleDownload = () => {
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `visualization-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      description: "Visualization downloaded",
    });
  };

  const handleFeedback = (feedback: boolean) => {
    setLiked(feedback);
    
    // In a real implementation, this would send feedback to the server
    toast({
      description: `Thank you for your feedback!`,
    });
  };

  return (
    <Card className="h-full bg-[#2A2B36] border-[#10A37F]/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium text-[#10A37F]">Visualization</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownload}
          disabled={isLoading || !imageUrl}
          className="h-8 border-[#10A37F]/20 text-[#10A37F] hover:bg-[#10A37F]/10"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </CardHeader>
      <CardContent>
        <div className="bg-[#343541] rounded-md overflow-hidden relative min-h-[300px] flex items-center justify-center border border-[#10A37F]/20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <Loader2 className="h-10 w-10 text-[#10A37F] animate-spin" />
              <p className="text-sm text-[#10A37F] animate-pulse">Generating visualization...</p>
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt={`Visualization for: ${query}`} 
              className="w-full object-contain"
              style={{ maxHeight: '400px' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <p className="text-sm text-gray-400">No visualization available yet.</p>
              <p className="text-xs text-gray-500">Submit a query to generate one.</p>
            </div>
          )}
        </div>
        
        {!isLoading && imageUrl && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-sm text-gray-400 mr-2">Was this helpful?</span>
            <Button
              variant={liked === true ? "default" : "outline"}
              size="sm"
              onClick={() => handleFeedback(true)}
              className={`h-8 ${liked === true ? 'bg-[#10A37F] hover:bg-[#0D8A69]' : 'border-[#10A37F]/20 text-[#10A37F] hover:bg-[#10A37F]/10'}`}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Yes
            </Button>
            <Button
              variant={liked === false ? "default" : "outline"}
              size="sm"
              onClick={() => handleFeedback(false)}
              className={`h-8 ${liked === false ? 'bg-amber-600 hover:bg-amber-700' : 'border-[#10A37F]/20 text-[#10A37F] hover:bg-[#10A37F]/10'}`}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              No
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisualizationDisplay;
