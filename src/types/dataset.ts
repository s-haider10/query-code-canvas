
export interface Dataset {
  id: string;
  name: string;
  description: string;
  columns: string[];
  rows: number;
  columns_count: number;
  predefined: boolean;
  sample?: any[];
}
