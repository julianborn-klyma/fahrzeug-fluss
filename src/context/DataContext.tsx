import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Vehicle,
  VehicleType,
  MaterialCatalogItem,
  UserVehicleAssignment,
} from '@/types/database';

interface DataContextType {
  users: { id: string; name: string; team_id: string | null }[];
  teams: { id: string; name: string }[];
  vehicles: Vehicle[];
  vehicleTypes: VehicleType[];
  materialCatalog: MaterialCatalogItem[];
  assignments: UserVehicleAssignment[];
  loading: boolean;
  // Users (profiles)
  addUser: (user: { id: string; name: string; team_id: string | null }) => void;
  updateUser: (user: { id: string; name: string; team_id: string | null }) => void;
  deleteUser: (id: string) => void;
  // Vehicles
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  // Vehicle Types
  addVehicleType: (vt: VehicleType) => void;
  updateVehicleType: (vt: VehicleType) => void;
  deleteVehicleType: (id: string) => void;
  // Materials
  addMaterial: (mat: MaterialCatalogItem) => void;
  updateMaterial: (mat: MaterialCatalogItem) => void;
  deleteMaterial: (id: string) => void;
  deleteMaterialsByCategory: (category: string, typeId?: string) => void;
  // Assignments
  addAssignment: (a: UserVehicleAssignment) => void;
  removeAssignment: (userId: string, vehicleId: string) => void;
  // Refresh
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<{ id: string; name: string; team_id: string | null }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [materialCatalog, setMaterialCatalog] = useState<MaterialCatalogItem[]>([]);
  const [assignments, setAssignments] = useState<UserVehicleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [vtRes, vRes, mcRes, aRes, pRes, tRes] = await Promise.all([
      supabase.from('vehicle_types').select('*').order('name'),
      supabase.from('vehicles').select('*').order('name'),
      supabase.from('material_catalog').select('*').order('name').limit(5000),
      supabase.from('user_vehicle_assignments').select('*'),
      supabase.from('profiles').select('user_id, name, team_id'),
      supabase.from('teams').select('id, name').order('name'),
    ]);

