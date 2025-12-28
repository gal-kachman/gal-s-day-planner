-- Fix unauthenticated write access to library_item_enrichments
DROP POLICY IF EXISTS "Anyone can create enrichments" ON library_item_enrichments;
DROP POLICY IF EXISTS "Anyone can update enrichments" ON library_item_enrichments;

-- Keep public read access (library data is public)
-- The "Anyone can view enrichments" policy already exists

-- Restrict writes to authenticated users
CREATE POLICY "Authenticated users can create enrichments"
ON library_item_enrichments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update enrichments"
ON library_item_enrichments FOR UPDATE
TO authenticated
USING (true);

-- Fix unauthenticated upload access to storage bucket
DROP POLICY IF EXISTS "Anyone can upload library covers" ON storage.objects;

-- Restrict uploads to authenticated users only
CREATE POLICY "Authenticated users can upload library covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'library-covers');