
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, File, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Dataset } from '@/types/dataset';

interface DatasetUploaderProps {
  onDatasetUploaded: (dataset: Dataset) => void;
}

const DatasetUploader = ({ onDatasetUploaded }: DatasetUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<{ columns: string[], rows: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };
  
  const handleFileSelection = (selectedFile: File) => {
    // Check file size (50MB limit)
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 50MB",
      });
      return;
    }
    
    // Check file type
    const validFileTypes = [
      'text/csv', 
      'application/json', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validFileTypes.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a CSV, JSON or Excel file",
      });
      return;
    }
    
    setFile(selectedFile);
    
    // Generate preview for CSV files
    if (selectedFile.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          // Parse first 5 rows
          const rows = [];
          for (let i = 1; i < Math.min(lines.length, 6); i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim());
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              rows.push(row);
            }
          }
          
          setFilePreview({ columns: headers, rows });
        } catch (error) {
          console.error('Error parsing CSV', error);
          toast({
            variant: "destructive",
            title: "Error parsing file",
            description: "The file couldn't be parsed. Is it a valid CSV?",
          });
        }
      };
      reader.readAsText(selectedFile);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload dataset');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Notify parent component
        onDatasetUploaded({
          id: data.dataset_id,
          name: file.name,
          description: `Uploaded dataset (${file.name})`,
          columns: filePreview?.columns || [],
          rows: data.rows || 0,
          columns_count: filePreview?.columns.length || 0,
          predefined: false
        });
        
        // Reset state
        setFile(null);
        setFilePreview(null);
        
        toast({
          title: "Upload successful",
          description: "Your dataset is ready for analysis",
        });
      } else {
        throw new Error('Unknown error occurred');
      }
    } catch (error) {
      console.error('Error uploading dataset:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCancel = () => {
    setFile(null);
    setFilePreview(null);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Upload Dataset</h3>
      
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-[#10A37F] bg-[#10A37F]/10' : 'border-gray-700 hover:border-[#10A37F]/50'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.xls,.xlsx"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-400">
            Drag & drop or click to upload CSV, JSON or Excel files
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: 50MB
          </p>
        </div>
      ) : (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <File className="h-5 w-5 mr-2 text-[#10A37F]" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[160px]">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)}MB</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {filePreview && (
              <div className="mb-4">
                <p className="text-xs font-medium mb-1">Preview</p>
                <div className="bg-gray-900 p-2 rounded-md text-xs overflow-x-auto max-h-32">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {filePreview.columns.slice(0, 5).map((col, idx) => (
                          <th key={idx} className="px-2 py-1 text-left text-gray-400">{col}</th>
                        ))}
                        {filePreview.columns.length > 5 && (
                          <th className="px-2 py-1 text-left text-gray-400">...</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filePreview.rows.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-800">
                          {filePreview.columns.slice(0, 5).map((col, colIdx) => (
                            <td key={colIdx} className="px-2 py-1 truncate max-w-[80px]">
                              {row[col]}
                            </td>
                          ))}
                          {filePreview.columns.length > 5 && (
                            <td className="px-2 py-1">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleUpload} 
              className="w-full bg-[#10A37F] hover:bg-[#0D8A69]"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>Upload Dataset</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatasetUploader;