    if (vtRes.data) setVehicleTypes(vtRes.data.map(vt => ({ id: vt.id, name: vt.name, description: vt.description || '' })));
    if (vRes.data) setVehicles(vRes.data.map(v => ({
      id: v.id, name: v.name, license_plate: v.license_plate, type_id: v.type_id,
      driver_phone: v.driver_phone || '', driver_name: v.driver_name || '',
      owner_id: (v as any).owner_id || undefined,
      vehicle_status: (v as any).vehicle_status || 'einsatz',
      replacement_plate: (v as any).replacement_plate || '',
    })));
    if (mcRes.data) setMaterialCatalog(mcRes.data.map(m => ({
      id: m.id, name: m.name, article_number: m.article_number || '',
      category: m.category, item_type: m.item_type as 'Lager' | 'Bestellung',
      type_id: m.type_id, target_quantity: m.target_quantity,
      sort_order: (m as any).sort_order ?? 0,
    })));
    if (aRes.data) setAssignments(aRes.data.map(a => ({ id: a.id, user_id: a.user_id, vehicle_id: a.vehicle_id })));
    if (pRes.data) setUsers(pRes.data.map(p => ({ id: p.user_id, name: p.name, team_id: (p as any).team_id || null })));
    if (tRes.data) setTeams(tRes.data.map(t => ({ id: t.id, name: t.name })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Vehicle Types
  const addVehicleType = async (vt: VehicleType) => {
    const { data } = await supabase.from('vehicle_types').insert({ name: vt.name, description: vt.description || '' }).select().single();
    if (data) setVehicleTypes(prev => [...prev, { id: data.id, name: data.name, description: data.description || '' }]);
  };
  const updateVehicleType = async (vt: VehicleType) => {
    await supabase.from('vehicle_types').update({ name: vt.name }).eq('id', vt.id);
    setVehicleTypes(prev => prev.map(x => x.id === vt.id ? vt : x));
  };
  const deleteVehicleType = async (id: string) => {
    await supabase.from('vehicle_types').delete().eq('id', id);
    setVehicleTypes(prev => prev.filter(x => x.id !== id));
  };

  // Vehicles
  const addVehicle = async (v: Vehicle) => {
    const { data } = await supabase.from('vehicles').insert({
      name: v.name || '', license_plate: v.license_plate, type_id: v.type_id,
      driver_phone: v.driver_phone || '', driver_name: v.driver_name || '',
      owner_id: v.owner_id || null,
      vehicle_status: v.vehicle_status || 'einsatz',
      replacement_plate: v.replacement_plate || '',
    } as any).select().single();
    if (data) setVehicles(prev => [...prev, { id: data.id, name: data.name, license_plate: data.license_plate, type_id: data.type_id, driver_phone: data.driver_phone || '', driver_name: data.driver_name || '', owner_id: (data as any).owner_id || undefined, vehicle_status: (data as any).vehicle_status || 'einsatz', replacement_plate: (data as any).replacement_plate || '' }]);
  };
  const updateVehicle = async (v: Vehicle) => {
    await supabase.from('vehicles').update({ license_plate: v.license_plate, type_id: v.type_id, name: v.name || '', driver_phone: v.driver_phone || '', driver_name: v.driver_name || '', owner_id: v.owner_id || null, vehicle_status: v.vehicle_status || 'einsatz', replacement_plate: v.replacement_plate || '' } as any).eq('id', v.id);
    setVehicles(prev => prev.map(x => x.id === v.id ? v : x));
  };
  const deleteVehicle = async (id: string) => {
    await supabase.from('vehicles').delete().eq('id', id);
    setVehicles(prev => prev.filter(x => x.id !== id));
    setAssignments(prev => prev.filter(a => a.vehicle_id !== id));
  };

  // Materials
  const addMaterial = async (m: MaterialCatalogItem) => {
    const { data } = await supabase.from('material_catalog').insert({
      name: m.name, article_number: m.article_number, category: m.category,
      item_type: m.item_type, type_id: m.type_id, target_quantity: m.target_quantity,
      sort_order: m.sort_order,
    } as any).select().single();
    if (data) setMaterialCatalog(prev => [...prev, { ...m, id: data.id, sort_order: (data as any).sort_order ?? m.sort_order }]);
  };
  const updateMaterial = async (m: MaterialCatalogItem) => {
    await supabase.from('material_catalog').update({
      name: m.name, article_number: m.article_number, category: m.category,
      item_type: m.item_type, type_id: m.type_id, target_quantity: m.target_quantity,
      sort_order: m.sort_order,
    } as any).eq('id', m.id);
    setMaterialCatalog(prev => prev.map(x => x.id === m.id ? m : x));
  };
  const deleteMaterial = async (id: string) => {
    await supabase.from('material_catalog').delete().eq('id', id);
    setMaterialCatalog(prev => prev.filter(x => x.id !== id));
  };
  const deleteMaterialsByCategory = async (category: string, typeId?: string) => {
    let query = supabase.from('material_catalog').delete().eq('category', category);
    if (typeId && typeId !== 'all') query = query.eq('type_id', typeId);
    await query;
    setMaterialCatalog(prev => prev.filter(x => {
      if (x.category !== category) return true;
      if (typeId && typeId !== 'all') return x.type_id !== typeId;
      return false;
    }));
  };

  // Users (read-only from profiles)
  const addUser = (_u: { id: string; name: string; team_id: string | null }) => {};
  const updateUser = (_u: { id: string; name: string; team_id: string | null }) => {};
  const deleteUser = (_id: string) => {};

  // Assignments
  const addAssignment = async (a: UserVehicleAssignment) => {
    const { data } = await supabase.from('user_vehicle_assignments').insert({ user_id: a.user_id, vehicle_id: a.vehicle_id }).select().single();
    if (data) setAssignments(prev => [...prev, { id: data.id, user_id: data.user_id, vehicle_id: data.vehicle_id }]);
  };
  const removeAssignment = async (userId: string, vehicleId: string) => {
    await supabase.from('user_vehicle_assignments').delete().eq('user_id', userId).eq('vehicle_id', vehicleId);
    setAssignments(prev => prev.filter(a => !(a.user_id === userId && a.vehicle_id === vehicleId)));
  };

  return (
    <DataContext.Provider
      value={{
        users, teams, vehicles, vehicleTypes, materialCatalog, assignments, loading,
        addUser, updateUser, deleteUser,
        addVehicle, updateVehicle, deleteVehicle,
        addVehicleType, updateVehicleType, deleteVehicleType,
        addMaterial, updateMaterial, deleteMaterial, deleteMaterialsByCategory,
        addAssignment, removeAssignment,
        refresh: fetchAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
