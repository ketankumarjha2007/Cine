-- ============================================================================
-- 06_storage.sql: Storage Bucket and Policies
-- ============================================================================

-- Create public media bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to media bucket
CREATE POLICY "Public media access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');

-- Admin upload access
CREATE POLICY "Admins upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND public.is_admin()
);

-- Admin update access
CREATE POLICY "Admins update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND public.is_admin()
);

-- Admin delete access
CREATE POLICY "Admins delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND public.is_admin()
);
