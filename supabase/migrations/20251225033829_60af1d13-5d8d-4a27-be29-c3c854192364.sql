-- Create a sequence for appointment reference IDs
CREATE SEQUENCE IF NOT EXISTS appointment_ref_seq START WITH 1001;

-- Update the generate_appointment_reference function to use KTS-XXXX format with 4 digit serial
CREATE OR REPLACE FUNCTION public.generate_appointment_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_serial INTEGER;
BEGIN
  -- Get next value from sequence
  SELECT nextval('appointment_ref_seq') INTO next_serial;
  
  -- Format: KTS-XXXX (4 digit serial number)
  NEW.reference_id := 'KTS-' || LPAD(next_serial::text, 4, '0');
  
  RETURN NEW;
END;
$function$;