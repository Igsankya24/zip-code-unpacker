-- Create service_projects table for portfolio/work items
CREATE TABLE public.service_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_projects ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible projects
CREATE POLICY "Anyone can view visible service projects"
ON public.service_projects
FOR SELECT
USING (is_visible = true);

-- Admins can manage all projects
CREATE POLICY "Admins can manage service projects"
ON public.service_projects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_service_projects_service_id ON public.service_projects(service_id);

-- Create trigger for updated_at
CREATE TRIGGER update_service_projects_updated_at
BEFORE UPDATE ON public.service_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();