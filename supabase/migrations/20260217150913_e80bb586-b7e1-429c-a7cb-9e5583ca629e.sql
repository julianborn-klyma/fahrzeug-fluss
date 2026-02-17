-- Add is_internal override column to job_appointments
ALTER TABLE public.job_appointments
ADD COLUMN is_internal boolean DEFAULT NULL;
-- NULL means "use appointment_type default", true/false = override