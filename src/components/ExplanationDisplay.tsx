
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ExplanationDisplayProps {
  explanation: string;
  isLoading: boolean;
}

const ExplanationDisplay = ({ explanation, isLoading }: ExplanationDisplayProps) => {
  return (
    <Card className="bg-[#2A2B36] border-[#10A37F]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium text-[#10A37F]">Explanation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-[#343541] rounded-md p-4 text-[#ECECF1] border border-[#10A37F]/20 min-h-[100px] text-sm">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-4">
              <Loader2 className="h-5 w-5 text-[#10A37F] animate-spin mr-2" />
              <span className="text-[#10A37F] animate-pulse">Generating explanation...</span>
            </div>
          ) : explanation ? (
            <div className="prose prose-invert max-w-none">
              {explanation.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2">{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">No explanation available yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExplanationDisplay;
