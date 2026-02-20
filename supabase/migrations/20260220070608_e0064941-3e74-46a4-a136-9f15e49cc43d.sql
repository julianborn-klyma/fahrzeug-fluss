
-- Add vehicle status and replacement plate fields
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS vehicle_status text NOT NULL DEFAULT 'einsatz',
ADD COLUMN IF NOT EXISTS replacement_plate text DEFAULT '';
