import { useState } from 'react';
import { useOrderTypes } from '@/hooks/useOrderTypes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Settings2, FolderKanban, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import EditAppointmentTypeDialog from './EditAppointmentTypeDialog';
import SettingsChecklists from './SettingsChecklists';
import EditOrderTypeDialog from './EditOrderTypeDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const SettingsOrderTypes = () => {
  const [subTab, setSubTab] = useState<'projektarten' | 'checklisten'>('projektarten');
  const { orderTypes, loading, createOrderType, deleteOrderType } = useOrderTypes();
  const queryClient = useQueryClient();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingOrderType, setEditingOrderType] = useState<any>(null);
  const [editingAppointmentType, setEditingAppointmentType] = useState<any>(null);
  const [addingToOrderType, setAddingToOrderType] = useState<string | null>(null);
  const [newAtName, setNewAtName] = useState('');


  const handleCreateOrderType = async () => {
    if (!newName.trim()) return;
    try {
      await createOrderType.mutateAsync({ name: newName.trim() });
      setNewName('');
      setShowNewDialog(false);
      toast.success('Projektart erstellt.');
    } catch { toast.error('Fehler.'); }
  };

  const handleDeleteAppointmentType = async (id: string) => {
    const { error } = await supabase.from('appointment_types').delete().eq('id', id);
    if (error) { toast.error('Fehler beim Löschen.'); return; }
    queryClient.invalidateQueries({ queryKey: ['order-types'] });
    toast.success('Terminart gelöscht.');
  };

  const handleAddAppointmentType = async () => {
    if (!addingToOrderType || !newAtName.trim()) return;
    const { error } = await supabase.from('appointment_types').insert({
      order_type_id: addingToOrderType,
      name: newAtName.trim(),
    } as any).select();
    if (error) { toast.error('Fehler.'); return; }
    queryClient.invalidateQueries({ queryKey: ['order-types'] });
    setAddingToOrderType(null);
    setNewAtName('');
    toast.success('Terminart hinzugefügt.');
  };

  if (loading) return <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b mb-4">
        {[
          { key: 'projektarten' as const, label: 'Projektarten & Terminarten', icon: FolderKanban },
          { key: 'checklisten' as const, label: 'Checklisten', icon: ClipboardList },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              subTab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {subTab === 'checklisten' && <SettingsChecklists />}

      {subTab === 'projektarten' && (
      <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Projektarten & Terminarten</h3>
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
                <Card key={at.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{at.name}</span>
                      <Badge variant={at.is_internal ? 'default' : 'secondary'} className="text-xs">
                        {at.is_internal ? 'Intern' : 'Extern'}
                      </Badge>
                      {at.is_active === false && <Badge variant="destructive" className="text-xs">Inaktiv</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingAppointmentType(at)}>
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteAppointmentType(at.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" size="sm" className="gap-1 w-full" onClick={() => { setAddingToOrderType(ot.id); setNewAtName(''); }}>
                <Plus className="h-3 w-3" /> Terminart hinzufügen
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      </div>
      )}

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
          <DialogHeader><DialogTitle>Terminart hinzufügen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={newAtName} onChange={(e) => setNewAtName(e.target.value)} /></div>
            <Button onClick={handleAddAppointmentType} className="w-full">Hinzufügen</Button>
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

      {/* Edit Appointment Type Dialog */}
      {editingAppointmentType && (
        <EditAppointmentTypeDialog
          appointmentType={editingAppointmentType}
          open={!!editingAppointmentType}
          onOpenChange={(open) => { if (!open) setEditingAppointmentType(null); }}
        />
      )}
    </div>
  );
};

export default SettingsOrderTypes;
