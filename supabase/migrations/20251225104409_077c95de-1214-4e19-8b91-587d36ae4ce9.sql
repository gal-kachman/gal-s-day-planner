-- Create a table to store enriched library item data
CREATE TABLE public.library_item_enrichments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id TEXT NOT NULL UNIQUE,
  image_url TEXT,
  enriched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.library_item_enrichments ENABLE ROW LEVEL SECURITY;

-- Allow public read access (library items are not user-specific in this app)
CREATE POLICY "Anyone can view enrichments" 
ON public.library_item_enrichments 
FOR SELECT 
USING (true);

-- Allow public insert/update (edge function will handle this)
CREATE POLICY "Anyone can create enrichments" 
ON public.library_item_enrichments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update enrichments" 
ON public.library_item_enrichments 
FOR UPDATE 
USING (true);

-- Create storage bucket for library covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('library-covers', 'library-covers', true);

-- Allow public read access to covers
CREATE POLICY "Public can view library covers" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'library-covers');

-- Allow uploads to library covers bucket
CREATE POLICY "Anyone can upload library covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'library-covers');