
-- Add contact person (Ansprechpartner) and planner (Auftragsplaner) to jobs
ALTER TABLE public.jobs ADD COLUMN contact_person_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN planner_id uuid;
