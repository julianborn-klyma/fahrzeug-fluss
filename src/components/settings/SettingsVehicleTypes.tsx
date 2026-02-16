import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { VehicleType } from '@/types/database';

const SettingsVehicleTypes = () => {
  const { vehicleTypes, vehicles, materialCatalog, addVehicleType, updateVehicleType, deleteVehicleType } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<VehicleType | null>(null);
  const [formName, setFormName] = useState('');

  const openAdd = () => {
    setEditItem(null);
    setFormName('');
    setDialogOpen(true);
  };

  const openEdit = (vt: VehicleType) => {
    setEditItem(vt);
    setFormName(vt.name);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const item: VehicleType = {
      id: editItem?.id || '',
      name: formName.trim(),
    };
    if (editItem) updateVehicleType(item);
    else addVehicleType(item);
    setDialogOpen(false);
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold text-foreground">Fahrzeugarten</h3>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Hinzufügen
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-center">Fahrzeuge</TableHead>
            <TableHead className="text-center">Materialien</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicleTypes.map(vt => {
            const vehicleCount = vehicles.filter(v => v.type_id === vt.id).length;
            const materialCount = materialCatalog.filter(m => m.type_id === vt.id).length;
            return (
              <TableRow key={vt.id}>
                <TableCell className="font-medium text-foreground">{vt.name}</TableCell>
                <TableCell className="text-center text-muted-foreground">{vehicleCount}</TableCell>
                <TableCell className="text-center text-muted-foreground">{materialCount}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(vt)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteVehicleType(vt.id)}
                      disabled={vehicleCount > 0}
                    >
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
            <DialogTitle>{editItem ? 'Fahrzeugart bearbeiten' : 'Fahrzeugart hinzufügen'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="z.B. Service SHK" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsVehicleTypes;
