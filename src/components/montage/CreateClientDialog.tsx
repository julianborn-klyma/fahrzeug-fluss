import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients, type CreateClientInput } from '@/hooks/useClients';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateClientDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { createClient } = useClients();
  const [form, setForm] = useState<CreateClientInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    billing_street: '',
    billing_city: '',
    billing_postal_code: '',
  });

  const set = (key: keyof CreateClientInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleCreate = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('Vor- und Nachname sind Pflichtfelder.');
      return;
    }
    try {
      await createClient.mutateAsync(form);
      toast.success('Kunde erstellt.');
      setForm({ first_name: '', last_name: '', email: '', phone: '', company_name: '', billing_street: '', billing_city: '', billing_postal_code: '' });
      onOpenChange(false);
    } catch {
      toast.error('Fehler beim Erstellen.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Kunde</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Vorname *</Label>
              <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </div>
            <div>
              <Label>Nachname *</Label>
              <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Firma</Label>
            <Input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
          </div>
          <div>
            <Label>Straße</Label>
            <Input value={form.billing_street} onChange={(e) => set('billing_street', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>PLZ</Label>
              <Input value={form.billing_postal_code} onChange={(e) => set('billing_postal_code', e.target.value)} />
            </div>
            <div>
              <Label>Ort</Label>
              <Input value={form.billing_city} onChange={(e) => set('billing_city', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>E-Mail</Label>
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <Button onClick={handleCreate} disabled={createClient.isPending} className="w-full">
            {createClient.isPending ? 'Erstelle…' : 'Kunde erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientDialog;
