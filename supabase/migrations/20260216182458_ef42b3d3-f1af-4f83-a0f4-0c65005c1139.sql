
-- Add appointment_id to job_checklists so checklists can be linked to specific appointments
ALTER TABLE public.job_checklists ADD COLUMN appointment_id uuid REFERENCES public.job_appointments(id) ON DELETE CASCADE;
