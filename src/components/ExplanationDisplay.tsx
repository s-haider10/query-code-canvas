
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface ExplanationDisplayProps {
  explanation: string;
  analysis?: string;
  insights?: string;
  isLoading: boolean;
}

const ExplanationDisplay = ({ explanation, analysis, insights, isLoading }: ExplanationDisplayProps) => {
  const [tab, setTab] = useState<string>('explanation');

  // Helper function to render content with proper paragraph breaks
  const renderContent = (content: string | undefined) => {
    if (!content) {
      return (
        <div className="text-center text-sm text-gray-400 py-8">
          No content available
        </div>
      );
    }

    return (
      <div className="text-sm text-white/90 whitespace-pre-wrap">
        {content.split('\n').map((paragraph, i) => (
          <p key={i} className={i > 0 ? 'mt-4' : ''}>
            {paragraph}
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-[#2A2B36] border-[#10A37F]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium text-[#10A37F]">Analysis</CardTitle>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-[#10A37F] animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="explanation" className="mt-0 pt-2">
              {renderContent(explanation)}
            </TabsContent>
            <TabsContent value="insights" className="mt-0 pt-2">
              {renderContent(insights)}
            </TabsContent>
            <TabsContent value="summary" className="mt-0 pt-2">
              {renderContent(analysis)}
            </TabsContent>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExplanationDisplay;
