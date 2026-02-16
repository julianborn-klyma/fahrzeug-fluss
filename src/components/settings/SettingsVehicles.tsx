import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Vehicle } from '@/types/database';

const SettingsVehicles = () => {
  const { vehicles, vehicleTypes, users, assignments, addVehicle, updateVehicle, deleteVehicle } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Vehicle | null>(null);
  const [formPlate, setFormPlate] = useState('');
  const [formTypeId, setFormTypeId] = useState('');

  const openAdd = () => {
    setEditItem(null);
    setFormPlate('');
    setFormTypeId(vehicleTypes[0]?.id || '');
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditItem(v);
    setFormPlate(v.license_plate);
    setFormTypeId(v.type_id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const item: Vehicle = {
      id: editItem?.id || '',
      name: '',
      license_plate: formPlate.trim(),
      type_id: formTypeId,
    };
    if (editItem) updateVehicle(item);
    else addVehicle(item);
    setDialogOpen(false);
  };

  const getAssignedUsers = (vehicleId: string) => {
    const userIds = assignments.filter(a => a.vehicle_id === vehicleId).map(a => a.user_id);
    return users.filter(u => userIds.includes(u.id));
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold text-foreground">Fahrzeuge</h3>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Hinzufügen
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kennzeichen</TableHead>
            <TableHead>Fahrzeugart</TableHead>
            <TableHead>Zugewiesene Benutzer</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map(vehicle => {
            const vt = vehicleTypes.find(t => t.id === vehicle.type_id);
            const assignedUsers = getAssignedUsers(vehicle.id);
            return (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium text-foreground">{vehicle.license_plate}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">{vt?.name}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {assignedUsers.map(u => u.name).join(', ') || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(vehicle)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteVehicle(vehicle.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Fahrzeug bearbeiten' : 'Fahrzeug hinzufügen'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Kennzeichen</Label>
              <Input value={formPlate} onChange={e => setFormPlate(e.target.value)} placeholder="z.B. B-KL 1001" />
            </div>
            <div className="grid gap-2">
              <Label>Fahrzeugart</Label>
              <Select value={formTypeId} onValueChange={setFormTypeId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map(vt => (
                    <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!formPlate.trim() || !formTypeId}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsVehicles;
