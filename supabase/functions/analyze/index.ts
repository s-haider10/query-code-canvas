
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

// Helper function to create a data profile from dataset
function createDataProfile(data: any[], sampleSize = 3) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return "No data available for profiling";
  }

  try {
    // Extract columns
    const columns = Object.keys(data[0]);
    
    // Infer data types
    const dtypes: Record<string, string> = {};
    columns.forEach(col => {
      const value = data[0][col];
      if (typeof value === 'number') dtypes[col] = 'number';
      else if (typeof value === 'boolean') dtypes[col] = 'boolean';
      else dtypes[col] = 'string';
    });

    // Count missing values
    const missingValues: Record<string, number> = {};
    columns.forEach(col => {
      missingValues[col] = data.filter(row => 
        row[col] === null || row[col] === undefined || row[col] === ''
      ).length;
    });

    // Basic numerical summary for numeric columns
    const numericalSummary: Record<string, any> = {};
    columns.filter(col => dtypes[col] === 'number').forEach(col => {
      const values = data.map(row => row[col]).filter(val => val !== null && val !== undefined);
      if (values.length > 0) {
        numericalSummary[col] = {
          min: Math.min(...values),
          max: Math.max(...values),
          mean: values.reduce((sum, val) => sum + val, 0) / values.length,
          count: values.length
        };
      }
    });

    // Basic categorical summary (top values)
    const categoricalSummary: Record<string, any> = {};
    columns.filter(col => dtypes[col] === 'string').forEach(col => {
      const valueCounts: Record<string, number> = {};
      data.forEach(row => {
        const val = String(row[col]);
        if (val) {
          valueCounts[val] = (valueCounts[val] || 0) + 1;
        }
      });
      // Get top 5 categories
      const topCategories = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, number>);

      categoricalSummary[col] = topCategories;
    });

    // Create sample (random subset)
    const sample = data.length <= sampleSize ? 
      data : 
      Array.from({length: sampleSize}, () => data[Math.floor(Math.random() * data.length)]);

    // Compile profile
    const profile = {
      columns,
      dtypes,
      shape: [data.length, columns.length],
      missingValues,
      numericalSummary: Object.keys(numericalSummary).length > 0 ? numericalSummary : null,
      categoricalSummary: Object.keys(categoricalSummary).length > 0 ? categoricalSummary : null,
      sample
    };

    return JSON.stringify(profile);
  } catch (error) {
    console.error("Error creating data profile:", error);
    return "Error generating data profile";
  }
}

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
    
    // Parse full content or use sample data
    let dataContent;
    
    if (dataset.full_content) {
      try {
        dataContent = JSON.parse(dataset.full_content);
      } catch (error) {
        console.error("Error parsing dataset full content:", error);
        // Fallback to sample if available
        if (dataset.sample) {
          if (typeof dataset.sample === 'string') {
            dataContent = JSON.parse(dataset.sample);
          } else {
            dataContent = dataset.sample;
          }
        }
      }
    } else if (dataset.sample) {
      if (typeof dataset.sample === 'string') {
        dataContent = JSON.parse(dataset.sample);
      } else {
        dataContent = dataset.sample;
      }
    }
    
    if (!dataContent || !Array.isArray(dataContent)) {
      return new Response(
        JSON.stringify({ error: "Dataset content not available or invalid" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate data profile for the dataset
    const dataProfile = createDataProfile(dataContent);
    
    // Get column information
    let columns = [];
    let dtypes = {};
    
    if (dataset.columns && Array.isArray(dataset.columns)) {
      columns = dataset.columns;
    } else if (typeof dataset.columns === 'string') {
      try {
        columns = JSON.parse(dataset.columns);
      } catch (e) {
        console.error("Error parsing columns:", e);
        // Try to extract from the first data record
        if (dataContent && dataContent.length > 0) {
          columns = Object.keys(dataContent[0]);
        }
      }
    } else if (dataContent && dataContent.length > 0) {
      // If no columns defined, extract from data
      columns = Object.keys(dataContent[0]);
    }

    // Create a structured prompt for the initial analysis
    const initialSystemPrompt = `
You are DEXA (Data Exploration Assistant), an advanced data analysis assistant working with a pandas DataFrame.
You have been given the following data profile to understand the dataset structure:

DATA PROFILE:
${dataProfile}

The user asks: ${query}

Generate Python code to:
1. Perform the requested analysis on the dataset using pandas, numpy, matplotlib and seaborn
2. Create appropriate visualization using matplotlib/seaborn
3. Store any numerical or tabular results in a variable called 'analysis_result'
4. Return the plot object with clear labels, titles and styling

IMPORTANT:
- Use ONLY these variables: df, plt, sns, np, pd
- Never use unsafe functions like eval() or os
- Use seaborn or matplotlib for plots
- Make sure to display the plot with plt.show() at the end
- Store important numerical or tabular results in 'analysis_result' variable
- Add proper labels, titles and formatting to make the visualization clear and professional

Format your response as TWO SEPARATE SECTIONS:
1. Analysis: [Initial hypothesis and approach based on the data profile]
2. Code: [Python code that performs the analysis and creates visualization]
`;

    // Call OpenAI API for initial analysis and code generation
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
          { role: "system", content: initialSystemPrompt }
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
    let initialAnalysis = "";
    let code = "";

    if (responseText.includes("Analysis:")) {
      const analysisMatch = responseText.match(/Analysis:([\s\S]*?)(?=Code:|$)/);
      if (analysisMatch && analysisMatch[1]) {
        initialAnalysis = analysisMatch[1].trim();
      }
    }

    if (responseText.includes("Code:")) {
      const codeMatch = responseText.match(/Code:([\s\S]*?)(?=Analysis:|$)/);
      if (codeMatch && codeMatch[1]) {
        code = codeMatch[1].trim();
        // Remove any markdown code block formatting
        code = code.replace(/```python\n/g, "").replace(/```/g, "");
      }
    }

    // Here, in a real implementation, we would execute the code on the dataset
    // For now, we'll simulate the execution and interpretation phase
    
    // Create the prompt for the interpretation phase
    const interpretationPrompt = `
You are DEXA (Data Exploration Assistant), an advanced data analysis assistant.

You previously generated code to answer this query: "${query}"

Based on the code you generated:
${code}

Now generate a thorough explanation and interpretation of what this code does and what insights it would likely reveal.
Follow this structure:

1. Explanation: [Explain what the code does step by step in plain language]
2. Likely Insights: [Describe patterns, trends, or relationships the code would reveal]
3. Summary: [Provide a concise, high-level summary of key findings]

Your response should be informative and accessible to users without technical knowledge.
`;

    // Call OpenAI API for interpretation
    const interpretationResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: interpretationPrompt }
        ],
        temperature: 0.2,
      })
    });

    if (!interpretationResponse.ok) {
      const errorText = await interpretationResponse.text();
      console.error("OpenAI API error during interpretation:", errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error during interpretation: ${errorText}` }),
        { status: interpretationResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const interpretationData = await interpretationResponse.json();
    const interpretationText = interpretationData.choices[0].message.content;
    
    // Parse the interpretation response
    let explanation = "";
    let likelyInsights = "";
    let summary = "";

    if (interpretationText.includes("Explanation:")) {
      const explanationMatch = interpretationText.match(/Explanation:([\s\S]*?)(?=Likely Insights:|$)/);
      if (explanationMatch && explanationMatch[1]) {
        explanation = explanationMatch[1].trim();
      }
    }

    if (interpretationText.includes("Likely Insights:")) {
      const insightsMatch = interpretationText.match(/Likely Insights:([\s\S]*?)(?=Summary:|$)/);
      if (insightsMatch && insightsMatch[1]) {
        likelyInsights = insightsMatch[1].trim();
      }
    }

    if (interpretationText.includes("Summary:")) {
      const summaryMatch = interpretationText.match(/Summary:([\s\S]*?)$/);
      if (summaryMatch && summaryMatch[1]) {
        summary = summaryMatch[1].trim();
      }
    }

    const executionTime = Date.now() - start;

    // Save the query to the database
    try {
      const { data: queryRecord, error: queryError } = await supabase
        .from('queries')
        .insert({
          query_text: query,
          dataset_id: datasetId,
          generated_code: code,
          explanation: explanation + "\n\n" + likelyInsights,
          execution_time: executionTime / 1000, // Convert to seconds
          success: true,
        })
        .select();

      if (queryError) {
        console.error("Error saving query:", queryError);
        // Continue execution even if saving the query fails
      }
    } catch (error) {
      console.error("Error in query saving process:", error);
      // Continue with the response even if there's an error saving the query
    }
    
    // For now, we'll use sample images based on the dataset type
    // In a production environment, you would execute the Python code and generate the actual image
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
        explanation: explanation,
        analysis: summary,
        insights: likelyInsights,
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
