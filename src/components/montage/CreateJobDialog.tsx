import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useJobs } from '@/hooks/useJobs';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateJobDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { createJob } = useJobs();
  const [title, setTitle] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Bitte Titel eingeben.');
      return;
    }
    try {
      await createJob.mutateAsync({
        title: title.trim(),
        job_number: jobNumber.trim(),
        description: description.trim(),
      });
      toast.success('Auftrag erstellt.');
      setTitle('');
      setJobNumber('');
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
            <Label>Auftragsnummer</Label>
            <Input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} placeholder="z.B. A-2026-001" />
          </div>
          <div>
            <Label>Titel</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Auftragstitel" />
          </div>
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
