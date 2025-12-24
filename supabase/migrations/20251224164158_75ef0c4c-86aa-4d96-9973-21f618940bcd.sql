-- Fix the function search path issue
CREATE OR REPLACE FUNCTION generate_appointment_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.reference_id := 'KTS-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 4);
  RETURN NEW;
END;
$$;