-- Add new columns to admin_permissions for new features
ALTER TABLE public.admin_permissions 
ADD COLUMN IF NOT EXISTS can_view_invoices boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_invoices boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_technicians boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_technicians boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_analytics boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_export_data boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_view_api_keys boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_api_keys boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_bot_settings boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_bot_settings boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_deletion_requests boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_deletion_requests boolean DEFAULT false;

-- Add new columns to user_access for additional user features
ALTER TABLE public.user_access 
ADD COLUMN IF NOT EXISTS can_view_invoices boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_track_appointments boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_receive_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_update_profile boolean DEFAULT true;