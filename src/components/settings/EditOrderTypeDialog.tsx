import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useOrderTypes } from '@/hooks/useOrderTypes';
import { toast } from 'sonner';

interface Props {
  orderType: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditOrderTypeDialog: React.FC<Props> = ({ orderType, open, onOpenChange }) => {
  const { updateOrderType } = useOrderTypes();
  const [name, setName] = useState(orderType.name);
  const [description, setDescription] = useState(orderType.description || '');
  const [isActive, setIsActive] = useState(orderType.is_active);

  const handleSave = async () => {
    try {
      await updateOrderType.mutateAsync({ id: orderType.id, name, description, is_active: isActive });
      toast.success('Gespeichert.');
      onOpenChange(false);
    } catch { toast.error('Fehler.'); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Projektart bearbeiten</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Beschreibung</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="flex items-center justify-between">
            <Label>Aktiv</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Button onClick={handleSave} disabled={updateOrderType.isPending} className="w-full">Speichern</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderTypeDialog;
