
-- Create a storage bucket for datasets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'datasets', 'datasets', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'datasets'
);

-- Create policy to allow authenticated users to upload to this bucket
INSERT INTO storage.policies (name, definition, bucket_id)
SELECT 
  'Allow authenticated users to upload', 
  '(role() = ''authenticated'')', 
  'datasets'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'datasets' AND name = 'Allow authenticated users to upload'
);

-- Allow users to read from the bucket
INSERT INTO storage.policies (name, definition, bucket_id)
SELECT 
  'Allow public read access', 
  '(TRUE)', 
  'datasets'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = 'datasets' AND name = 'Allow public read access'
);

-- Create RLS policy for datasets table to ensure users can only see their own datasets or predefined ones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE tablename = 'datasets' AND policyname = 'Users can see their own datasets or predefined ones'
  ) THEN
    CREATE POLICY "Users can see their own datasets or predefined ones" 
      ON public.datasets 
      FOR SELECT 
      USING (auth.uid() = user_id OR predefined = true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE tablename = 'datasets' AND policyname = 'Users can insert their own datasets'
  ) THEN
    CREATE POLICY "Users can insert their own datasets" 
      ON public.datasets 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Enable RLS on datasets table if not already enabled
ALTER TABLE IF EXISTS public.datasets ENABLE ROW LEVEL SECURITY;
