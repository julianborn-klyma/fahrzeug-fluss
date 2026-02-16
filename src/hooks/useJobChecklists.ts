import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { JobChecklist, JobChecklistStep } from '@/types/montage';

export const useJobChecklists = (jobId: string | undefined) => {
  const queryClient = useQueryClient();

  const checklistsQuery = useQuery({
    queryKey: ['job-checklists', jobId],
    enabled: !!jobId,
    queryFn: async (): Promise<JobChecklist[]> => {
      const { data, error } = await supabase
        .from('job_checklists')
        .select('*, job_checklist_steps(*)')
        .eq('job_id', jobId!)
        .order('created_at');
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        steps: (d.job_checklist_steps || []).sort((a: any, b: any) => a.order_index - b.order_index),
      }));
    },
  });

  const updateStep = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JobChecklistStep> & { id: string }) => {
      const { error } = await supabase.from('job_checklist_steps').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-checklists', jobId] }),
  });

  return { checklists: checklistsQuery.data || [], loading: checklistsQuery.isLoading, updateStep };
};
