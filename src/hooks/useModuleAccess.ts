import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Fetch module access entries for a specific user */
export function useUserModuleAccess(userId: string | null) {
  return useQuery({
    queryKey: ['user-module-access', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_module_access' as any)
        .select('module')
        .eq('user_id', userId!);
      if (error) throw error;
      return (data as any[]).map(d => d.module as string);
    },
  });
}

/** Fetch module access entries for the current logged-in user */
export function useMyModuleAccess() {
  return useQuery({
    queryKey: ['my-module-access'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_module_access' as any)
        .select('module')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data as any[]).map(d => d.module as string);
    },
  });
}

const ALL_MODULES = [
  'module_klyma_os_enabled',
  'module_fahrzeuglager_enabled',
  'module_performance_enabled',
  'module_kalkulation_enabled',
] as const;

export type ModuleKey = typeof ALL_MODULES[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  module_klyma_os_enabled: 'Klyma OS (Montage)',
  module_fahrzeuglager_enabled: 'Fahrzeuglager',
  module_performance_enabled: 'Performance & Bonus',
  module_kalkulation_enabled: 'Kalkulation',
};

export { ALL_MODULES };

/** Save module access for a user (replace all) */
export async function saveUserModuleAccess(userId: string, modules: string[]) {
  // Delete existing
  await supabase.from('user_module_access' as any).delete().eq('user_id', userId);
  // Insert new
  if (modules.length > 0) {
    const rows = modules.map(m => ({ user_id: userId, module: m }));
    const { error } = await supabase.from('user_module_access' as any).insert(rows);
    if (error) throw error;
  }
}
