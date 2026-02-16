import { useState } from 'react';
import { useOrderTypes } from '@/hooks/useOrderTypes';
import { useAppointmentTypes } from '@/hooks/useAppointmentTypes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Link } from 'lucide-react';
import { toast } from 'sonner';
import EditOrderTypeDialog from './EditOrderTypeDialog';

const SettingsProjektarten = () => {
  const { orderTypes, loading, createOrderType, deleteOrderType, addAppointmentTypeToOrder, removeAppointmentTypeFromOrder } = useOrderTypes();
  const { appointmentTypes, createAppointmentType } = useAppointmentTypes();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingOrderType, setEditingOrderType] = useState<any>(null);

  // Add appointment type to order type
  const [addingToOrderType, setAddingToOrderType] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'new' | 'existing'>('existing');
  const [newAtName, setNewAtName] = useState('');
  const [selectedAtId, setSelectedAtId] = useState('');

  const handleCreateOrderType = async () => {
    if (!newName.trim()) return;
    try {
      await createOrderType.mutateAsync({ name: newName.trim() });
      setNewName('');
      setShowNewDialog(false);
      toast.success('Projektart erstellt.');
    } catch { toast.error('Fehler.'); }
  };

  const handleRemoveAppointmentType = async (junctionId: string) => {
    try {
      await removeAppointmentTypeFromOrder.mutateAsync(junctionId);
      toast.success('Terminart entfernt.');
    } catch { toast.error('Fehler beim Entfernen.'); }
  };

  const handleAddAppointmentType = async () => {
    if (!addingToOrderType) return;
    try {
      if (addMode === 'existing' && selectedAtId) {
        await addAppointmentTypeToOrder.mutateAsync({
          order_type_id: addingToOrderType,
          appointment_type_id: selectedAtId,
        });
        toast.success('Terminart zugeordnet.');
      } else if (addMode === 'new' && newAtName.trim()) {
        const created = await createAppointmentType.mutateAsync({ name: newAtName.trim() });
        await addAppointmentTypeToOrder.mutateAsync({
          order_type_id: addingToOrderType,
          appointment_type_id: created.id,
        });
        toast.success('Terminart erstellt und zugeordnet.');
      } else {
        return;
      }
      setAddingToOrderType(null);
      setNewAtName('');
      setSelectedAtId('');
    } catch { toast.error('Fehler.'); }
  };

  const getExistingAtIds = (orderTypeId: string) => {
    const ot = orderTypes.find(o => o.id === orderTypeId);
    return (ot?.appointment_types || []).map((at: any) => at.id);
  };

  if (loading) return <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Projektarten</h3>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> Neue Projektart</Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {orderTypes.map((ot) => (
          <AccordionItem key={ot.id} value={ot.id} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="font-medium">{ot.name}</span>
                {ot.is_system && <Badge variant="secondary" className="text-xs">System</Badge>}
                <Badge variant="outline" className="text-xs">{ot.appointment_types.length} Terminarten</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingOrderType(ot)}>
                  <Pencil className="h-3 w-3" /> Bearbeiten
                </Button>
                {!ot.is_system && (
                  <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={async () => {
                    if (!confirm('Projektart wirklich löschen?')) return;
                    try { await deleteOrderType.mutateAsync(ot.id); toast.success('Gelöscht.'); } catch { toast.error('Fehler.'); }
                  }}>
                    <Trash2 className="h-3 w-3" /> Löschen
                  </Button>
                )}
              </div>

              {ot.appointment_types.map((at: any) => (
                <Card key={at.junction_id || at.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{at.name}</span>
                      <Badge variant={at.is_internal ? 'default' : 'secondary'} className="text-xs">
                        {at.is_internal ? 'Intern' : 'Extern'}
                      </Badge>
                      {at.is_active === false && <Badge variant="destructive" className="text-xs">Inaktiv</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                      if (at.junction_id) handleRemoveAppointmentType(at.junction_id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" size="sm" className="gap-1 w-full" onClick={() => { setAddingToOrderType(ot.id); setNewAtName(''); setSelectedAtId(''); setAddMode('existing'); }}>
                <Plus className="h-3 w-3" /> Terminart zuordnen
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* New Order Type Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neue Projektart</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <Button onClick={handleCreateOrderType} disabled={createOrderType.isPending} className="w-full">Erstellen</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Type Dialog */}
      <Dialog open={!!addingToOrderType} onOpenChange={() => setAddingToOrderType(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Terminart zuordnen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={addMode === 'existing' ? 'default' : 'outline'} size="sm" onClick={() => setAddMode('existing')}>
                <Link className="h-3 w-3 mr-1" /> Bestehende zuordnen
              </Button>
              <Button variant={addMode === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setAddMode('new')}>
                <Plus className="h-3 w-3 mr-1" /> Neue erstellen
              </Button>
            </div>

            {addMode === 'new' && (
              <div><Label>Name</Label><Input value={newAtName} onChange={(e) => setNewAtName(e.target.value)} /></div>
            )}

            {addMode === 'existing' && (
              <div>
                <Label>Terminart auswählen</Label>
                <Select value={selectedAtId} onValueChange={setSelectedAtId}>
                  <SelectTrigger><SelectValue placeholder="Terminart wählen…" /></SelectTrigger>
                  <SelectContent>
                    {appointmentTypes
                      .filter((at: any) => !getExistingAtIds(addingToOrderType!).includes(at.id))
                      .map((at: any) => (
                        <SelectItem key={at.id} value={at.id}>{at.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleAddAppointmentType} className="w-full">
              {addMode === 'new' ? 'Erstellen & Zuordnen' : 'Zuordnen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Order Type Dialog */}
      {editingOrderType && (
        <EditOrderTypeDialog
          orderType={editingOrderType}
          open={!!editingOrderType}
          onOpenChange={(open) => { if (!open) setEditingOrderType(null); }}
        />
      )}
    </div>
  );
};

export default SettingsProjektarten;
