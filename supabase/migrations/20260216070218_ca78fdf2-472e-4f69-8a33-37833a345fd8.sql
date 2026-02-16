
-- 2. Create teamleiter_monteur_assignments table
CREATE TABLE public.teamleiter_monteur_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teamleiter_id uuid NOT NULL,
  monteur_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teamleiter_id, monteur_id)
);

ALTER TABLE public.teamleiter_monteur_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage teamleiter assignments"
  ON public.teamleiter_monteur_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teamleiter can view own assignments"
  ON public.teamleiter_monteur_assignments FOR SELECT TO authenticated
  USING (teamleiter_id = auth.uid());

-- 3. Create performance_reviews table
CREATE TABLE public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monteur_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  review_month date NOT NULL,
  score_speed numeric NOT NULL DEFAULT 0,
  score_quality numeric NOT NULL DEFAULT 0,
  score_reliability numeric NOT NULL DEFAULT 0,
  score_team numeric NOT NULL DEFAULT 0,
  score_cleanliness numeric NOT NULL DEFAULT 0,
  total_score numeric NOT NULL DEFAULT 0,
  monthly_bonus numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (monteur_id, review_month)
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reviews"
  ON public.performance_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teamleiter can manage reviews"
  ON public.performance_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));

CREATE POLICY "Monteurs can view own approved reviews"
  ON public.performance_reviews FOR SELECT TO authenticated
  USING (monteur_id = auth.uid() AND status = 'approved');

-- 4. Add require_approval to bonus_settings
ALTER TABLE public.bonus_settings ADD COLUMN IF NOT EXISTS require_approval boolean NOT NULL DEFAULT true;

-- 5. Add teamleiter policies to existing tables
CREATE POLICY "Teamleiter can manage bonus settings"
  ON public.bonus_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));

CREATE POLICY "Teamleiter can manage inventory"
  ON public.inventory_status FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));

CREATE POLICY "Teamleiter can manage materials"
  ON public.material_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));

CREATE POLICY "Teamleiter can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));

CREATE POLICY "Teamleiter can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));

CREATE POLICY "Teamleiter can manage vehicle assignments"
  ON public.user_vehicle_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));

CREATE POLICY "Teamleiter can manage vehicle types"
  ON public.vehicle_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));

CREATE POLICY "Teamleiter can manage vehicles"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'));
