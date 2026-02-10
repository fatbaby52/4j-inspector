-- Migration: 00002_photos_anon_access
-- Allow anonymous access to photos table since auth has been removed
-- NOTE: For production, re-enable proper RLS with authentication

-- Drop existing restrictive policies on photos
DROP POLICY IF EXISTS "Users can view photos of own inspections" ON public.photos;
DROP POLICY IF EXISTS "Users can insert photos to own inspections" ON public.photos;
DROP POLICY IF EXISTS "Users can delete photos from own inspections" ON public.photos;

-- Create permissive policies for anon access
CREATE POLICY "Allow all select on photos"
    ON public.photos FOR SELECT
    USING (true);

CREATE POLICY "Allow all insert on photos"
    ON public.photos FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all update on photos"
    ON public.photos FOR UPDATE
    USING (true);

CREATE POLICY "Allow all delete on photos"
    ON public.photos FOR DELETE
    USING (true);

-- Also update storage policies to be more permissive
DROP POLICY IF EXISTS "Users can upload to own inspection folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own inspection photos" ON storage.objects;

-- Permissive storage policies for inspection-photos bucket
CREATE POLICY "Allow all uploads to inspection-photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'inspection-photos');

CREATE POLICY "Allow all reads from inspection-photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'inspection-photos');

CREATE POLICY "Allow all deletes from inspection-photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'inspection-photos');

-- Also fix inspections table to allow anon access (if not already done)
DROP POLICY IF EXISTS "Users can view own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can insert own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update own inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can delete own inspections" ON public.inspections;

CREATE POLICY "Allow all select on inspections"
    ON public.inspections FOR SELECT
    USING (true);

CREATE POLICY "Allow all insert on inspections"
    ON public.inspections FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all update on inspections"
    ON public.inspections FOR UPDATE
    USING (true);

CREATE POLICY "Allow all delete on inspections"
    ON public.inspections FOR DELETE
    USING (true);

-- Update reports bucket policies
DROP POLICY IF EXISTS "Users can view own reports" ON storage.objects;

CREATE POLICY "Allow all reads from inspection-reports"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'inspection-reports');

CREATE POLICY "Allow all uploads to inspection-reports"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'inspection-reports');
