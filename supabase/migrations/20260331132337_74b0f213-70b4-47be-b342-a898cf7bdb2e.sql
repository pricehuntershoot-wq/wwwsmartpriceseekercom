CREATE POLICY "Authenticated users can update shops ehub_program_id"
ON public.shops
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);