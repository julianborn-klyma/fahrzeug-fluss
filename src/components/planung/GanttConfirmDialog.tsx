import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface BarChangeRequest {
  appointmentId: string;
  typeName: string;
  jobTitle: string;
  jobNumber: string;
  newStartDate: string;
  newEndDate: string;
  /** set when moving to a different person */
  newPersonId?: string;
  newPersonName?: string;
  /** original person being moved from */
  oldPersonId?: string;
}

interface Props {
  request: BarChangeRequest | null;
  onConfirm: (req: BarChangeRequest) => void;
  onCancel: () => void;
}

const GanttConfirmDialog = ({ request, onConfirm, onCancel }: Props) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('17:00');

  useEffect(() => {
    if (request) {
      setStartDate(request.newStartDate.slice(0, 10));
      setStartTime(request.newStartDate.slice(11, 16) || '08:00');
      setEndDate(request.newEndDate.slice(0, 10));
      setEndTime(request.newEndDate.slice(11, 16) || '17:00');
    }
  }, [request]);

  if (!request) return null;

  const handleConfirm = () => {
    onConfirm({
      ...request,
      newStartDate: `${startDate}T${startTime}:00`,
      newEndDate: `${endDate}T${endTime}:00`,
    });
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Termin aktualisieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{request.typeName}</span> – {request.jobTitle} (#{request.jobNumber})
          </p>
          {request.newPersonName && (
            <p className="text-sm">
              Verschieben zu: <span className="font-medium">{request.newPersonName}</span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Startdatum</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Startzeit</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Enddatum</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Endzeit</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Änderungen gelten für alle zugewiesenen Monteure dieses Termins.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
          <Button onClick={handleConfirm}>Bestätigen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GanttConfirmDialog;
