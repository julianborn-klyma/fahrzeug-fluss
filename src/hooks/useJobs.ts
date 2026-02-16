import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Job, JobStatus } from '@/types/montage';

export const useJobs = () => {
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: ['jobs'],
    queryFn: async (): Promise<Job[]> => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, properties(*), clients(*), order_types(*), contacts!jobs_contact_person_id_fkey(*), profiles!jobs_planner_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        trades: d.trades || [],
        active_trades: d.active_trades || [],
        assigned_to: d.assigned_to || [],
        property: d.properties || undefined,
        client: d.clients || undefined,
        order_type: d.order_types || undefined,
        contact_person: d.contacts || undefined,
        planner: d.profiles || undefined,
      }));
    },
  });

  const createJob = useMutation({
    mutationFn: async (job: Partial<Job>) => {
      const { data, error } = await supabase.from('jobs').insert(job as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Job> & { id: string }) => {
      const { error } = await supabase.from('jobs').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });

  return { jobs: jobsQuery.data || [], loading: jobsQuery.isLoading, createJob, updateJob, deleteJob };
};

export const useAssignedJobs = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['assigned-jobs', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Job[]> => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, properties(*), clients(*), order_types(*), contacts!jobs_contact_person_id_fkey(*), profiles!jobs_planner_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || [])
        .map((d: any) => ({
          ...d,
          trades: d.trades || [],
          active_trades: d.active_trades || [],
          assigned_to: d.assigned_to || [],
          property: d.properties || undefined,
          client: d.clients || undefined,
          order_type: d.order_types || undefined,
          contact_person: d.contacts || undefined,
          planner: d.profiles || undefined,
        }))
        .filter((j: Job) => j.assigned_to.includes(userId!));
    },
  });
};
