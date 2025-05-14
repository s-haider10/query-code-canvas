
import { supabase } from '@/integrations/supabase/client';
import { DatasetType, DatasetMetadata as DatasetMetadataType } from '@/types/dataset';

// Remove the duplicate interface declaration and use the imported type
export interface QueryResult {
  id: string;
  query_text: string;
  generated_code: string;
  visualization_url: string;
  explanation: string;
  execution_time: number;
  created_at: string;
}

// Dataset API functions
export const fetchDatasets = async () => {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as DatasetMetadataType[];
};

export const fetchDataset = async (id: string) => {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data as DatasetMetadataType | null;
};

export const uploadDataset = async (
  file: File,
  name: string,
  description: string
) => {
  const user = supabase.auth.getUser();
  const userId = (await user).data.user?.id;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}-${file.name}`;
  
  const { error: storageError } = await supabase.storage
    .from('datasets')
    .upload(filePath, file);
  
  if (storageError) throw storageError;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('datasets')
    .getPublicUrl(filePath);
  
  // Extract metadata (this is simplified, in real app parse file content)
  // For now just use mock data
  const fileType = file.type;
  const columns = ['column1', 'column2', 'column3']; // Mock columns
  const rows = 100; // Mock row count
  
  // Insert metadata into datasets table
  const { data, error } = await supabase
    .from('datasets')
    .insert([
      {
        name,
        description,
        file_path: urlData.publicUrl,
        file_type: fileExt,
        columns: JSON.stringify(columns),
        columns_count: columns.length,
        rows,
        user_id: userId
      }
    ])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

// Query API functions
export const executeQuery = async (datasetId: string, queryText: string) => {
  // Call the AI code generation endpoint
  const response = await fetch(`/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      dataset: datasetId,
      query: queryText 
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to execute query');
  }
  
  const result = await response.json();
  
  // Store query results in database
  const user = supabase.auth.getUser();
  const userId = (await user).data.user?.id;
  
  if (userId) {
    await supabase.from('queries').insert([
      {
        dataset_id: datasetId,
        user_id: userId,
        query_text: queryText,
        generated_code: result.code,
        visualization_url: result.image ? `data:image/png;base64,${result.image}` : null,
        explanation: result.explanation,
        execution_time: result.executionTime || 0,
        success: result.success
      }
    ]);
  }
  
  return result;
};

// Function to create or get default datasets
export const ensureDefaultDatasets = async () => {
  const { data: existingDatasets } = await supabase
    .from('datasets')
    .select('id')
    .eq('predefined', true);
  
  // If we already have predefined datasets, return
  if (existingDatasets && existingDatasets.length > 0) {
    return;
  }
  
  // Create default Titanic dataset
  await supabase.from('datasets').insert([
    {
      name: 'Titanic Passenger Data',
      description: 'Information about Titanic passengers including age, sex, class, fare, and survival status.',
      file_path: '/predefined/titanic.csv',
      file_type: 'csv',
      columns: JSON.stringify(['passenger_id', 'survived', 'pclass', 'name', 'sex', 'age', 'sibsp', 'parch', 'ticket', 'fare', 'cabin', 'embarked']),
      columns_count: 12,
      rows: 891,
      predefined: true,
      sample: JSON.stringify([
        { passenger_id: 1, survived: 0, pclass: 3, name: 'Braund, Mr. Owen Harris', sex: 'male', age: 22 },
        { passenger_id: 2, survived: 1, pclass: 1, name: 'Cumings, Mrs. John Bradley', sex: 'female', age: 38 }
      ])
    },
    {
      name: 'Iris Flower Dataset',
      description: 'Classic dataset containing measurements for iris flowers of three different species.',
      file_path: '/predefined/iris.json',
      file_type: 'json',
      columns: JSON.stringify(['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species']),
      columns_count: 5,
      rows: 150,
      predefined: true,
      sample: JSON.stringify([
        { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
        { sepal_length: 7.0, sepal_width: 3.2, petal_length: 4.7, petal_width: 1.4, species: 'versicolor' }
      ])
    }
  ]);
};
