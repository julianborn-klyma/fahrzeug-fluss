
-- Branding settings table
CREATE TABLE public.branding_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url text DEFAULT '',
  primary_color text DEFAULT '45 100% 51%',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage branding_settings" ON public.branding_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Teamleiter can manage branding_settings" ON public.branding_settings FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Office can view branding_settings" ON public.branding_settings FOR SELECT USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Monteurs can view branding_settings" ON public.branding_settings FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));

-- Insert default row
INSERT INTO public.branding_settings (id, logo_url, primary_color) VALUES (gen_random_uuid(), '', '45 100% 51%');

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true);

CREATE POLICY "Admins can upload branding" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update branding" ON storage.objects FOR UPDATE USING (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete branding" ON storage.objects FOR DELETE USING (bucket_id = 'branding' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view branding" ON storage.objects FOR SELECT USING (bucket_id = 'branding');
