import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType?: string;
  entityId?: string;
}

const CreateTaskDialog = ({ open, onOpenChange, entityType, entityId }: CreateTaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assignedTo, setAssignedTo] = useState('');
  const { createTask } = useTasks();

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles-for-tasks'],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, name, email').order('name');
      return data || [];
    },
  });

  const handleSubmit = async () => {
    if (!title.trim() || !assignedTo) return;
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        assigned_to: assignedTo,
        entity_type: entityType || null,
        entity_id: entityId || null,
      });
      toast.success('Aufgabe erstellt.');
      setTitle('');
      setDescription('');
      setDueDate(undefined);
      setAssignedTo('');
      onOpenChange(false);
    } catch {
      toast.error('Fehler beim Erstellen.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Aufgabe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Titel *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Aufgabentitel…" />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details…" rows={3} />
          </div>
          <div>
            <Label>Fälligkeitsdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dueDate ? format(dueDate, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen…'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Zugewiesen an *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Person wählen…" />
              </SelectTrigger>
              <SelectContent>
                {(profiles || []).map((p: any) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={!title.trim() || !assignedTo || createTask.isPending} className="w-full">
            Aufgabe erstellen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
