-- Allow guest appointment requests to be stored as real appointments
ALTER TABLE public.appointments ALTER COLUMN user_id DROP NOT NULL;

-- Reference ID generator sequence (used by generate_appointment_reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND c.relname = 'appointment_ref_seq' AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.appointment_ref_seq START 1001;
  END IF;
END $$;

-- Triggers (they were missing; functions already exist)
DROP TRIGGER IF EXISTS trg_generate_appointment_reference ON public.appointments;
CREATE TRIGGER trg_generate_appointment_reference
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.generate_appointment_reference();

DROP TRIGGER IF EXISTS trg_notify_new_appointment ON public.appointments;
CREATE TRIGGER trg_notify_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_appointment();

DROP TRIGGER IF EXISTS trg_notify_appointment_status_change ON public.appointments;
CREATE TRIGGER trg_notify_appointment_status_change
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_appointment_status_change();

-- RLS: allow anyone to submit a guest appointment request (no login) with user_id NULL
DROP POLICY IF EXISTS "Anyone can create guest appointments" ON public.appointments;
CREATE POLICY "Anyone can create guest appointments"
ON public.appointments
FOR INSERT
WITH CHECK (user_id IS NULL);
