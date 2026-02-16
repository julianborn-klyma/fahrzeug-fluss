// ---- Types ----

export interface User {
  id: string;
  name: string;
  role: 'monteur' | 'admin';
}

export interface VehicleType {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  type_id: string;
}

export interface UserVehicleAssignment {
  user_id: string;
  vehicle_id: string;
}

export interface MaterialCatalogItem {
  id: string;
  article_number: string;
  name: string;
  category: string;
  item_type: 'Lager' | 'Bestellung';
  type_id: string;
  target_quantity: number;
}

export interface InventoryStatus {
  vehicle_id: string;
  material_id: string;
  current_quantity: number;
}

// ---- Mock Data ----

export const users: User[] = [
  { id: 'u1', name: 'Max Müller', role: 'monteur' },
  { id: 'u2', name: 'Lisa Schmidt', role: 'monteur' },
  { id: 'u3', name: 'Thomas Weber', role: 'admin' },
  { id: 'u4', name: 'Anna Fischer', role: 'admin' },
];

export const vehicleTypes: VehicleType[] = [
  { id: 'vt1', name: 'Service SHK' },
  { id: 'vt2', name: 'Elektro' },
  { id: 'vt3', name: 'SHK Projekt' },
];

export const vehicles: Vehicle[] = [
  { id: 'v1', license_plate: 'B-KL 1001', type_id: 'vt1' },
  { id: 'v2', license_plate: 'B-KL 1002', type_id: 'vt1' },
  { id: 'v3', license_plate: 'B-KL 2001', type_id: 'vt2' },
  { id: 'v4', license_plate: 'B-KL 3001', type_id: 'vt3' },
  { id: 'v5', license_plate: 'B-KL 3002', type_id: 'vt3' },
];

export const userVehicleAssignments: UserVehicleAssignment[] = [
  { user_id: 'u1', vehicle_id: 'v1' },
  { user_id: 'u1', vehicle_id: 'v2' },
  { user_id: 'u2', vehicle_id: 'v3' },
  { user_id: 'u2', vehicle_id: 'v4' },
  { user_id: 'u1', vehicle_id: 'v5' },
];

export const materialCatalog: MaterialCatalogItem[] = [
  // Service SHK materials
  { id: 'm1', article_number: 'SHK-001', name: 'Kupferrohr 15mm', category: 'Bauteile', item_type: 'Lager', type_id: 'vt1', target_quantity: 10 },
  { id: 'm2', article_number: 'SHK-002', name: 'Fitting T-Stück 15mm', category: 'Bauteile', item_type: 'Lager', type_id: 'vt1', target_quantity: 20 },
  { id: 'm3', article_number: 'SHK-003', name: 'Dichtungsband PTFE', category: 'Verbrauchsmaterial', item_type: 'Lager', type_id: 'vt1', target_quantity: 5 },
  { id: 'm4', article_number: 'SHK-004', name: 'Silikon Sanitär weiß', category: 'Verbrauchsmaterial', item_type: 'Bestellung', type_id: 'vt1', target_quantity: 3 },
  { id: 'm5', article_number: 'SHK-005', name: 'Absperrventil 1/2"', category: 'Armaturen', item_type: 'Bestellung', type_id: 'vt1', target_quantity: 4 },
  { id: 'm6', article_number: 'SHK-006', name: 'Flexschlauch 3/8"', category: 'Armaturen', item_type: 'Lager', type_id: 'vt1', target_quantity: 6 },
  { id: 'm7', article_number: 'SHK-007', name: 'Rohrschelle 15mm', category: 'Außenbereich', item_type: 'Lager', type_id: 'vt1', target_quantity: 15 },
  { id: 'm8', article_number: 'SHK-008', name: 'Isolierschlauch 22mm', category: 'Außenbereich', item_type: 'Bestellung', type_id: 'vt1', target_quantity: 8 },

  // Elektro materials
  { id: 'm9', article_number: 'EL-001', name: 'NYM-J 3x1.5mm²', category: 'Kabel', item_type: 'Lager', type_id: 'vt2', target_quantity: 5 },
  { id: 'm10', article_number: 'EL-002', name: 'NYM-J 5x2.5mm²', category: 'Kabel', item_type: 'Lager', type_id: 'vt2', target_quantity: 3 },
  { id: 'm11', article_number: 'EL-003', name: 'Lüsterklemme 2.5mm²', category: 'Bauteile', item_type: 'Lager', type_id: 'vt2', target_quantity: 30 },
  { id: 'm12', article_number: 'EL-004', name: 'Steckdose UP weiß', category: 'Bauteile', item_type: 'Bestellung', type_id: 'vt2', target_quantity: 10 },
  { id: 'm13', article_number: 'EL-005', name: 'Schalter Wechsel UP', category: 'Bauteile', item_type: 'Bestellung', type_id: 'vt2', target_quantity: 8 },
  { id: 'm14', article_number: 'EL-006', name: 'Kabelbinder 200mm', category: 'Verbrauchsmaterial', item_type: 'Lager', type_id: 'vt2', target_quantity: 50 },

  // SHK Projekt materials
  { id: 'm15', article_number: 'PRJ-001', name: 'Heizkörper Typ 22/600', category: 'Bauteile', item_type: 'Bestellung', type_id: 'vt3', target_quantity: 2 },
  { id: 'm16', article_number: 'PRJ-002', name: 'Thermostatventil', category: 'Armaturen', item_type: 'Bestellung', type_id: 'vt3', target_quantity: 4 },
  { id: 'm17', article_number: 'PRJ-003', name: 'Kupferrohr 22mm', category: 'Bauteile', item_type: 'Lager', type_id: 'vt3', target_quantity: 12 },
  { id: 'm18', article_number: 'PRJ-004', name: 'Pressfitting 22mm', category: 'Bauteile', item_type: 'Lager', type_id: 'vt3', target_quantity: 15 },
  { id: 'm19', article_number: 'PRJ-005', name: 'Dämmschale 22mm', category: 'Außenbereich', item_type: 'Lager', type_id: 'vt3', target_quantity: 10 },
  { id: 'm20', article_number: 'PRJ-006', name: 'Montageschiene', category: 'Außenbereich', item_type: 'Bestellung', type_id: 'vt3', target_quantity: 6 },
];

