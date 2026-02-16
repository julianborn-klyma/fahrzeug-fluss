import { useState } from 'react';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import { useOrderTypes } from '@/hooks/useOrderTypes';
import { useChecklistTemplates } from '@/hooks/useChecklistTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Pencil, Trash2, Settings2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import EditAppointmentTypeDialog from './EditAppointmentTypeDialog';

const SettingsAppointmentTypes = () => {
  const { appointmentTypes, loading, createAppointmentType, deleteAppointmentType } = useAppointmentTypes();
  const { orderTypes } = useOrderTypes();
  const { templates } = useChecklistTemplates();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingAt, setEditingAt] = useState<any>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createAppointmentType.mutateAsync({ name: newName.trim() });
      setNewName('');
      setShowNewDialog(false);
      toast.success('Terminart erstellt.');
    } catch { toast.error('Fehler.'); }
  };

  // Find which order types use a given appointment type
  const getOrderTypesForAt = (atId: string) => {
    return orderTypes.filter((ot: any) =>
      (ot.appointment_types || []).some((at: any) => at.id === atId)
    );
  };

  // Find checklists for a given appointment type
  const getChecklistsForAt = (atId: string) => {
    return templates.filter((t: any) => t.appointment_type_id === atId);
  };

  if (loading) return <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Terminarten</h3>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Neue Terminart</Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {appointmentTypes.map((at: any) => {
          const usedInOts = getOrderTypesForAt(at.id);
          const checklists = getChecklistsForAt(at.id);
          return (
            <AccordionItem key={at.id} value={at.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{at.name}</span>
                  <Badge variant={at.is_internal ? 'default' : 'secondary'} className="text-xs">
                    {at.is_internal ? 'Intern' : 'Extern'}
                  </Badge>
                  {at.is_active === false && <Badge variant="destructive" className="text-xs">Inaktiv</Badge>}
                  {usedInOts.length > 0 && (
                    <Badge variant="outline" className="text-xs">{usedInOts.length} Projektart{usedInOts.length !== 1 ? 'en' : ''}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="flex gap-2 mb-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingAt(at)}>
                    <Settings2 className="h-3 w-3" /> Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={async () => {
                    if (!confirm('Terminart wirklich löschen? Sie wird aus allen Projektarten entfernt.')) return;
                    try { await deleteAppointmentType.mutateAsync(at.id); toast.success('Gelöscht.'); } catch { toast.error('Fehler.'); }
                  }}>
                    <Trash2 className="h-3 w-3" /> Löschen
                  </Button>
                </div>

                {/* Used in project types */}
                {usedInOts.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Verwendet in Projektarten:</p>
                    <div className="flex flex-wrap gap-1">
                      {usedInOts.map((ot: any) => (
                        <Badge key={ot.id} variant="outline" className="text-xs">{ot.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned checklists */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" /> Zugeordnete Checklisten:
                  </p>
                  {checklists.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Keine Checklisten zugeordnet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {checklists.map((cl: any) => (
                        <Badge key={cl.id} variant="secondary" className="text-xs">
                          {cl.name}
                          {cl.is_standard && ' ★'}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* New Appointment Type Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neue Terminart</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <Button onClick={handleCreate} disabled={createAppointmentType.isPending} className="w-full">Erstellen</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Type Dialog */}
      {editingAt && (
        <EditAppointmentTypeDialog
          appointmentType={editingAt}
          open={!!editingAt}
          onOpenChange={(open) => { if (!open) setEditingAt(null); }}
        />
      )}
    </div>
  );
};

export default SettingsAppointmentTypes;
