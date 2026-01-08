-- Add blog-related permissions to admin_permissions table
ALTER TABLE public.admin_permissions 
ADD COLUMN IF NOT EXISTS can_view_blog boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_blog boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_blog_ads boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_blog_ads boolean DEFAULT false;