import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type VehicleStatus = 'einsatz' | 'werkstatt_noetig' | 'werkstatt';

const STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string }> = {
  einsatz: { label: 'Einsatz', color: 'bg-green-100 text-green-700 border-green-300' },
  werkstatt_noetig: { label: 'Braucht Werkstatttermin', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  werkstatt: { label: 'Werkstatt', color: 'bg-red-100 text-red-700 border-red-300' },
};

interface Props {
  vehicleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const VehicleStatusDialog = ({ vehicleId, open, onOpenChange, onUpdated }: Props) => {
  const [vehicle, setVehicle] = useState<any>(null);
  const [ownerName, setOwnerName] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('einsatz');
  const [replacementPlate, setReplacementPlate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vehicleId || !open) return;
    (async () => {
      const { data } = await supabase.from('vehicles').select('*').eq('id', vehicleId).single();
      if (data) {
        setVehicle(data);
        setStatus(((data as any).vehicle_status as VehicleStatus) || 'einsatz');
        setReplacementPlate((data as any).replacement_plate || '');
        // Fetch owner name
        if ((data as any).owner_id) {
          const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', (data as any).owner_id).single();
          setOwnerName(profile?.name || '—');
        } else {
          setOwnerName('—');
        }
      }
    })();
  }, [vehicleId, open]);

  const handleSave = async () => {
    if (!vehicleId) return;
    setSaving(true);
    await supabase.from('vehicles').update({
      vehicle_status: status,
      replacement_plate: status === 'werkstatt' ? replacementPlate : '',
    } as any).eq('id', vehicleId);
    setSaving(false);
    toast.success('Fahrzeugstatus aktualisiert');
    onUpdated?.();
    onOpenChange(false);
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Fahrzeug {vehicle.license_plate}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1">
            <Label className="text-muted-foreground text-xs">Kennzeichen</Label>
            <span className="font-mono font-semibold text-lg">{vehicle.license_plate}</span>
          </div>

          <div className="grid gap-1">
            <Label className="text-muted-foreground text-xs">Fahrzeuginhaber</Label>
            <span className="text-sm">{ownerName}</span>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as VehicleStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-[10px]', cfg.color)}>{cfg.label}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === 'werkstatt' && (
            <div className="grid gap-2">
              <Label>Kennzeichen Ersatzfahrzeug</Label>
              <Input
                value={replacementPlate}
                onChange={(e) => setReplacementPlate(e.target.value)}
                placeholder="z.B. B-ER 2002"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={saving}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleStatusDialog;
