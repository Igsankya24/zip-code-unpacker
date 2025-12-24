-- Create user_access table to control what features users can access
CREATE TABLE public.user_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  can_book_appointments boolean DEFAULT true,
  can_view_services boolean DEFAULT true,
  can_use_chatbot boolean DEFAULT true,
  can_apply_coupons boolean DEFAULT true,
  can_contact_support boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own access settings
CREATE POLICY "Users can view their own access"
ON public.user_access
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all user access
CREATE POLICY "Admins can manage user access"
ON public.user_access
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create default access for new users
CREATE OR REPLACE FUNCTION public.create_default_user_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_access (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create default access when profile is created
DROP TRIGGER IF EXISTS on_profile_created_access ON profiles;
CREATE TRIGGER on_profile_created_access
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_user_access();