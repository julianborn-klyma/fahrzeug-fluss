
-- Add pricebook_id to jobs
ALTER TABLE public.jobs ADD COLUMN pricebook_id uuid REFERENCES public.kalkulation_pricebooks(id) ON DELETE SET NULL;

-- Create job_appointment_items table
CREATE TABLE public.job_appointment_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_appointment_id uuid NOT NULL REFERENCES public.job_appointments(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'product',
  item_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  vat_rate numeric NOT NULL DEFAULT 19,
  override_vk numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_appointment_items ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as job_appointments)
CREATE POLICY "Admins can manage job_appointment_items"
  ON public.job_appointment_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Office can manage job_appointment_items"
  ON public.job_appointment_items FOR ALL
  USING (has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Teamleiter can manage job_appointment_items"
  ON public.job_appointment_items FOR ALL
  USING (has_role(auth.uid(), 'teamleiter'::app_role));

CREATE POLICY "Monteurs can view job_appointment_items"
  ON public.job_appointment_items FOR SELECT
  USING (has_role(auth.uid(), 'monteur'::app_role));
