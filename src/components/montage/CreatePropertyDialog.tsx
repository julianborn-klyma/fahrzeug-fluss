import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useProperties } from '@/hooks/useProperties';
import type { Client } from '@/types/montage';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

const CreatePropertyDialog: React.FC<Props> = ({ open, onOpenChange, client }) => {
  const { createProperty } = useProperties(client.id);
  const [useBilling, setUseBilling] = useState(false);
  const [street, setStreet] = useState('');
  const [plz, setPlz] = useState('');
  const [city, setCity] = useState('');

  const handleUseBillingChange = (checked: boolean) => {
    setUseBilling(checked);
    if (checked) {
      setStreet(client.billing_street || '');
      setPlz(client.billing_postal_code || '');
      setCity(client.billing_city || '');
    } else {
      setStreet('');
      setPlz('');
      setCity('');
    }
  };

  const handleCreate = async () => {
    if (!street.trim() || !city.trim()) {
      toast.error('Straße und Ort sind Pflichtfelder.');
      return;
    }
    try {
      await createProperty.mutateAsync({
        client_id: client.id,
        street_address: street.trim(),
        city: city.trim(),
        postal_code: plz.trim(),
      });
      toast.success('Immobilie erstellt.');
      setStreet('');
      setPlz('');
      setCity('');
      setUseBilling(false);
      onOpenChange(false);
    } catch {
      toast.error('Fehler beim Erstellen.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Immobilie (Einsatzort)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="useBilling" checked={useBilling} onCheckedChange={(c) => handleUseBillingChange(!!c)} />
            <Label htmlFor="useBilling">Rechnungsadresse = Einsatzort</Label>
          </div>
          <div>
            <Label>Straße *</Label>
            <Input value={street} onChange={(e) => setStreet(e.target.value)} disabled={useBilling} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>PLZ</Label>
              <Input value={plz} onChange={(e) => setPlz(e.target.value)} disabled={useBilling} />
            </div>
            <div>
              <Label>Ort *</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} disabled={useBilling} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={createProperty.isPending} className="w-full">
            {createProperty.isPending ? 'Erstelle…' : 'Immobilie erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePropertyDialog;
