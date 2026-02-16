
-- Fix ALL RLS policies: change from RESTRICTIVE to PERMISSIVE

-- bonus_settings
DROP POLICY IF EXISTS "Admins can manage bonus settings" ON public.bonus_settings;
DROP POLICY IF EXISTS "Monteurs can view bonus settings" ON public.bonus_settings;
CREATE POLICY "Admins can manage bonus settings" ON public.bonus_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Monteurs can view bonus settings" ON public.bonus_settings FOR SELECT USING (public.has_role(auth.uid(), 'monteur'::app_role));

-- inventory_status
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory_status;
DROP POLICY IF EXISTS "Monteurs can insert inventory" ON public.inventory_status;
DROP POLICY IF EXISTS "Monteurs can update inventory" ON public.inventory_status;
DROP POLICY IF EXISTS "Monteurs can view inventory" ON public.inventory_status;
CREATE POLICY "Admins can manage inventory" ON public.inventory_status FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Monteurs can view inventory" ON public.inventory_status FOR SELECT USING (public.has_role(auth.uid(), 'monteur'::app_role));
CREATE POLICY "Monteurs can insert inventory" ON public.inventory_status FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'monteur'::app_role));
CREATE POLICY "Monteurs can update inventory" ON public.inventory_status FOR UPDATE USING (public.has_role(auth.uid(), 'monteur'::app_role));

-- material_catalog
DROP POLICY IF EXISTS "Admins can manage materials" ON public.material_catalog;
DROP POLICY IF EXISTS "Monteurs can view materials" ON public.material_catalog;
CREATE POLICY "Admins can manage materials" ON public.material_catalog FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Monteurs can view materials" ON public.material_catalog FOR SELECT USING (public.has_role(auth.uid(), 'monteur'::app_role));

-- profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- user_vehicle_assignments
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.user_vehicle_assignments;
DROP POLICY IF EXISTS "Users can view own assignments" ON public.user_vehicle_assignments;
CREATE POLICY "Admins can manage assignments" ON public.user_vehicle_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own assignments" ON public.user_vehicle_assignments FOR SELECT USING (user_id = auth.uid());

-- vehicle_types
DROP POLICY IF EXISTS "Admins can manage vehicle types" ON public.vehicle_types;
DROP POLICY IF EXISTS "Monteurs can view vehicle types" ON public.vehicle_types;
CREATE POLICY "Admins can manage vehicle types" ON public.vehicle_types FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Monteurs can view vehicle types" ON public.vehicle_types FOR SELECT USING (public.has_role(auth.uid(), 'monteur'::app_role));

-- vehicles
DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Monteurs can view vehicles" ON public.vehicles;
CREATE POLICY "Admins can manage vehicles" ON public.vehicles FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Monteurs can view vehicles" ON public.vehicles FOR SELECT USING (public.has_role(auth.uid(), 'monteur'::app_role));
