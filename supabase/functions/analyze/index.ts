
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
    
    console.log(`Processing query for dataset: ${datasetId}`);
    
    if (!datasetId) {
      throw new Error('Dataset ID is required');
    }

    // Get dataset information
    const { data: datasets, error: datasetsError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId);
      
    if (datasetsError) {
      console.error("Error fetching dataset:", datasetsError);
      throw new Error(`Dataset fetch error: ${datasetsError.message}`);
    }
    
    if (!datasets || datasets.length === 0) {
      console.error(`No dataset found with id: ${datasetId}`);
      throw new Error('Dataset not found');
    }
    
    const datasetData = datasets[0];
    console.log(`Found dataset: ${datasetData.name}`);

    // Parse columns from the dataset
    let columns = [];
    try {
      columns = JSON.parse(datasetData.columns);
    } catch (e) {
      console.error("Error parsing columns:", e);
      columns = [];
    }

    // Get the dataset content
    const dataContent = datasetData.full_content || '';
    if (!dataContent) {
      throw new Error('Dataset content not available');
    }

    // Extract data types by analyzing the sample data
    const sample = datasetData.sample ? JSON.parse(datasetData.sample) : [];
    const dataTypes: Record<string, string> = {};
    
    if (sample.length > 0) {
      const firstRow = sample[0];
      for (const key in firstRow) {
        const value = firstRow[key];
        dataTypes[key] = typeof value;
      }
    }

    // Create prompt for data analysis similar to the notebook version
    const systemPrompt = `
    You are a data analysis assistant working with a pandas DataFrame.
    Dataframe columns: ${columns.join(', ')}
    Data types: ${JSON.stringify(dataTypes)}
    
    The user asks: ${query}
    
    Generate Python code to:
    1. Perform the requested analysis
    2. Create appropriate visualization using matplotlib/seaborn
    3. Return insights about the data
    
    IMPORTANT:
    - Use ONLY these variables: df, plt, sns
    - Never use unsafe functions like eval() or os
    - Use seaborn or matplotlib for plots
    - Make sure the code is complete and ready to run
    - Include all necessary imports
    - Save the plot to a variable called 'fig'
    
    Provide your response in this format:
    Analysis: [Brief analysis summary]
    Code: [Python code only, without backticks]
    `;

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
    const fullResponse = codeData.choices[0].message.content;

    // Extract components from the response
    let analysis = "";
    let generatedCode = "";
    
    if (fullResponse.includes("Analysis:") && fullResponse.includes("Code:")) {
      analysis = fullResponse.split("Analysis:")[1].split("Code:")[0].trim();
      generatedCode = fullResponse.split("Code:")[1].trim();
    } else {
      // If the format isn't as expected, use the whole response as code
      generatedCode = fullResponse;
    }

    // Generate explanation with a second API call
    const explanationPrompt = `
    I analyzed a dataset with these columns: ${columns.join(', ')}
    
    The user asked: "${query}"
    
    I generated this code:
    ${generatedCode}
    
    Please provide a detailed explanation of:
    1. What the code does
    2. What insights can be derived from this analysis
    3. Any interesting patterns or findings
    4. Recommendations for further analysis
    
    Explanation should be understandable to non-technical users but still informative.
    `;

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

    // Store query in database
    try {
      const { error: insertError } = await supabase.from('queries').insert([
        {
          dataset_id: datasetId,
          query_text: query,
          generated_code: generatedCode,
          explanation: explanation,
          execution_time: 0.5, // Mock execution time
          success: true
        }
      ]);
      
      if (insertError) {
        console.error("Error storing query in database:", insertError);
        // Continue execution even if storing query fails
      }
    } catch (e) {
      console.error("Exception storing query:", e);
      // Continue execution even if storing query fails
    }

    // Return the response
    return new Response(
      JSON.stringify({
        code: generatedCode,
        explanation: explanation,
        analysis: analysis,
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
