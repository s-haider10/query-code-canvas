
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.82.0/encoding/base64.ts";

interface AnalysisRequest {
  dataset: string;
  query: string;
}

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
    // Get the authorization header for user authentication
    const authHeader = req.headers.get('authorization');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get OpenAI API key from environment variables
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { dataset: datasetId, query } = await req.json() as AnalysisRequest;
    
    if (!datasetId || !query) {
      return new Response(
        JSON.stringify({ error: "Missing dataset ID or query" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing analysis request for dataset ${datasetId} with query: ${query}`);

    // Fetch the dataset from the database
    const { data: datasets, error: datasetError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId);
    
    if (datasetError || !datasets || datasets.length === 0) {
      console.error("Error fetching dataset:", datasetError);
      return new Response(
        JSON.stringify({ error: `Dataset not found: ${datasetError?.message || "No dataset with that ID"}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dataset = datasets[0];
    const fullContent = dataset.full_content;
    
    if (!fullContent) {
      return new Response(
        JSON.stringify({ error: "Dataset content not available" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract column names and data types from the dataset
    let columns = [];
    let dtypes = {};
    
    if (dataset.columns && Array.isArray(dataset.columns)) {
      columns = dataset.columns;
      // Infer data types from sample data if available
      if (dataset.sample && Array.isArray(dataset.sample) && dataset.sample.length > 0) {
        const sample = dataset.sample[0];
        for (const col of columns) {
          const val = sample[col];
          if (typeof val === 'number') {
            dtypes[col] = 'number';
          } else if (typeof val === 'boolean') {
            dtypes[col] = 'boolean';
          } else {
            dtypes[col] = 'string';
          }
        }
      }
    } else if (typeof dataset.columns === 'string') {
      try {
        columns = JSON.parse(dataset.columns);
      } catch (e) {
        console.error("Error parsing columns:", e);
      }
    }

    // Create a structured prompt similar to notebook_analyze function
    const systemPrompt = `
You are a data analysis assistant working with a pandas DataFrame.
Dataframe columns: ${JSON.stringify(columns)}
Data types: ${JSON.stringify(dtypes)}

The user asks: ${query}

Generate Python code to:
1. Perform the requested analysis
2. Create appropriate visualization using matplotlib/seaborn
3. Return the plot object

IMPORTANT:
- Use ONLY these variables: df, plt, sns
- Never use unsafe functions like eval() or os
- Use seaborn or matplotlib for plots
- Make sure to display the plot with plt.show() at the end
- For analysis, provide a comprehensive explanation of the data patterns
- Make the visualization clear and readable with proper labels and titles

Format your response as THREE SEPARATE SECTIONS:
1. Code: [Python code that performs the analysis and creates visualization]
2. Analysis: [Comprehensive analysis of data patterns and insights]
3. Summary: [Brief, concise summary of key findings]

Each section should be distinct and clearly labeled.`;

    // Call OpenAI API
    const start = Date.now();
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt }
        ],
        temperature: 0.2,
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errorText}` }),
        { status: openAIResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIData = await openAIResponse.json();
    const responseText = openAIData.choices[0].message.content;
    
    // Parse the response to extract code and analysis
    let code = "";
    let analysis = "";
    let summary = "";

    if (responseText.includes("Code:")) {
      const codeMatch = responseText.match(/Code:([\s\S]*?)(?=Analysis:|Summary:|$)/);
      if (codeMatch && codeMatch[1]) {
        code = codeMatch[1].trim();
        // Remove any markdown code block formatting
        code = code.replace(/```python\n/g, "").replace(/```/g, "");
      }
    }

    if (responseText.includes("Analysis:")) {
      const analysisMatch = responseText.match(/Analysis:([\s\S]*?)(?=Code:|Summary:|$)/);
      if (analysisMatch && analysisMatch[1]) {
        analysis = analysisMatch[1].trim();
      }
    }

    if (responseText.includes("Summary:")) {
      const summaryMatch = responseText.match(/Summary:([\s\S]*?)(?=Code:|Analysis:|$)/);
      if (summaryMatch && summaryMatch[1]) {
        summary = summaryMatch[1].trim();
      }
    }

    // Create the Python script to execute the code with the dataset
    // Assuming we'll capture the generated image as a base64 string
    const executionTime = Date.now() - start;

    // Save the query to the database
    const { data: queryRecord, error: queryError } = await supabase
      .from('queries')
      .insert({
        query_text: query,
        dataset_id: datasetId,
        generated_code: code,
        explanation: analysis,
        execution_time: executionTime / 1000, // Convert to seconds
        success: true,
      })
      .select()
      .single();

    if (queryError) {
      console.error("Error saving query:", queryError);
      // Continue execution even if saving the query fails
    }
    
    // For now, we'll use sample images based on the dataset type
    // In a production environment, you would execute the Python code and generate the actual image
    // This is just a placeholder implementation
    let imageUrl = "";
    
    if (dataset.name.toLowerCase().includes("titanic")) {
      const imageOptions = [
        "/titanic-age-histogram.png",
        "/titanic-class-survival.png",
        "/titanic-gender-survival.png",
        "/titanic-age-fare-scatter.png"
      ];
      imageUrl = imageOptions[Math.floor(Math.random() * imageOptions.length)];
    } else if (dataset.name.toLowerCase().includes("iris")) {
      const imageOptions = [
        "/iris-petal-histogram.png",
        "/iris-sepal-scatter.png",
        "/iris-boxplot.png"
      ];
      imageUrl = imageOptions[Math.floor(Math.random() * imageOptions.length)];
    } else if (dataset.name.toLowerCase().includes("gapminder")) {
      const imageOptions = [
        "/gapminder-gdp-life.png",
        "/gapminder-continent.png",
        "/gapminder-population.png"
      ];
      imageUrl = imageOptions[Math.floor(Math.random() * imageOptions.length)];
    } else {
      imageUrl = "/default-chart.png";
    }

    // Send the result back to the client
    return new Response(
      JSON.stringify({
        code,
        explanation: analysis,
        analysis: summary,
        image: imageUrl,
        execution_time: executionTime / 1000
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in analyze function:", error);
    return new Response(
      JSON.stringify({ error: `Analysis failed: ${error.message || String(error)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
