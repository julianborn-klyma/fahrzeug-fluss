
-- Add monteur_visible flag to job_appointments (defaults true, set false on abgenommen)
ALTER TABLE public.job_appointments
ADD COLUMN IF NOT EXISTS monteur_visible boolean NOT NULL DEFAULT true;
