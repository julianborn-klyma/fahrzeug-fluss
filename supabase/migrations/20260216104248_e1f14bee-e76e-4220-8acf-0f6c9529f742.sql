
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Teamleiter can manage teams" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Office can manage teams" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Monteurs can view teams" ON public.teams FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'monteur'::app_role));

ALTER TABLE public.profiles ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
