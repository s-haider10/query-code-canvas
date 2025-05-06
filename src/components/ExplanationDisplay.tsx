
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExplanationDisplayProps {
  explanation: string;
}

const ExplanationDisplay = ({ explanation }: ExplanationDisplayProps) => {
  return (
    <Card className="h-full bg-gray-800 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-md font-medium text-blue-400">Explanation</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="prose prose-invert max-w-none">
            {explanation.split('\n').map((paragraph, index) => (
              paragraph.trim() ? (
                <p key={index} className="mb-4 text-gray-300">{paragraph}</p>
              ) : null
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExplanationDisplay;
