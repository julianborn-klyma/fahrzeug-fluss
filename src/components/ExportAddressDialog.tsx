import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExportAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (address: string) => void;
  exportLabel: string;
}

const ExportAddressDialog = ({ open, onOpenChange, onConfirm, exportLabel }: ExportAddressDialogProps) => {
  const [street, setStreet] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<{ street?: string; zip?: string; city?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!street.trim()) e.street = 'Straße ist erforderlich';
    if (!zip.trim()) e.zip = 'PLZ ist erforderlich';
    else if (!/^\d{4,5}$/.test(zip.trim())) e.zip = 'Ungültige PLZ';
    if (!city.trim()) e.city = 'Ort ist erforderlich';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const address = `${street.trim()}, ${zip.trim()} ${city.trim()}`;
    onConfirm(address);
    setStreet('');
    setZip('');
    setCity('');
    setErrors({});
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setErrors({});
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kundenadresse für Export</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Bitte geben Sie die Kundenadresse ein, die auf dem PDF angezeigt werden soll.
        </p>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="export-street">Straße & Hausnummer</Label>
            <Input
              id="export-street"
              value={street}
              onChange={e => setStreet(e.target.value)}
              placeholder="Musterstraße 12"
              className="mt-1"
            />
            {errors.street && <p className="text-xs text-destructive mt-1">{errors.street}</p>}
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div>
              <Label htmlFor="export-zip">PLZ</Label>
              <Input
                id="export-zip"
                value={zip}
                onChange={e => setZip(e.target.value)}
                placeholder="12345"
                maxLength={5}
                className="mt-1"
              />
              {errors.zip && <p className="text-xs text-destructive mt-1">{errors.zip}</p>}
            </div>
            <div>
              <Label htmlFor="export-city">Ort</Label>
              <Input
                id="export-city"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Musterstadt"
                className="mt-1"
              />
              {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Abbrechen</Button>
          <Button onClick={handleConfirm}>
            {exportLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportAddressDialog;
