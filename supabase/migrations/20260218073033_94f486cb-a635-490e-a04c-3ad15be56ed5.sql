-- Allow monteurs to update job_appointments (e.g. field_values)
CREATE POLICY "Monteurs can update job_appointments"
ON public.job_appointments
FOR UPDATE
USING (has_role(auth.uid(), 'monteur'::app_role));
