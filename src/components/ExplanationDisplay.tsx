
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface ExplanationDisplayProps {
  explanation: string;
  analysis?: string;
  isLoading: boolean;
}

const ExplanationDisplay = ({ explanation, analysis, isLoading }: ExplanationDisplayProps) => {
  const [tab, setTab] = useState<string>('explanation');

  return (
    <Card className="bg-[#2A2B36] border-[#10A37F]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium text-[#10A37F]">Analysis</CardTitle>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
            <TabsTrigger value="analysis">Summary</TabsTrigger>
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
              {explanation ? (
                <div className="text-sm text-white/90 whitespace-pre-wrap">
                  {explanation.split('\n').map((paragraph, i) => (
                    <p key={i} className={i > 0 ? 'mt-4' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 py-8">
                  No explanation available
                </div>
              )}
            </TabsContent>
            <TabsContent value="analysis" className="mt-0 pt-2">
              {analysis ? (
                <div className="text-sm text-white/90 whitespace-pre-wrap">
                  {analysis.split('\n').map((paragraph, i) => (
                    <p key={i} className={i > 0 ? 'mt-4' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400 py-8">
                  No analysis summary available
                </div>
              )}
            </TabsContent>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExplanationDisplay;
