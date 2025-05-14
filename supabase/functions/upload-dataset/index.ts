
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    if (!file || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse JWT to get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: jwtError } = await supabase.auth.getUser(token);
    
    if (jwtError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    // Upload file to storage bucket
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('datasets')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    
    // Get file URL
    const { data: urlData } = supabase.storage
      .from('datasets')
      .getPublicUrl(filePath);
    
    // TODO: In a real implementation, we would parse the file content here
    // to extract columns, column count, and sample data
    
    // For now, use mock data
    const fileType = file.name.split('.').pop() || '';
    let columns, sample;
    
    if (fileType === 'csv') {
      columns = ['column1', 'column2', 'column3'];
      sample = [
        { column1: 'value1', column2: 'value2', column3: 'value3' },
        { column1: 'value4', column2: 'value5', column3: 'value6' }
      ];
    } else if (fileType === 'json') {
      columns = ['id', 'name', 'value'];
      sample = [
        { id: 1, name: 'Item 1', value: 10 },
        { id: 2, name: 'Item 2', value: 20 }
      ];
    } else {
      columns = ['column1', 'column2'];
      sample = [{ column1: 'value1', column2: 'value2' }];
    }
    
    // Insert metadata into datasets table
    const { data: dataset, error: insertError } = await supabase
      .from('datasets')
      .insert([{
        name,
        description,
        file_path: urlData.publicUrl,
        file_type: fileType,
        columns: JSON.stringify(columns),
        columns_count: columns.length,
        rows: 100, // Mock row count
        user_id: user.id,
        sample: JSON.stringify(sample)
      }])
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Failed to insert dataset metadata: ${insertError.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, dataset }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in upload-dataset function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
