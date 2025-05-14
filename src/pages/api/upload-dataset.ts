
// Create a standard API endpoint to handle file uploads

import { supabase } from '@/integrations/supabase/client';

export async function handleDatasetUpload(file: File, name: string, description: string, accessToken: string) {
  const supabaseUrl = "https://nzkrqbhwxxwzivjzweat.supabase.co";
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }

  // Forward the request to the Supabase Edge Function
  const functionUrl = `${supabaseUrl}/functions/v1/upload-dataset`;
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    
    // Forward the request with auth headers and body
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Make sure we're not sending host header which can cause issues
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || 'Failed to upload dataset';
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || 'Failed to upload dataset';
      }
      throw new Error(errorMessage);
    }

    // Return the response data
    return await response.json();
  } catch (error) {
    console.error('Error calling upload-dataset function:', error);
    throw error;
  }
}
