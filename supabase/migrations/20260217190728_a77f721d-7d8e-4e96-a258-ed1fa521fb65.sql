
-- Add work day start/end time settings to bonus_settings
ALTER TABLE public.bonus_settings
ADD COLUMN work_day_start text NOT NULL DEFAULT '08:00',
ADD COLUMN work_day_end text NOT NULL DEFAULT '17:00';
