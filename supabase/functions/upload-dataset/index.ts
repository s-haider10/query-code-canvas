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

    // Convert file to buffer and text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    const fileContent = decoder.decode(buffer);

    // --- PARSE DATASET AND EXTRACT DETAILS ---
    let columns: string[] = [];
    let sample: Record<string, any>[] = [];
    let rows = 0;

    if (fileExt === 'csv') {
      try {
        // Split CSV lines for sample extraction
        const lines = fileContent.split(/\r?\n/).filter(l => l.trim());
        if (lines.length > 1) {
          // Extract columns from header
          const header = lines[0].split(',').map(h => h.trim());
          columns = header;

          // Parse CSV rows for sample, columns, rows
          const parsedData = parse(fileContent, { skipFirstRow: true, columns: true }) as any[];
          sample = Array.isArray(parsedData) ? parsedData.slice(0, 5) : [];
          rows = Array.isArray(parsedData) ? parsedData.length : 0;
        }
      } catch (e) {
        columns = [];
        sample = [];
        rows = 0;
      }
    } else if (fileExt === 'json') {
      try {
        const parsedJson = JSON.parse(fileContent);
        if (Array.isArray(parsedJson) && parsedJson.length > 0) {
          columns = Object.keys(parsedJson[0]);
          sample = parsedJson.slice(0, 5);
          rows = parsedJson.length;
        }
      } catch (e) {
        columns = [];
        sample = [];
        rows = 0;
      }
    } else if (fileExt === 'xls' || fileExt === 'xlsx') {
      // Excel support
      try {
        // Use SheetJS CDN from Deno if available
        // https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.full.min.js
        const XLSXmod = await import("https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.mjs");
        const workbook = XLSXmod.read(buffer, { type: "array" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSXmod.utils.sheet_to_json(ws, { header: 1 });

        if (Array.isArray(data) && data.length > 1) {
          columns = data[0] as string[];
          rows = data.length - 1;
          // Map to array of objects for sample display
          const recordsArr = data.slice(1).map((row: any[]) =>
            Object.fromEntries(
              columns.map((col, idx) => [col, row[idx]])
            )
          );
          sample = recordsArr.slice(0, 5);
        }
      } catch (e) {
        columns = [];
        sample = [];
        rows = 0;
      }
    }

    // --- ALWAYS JSON.stringify for DB columns ---
    const columnsToSave = JSON.stringify(Array.isArray(columns) ? columns : []);
    const sampleToSave = JSON.stringify(Array.isArray(sample) ? sample : []);
    const columnsCount = Array.isArray(columns) ? columns.length : 0;

    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
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
        description: description || null,
        file_path: urlData.publicUrl,
        file_type: fileExt,
        columns: columnsToSave,
        columns_count: columnsCount,
        rows,
        user_id: user.id,
        sample: sampleToSave,
        full_content: fileContent
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

    // Return the stored dataset including all fields
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
