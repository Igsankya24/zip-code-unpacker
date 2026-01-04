-- Add post_id column to blog_ads table for post-specific ads
ALTER TABLE public.blog_ads ADD COLUMN post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_blog_ads_post_id ON public.blog_ads(post_id);

-- Add comment
COMMENT ON COLUMN public.blog_ads.post_id IS 'Optional: Link ad to a specific blog post. NULL means ad shows on all posts.';