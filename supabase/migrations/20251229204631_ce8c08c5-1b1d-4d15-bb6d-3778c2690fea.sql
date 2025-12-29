-- Create storage bucket for site icons/favicons
INSERT INTO storage.buckets (id, name, public) VALUES ('site-icons', 'site-icons', true);

-- Create policy for public read access to site icons
CREATE POLICY "Anyone can view site icons"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-icons');

-- Create policy for admins to upload site icons
CREATE POLICY "Admins can upload site icons"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'site-icons' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Create policy for admins to update site icons
CREATE POLICY "Admins can update site icons"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'site-icons' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Create policy for admins to delete site icons
CREATE POLICY "Admins can delete site icons"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'site-icons' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);