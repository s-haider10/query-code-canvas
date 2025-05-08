
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import { Dataset } from '@/types/dataset';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  datasets: Dataset[];
  selectedDataset: string | null;
  onSelectDataset: (datasetId: string) => void;
  onQuerySubmit: (query: string) => void;
  isLoading: boolean;
}

const ChatPanel = ({ datasets, selectedDataset, onSelectDataset, onQuerySubmit, isLoading }: ChatPanelProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your data analysis assistant. Select a dataset and ask me a question about it.'
    }
  ]);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Example queries based on dataset
  const getExampleQueries = (datasetId: string) => {
    switch(datasetId) {
      case 'titanic':
        return [
          'Plot survival rate by passenger class',
          'Create a histogram of passenger ages',
          'Show correlation between fare and survival'
        ];
      case 'iris':
        return [
          'Plot sepal length vs sepal width colored by species',
          'Create a histogram of petal lengths',
          'Show a boxplot of measurements by species'
        ];
      default:
        return [
          'Show data distribution',
          'Plot correlation between columns',
          'Create a histogram of numerical values'
        ];
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add thinking message
    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Thinking...'
    };
    
    setMessages(prev => [...prev, thinkingMessage]);
    
    // Submit query
    onQuerySubmit(input);
    
    // Clear input
    setInput('');
    
    // Focus input for next query
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  
  // Update messages when query is processed
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].content === 'Thinking...') {
      // Replace "thinking" message with completion
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove thinking message
        newMessages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Here\'s the analysis you requested. Check the visualization tab to see the results.'
        });
        return newMessages;
      });
    }
  }, [isLoading, messages]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <label className="block text-sm font-medium mb-2">
          Select Dataset
        </label>
        <Select 
          value={selectedDataset || undefined} 
          onValueChange={onSelectDataset}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700">
            <SelectValue placeholder="Choose a dataset" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {datasets.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.rows} rows)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-[#10A37F] text-white' 
                    : 'bg-gray-800 text-[#ECECF1]'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>
      
      {selectedDataset && (
        <div className="p-2 border-t border-gray-700">
          <div className="mb-2">
            <p className="text-xs text-gray-400">Try asking:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {getExampleQueries(selectedDataset).map((query, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm"
                  className="text-xs border-gray-700 bg-gray-800 hover:bg-gray-700"
                  onClick={() => {
                    setInput(query);
                    inputRef.current?.focus();
                  }}
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            className="bg-gray-800 border-gray-700"
            disabled={!selectedDataset || isLoading}
          />
          <Button 
            type="submit" 
            disabled={!selectedDataset || !input.trim() || isLoading}
            className="bg-[#10A37F] hover:bg-[#0D8A69]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
