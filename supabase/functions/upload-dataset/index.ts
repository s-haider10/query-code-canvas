
// Follow Deno Supabase Edge Function syntax
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Define file processing functions
async function extractColumnsFromCSV(content: string): Promise<string[]> {
  const firstLine = content.split('\n')[0];
  return firstLine.split(',').map(col => col.trim().replace(/"/g, ''));
}

async function countRowsFromCSV(content: string): Promise<number> {
  return content.split('\n').filter(line => line.trim().length > 0).length - 1; // Subtract header row
}

async function extractSampleFromCSV(content: string, numRows: number = 2): Promise<Record<string, any>[]> {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const sampleRows = lines.slice(1, numRows + 1);
  
  return sampleRows.map(row => {
    const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
    const rowObj: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      // Try to convert to number if possible
      const numValue = Number(value);
      rowObj[header] = !isNaN(numValue) && value !== '' ? numValue : value;
    });
    
    return rowObj;
  });
}

// Create a single edge function to handle dataset uploads
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get authentication details
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Get user data from the client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: userError?.message || 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate form data
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Dataset name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process file content
    const fileContent = await file.text();
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    
    // Extract metadata based on file type
    let columns: string[] = [];
    let rows = 0;
    let sample: Record<string, any>[] = [];
    let fullContent = fileContent; // Store the full content
    
    if (fileExt === 'csv') {
      columns = await extractColumnsFromCSV(fileContent);
      rows = await countRowsFromCSV(fileContent);
      sample = await extractSampleFromCSV(fileContent);
    } else {
      // For other file types (JSON, Excel), use placeholder values
      // In a real implementation, you'd parse these properly
      columns = ['column1', 'column2', 'column3'];
      rows = 100;
      sample = [{ column1: 'value1', column2: 'value2', column3: 'value3' }];
    }

    // Upload file to storage
    const { data: storageData, error: storageError } = await supabaseClient.storage
      .from('datasets')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      });

    if (storageError) {
      return new Response(
        JSON.stringify({ error: `Failed to upload file: ${storageError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the public URL for the file
    const { data: urlData } = await supabaseClient.storage
      .from('datasets')
      .getPublicUrl(filePath);

    // Insert metadata into datasets table
    const { data: datasetData, error: datasetError } = await supabaseClient
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
          user_id: user.id,
          sample: JSON.stringify(sample),
          full_content: fileContent // Store the full dataset content
        }
      ])
      .select()
      .single();

    if (datasetError) {
      return new Response(
        JSON.stringify({ error: `Failed to save dataset metadata: ${datasetError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(datasetData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
