
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { dataset: datasetId, query } = await req.json();

    // Get dataset information
    const { data: datasetData, error: datasetError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .single();

    if (datasetError || !datasetData) {
      throw new Error(`Dataset not found: ${datasetError?.message || 'Unknown error'}`);
    }

    // Parse columns from the dataset
    let columns = [];
    try {
      columns = JSON.parse(datasetData.columns);
    } catch (e) {
      console.error("Error parsing columns:", e);
      columns = [];
    }

    // Create prompt for code generation
    const systemPrompt = `You are a data science assistant that generates Python visualization code.
    The data is in a pandas DataFrame named 'df' with columns: ${columns.join(', ')}.
    Generate high-quality Python code using pandas and matplotlib/seaborn to answer the query.
    Focus only on the visualization code, with no explanations or comments.`;

    // Generate code with OpenAI
    const codeResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using a fast, affordable model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.2, // Lower temperature for more deterministic code
      }),
    });

    if (!codeResponse.ok) {
      const errorData = await codeResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const codeData = await codeResponse.json();
    const generatedCode = codeData.choices[0].message.content;

    // Generate explanation with a second API call
    const explanationPrompt = `Explain this data visualization in simple terms:
    
    Query: "${query}"
    
    Code:
    ${generatedCode}
    
    Explain what insights can be drawn from this visualization in 3-4 sentences.`;

    const explanationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at explaining data visualizations in simple terms.' },
          { role: 'user', content: explanationPrompt }
        ],
        temperature: 0.7, // Higher temperature for more creative explanation
      }),
    });

    if (!explanationResponse.ok) {
      const errorData = await explanationResponse.text();
      console.error("OpenAI API error (explanation):", errorData);
      throw new Error(`OpenAI API error (explanation): ${errorData}`);
    }

    const explanationData = await explanationResponse.json();
    const explanation = explanationData.choices[0].message.content;

    // For demo purposes, create a mock image
    // In a real implementation, this would execute the code and generate an actual image
    // For now, we'll use a predefined image based on dataset and query type
    let imageUrl = '';
    
    // Simple logic to choose a relevant pre-made visualization based on the query
    if (datasetData.name.toLowerCase().includes('titanic')) {
      if (query.toLowerCase().includes('age')) {
        imageUrl = '/titanic-age-histogram.png';
      } else if (query.toLowerCase().includes('class') || query.toLowerCase().includes('survival')) {
        imageUrl = '/titanic-class-survival.png';
      } else if (query.toLowerCase().includes('gender')) {
        imageUrl = '/titanic-gender-survival.png';
      } else {
        imageUrl = '/titanic-default.png';
      }
    } else if (datasetData.name.toLowerCase().includes('iris')) {
      if (query.toLowerCase().includes('petal')) {
        imageUrl = '/iris-petal-histogram.png';
      } else if (query.toLowerCase().includes('sepal') && query.toLowerCase().includes('scatter')) {
        imageUrl = '/iris-sepal-scatter.png';
      } else if (query.toLowerCase().includes('box')) {
        imageUrl = '/iris-boxplot.png';
      } else {
        imageUrl = '/iris-default.png';
      }
    } else {
      imageUrl = '/default-chart.png';
    }

    // Convert the relative URL to a data URL by fetching the image
    // Note: In a real implementation with a backend, you would generate this image from the code
    // Store query in database
    await supabase.from('queries').insert([
      {
        dataset_id: datasetId,
        query_text: query,
        generated_code: generatedCode,
        explanation: explanation,
        execution_time: 0.5, // Mock execution time
        success: true
      }
    ]);

    // Return the response
    return new Response(
      JSON.stringify({
        code: generatedCode,
        explanation: explanation,
        image: imageUrl,
        success: true
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error in analyze function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
