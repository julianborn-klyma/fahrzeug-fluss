import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ---- PriceBooks ----
export function usePriceBooks() {
  return useQuery({
    queryKey: ['kalkulation-pricebooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kalkulation_pricebooks' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertPriceBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pb: { id?: string; name: string; is_active: boolean }) => {
      if (pb.id) {
        const { error } = await supabase.from('kalkulation_pricebooks' as any).update({ name: pb.name, is_active: pb.is_active }).eq('id', pb.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kalkulation_pricebooks' as any).insert({ name: pb.name, is_active: pb.is_active });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-pricebooks'] }),
  });
}

export function useDeletePriceBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kalkulation_pricebooks' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-pricebooks'] }),
  });
}

// ---- Categories ----
export function useCategories() {
  return useQuery({
    queryKey: ['kalkulation-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kalkulation_categories' as any).select('*').order('name');
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { id?: string; name: string; parent_id?: string | null }) => {
      if (c.id) {
        const { error } = await supabase.from('kalkulation_categories' as any).update({ name: c.name, parent_id: c.parent_id || null }).eq('id', c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kalkulation_categories' as any).insert({ name: c.name, parent_id: c.parent_id || null });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-categories'] }),
  });
}

// ---- Products ----
export function useProducts() {
  return useQuery({
    queryKey: ['kalkulation-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kalkulation_products' as any).select('*').order('name');
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id?: string; article_number: string; name: string; description: string; category_id: string | null }) => {
      if (p.id) {
        const { error } = await supabase.from('kalkulation_products' as any).update({ article_number: p.article_number, name: p.name, description: p.description, category_id: p.category_id }).eq('id', p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kalkulation_products' as any).insert({ article_number: p.article_number, name: p.name, description: p.description, category_id: p.category_id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kalkulation_products' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-products'] }),
  });
}

// ---- Product Prices ----
export function useProductPrices(pricebookId: string | null) {
  return useQuery({
    queryKey: ['kalkulation-product-prices', pricebookId],
    enabled: !!pricebookId,
    queryFn: async () => {
      const { data, error } = await supabase.from('kalkulation_product_prices' as any).select('*').eq('pricebook_id', pricebookId!);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertProductPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pp: { id?: string; product_id: string; pricebook_id: string; material_cost: number; hourly_rate: number; time_budget: number; calculation_factor: number; final_vk: number }) => {
      if (pp.id) {
        const { id, ...rest } = pp;
        const { error } = await supabase.from('kalkulation_product_prices' as any).update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { id, ...rest } = pp;
        const { error } = await supabase.from('kalkulation_product_prices' as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-product-prices'] }),
  });
}

// ---- Packages ----
export function usePackages() {
  return useQuery({
    queryKey: ['kalkulation-packages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kalkulation_packages' as any).select('*').order('name');
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id?: string; article_number: string; name: string; description: string; category_id: string | null }) => {
      if (p.id) {
        const { error } = await supabase.from('kalkulation_packages' as any).update({ article_number: p.article_number, name: p.name, description: p.description, category_id: p.category_id }).eq('id', p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kalkulation_packages' as any).insert({ article_number: p.article_number, name: p.name, description: p.description, category_id: p.category_id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-packages'] }),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kalkulation_packages' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-packages'] }),
  });
}

// ---- Package Items ----
export function usePackageItems(packageId: string | null) {
  return useQuery({
    queryKey: ['kalkulation-package-items', packageId],
    enabled: !!packageId,
    queryFn: async () => {
      const { data, error } = await supabase.from('kalkulation_package_items' as any).select('*').eq('package_id', packageId!);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useAllPackageItems() {
  return useQuery({
    queryKey: ['kalkulation-all-package-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kalkulation_package_items' as any).select('*');
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useSetPackageItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ packageId, items }: { packageId: string; items: { product_id: string; quantity: number }[] }) => {
      // delete existing
      await supabase.from('kalkulation_package_items' as any).delete().eq('package_id', packageId);
      if (items.length > 0) {
        const rows = items.map(i => ({ package_id: packageId, product_id: i.product_id, quantity: i.quantity }));
        const { error } = await supabase.from('kalkulation_package_items' as any).insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-package-items'] }),
  });
}

// ---- Package Prices ----
export function usePackagePrices(pricebookId: string | null) {
  return useQuery({
    queryKey: ['kalkulation-package-prices', pricebookId],
    enabled: !!pricebookId,
    queryFn: async () => {
      const { data, error } = await supabase.from('kalkulation_package_prices' as any).select('*').eq('pricebook_id', pricebookId!);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUpsertPackagePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pp: { id?: string; package_id: string; pricebook_id: string; custom_override_vk: number | null }) => {
      if (pp.id) {
        const { id, ...rest } = pp;
        const { error } = await supabase.from('kalkulation_package_prices' as any).update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { id, ...rest } = pp;
        const { error } = await supabase.from('kalkulation_package_prices' as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kalkulation-package-prices'] }),
  });
}
