
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    return res.status(500).json({ error: 'Supabase URL not configured' });
  }

  // Forward the request to the Supabase Edge Function
  const functionUrl = `${supabaseUrl}/functions/v1/upload-dataset`;
  
  try {
    // Forward the request with all headers and body
    const response = await fetch(functionUrl, {
      method: req.method,
      headers: {
        ...req.headers as any,
        // Make sure we're not sending host header which can cause issues
        host: new URL(supabaseUrl).host,
      },
      body: req.body,
    });

    // Get the response data
    const data = await response.text();
    
    // Set the appropriate status code
    res.status(response.status);

    // Set all the headers from the response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send the response body
    res.send(data);
  } catch (error) {
    console.error('Error calling upload-dataset function:', error);
    res.status(500).json({ error: 'Failed to call upload-dataset function' });
  }
}
