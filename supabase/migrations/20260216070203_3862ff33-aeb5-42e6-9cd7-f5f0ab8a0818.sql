
-- 1. Add 'teamleiter' to app_role enum (must be separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teamleiter';
