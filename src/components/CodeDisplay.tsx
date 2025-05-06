
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
    highlightedCode = highlightedCode.replace(/'([^']*)'/g, "<span class='text-green-400'>'$1'</span>");
    highlightedCode = highlightedCode.replace(/"([^"]*)"/g, "<span class='text-green-400'>\"$1\"</span>");
    
    // Replace numbers
    highlightedCode = highlightedCode.replace(/\b(\d+\.?\d*|\.\d+)\b/g, "<span class='text-yellow-400'>$1</span>");
    
    // Replace comments
    highlightedCode = highlightedCode.replace(/(#.*)$/mg, "<span class='text-gray-500'>$1</span>");
    
    // Replace functions
    highlightedCode = highlightedCode.replace(/(\w+)\(/g, "<span class='text-[#10A37F]'>$1</span>(");
    
    // Replace keywords (must be done last to avoid replacing parts of other tokens)
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlightedCode = highlightedCode.replace(regex, `<span class='text-purple-400'>${keyword}</span>`);
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
    <Card className="bg-[#343541] border-[#10A37F]/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium text-[#10A37F]">Generated Python Code</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopyCode}
          className={`h-8 ${copied ? 'bg-[#10A37F] text-white' : 'border-[#10A37F]/20 text-[#10A37F] hover:bg-[#10A37F]/10'}`}
        >
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre 
            className="bg-[#2A2B36] text-[#ECECF1] p-4 rounded-md text-sm overflow-x-auto max-h-72 overscroll-y-auto border border-[#10A37F]/20"
            dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeDisplay;
