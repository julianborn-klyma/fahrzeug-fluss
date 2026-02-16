import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InventoryStatus } from '@/types/database';
import { useData } from '@/context/DataContext';

interface InventoryContextType {
  inventory: InventoryStatus[];
  loading: boolean;
  updateQuantity: (vehicleId: string, materialId: string, quantity: number) => void;
  setToTarget: (vehicleId: string, typeId: string) => void;
  refresh: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { materialCatalog } = useData();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const allData: InventoryStatus[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data } = await supabase
        .from('inventory_status')
        .select('vehicle_id, material_id, current_quantity')
        .range(from, from + PAGE_SIZE - 1);

      if (data && data.length > 0) {
        allData.push(...data.map(d => ({
          vehicle_id: d.vehicle_id,
          material_id: d.material_id,
          current_quantity: d.current_quantity,
        })));
        from += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    setInventory(allData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const updateQuantity = async (vehicleId: string, materialId: string, quantity: number) => {
    const newQty = Math.max(0, quantity);
    // Optimistic update
    setInventory(prev => {
      const exists = prev.some(i => i.vehicle_id === vehicleId && i.material_id === materialId);
      if (exists) {
        return prev.map(item =>
          item.vehicle_id === vehicleId && item.material_id === materialId
            ? { ...item, current_quantity: newQty }
            : item
        );
      }
      return [...prev, { vehicle_id: vehicleId, material_id: materialId, current_quantity: newQty }];
    });

    // Upsert to DB
    await supabase.from('inventory_status').upsert(
      { vehicle_id: vehicleId, material_id: materialId, current_quantity: newQty, updated_at: new Date().toISOString() },
      { onConflict: 'vehicle_id,material_id' }
    );
  };

  const setToTarget = async (vehicleId: string, typeId: string) => {
    // Get all materials for this vehicle type
    const relevantMaterials = materialCatalog.filter(m => m.type_id === typeId);
    const updates: { vehicle_id: string; material_id: string; current_quantity: number }[] = [];

    for (const mat of relevantMaterials) {
      updates.push({ vehicle_id: vehicleId, material_id: mat.id, current_quantity: mat.target_quantity });
    }

    // Optimistic update
    setInventory(prev => {
      let newInv = [...prev];
      for (const u of updates) {
        const idx = newInv.findIndex(i => i.vehicle_id === u.vehicle_id && i.material_id === u.material_id);
        if (idx >= 0) {
          newInv[idx] = { ...newInv[idx], current_quantity: u.current_quantity };
        } else {
          newInv.push(u);
        }
      }
      return newInv;
    });

    // Batch upsert
    if (updates.length > 0) {
      await supabase.from('inventory_status').upsert(
        updates.map(u => ({ ...u, updated_at: new Date().toISOString() })),
        { onConflict: 'vehicle_id,material_id' }
      );
    }
  };

  return (
    <InventoryContext.Provider value={{ inventory, loading, updateQuantity, setToTarget, refresh: fetchInventory }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
