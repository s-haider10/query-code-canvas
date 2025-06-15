
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// This function fetches a summary/profile for a chosen dataset
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { dataset_id } = await req.json();
    if (!dataset_id) {
      return new Response(JSON.stringify({ error: "Missing dataset_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query the datasets table for the specified dataset_id (works for both predefined and uploaded)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/datasets?select=columns,sample&name=eq.${dataset_id}`,
      {
        method: "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    if (!profileRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch dataset profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const [dataset] = await profileRes.json();
    if (!dataset) {
      return new Response(JSON.stringify({ error: "Dataset not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // columns: string[]  sample: record[]
    const { columns, sample } = dataset;
    // Create concise data_profile string
    const data_profile = `Columns: [${columns.join(", ")}]
Sample: ${JSON.stringify(sample, null, 2)}`;
    return new Response(JSON.stringify({ data_profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[get-dataset-profile]", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
