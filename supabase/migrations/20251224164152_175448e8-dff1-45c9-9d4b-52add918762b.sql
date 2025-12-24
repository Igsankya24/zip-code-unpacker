-- Add reference_id column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reference_id TEXT UNIQUE;

-- Create a function to generate a unique reference ID
CREATE OR REPLACE FUNCTION generate_appointment_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference_id := 'KTS-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate reference_id on insert
DROP TRIGGER IF EXISTS set_appointment_reference ON public.appointments;
CREATE TRIGGER set_appointment_reference
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION generate_appointment_reference();

-- Update existing appointments with reference IDs
UPDATE public.appointments 
SET reference_id = 'KTS-' || TO_CHAR(created_at, 'YYMMDD') || '-' || SUBSTRING(id::text, 1, 4)
WHERE reference_id IS NULL;