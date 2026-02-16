
-- Enums
CREATE TYPE public.trade_type AS ENUM ('SHK','Elektro','Fundament','Dach','GaLa');
CREATE TYPE public.job_status AS ENUM ('erstellt','vorbereitet','verplant','durchgefuehrt','abgerechnet');

-- Module flag
ALTER TABLE public.bonus_settings ADD COLUMN module_klyma_os_enabled boolean NOT NULL DEFAULT true;

-- Contacts
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage contacts" ON public.contacts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage contacts" ON public.contacts FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage contacts" ON public.contacts FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view contacts" ON public.contacts FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Clients
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_type text NOT NULL DEFAULT 'private',
  company_name text DEFAULT '',
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  billing_street text DEFAULT '',
  billing_city text DEFAULT '',
  billing_postal_code text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage clients" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage clients" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage clients" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view clients" ON public.clients FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Properties
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  street_address text DEFAULT '',
  city text DEFAULT '',
  postal_code text DEFAULT '',
  property_type text DEFAULT '',
  old_heating text DEFAULT '',
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage properties" ON public.properties FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage properties" ON public.properties FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage properties" ON public.properties FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view properties" ON public.properties FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Client contacts junction
CREATE TABLE public.client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, contact_id)
);
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage client_contacts" ON public.client_contacts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage client_contacts" ON public.client_contacts FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage client_contacts" ON public.client_contacts FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view client_contacts" ON public.client_contacts FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Property contacts junction
CREATE TABLE public.property_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, contact_id)
);
ALTER TABLE public.property_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage property_contacts" ON public.property_contacts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage property_contacts" ON public.property_contacts FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage property_contacts" ON public.property_contacts FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view property_contacts" ON public.property_contacts FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Order types
CREATE TABLE public.order_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage order_types" ON public.order_types FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage order_types" ON public.order_types FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage order_types" ON public.order_types FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view order_types" ON public.order_types FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Appointment types per order type
CREATE TABLE public.appointment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type_id uuid NOT NULL REFERENCES public.order_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  trade trade_type,
  is_internal boolean NOT NULL DEFAULT false,
  requires_documents boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage appointment_types" ON public.appointment_types FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage appointment_types" ON public.appointment_types FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage appointment_types" ON public.appointment_types FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view appointment_types" ON public.appointment_types FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Jobs
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  order_type_id uuid REFERENCES public.order_types(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'erstellt',
  trades trade_type[] NOT NULL DEFAULT '{}',
  active_trades trade_type[] NOT NULL DEFAULT '{}',
  description text DEFAULT '',
  estimated_hours numeric DEFAULT 0,
  assigned_to uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage jobs" ON public.jobs FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage jobs" ON public.jobs FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage jobs" ON public.jobs FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view assigned jobs" ON public.jobs FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Job trade details
CREATE TABLE public.job_trade_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade trade_type NOT NULL,
  appointment_start timestamptz,
  appointment_end timestamptz,
  assigned_team_members uuid[] DEFAULT '{}',
  technical_info text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_trade_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage job_trade_details" ON public.job_trade_details FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage job_trade_details" ON public.job_trade_details FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage job_trade_details" ON public.job_trade_details FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view job_trade_details" ON public.job_trade_details FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Trade appointments
CREATE TABLE public.trade_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  trade trade_type NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage trade_appointments" ON public.trade_appointments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage trade_appointments" ON public.trade_appointments FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage trade_appointments" ON public.trade_appointments FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view trade_appointments" ON public.trade_appointments FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Appointment assignments
CREATE TABLE public.appointment_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.trade_appointments(id) ON DELETE CASCADE,
  person_id uuid NOT NULL,
  person_name text DEFAULT '',
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  trade trade_type,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointment_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage appointment_assignments" ON public.appointment_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage appointment_assignments" ON public.appointment_assignments FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage appointment_assignments" ON public.appointment_assignments FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view appointment_assignments" ON public.appointment_assignments FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Document types
CREATE TABLE public.document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT '',
  applicable_trades trade_type[] DEFAULT '{}',
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage document_types" ON public.document_types FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage document_types" ON public.document_types FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage document_types" ON public.document_types FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view document_types" ON public.document_types FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Job documents
CREATE TABLE public.job_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  document_type_id uuid REFERENCES public.document_types(id) ON DELETE SET NULL,
  trade trade_type,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage job_documents" ON public.job_documents FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage job_documents" ON public.job_documents FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage job_documents" ON public.job_documents FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view job_documents" ON public.job_documents FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));
