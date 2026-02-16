
-- Extend appointment_types with description and is_active
ALTER TABLE public.appointment_types ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE public.appointment_types ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create appointment_type_fields
CREATE TABLE public.appointment_type_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_type_id uuid NOT NULL REFERENCES public.appointment_types(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  placeholder text NOT NULL DEFAULT '',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  width text NOT NULL DEFAULT 'half',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_type_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage appointment_type_fields" ON public.appointment_type_fields FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage appointment_type_fields" ON public.appointment_type_fields FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage appointment_type_fields" ON public.appointment_type_fields FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view appointment_type_fields" ON public.appointment_type_fields FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- Create appointment_type_documents
CREATE TABLE public.appointment_type_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_type_id uuid NOT NULL REFERENCES public.appointment_types(id) ON DELETE CASCADE,
  document_type_id uuid NOT NULL REFERENCES public.document_types(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_type_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage appointment_type_documents" ON public.appointment_type_documents FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage appointment_type_documents" ON public.appointment_type_documents FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage appointment_type_documents" ON public.appointment_type_documents FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view appointment_type_documents" ON public.appointment_type_documents FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- Create job_appointments
CREATE TABLE public.job_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  appointment_type_id uuid NOT NULL REFERENCES public.appointment_types(id) ON DELETE CASCADE,
  start_date timestamptz,
  end_date timestamptz,
  status text NOT NULL DEFAULT 'offen',
  notes text NOT NULL DEFAULT '',
  field_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage job_appointments" ON public.job_appointments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Office can manage job_appointments" ON public.job_appointments FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage job_appointments" ON public.job_appointments FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Monteurs can view job_appointments" ON public.job_appointments FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));
