
-- Add proper foreign key for planner_id referencing profiles
ALTER TABLE public.jobs ADD CONSTRAINT jobs_planner_id_fkey FOREIGN KEY (planner_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
