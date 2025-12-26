-- Remove duplicate triggers on appointments that cause duplicate notifications/reference IDs
DO $$
BEGIN
  -- Appointment status change notification trigger (duplicate)
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_notify_appointment_status_change'
      AND tgrelid = 'public.appointments'::regclass
  ) THEN
    EXECUTE 'DROP TRIGGER trg_notify_appointment_status_change ON public.appointments';
  END IF;

  -- New appointment notification trigger (duplicate)
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_notify_new_appointment'
      AND tgrelid = 'public.appointments'::regclass
  ) THEN
    EXECUTE 'DROP TRIGGER trg_notify_new_appointment ON public.appointments';
  END IF;

  -- Appointment reference trigger (duplicate)
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_generate_appointment_reference'
      AND tgrelid = 'public.appointments'::regclass
  ) THEN
    EXECUTE 'DROP TRIGGER trg_generate_appointment_reference ON public.appointments';
  END IF;
END $$;
