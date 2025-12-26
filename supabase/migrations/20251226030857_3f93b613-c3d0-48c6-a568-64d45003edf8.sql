-- Create a sanitize function for preventing XSS in notification messages
CREATE OR REPLACE FUNCTION public.sanitize_html(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '<', '&lt;', 'g'),
        '>', '&gt;', 'g'),
      '"', '&quot;', 'g'),
    '''', '&#39;', 'g'
  );
END;
$$;

-- Update generate_appointment_reference to use random UUID-based IDs instead of sequential
CREATE OR REPLACE FUNCTION public.generate_appointment_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate unpredictable reference ID using random UUID prefix
  NEW.reference_id := 'KTS-' || upper(substr(gen_random_uuid()::text, 1, 8));
  RETURN NEW;
END;
$$;

-- Update notification functions to sanitize user input
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS trigger
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
  
  -- Create notification for admins with sanitized data
  INSERT INTO notifications (title, message, type, user_id)
  VALUES (
    'New Appointment Booked',
    sanitize_html(COALESCE(user_name, 'A customer')) || ' booked ' || 
    sanitize_html(COALESCE(service_name, 'an appointment')) || ' for ' || 
    NEW.appointment_date || ' at ' || NEW.appointment_time,
    'info',
    NULL
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification for admins with sanitized data
  INSERT INTO notifications (title, message, type, user_id)
  VALUES (
    'New User Registered',
    sanitize_html(COALESCE(NEW.full_name, NEW.email)) || ' has signed up and is awaiting approval.',
    'warning',
    NULL
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_appointment_status_change()
RETURNS trigger
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
      'Appointment ' || INITCAP(sanitize_html(NEW.status)),
      'Your appointment on ' || NEW.appointment_date || ' at ' || NEW.appointment_time || ' has been ' || sanitize_html(NEW.status) || '.',
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