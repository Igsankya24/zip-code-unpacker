-- Create blog_ad_analytics table for tracking impressions and clicks
CREATE TABLE public.blog_ad_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id uuid NOT NULL REFERENCES public.blog_ads(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'click')),
  visitor_id text,
  user_agent text,
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_blog_ad_analytics_ad_id ON public.blog_ad_analytics(ad_id);
CREATE INDEX idx_blog_ad_analytics_post_id ON public.blog_ad_analytics(post_id);
CREATE INDEX idx_blog_ad_analytics_event_type ON public.blog_ad_analytics(event_type);
CREATE INDEX idx_blog_ad_analytics_created_at ON public.blog_ad_analytics(created_at);

-- Enable RLS
ALTER TABLE public.blog_ad_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can insert ad analytics" 
ON public.blog_ad_analytics 
FOR INSERT 
WITH CHECK (true);

-- Admins can view analytics
CREATE POLICY "Admins can view ad analytics" 
ON public.blog_ad_analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can delete analytics
CREATE POLICY "Super admins can delete ad analytics" 
ON public.blog_ad_analytics 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));