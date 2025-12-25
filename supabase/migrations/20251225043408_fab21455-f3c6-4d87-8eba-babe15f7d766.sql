-- Ensure sequence exists for appointment references
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = 'appointment_ref_seq'
      AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.appointment_ref_seq START 1001;
  END IF;
END $$;

-- Triggers for appointments
DROP TRIGGER IF EXISTS trg_generate_appointment_reference ON public.appointments;
CREATE TRIGGER trg_generate_appointment_reference
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.generate_appointment_reference();

DROP TRIGGER IF EXISTS trg_appointments_set_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_set_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

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