CREATE POLICY "Monteurs can insert job_documents" ON public.job_documents FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'monteur'));

-- Checklist templates
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trade trade_type,
  is_standard boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage checklist_templates" ON public.checklist_templates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage checklist_templates" ON public.checklist_templates FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage checklist_templates" ON public.checklist_templates FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view checklist_templates" ON public.checklist_templates FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Checklist template steps
CREATE TABLE public.checklist_template_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  step_type text NOT NULL DEFAULT 'checkbox',
  order_index integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_template_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage checklist_template_steps" ON public.checklist_template_steps FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage checklist_template_steps" ON public.checklist_template_steps FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage checklist_template_steps" ON public.checklist_template_steps FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view checklist_template_steps" ON public.checklist_template_steps FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));

-- Job checklists (instantiated from templates)
CREATE TABLE public.job_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  trade trade_type,
  status text NOT NULL DEFAULT 'offen',
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage job_checklists" ON public.job_checklists FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage job_checklists" ON public.job_checklists FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage job_checklists" ON public.job_checklists FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view job_checklists" ON public.job_checklists FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));
CREATE POLICY "Monteurs can update job_checklists" ON public.job_checklists FOR UPDATE USING (public.has_role(auth.uid(), 'monteur'));

-- Job checklist steps
CREATE TABLE public.job_checklist_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.job_checklists(id) ON DELETE CASCADE,
  template_step_id uuid REFERENCES public.checklist_template_steps(id) ON DELETE SET NULL,
  title text NOT NULL,
  step_type text NOT NULL DEFAULT 'checkbox',
  order_index integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  text_value text DEFAULT '',
  photo_url text DEFAULT '',
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_checklist_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage job_checklist_steps" ON public.job_checklist_steps FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage job_checklist_steps" ON public.job_checklist_steps FOR ALL USING (public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage job_checklist_steps" ON public.job_checklist_steps FOR ALL USING (public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view job_checklist_steps" ON public.job_checklist_steps FOR SELECT USING (public.has_role(auth.uid(), 'monteur'));
CREATE POLICY "Monteurs can update job_checklist_steps" ON public.job_checklist_steps FOR UPDATE USING (public.has_role(auth.uid(), 'monteur'));

-- Storage bucket for job documents
INSERT INTO storage.buckets (id, name, public) VALUES ('job-documents', 'job-documents', false);

-- Storage policies
CREATE POLICY "Admins can manage job document files" ON storage.objects FOR ALL USING (bucket_id = 'job-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teamleiter can manage job document files" ON storage.objects FOR ALL USING (bucket_id = 'job-documents' AND public.has_role(auth.uid(), 'teamleiter'));
CREATE POLICY "Office can manage job document files" ON storage.objects FOR ALL USING (bucket_id = 'job-documents' AND public.has_role(auth.uid(), 'office'));
CREATE POLICY "Monteurs can view job document files" ON storage.objects FOR SELECT USING (bucket_id = 'job-documents' AND public.has_role(auth.uid(), 'monteur'));
CREATE POLICY "Monteurs can upload job document files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'job-documents' AND public.has_role(auth.uid(), 'monteur'));

-- Trigger for jobs updated_at
CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_jobs_updated_at();

-- Default order types
INSERT INTO public.order_types (name, description, is_system, display_order) VALUES
  ('Wärmepumpe', 'Installation einer Wärmepumpe', true, 1),
  ('Wartung', 'Wartungsauftrag', true, 2),
  ('Reparatur', 'Reparaturauftrag', true, 3);
