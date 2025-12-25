-- Add address and photo_url columns to technicians table
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for technician photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('technician-photos', 'technician-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for technician photos
CREATE POLICY "Anyone can view technician photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'technician-photos');

CREATE POLICY "Admins can upload technician photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'technician-photos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can update technician photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'technician-photos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can delete technician photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'technician-photos' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Create api_keys table for storing API configuration (super admin only)
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL UNIQUE,
  key_value text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage API keys
CREATE POLICY "Super admins can manage API keys"
ON public.api_keys FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();