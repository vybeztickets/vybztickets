-- Event images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('event-images', 'event-images', true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public read event images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'event-images');

-- Authenticated upload
CREATE POLICY "Auth upload event images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-images');

-- Authenticated update (replace)
CREATE POLICY "Auth update event images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'event-images');
