-- Add photo_urls array column to job_checklist_steps for multi-photo support
ALTER TABLE public.job_checklist_steps
ADD COLUMN photo_urls text[] NOT NULL DEFAULT '{}';

-- Migrate existing photo_url data into photo_urls array
UPDATE public.job_checklist_steps
SET photo_urls = ARRAY[photo_url]
WHERE photo_url IS NOT NULL AND photo_url != '';