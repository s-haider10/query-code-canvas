
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import { parse } from "https://deno.land/std@0.170.0/encoding/csv.ts";

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
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!file || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing file or dataset name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['csv', 'json', 'xls', 'xlsx'].includes(fileExt)) {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload CSV, JSON, or Excel file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Extract file content as text
    const decoder = new TextDecoder('utf-8');
    const fileContent = decoder.decode(buffer);

    // Parse the dataset to extract columns and a sample
    let columns: string[] = [];
    let sample: any[] = [];
    let rows = 0;

    if (fileExt === 'csv') {
      try {
        const parsedData = parse(fileContent, { skipFirstRow: true, columns: true });
        if (parsedData.length > 0) {
          columns = Object.keys(parsedData[0]);
          sample = parsedData.slice(0, 5);
          rows = parsedData.length;
        }
      } catch (e) {
        console.error("Failed to parse CSV:", e);
      }
    } else if (fileExt === 'json') {
      try {
        const parsedData = JSON.parse(fileContent);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          columns = Object.keys(parsedData[0]);
          sample = parsedData.slice(0, 5);
          rows = parsedData.length;
        }
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    }

    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('datasets')
      .upload(filePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Failed to upload file: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('datasets')
      .getPublicUrl(filePath);

    // Insert dataset metadata into the database
    const { data: dataset, error: insertError } = await supabase
      .from('datasets')
      .insert({
        name,
        description,
        file_path: urlData.publicUrl,
        file_type: fileExt,
        columns: columns,
        columns_count: columns.length,
        rows,
        user_id: user.id,
        sample: sample,
        full_content: fileContent  // Store full dataset content
      })
      .select()
      .single();

    if (insertError) {
      // Clean up the uploaded file if metadata insertion fails
      await supabase.storage
        .from('datasets')
        .remove([filePath]);

      return new Response(
        JSON.stringify({ error: `Failed to save dataset metadata: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(dataset),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing upload:', error);
    return new Response(
      JSON.stringify({ error: `Upload failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
