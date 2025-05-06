
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CodeDisplayProps {
  code: string;
}

const CodeDisplay = ({ code }: CodeDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Function to highlight Python code syntax
  const highlightCode = (code: string) => {
    // Basic syntax highlighting for Python
    const keywords = ['import', 'from', 'def', 'for', 'in', 'if', 'else', 'elif', 'return', 'while', 'True', 'False', 'None', 'and', 'or', 'not', 'as', 'with', 'try', 'except', 'finally', 'print', 'class'];
    
    // Replace keywords with spans
    let highlightedCode = code;
    
    // Replace strings (both single and double quotes)
    highlightedCode = highlightedCode.replace(/'([^']*)'/g, "<span class='string'>'$1'</span>");
    highlightedCode = highlightedCode.replace(/"([^"]*)"/g, "<span class='string'>\"$1\"</span>");
    
    // Replace numbers
    highlightedCode = highlightedCode.replace(/\b(\d+\.?\d*|\.\d+)\b/g, "<span class='number'>$1</span>");
    
    // Replace comments
    highlightedCode = highlightedCode.replace(/(#.*)$/mg, "<span class='comment'>$1</span>");
    
    // Replace functions
    highlightedCode = highlightedCode.replace(/(\w+)\(/g, "<span class='function'>$1</span>(");
    
    // Replace keywords (must be done last to avoid replacing parts of other tokens)
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlightedCode = highlightedCode.replace(regex, `<span class='keyword'>${keyword}</span>`);
    });
    
    // Split by newlines and wrap in spans
    return highlightedCode.split('\n').map((line, index) => 
      `<span class="block">${line}</span>`
    ).join('');
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      description: "Code copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Generated Python Code</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopyCode}
          className="h-8"
        >
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre 
            className="code-block bg-code-background text-code-text p-4 rounded-md text-sm overflow-x-auto max-h-72 overscroll-y-auto"
            dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeDisplay;
