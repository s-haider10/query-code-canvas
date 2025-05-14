
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DatasetUploaderProps {
  onUploadComplete: () => void;
}

const DatasetUploader = ({ onUploadComplete }: DatasetUploaderProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Maximum file size is 50MB"
        });
        return;
      }
      
      // Validate file type
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      if (!['csv', 'json', 'xls', 'xlsx'].includes(fileExt)) {
        toast({
          variant: "destructive",
          title: "Unsupported file type",
          description: "Please upload a CSV, JSON, or Excel file"
        });
        return;
      }
      
      setFile(selectedFile);
      if (!name) {
        // Set default name from file name without extension
        setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    setProgress(10); // Start progress
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);
      
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to upload datasets');
      }
      
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Upload to the Supabase edge function
      const response = await fetch('/api/upload-dataset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to upload dataset';
        } catch (e) {
          // If parsing fails, use the raw text
          errorMessage = errorText || 'Failed to upload dataset';
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      setProgress(100);
      
      // Reset form and close dialog
      setTimeout(() => {
        setFile(null);
        setName('');
        setDescription('');
        setUploading(false);
        setProgress(0);
        setOpen(false);
        onUploadComplete();
      }, 1000);
      
      toast({
        title: "Dataset uploaded",
        description: "Your dataset has been successfully uploaded"
      });
    } catch (error) {
      console.error('Error uploading dataset:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "An error occurred while uploading dataset"
      });
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Dataset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Upload a CSV, JSON, or Excel file containing your dataset.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={uploading}
                accept=".csv,.json,.xls,.xlsx"
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 50MB. Supported formats: CSV, JSON, Excel.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Dataset Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Dataset"
                required
                disabled={uploading}
                maxLength={100}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A description of this dataset..."
                disabled={uploading}
                maxLength={500}
              />
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {progress < 100 ? "Uploading..." : "Processing..."}
                  </span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DatasetUploader;
