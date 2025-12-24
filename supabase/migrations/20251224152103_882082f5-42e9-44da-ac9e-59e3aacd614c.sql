-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Globe',
  features TEXT[] DEFAULT '{}',
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Anyone can view visible services" ON public.services
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins can view all services" ON public.services
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Insert default services
INSERT INTO public.services (name, description, icon, features, display_order) VALUES
('Web Development', 'Custom websites and web applications built with modern technologies for optimal performance and user experience.', 'Globe', ARRAY['Responsive Design', 'SEO Optimized', 'Fast Loading', 'Secure'], 1),
('Mobile App Development', 'Native and cross-platform mobile applications for iOS and Android devices.', 'Smartphone', ARRAY['iOS & Android', 'Cross-Platform', 'User-Friendly', 'Scalable'], 2),
('Desktop Applications', 'Powerful desktop software solutions for Windows, macOS, and Linux platforms.', 'Monitor', ARRAY['Cross-Platform', 'High Performance', 'Offline Support', 'Custom UI'], 3),
('Cybersecurity', 'Comprehensive security solutions to protect your digital assets and data.', 'Shield', ARRAY['Vulnerability Assessment', 'Penetration Testing', 'Security Audits', 'Compliance'], 4),
('Database Solutions', 'Design, implementation, and optimization of database systems for your business needs.', 'Database', ARRAY['Design & Setup', 'Migration', 'Optimization', 'Backup Solutions'], 5),
('IT Support', '24/7 technical support and maintenance services to keep your systems running smoothly.', 'Headphones', ARRAY['24/7 Support', 'Remote Assistance', 'On-Site Service', 'Maintenance'], 6);

-- Add more site settings
INSERT INTO public.site_settings (key, value) VALUES 
('github_link', 'https://github.com/krishna-tech-solutions'),
('twitter_link', ''),
('linkedin_link', ''),
('facebook_link', ''),
('company_email', 'info@krishnatechsolutions.com'),
('company_phone', '+91 12345 67890'),
('company_address', '123 Tech Park, Innovation Street, Bangalore, Karnataka 560001, India')
ON CONFLICT (key) DO NOTHING;