
-- Add new enum values for job_status
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'neu';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'in_planung';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'in_umsetzung';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'nacharbeiten';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'abgeschlossen';
