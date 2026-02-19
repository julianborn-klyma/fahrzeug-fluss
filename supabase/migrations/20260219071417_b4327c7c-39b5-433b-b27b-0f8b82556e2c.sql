
-- Table for per-user module access (whitelist)
CREATE TABLE public.user_module_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  module text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);

ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Admins can manage all access entries
CREATE POLICY "Admins can manage user_module_access"
  ON public.user_module_access FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Teamleiter can manage
CREATE POLICY "Teamleiter can manage user_module_access"
  ON public.user_module_access FOR ALL
  USING (has_role(auth.uid(), 'teamleiter'::app_role));

-- Office can manage
CREATE POLICY "Office can manage user_module_access"
  ON public.user_module_access FOR ALL
  USING (has_role(auth.uid(), 'office'::app_role));

-- Users can view their own access
CREATE POLICY "Users can view own module_access"
  ON public.user_module_access FOR SELECT
  USING (user_id = auth.uid());
