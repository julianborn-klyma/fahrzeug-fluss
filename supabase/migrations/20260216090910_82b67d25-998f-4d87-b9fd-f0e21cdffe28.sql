
-- bonus_settings: office can view (needed for module flags)
CREATE POLICY "Office can view bonus settings"
ON public.bonus_settings FOR SELECT
USING (public.has_role(auth.uid(), 'office'::app_role));

-- vehicles: office can manage
CREATE POLICY "Office can manage vehicles"
ON public.vehicles FOR ALL
USING (public.has_role(auth.uid(), 'office'::app_role));

-- vehicle_types: office can manage
CREATE POLICY "Office can manage vehicle types"
ON public.vehicle_types FOR ALL
USING (public.has_role(auth.uid(), 'office'::app_role));

-- material_catalog: office can manage
CREATE POLICY "Office can manage materials"
ON public.material_catalog FOR ALL
USING (public.has_role(auth.uid(), 'office'::app_role));

-- inventory_status: office can manage
CREATE POLICY "Office can manage inventory"
ON public.inventory_status FOR ALL
USING (public.has_role(auth.uid(), 'office'::app_role));

-- profiles: office can view all and update all
CREATE POLICY "Office can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Office can update profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Office can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'office'::app_role));

-- user_roles: office can view, insert, delete
CREATE POLICY "Office can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Office can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'office'::app_role));

CREATE POLICY "Office can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'office'::app_role));

-- user_vehicle_assignments: office can manage
CREATE POLICY "Office can manage vehicle assignments"
ON public.user_vehicle_assignments FOR ALL
USING (public.has_role(auth.uid(), 'office'::app_role));
