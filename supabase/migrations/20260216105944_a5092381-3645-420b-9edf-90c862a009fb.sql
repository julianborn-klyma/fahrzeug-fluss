
ALTER TABLE public.material_catalog ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Initialize sort_order based on current name order per category+type
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY type_id, category ORDER BY name) AS rn
  FROM public.material_catalog
)
UPDATE public.material_catalog SET sort_order = ranked.rn
FROM ranked WHERE material_catalog.id = ranked.id;
