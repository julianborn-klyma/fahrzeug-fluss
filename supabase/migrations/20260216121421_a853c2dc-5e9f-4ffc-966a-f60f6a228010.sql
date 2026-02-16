-- First remove any duplicates, keeping only the most recent entry
DELETE FROM inventory_status a
USING inventory_status b
WHERE a.vehicle_id = b.vehicle_id
  AND a.material_id = b.material_id
  AND a.updated_at < b.updated_at;

-- Now add the unique constraint so upserts work correctly
ALTER TABLE inventory_status
ADD CONSTRAINT inventory_status_vehicle_material_unique UNIQUE (vehicle_id, material_id);