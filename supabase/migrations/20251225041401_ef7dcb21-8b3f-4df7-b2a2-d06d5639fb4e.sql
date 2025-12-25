-- Fix appointments visibility & inserts: replace RESTRICTIVE policies with PERMISSIVE ones
-- (Existing policies were effectively acting like AND conditions, hiding rows and blocking inserts.)

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid restrictive stacking
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can track appointments by reference_id" ON public.appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create guest appointments" ON public.appointments;

-- Admins / Super admins: full access
CREATE POLICY "Admins can manage all appointments"
ON public.appointments
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Users: CRUD their own
CREATE POLICY "Users can create their own appointments"
ON public.appointments
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own appointments"
ON public.appointments
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
ON public.appointments
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Guests: allow creating an appointment request without login
CREATE POLICY "Anyone can create guest appointments"
ON public.appointments
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL);

-- Public tracking by reference id (keeps current behavior)
CREATE POLICY "Anyone can track appointments by reference_id"
ON public.appointments
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (reference_id IS NOT NULL);
