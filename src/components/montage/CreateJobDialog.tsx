import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobs } from '@/hooks/useJobs';
import { toast } from 'sonner';

const ORDER_TYPES = [
  { value: 'WP', label: 'Wärmepumpe' },
  { value: 'PV', label: 'Photovoltaik' },
  { value: 'INST', label: 'Installation' },
] as const;

type OrderTypePrefix = typeof ORDER_TYPES[number]['value'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateJobDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { jobs, createJob } = useJobs();
  const [orderType, setOrderType] = useState<OrderTypePrefix | ''>('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [generatedNumber, setGeneratedNumber] = useState('');

  // Generate job number when order type changes
  useEffect(() => {
    if (!orderType) {
      setGeneratedNumber('');
      return;
    }
    const year = new Date().getFullYear();
    const prefix = `${orderType}-${year}-`;
    const existing = jobs
      .map((j) => j.job_number)
      .filter((n) => n.startsWith(prefix))
      .map((n) => {
        const num = parseInt(n.replace(prefix, ''), 10);
        return isNaN(num) ? 0 : num;
      });
    const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
    setGeneratedNumber(`${prefix}${String(next).padStart(3, '0')}`);
  }, [orderType, jobs]);

  const generatedTitle = orderType && clientName.trim()
    ? `${clientName.trim()}_${orderType}`
    : '';

  const handleCreate = async () => {
    if (!orderType) {
      toast.error('Bitte Auftragsart wählen.');
      return;
    }
    if (!clientName.trim()) {
      toast.error('Bitte Kundenname eingeben.');
      return;
    }
    try {
      await createJob.mutateAsync({
        title: generatedTitle,
        job_number: generatedNumber,
        description: description.trim(),
      });
      toast.success('Auftrag erstellt.');
      setOrderType('');
      setClientName('');
      setDescription('');
      onOpenChange(false);
    } catch {
      toast.error('Fehler beim Erstellen.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Auftrag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Auftragsart</Label>
            <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderTypePrefix)}>
              <SelectTrigger>
                <SelectValue placeholder="Art wählen…" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kundenname</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="z.B. Müller" />
          </div>
          {generatedNumber && (
            <div>
              <Label>Auftragsnummer</Label>
              <Input value={generatedNumber} readOnly className="bg-muted" />
            </div>
          )}
          {generatedTitle && (
            <div>
              <Label>Auftragstitel</Label>
              <Input value={generatedTitle} readOnly className="bg-muted" />
            </div>
          )}
          <div>
            <Label>Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <Button onClick={handleCreate} disabled={createJob.isPending} className="w-full">
            {createJob.isPending ? 'Erstelle…' : 'Auftrag erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;
