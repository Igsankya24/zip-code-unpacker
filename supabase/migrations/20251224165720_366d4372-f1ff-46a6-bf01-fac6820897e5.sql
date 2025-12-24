-- Function to create notification when new appointment is booked
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  service_name TEXT;
BEGIN
  -- Get user name
  SELECT full_name INTO user_name FROM profiles WHERE user_id = NEW.user_id;
  
  -- Get service name
  SELECT name INTO service_name FROM services WHERE id = NEW.service_id;
  
  -- Create notification for admins (user_id = null means visible to all admins)
  INSERT INTO notifications (title, message, type, user_id)
  VALUES (
    'New Appointment Booked',
    COALESCE(user_name, 'A customer') || ' booked ' || COALESCE(service_name, 'an appointment') || ' for ' || NEW.appointment_date || ' at ' || NEW.appointment_time,
    'info',
    NULL
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new appointments
DROP TRIGGER IF EXISTS on_new_appointment ON appointments;
CREATE TRIGGER on_new_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION notify_new_appointment();

-- Function to create notification when new user signs up
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification for admins
  INSERT INTO notifications (title, message, type, user_id)
  VALUES (
    'New User Registered',
    COALESCE(NEW.full_name, NEW.email) || ' has signed up and is awaiting approval.',
    'warning',
    NULL
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user profiles
DROP TRIGGER IF EXISTS on_new_user_profile ON profiles;
CREATE TRIGGER on_new_user_profile
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_new_user();

-- Function to notify on appointment status change
CREATE OR REPLACE FUNCTION public.notify_appointment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify the user who owns the appointment
    INSERT INTO notifications (title, message, type, user_id)
    VALUES (
      'Appointment ' || INITCAP(NEW.status),
      'Your appointment on ' || NEW.appointment_date || ' at ' || NEW.appointment_time || ' has been ' || NEW.status || '.',
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'success'
        WHEN NEW.status = 'completed' THEN 'info'
        WHEN NEW.status = 'cancelled' THEN 'warning'
        ELSE 'info'
      END,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for appointment status changes
DROP TRIGGER IF EXISTS on_appointment_status_change ON appointments;
CREATE TRIGGER on_appointment_status_change
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION notify_appointment_status_change();