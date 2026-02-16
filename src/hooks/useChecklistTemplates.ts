import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useChecklistTemplates = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*, checklist_template_steps(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        steps: (t.checklist_template_steps || []).sort((a: any, b: any) => a.order_index - b.order_index),
      }));
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (input: { name: string; description?: string; appointment_type_id?: string | null; is_standard?: boolean }) => {
      const { data, error } = await supabase.from('checklist_templates').insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; appointment_type_id?: string | null; is_standard?: boolean }) => {
      const { error } = await supabase.from('checklist_templates').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });

  const addStep = useMutation({
    mutationFn: async (input: { template_id: string; title: string; description?: string; step_type?: string; order_index?: number; is_required?: boolean; parent_step_id?: string | null; options?: string }) => {
      const { options, ...rest } = input;
      const { data, error } = await supabase.from('checklist_template_steps').insert({
        ...rest,
        options: options ? JSON.parse(options) : [],
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checklist_template_steps').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-templates'] }),
  });

  return {
    templates: query.data || [],
    loading: query.isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addStep,
    deleteStep,
  };
};