// Initial inventory — some items below target to show differences
export const initialInventoryStatus: InventoryStatus[] = [
  // Vehicle v1 (Service SHK)
  { vehicle_id: 'v1', material_id: 'm1', current_quantity: 7 },
  { vehicle_id: 'v1', material_id: 'm2', current_quantity: 20 },
  { vehicle_id: 'v1', material_id: 'm3', current_quantity: 2 },
  { vehicle_id: 'v1', material_id: 'm4', current_quantity: 1 },
  { vehicle_id: 'v1', material_id: 'm5', current_quantity: 4 },
  { vehicle_id: 'v1', material_id: 'm6', current_quantity: 3 },
  { vehicle_id: 'v1', material_id: 'm7', current_quantity: 10 },
  { vehicle_id: 'v1', material_id: 'm8', current_quantity: 0 },
  // Vehicle v2 (Service SHK)
  { vehicle_id: 'v2', material_id: 'm1', current_quantity: 10 },
  { vehicle_id: 'v2', material_id: 'm2', current_quantity: 15 },
  { vehicle_id: 'v2', material_id: 'm3', current_quantity: 5 },
  { vehicle_id: 'v2', material_id: 'm4', current_quantity: 3 },
  { vehicle_id: 'v2', material_id: 'm5', current_quantity: 2 },
  { vehicle_id: 'v2', material_id: 'm6', current_quantity: 6 },
  { vehicle_id: 'v2', material_id: 'm7', current_quantity: 15 },
  { vehicle_id: 'v2', material_id: 'm8', current_quantity: 4 },
  // Vehicle v3 (Elektro)
  { vehicle_id: 'v3', material_id: 'm9', current_quantity: 2 },
  { vehicle_id: 'v3', material_id: 'm10', current_quantity: 3 },
  { vehicle_id: 'v3', material_id: 'm11', current_quantity: 25 },
  { vehicle_id: 'v3', material_id: 'm12', current_quantity: 5 },
  { vehicle_id: 'v3', material_id: 'm13', current_quantity: 8 },
  { vehicle_id: 'v3', material_id: 'm14', current_quantity: 30 },
  // Vehicle v4 (SHK Projekt)
  { vehicle_id: 'v4', material_id: 'm15', current_quantity: 0 },
  { vehicle_id: 'v4', material_id: 'm16', current_quantity: 2 },
  { vehicle_id: 'v4', material_id: 'm17', current_quantity: 8 },
  { vehicle_id: 'v4', material_id: 'm18', current_quantity: 10 },
  { vehicle_id: 'v4', material_id: 'm19', current_quantity: 6 },
  { vehicle_id: 'v4', material_id: 'm20', current_quantity: 3 },
  // Vehicle v5 (SHK Projekt)
  { vehicle_id: 'v5', material_id: 'm15', current_quantity: 1 },
  { vehicle_id: 'v5', material_id: 'm16', current_quantity: 0 },
  { vehicle_id: 'v5', material_id: 'm17', current_quantity: 12 },
  { vehicle_id: 'v5', material_id: 'm18', current_quantity: 5 },
  { vehicle_id: 'v5', material_id: 'm19', current_quantity: 10 },
  { vehicle_id: 'v5', material_id: 'm20', current_quantity: 1 },
];
