
-- Bonus settings table (singleton row pattern)
CREATE TABLE public.bonus_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  half_year_bonus_pool numeric NOT NULL DEFAULT 2000,
  weight_speed numeric NOT NULL DEFAULT 0.30,
  weight_quality numeric NOT NULL DEFAULT 0.30,
  weight_reliability numeric NOT NULL DEFAULT 0.15,
  weight_team numeric NOT NULL DEFAULT 0.15,
  weight_cleanliness numeric NOT NULL DEFAULT 0.10,
  threshold_min_bonus numeric NOT NULL DEFAULT 1.0,
  threshold_min_neutral numeric NOT NULL DEFAULT 0.5,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bonus_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and manage
CREATE POLICY "Admins can manage bonus settings"
  ON public.bonus_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Monteurs can read (for displaying bonus info)
CREATE POLICY "Monteurs can view bonus settings"
  ON public.bonus_settings FOR SELECT
  USING (has_role(auth.uid(), 'monteur'::app_role));

-- Insert default row
INSERT INTO public.bonus_settings (half_year_bonus_pool, weight_speed, weight_quality, weight_reliability, weight_team, weight_cleanliness, threshold_min_bonus, threshold_min_neutral)
VALUES (2000, 0.30, 0.30, 0.15, 0.15, 0.10, 1.0, 0.5);
