
-- Create tasks table
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  due_date date,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid NOT NULL REFERENCES public.profiles(user_id),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  entity_type text,
  entity_id uuid,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Admin ALL
CREATE POLICY "Admins can manage tasks"
ON public.tasks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Office ALL
CREATE POLICY "Office can manage tasks"
ON public.tasks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'office'::app_role));

-- Teamleiter ALL
CREATE POLICY "Teamleiter can manage tasks"
ON public.tasks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teamleiter'::app_role));

-- Monteur SELECT own
CREATE POLICY "Monteurs can view own tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'monteur'::app_role) AND assigned_to = auth.uid());
