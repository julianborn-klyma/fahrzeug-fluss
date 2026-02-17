-- Add parent_step_id to job_checklist_steps for group hierarchy
ALTER TABLE public.job_checklist_steps
ADD COLUMN parent_step_id uuid REFERENCES public.job_checklist_steps(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to job_checklists -> job_appointments FK
ALTER TABLE public.job_checklists
DROP CONSTRAINT IF EXISTS job_checklists_appointment_id_fkey;

ALTER TABLE public.job_checklists
ADD CONSTRAINT job_checklists_appointment_id_fkey
FOREIGN KEY (appointment_id) REFERENCES public.job_appointments(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to job_checklist_steps -> job_checklists FK
ALTER TABLE public.job_checklist_steps
DROP CONSTRAINT IF EXISTS job_checklist_steps_checklist_id_fkey;

ALTER TABLE public.job_checklist_steps
ADD CONSTRAINT job_checklist_steps_checklist_id_fkey
FOREIGN KEY (checklist_id) REFERENCES public.job_checklists(id) ON DELETE CASCADE;