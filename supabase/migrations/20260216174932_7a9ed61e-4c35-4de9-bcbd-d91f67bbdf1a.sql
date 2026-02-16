
-- Create junction table for many-to-many between order_types and appointment_types
CREATE TABLE public.order_type_appointment_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_type_id uuid NOT NULL REFERENCES public.order_types(id) ON DELETE CASCADE,
  appointment_type_id uuid NOT NULL REFERENCES public.appointment_types(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(order_type_id, appointment_type_id)
);

-- Enable RLS
ALTER TABLE public.order_type_appointment_types ENABLE ROW LEVEL SECURITY;

-- RLS policies matching existing pattern
CREATE POLICY "Admins can manage order_type_appointment_types" ON public.order_type_appointment_types FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Monteurs can view order_type_appointment_types" ON public.order_type_appointment_types FOR SELECT USING (has_role(auth.uid(), 'monteur'::app_role));
CREATE POLICY "Office can manage order_type_appointment_types" ON public.order_type_appointment_types FOR ALL USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Teamleiter can manage order_type_appointment_types" ON public.order_type_appointment_types FOR ALL USING (has_role(auth.uid(), 'teamleiter'::app_role));

-- Migrate existing data: each appointment_type with order_type_id gets an entry
INSERT INTO public.order_type_appointment_types (order_type_id, appointment_type_id, display_order)
SELECT order_type_id, id, display_order FROM public.appointment_types WHERE order_type_id IS NOT NULL;

-- Now drop the order_type_id column from appointment_types since relationship is via junction
ALTER TABLE public.appointment_types DROP COLUMN order_type_id;
