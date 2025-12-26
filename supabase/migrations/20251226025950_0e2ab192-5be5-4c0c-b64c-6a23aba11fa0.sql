-- Create guest_bookings table to store guest PII in a structured format
CREATE TABLE IF NOT EXISTS public.guest_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.guest_bookings ENABLE ROW LEVEL SECURITY;

-- Create index for efficient lookups
CREATE INDEX idx_guest_bookings_appointment_id ON public.guest_bookings(appointment_id);
CREATE INDEX idx_guest_bookings_guest_email ON public.guest_bookings(guest_email);

-- RLS policies: Only admins can access guest data
CREATE POLICY "Admins can view guest bookings"
  ON public.guest_bookings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Anyone can insert guest bookings for their appointments"
  ON public.guest_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update guest bookings"
  ON public.guest_bookings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete guest bookings"
  ON public.guest_bookings FOR DELETE
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_guest_bookings_updated_at
  BEFORE UPDATE ON public.guest_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Drop the api_keys table as secrets should not be stored in client-accessible database
-- First remove RLS policies
DROP POLICY IF EXISTS "Super admins can manage API keys" ON public.api_keys;

-- Drop the table - secrets should be managed via Supabase secrets/environment variables
DROP TABLE IF EXISTS public.api_keys;