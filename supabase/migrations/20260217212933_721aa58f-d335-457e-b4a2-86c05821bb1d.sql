-- Add address fields and geocoordinates to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address_street text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_postal_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_lat double precision,
  ADD COLUMN IF NOT EXISTS address_lng double precision;