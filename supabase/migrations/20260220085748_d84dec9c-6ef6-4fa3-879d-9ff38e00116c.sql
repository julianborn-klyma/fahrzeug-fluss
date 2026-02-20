
-- Add recurring fields to jobs table
ALTER TABLE public.jobs
ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
ADD COLUMN recurrence_interval text NULL, -- 'monthly', 'yearly', 'biennial'
ADD COLUMN recurrence_start_date date NULL,
ADD COLUMN next_due_date date NULL;

-- Index for finding due recurring jobs
CREATE INDEX idx_jobs_recurring_due ON public.jobs (next_due_date) WHERE is_recurring = true;
