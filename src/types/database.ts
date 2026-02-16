// App-level types matching the database schema

export interface VehicleType {
  id: string;
  name: string;
  description?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  license_plate: string;
  type_id: string;
  driver_phone?: string;
  driver_name?: string;
}

export interface UserVehicleAssignment {
  id?: string;
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
  sort_order: number;
}

export interface InventoryStatus {
  vehicle_id: string;
  material_id: string;
  current_quantity: number;
}

export interface User {
  id: string;
  name: string;
  role: 'monteur' | 'admin';
}
