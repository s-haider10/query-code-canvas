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
  full_content?: string;
  metadata?: any;
}

// Chat session (per dataset + user)
export interface DatasetChat {
  id: string;
  user_id: string;
  dataset_id: string;
  created_at: string;
  title?: string | null;
}

// Chat message, linked to chat_id and user
export interface ChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Change DatasetType to be compatible with string values
export type DatasetType = string;

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
  full_content?: string;
  metadata?: any;
  user_id?: string;
  file_path?: string;
}
