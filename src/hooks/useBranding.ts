import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BrandingSettings {
  id: string;
  logo_url: string;
  primary_color: string;
  updated_at: string;
}

export const useBranding = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['branding-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as BrandingSettings;
    },
  });

  const updateBranding = useMutation({
    mutationFn: async (updates: Partial<Pick<BrandingSettings, 'logo_url' | 'primary_color'>>) => {
      const { data, error } = await supabase
        .from('branding_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', query.data!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding-settings'] });
    },
  });

  return { branding: query.data, isLoading: query.isLoading, updateBranding };
};
