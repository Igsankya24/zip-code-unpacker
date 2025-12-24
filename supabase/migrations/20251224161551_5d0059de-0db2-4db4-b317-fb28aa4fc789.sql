-- Add is_frozen column to profiles table for account freezing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_frozen boolean DEFAULT false;

-- Create index for frozen status
CREATE INDEX IF NOT EXISTS idx_profiles_is_frozen ON public.profiles(is_frozen);