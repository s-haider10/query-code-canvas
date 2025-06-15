
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

interface ChatRequest {
  query: string;
  data_profile: string;
}

function buildPrompt(query: string, data_profile: string): string {
  // Build prompt exactly as the user described in their provided code
  return `
Task: Analyze dataset
Data Profile: ${data_profile}
User Query: ${query}

Requirements:
1. Generate Python code using df, plt, sns these functions already imported DO NOT import again
2. Store numerical results in 'analysis_result'
3. Create publication-quality visualization
4. Never use unsafe functions, 

Follow these Examples = 

Example 1 (Titanic):
Query: "Analyze survival rates by passenger class"
Hypothesis: First-class passengers had higher survival rates
Code: \`\`\`python
plt.figure(figsize=(10,6))
class_survival = df.groupby('Pclass')['Survived'].mean()
sns.barplot(x=class_survival.index, y=class_survival.values, palette="viridis")
plt.ylabel("Survival Rate")
plt.title("Survival Rates by Passenger Class")
analysis_result = class_survival
\`\`\`

Example 2 (Boston Housing):
Query: "Show relationship between crime rate and home prices"
Hypothesis: Higher crime rates correlate with lower median home values
Code: \`\`\`python
plt.figure(figsize=(10,6))
sns.scatterplot(x='CRIM', y='MEDV', data=df, alpha=0.6)
plt.xlabel("Crime Rate per Capita")
plt.ylabel("Median Home Value ($1000s)")
plt.title("Crime Rate vs. Home Value")
analysis_result = df[['CRIM', 'MEDV']].corr().iloc[0,1] # Pearson's 
\`\`\`

Response Format:
Hypothesis: [Your initial prediction]
Code: \`\`\`python
# Your code
\`\`\`
`
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, data_profile } = await req.json() as ChatRequest;

    if (!query || !data_profile) {
      return new Response(JSON.stringify({ error: "Missing query or data_profile" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(query, data_profile);

    const openaiRes = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (!openaiRes.ok) {
      const errStr = await openaiRes.text();
      return new Response(JSON.stringify({ error: "OpenAI error: " + errStr }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ai-chat] Server error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
