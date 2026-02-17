
-- 1. Neuer Enum fuer Termin-Status
CREATE TYPE public.appointment_status AS ENUM ('neu','in_planung','vorbereitet','in_umsetzung','review','abgenommen');

-- 2. job_appointments.status umstellen
ALTER TABLE public.job_appointments
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.job_appointments
  ALTER COLUMN status TYPE public.appointment_status
  USING CASE
    WHEN status = 'geplant' THEN 'in_planung'::public.appointment_status
    WHEN status = 'abgeschlossen' THEN 'abgenommen'::public.appointment_status
    ELSE 'neu'::public.appointment_status
  END;

ALTER TABLE public.job_appointments
  ALTER COLUMN status SET DEFAULT 'neu'::public.appointment_status;

-- 3. Neuer Wert fuer job_status
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'ausfuehrung';
