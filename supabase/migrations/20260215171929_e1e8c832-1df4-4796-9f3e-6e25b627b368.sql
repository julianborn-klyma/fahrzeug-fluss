
-- Vehicle Types table
CREATE TABLE public.vehicle_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vehicle types" ON public.vehicle_types FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Monteurs can view vehicle types" ON public.vehicle_types FOR SELECT
  USING (public.has_role(auth.uid(), 'monteur'));

-- Vehicles table
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  license_plate text NOT NULL,
  type_id uuid NOT NULL REFERENCES public.vehicle_types(id) ON DELETE CASCADE,
  driver_phone text DEFAULT '',
  driver_name text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vehicles" ON public.vehicles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Monteurs can view vehicles" ON public.vehicles FOR SELECT
  USING (public.has_role(auth.uid(), 'monteur'));

-- User-Vehicle Assignments
CREATE TABLE public.user_vehicle_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

ALTER TABLE public.user_vehicle_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignments" ON public.user_vehicle_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own assignments" ON public.user_vehicle_assignments FOR SELECT
  USING (user_id = auth.uid());

-- Material Catalog
CREATE TABLE public.material_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  article_number text DEFAULT '',
  category text NOT NULL,
  item_type text NOT NULL DEFAULT 'Bestellung' CHECK (item_type IN ('Lager', 'Bestellung')),
  type_id uuid NOT NULL REFERENCES public.vehicle_types(id) ON DELETE CASCADE,
  target_quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.material_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage materials" ON public.material_catalog FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Monteurs can view materials" ON public.material_catalog FOR SELECT
  USING (public.has_role(auth.uid(), 'monteur'));

-- Inventory Status (current stock per vehicle per material)
CREATE TABLE public.inventory_status (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.material_catalog(id) ON DELETE CASCADE,
  current_quantity integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, material_id)
);

ALTER TABLE public.inventory_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory" ON public.inventory_status FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Monteurs can view inventory" ON public.inventory_status FOR SELECT
  USING (public.has_role(auth.uid(), 'monteur'));

CREATE POLICY "Monteurs can update inventory" ON public.inventory_status FOR UPDATE
  USING (public.has_role(auth.uid(), 'monteur'));

CREATE POLICY "Monteurs can insert inventory" ON public.inventory_status FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'monteur'));
