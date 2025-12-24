-- Create admin_permissions table
CREATE TABLE public.admin_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  can_view_messages BOOLEAN DEFAULT true,
  can_view_appointments BOOLEAN DEFAULT true,
  can_confirm_appointments BOOLEAN DEFAULT true,
  can_delete_appointments BOOLEAN DEFAULT false,
  can_view_users BOOLEAN DEFAULT true,
  can_manage_users BOOLEAN DEFAULT false,
  can_view_services BOOLEAN DEFAULT true,
  can_manage_services BOOLEAN DEFAULT false,
  can_view_coupons BOOLEAN DEFAULT true,
  can_manage_coupons BOOLEAN DEFAULT false,
  can_view_settings BOOLEAN DEFAULT false,
  can_manage_settings BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create deletion_requests table
CREATE TABLE public.deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL, -- 'appointment', 'user', etc.
  target_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_permissions
CREATE POLICY "Super admins can manage permissions"
ON public.admin_permissions
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view their own permissions"
ON public.admin_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policies for deletion_requests
CREATE POLICY "Super admins can manage deletion requests"
ON public.deletion_requests
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can create and view their own deletion requests"
ON public.deletion_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'super_admin') OR 
  requested_by = auth.uid()
);

CREATE POLICY "Admins can create deletion requests"
ON public.deletion_requests
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Function to create default permissions when user becomes admin
CREATE OR REPLACE FUNCTION public.create_default_admin_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.admin_permissions (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create permissions when role assigned
CREATE TRIGGER on_admin_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_admin_permissions();