import { useState } from 'react';
import { cn } from '@/lib/utils';
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
import { Plus, Pencil, Trash2, Star, Car } from 'lucide-react';
import { Vehicle } from '@/types/database';

const SettingsVehicles = () => {
  const { vehicles, vehicleTypes, users, assignments, addVehicle, updateVehicle, deleteVehicle } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Vehicle | null>(null);
  const [formPlate, setFormPlate] = useState('');
  const [formTypeId, setFormTypeId] = useState('');
  const [formOwnerId, setFormOwnerId] = useState('');
  const [formStatus, setFormStatus] = useState<string>('einsatz');
  const [formReplacementPlate, setFormReplacementPlate] = useState('');

  const openAdd = () => {
    setEditItem(null);
    setFormPlate('');
    setFormTypeId(vehicleTypes[0]?.id || '');
    setFormOwnerId('');
    setFormStatus('einsatz');
    setFormReplacementPlate('');
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditItem(v);
    setFormPlate(v.license_plate);
    setFormTypeId(v.type_id);
    setFormOwnerId(v.owner_id || '');
    setFormStatus(v.vehicle_status || 'einsatz');
    setFormReplacementPlate(v.replacement_plate || '');
    setDialogOpen(true);
  };

  const handleSave = () => {
    const item: Vehicle = {
      id: editItem?.id || '',
      name: '',
      license_plate: formPlate.trim(),
      type_id: formTypeId,
      owner_id: formOwnerId || undefined,
      vehicle_status: formStatus as Vehicle['vehicle_status'],
      replacement_plate: formStatus === 'werkstatt' ? formReplacementPlate : '',
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
            <TableHead>Status</TableHead>
            <TableHead>Inhaber</TableHead>
            <TableHead>Zugewiesene Benutzer</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map(vehicle => {
            const vt = vehicleTypes.find(t => t.id === vehicle.type_id);
            const assignedUsers = getAssignedUsers(vehicle.id);
            const owner = users.find(u => u.id === vehicle.owner_id);
            return (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium text-foreground">{vehicle.license_plate}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">{vt?.name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    'font-normal text-[10px]',
                    vehicle.vehicle_status === 'einsatz' && 'bg-green-50 text-green-700 border-green-300',
                    vehicle.vehicle_status === 'werkstatt_noetig' && 'bg-orange-50 text-orange-700 border-orange-300',
                    vehicle.vehicle_status === 'werkstatt' && 'bg-red-50 text-red-700 border-red-300',
                  )}>
                    {vehicle.vehicle_status === 'einsatz' ? 'Einsatz' : vehicle.vehicle_status === 'werkstatt_noetig' ? 'Werkstatt nötig' : vehicle.vehicle_status === 'werkstatt' ? 'Werkstatt' : 'Einsatz'}
                  </Badge>
                  {vehicle.vehicle_status === 'werkstatt' && vehicle.replacement_plate && (
                    <span className="text-[10px] text-muted-foreground ml-1">Ersatz: {vehicle.replacement_plate}</span>
                  )}
                </TableCell>
                <TableCell>
                  {owner ? (
                    <span className="flex items-center gap-1 text-sm text-foreground">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      {owner.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
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
            <div className="grid gap-2">
              <Label>Fahrzeuginhaber</Label>
              <Select value={formOwnerId} onValueChange={setFormOwnerId}>
                <SelectTrigger><SelectValue placeholder="Kein Inhaber" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Inhaber</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="einsatz">Einsatz</SelectItem>
                  <SelectItem value="werkstatt_noetig">Braucht Werkstatttermin</SelectItem>
                  <SelectItem value="werkstatt">Werkstatt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formStatus === 'werkstatt' && (
              <div className="grid gap-2">
                <Label>Kennzeichen Ersatzfahrzeug</Label>
                <Input value={formReplacementPlate} onChange={e => setFormReplacementPlate(e.target.value)} placeholder="z.B. B-ER 2002" />
              </div>
            )}
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
