
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'review';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'abgenommen';

ALTER TABLE public.job_appointments ADD COLUMN IF NOT EXISTS signature_url text DEFAULT '';

-- Create signatures storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT DO NOTHING;

-- RLS policies for signatures bucket
CREATE POLICY "Authenticated users can upload signatures"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can view signatures"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'signatures');
