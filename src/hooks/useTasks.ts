import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  status: string;
  assigned_to: string;
  created_by: string;
  entity_type: string | null;
  entity_id: string | null;
  closed_at: string | null;
  created_at: string;
  assigned_profile?: { name: string; email: string } | null;
}

export function useTasks(entityType?: string, entityId?: string) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', entityType, entityId],
    queryFn: async () => {
      let q = supabase
        .from('tasks' as any)
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (entityType && entityId) {
        q = q.eq('entity_type', entityType).eq('entity_id', entityId);
      }

      const { data, error } = await q;
      if (error) throw error;
      
      // Fetch assigned profiles
      const tasks = (data || []) as any[];
      const userIds = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, name, email').in('user_id', userIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        for (const t of tasks) {
          t.assigned_profile = profileMap.get(t.assigned_to) || null;
        }
      }
      return tasks as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      due_date?: string | null;
      assigned_to: string;
      entity_type?: string | null;
      entity_id?: string | null;
    }) => {
      const { error } = await supabase.from('tasks' as any).insert(task);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      const updates: any = { status: newStatus };
      if (newStatus === 'closed') updates.closed_at = new Date().toISOString();
      else updates.closed_at = null;

      const { error } = await supabase.from('tasks' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { tasks, isLoading, createTask, toggleTaskStatus };
}

export function useMyTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'my', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks' as any)
        .select('*')
        .eq('assigned_to', user!.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      
      const tasks = (data || []) as any[];
      if (tasks.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, name, email').in('user_id', [user!.id]);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        for (const t of tasks) {
          t.assigned_profile = profileMap.get(t.assigned_to) || null;
        }
      }
      return tasks as Task[];
    },
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      const updates: any = { status: newStatus };
      if (newStatus === 'closed') updates.closed_at = new Date().toISOString();
      else updates.closed_at = null;

      const { error } = await supabase.from('tasks' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { tasks, isLoading, toggleTaskStatus };
}
