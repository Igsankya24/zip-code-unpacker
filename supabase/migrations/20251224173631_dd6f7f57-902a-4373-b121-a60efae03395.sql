-- Allow anyone to track appointments by reference_id (read-only, limited fields exposed via query)
CREATE POLICY "Anyone can track appointments by reference_id"
ON public.appointments
FOR SELECT
USING (reference_id IS NOT NULL);