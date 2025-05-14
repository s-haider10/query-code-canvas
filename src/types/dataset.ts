
export interface Dataset {
  id: string;
  name: string;
  description: string;
  columns: string[];
  rows: number;
  columns_count: number;
  predefined: boolean;
  sample?: any[];
  file_type?: string;
  full_content?: string; // Added to store the full dataset content
}

// Change DatasetType to be compatible with string values
export type DatasetType = string;

// Make sure our interface is compatible with what's coming from API
export interface DatasetMetadata {
  id: string;
  name: string;
  description: string | null;
  columns: string[] | string;
  rows: number | null;
  columns_count: number | null;
  file_type: string;
  created_at: string;
  predefined?: boolean;
  sample?: any[] | string;
  full_content?: string; // Added to store the full dataset content
}
