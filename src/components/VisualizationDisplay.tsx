
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
    // In a real implementation, this would download the actual visualization
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Visualization</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownload}
          disabled={isLoading}
          className="h-8"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-md overflow-hidden relative min-h-[300px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Generating visualization...</p>
            </div>
          ) : (
            <>
              <img 
                src={imageUrl} 
                alt={`Visualization for: ${query}`} 
                className="w-full object-contain"
                style={{ maxHeight: '400px' }}
              />
              {/* Fallback for real implementation */}
              {imageUrl === '/default-chart.png' && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted bg-opacity-90">
                  <div className="text-center p-6">
                    <p className="text-lg font-medium mb-2">Visualization Preview</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      In the complete implementation, this would display a real chart rendered from the generated code.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {!isLoading && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-sm text-muted-foreground mr-2">Was this helpful?</span>
            <Button
              variant={liked === true ? "default" : "outline"}
              size="sm"
              onClick={() => handleFeedback(true)}
              className={`h-8 ${liked === true ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Yes
            </Button>
            <Button
              variant={liked === false ? "default" : "outline"}
              size="sm"
              onClick={() => handleFeedback(false)}
              className={`h-8 ${liked === false ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
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
