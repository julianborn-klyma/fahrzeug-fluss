
-- New table for assigning monteurs to job_appointments
CREATE TABLE public.job_appointment_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_appointment_id uuid NOT NULL REFERENCES public.job_appointments(id) ON DELETE CASCADE,
  person_id uuid NOT NULL,
  person_name text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_appointment_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage job_appointment_assignments"
  ON public.job_appointment_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Office can manage job_appointment_assignments"
  ON public.job_appointment_assignments FOR ALL
  USING (has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Teamleiter can manage job_appointment_assignments"
  ON public.job_appointment_assignments FOR ALL
  USING (has_role(auth.uid(), 'teamleiter'::app_role));

CREATE POLICY "Monteurs can view job_appointment_assignments"
  ON public.job_appointment_assignments FOR SELECT
  USING (has_role(auth.uid(), 'monteur'::app_role));
