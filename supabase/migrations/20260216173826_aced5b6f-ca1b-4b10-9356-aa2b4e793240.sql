
-- Extend checklist_templates
ALTER TABLE public.checklist_templates
  ADD COLUMN description text NOT NULL DEFAULT '',
  ADD COLUMN appointment_type_id uuid REFERENCES public.appointment_types(id) ON DELETE SET NULL;

-- Extend checklist_template_steps
ALTER TABLE public.checklist_template_steps
  ADD COLUMN description text NOT NULL DEFAULT '',
  ADD COLUMN parent_step_id uuid REFERENCES public.checklist_template_steps(id) ON DELETE CASCADE,
  ADD COLUMN options jsonb NOT NULL DEFAULT '[]'::jsonb;
