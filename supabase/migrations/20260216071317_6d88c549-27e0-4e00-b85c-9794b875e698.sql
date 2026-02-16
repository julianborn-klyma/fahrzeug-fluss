
ALTER TABLE public.bonus_settings ADD COLUMN IF NOT EXISTS module_performance_enabled boolean NOT NULL DEFAULT true;
