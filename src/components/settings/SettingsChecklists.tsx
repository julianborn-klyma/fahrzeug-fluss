import { useState } from 'react';
import { useChecklistTemplates } from '@/hooks/useChecklistTemplates';
import { useOrderTypes } from '@/hooks/useOrderTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import EditChecklistDialog from './EditChecklistDialog';

const SettingsChecklists = () => {
  const { templates, loading, deleteTemplate } = useChecklistTemplates();
  const { orderTypes } = useOrderTypes();
  const [filterAtId, setFilterAtId] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  // Flatten all appointment types
  const allAppointmentTypes = orderTypes.flatMap((ot: any) =>
    (ot.appointment_types || []).map((at: any) => ({ ...at, orderTypeName: ot.name }))
  );

  const filtered = filterAtId === 'all'
    ? templates
    : templates.filter((t: any) => t.appointment_type_id === filterAtId);

  if (loading) return <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Checklisten-Vorlagen</h3>
        <Button onClick={() => setCreating(true)} className="gap-2"><Plus className="h-4 w-4" /> Neue Checkliste</Button>
      </div>

      <div className="max-w-xs">
        <Select value={filterAtId} onValueChange={setFilterAtId}>
          <SelectTrigger><SelectValue placeholder="Alle Terminarten" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Terminarten</SelectItem>
            {allAppointmentTypes.map((at: any) => (
              <SelectItem key={at.id} value={at.id}>{at.orderTypeName} → {at.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <div className="text-muted-foreground text-sm py-8 text-center flex flex-col items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Keine Checklisten vorhanden.
        </div>
      )}

      {filtered.map((t: any) => {
        const at = allAppointmentTypes.find((a: any) => a.id === t.appointment_type_id);
        return (
          <Card key={t.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  {t.is_standard && <Badge className="text-xs">Standard</Badge>}
                </div>
                {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                {at && <Badge variant="outline" className="text-xs">{at.orderTypeName} → {at.name}</Badge>}
                <Badge variant="secondary" className="text-xs">{(t.steps || []).length} Schritte</Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTemplate(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                  if (!confirm('Checkliste wirklich löschen?')) return;
                  try { await deleteTemplate.mutateAsync(t.id); toast.success('Gelöscht.'); } catch { toast.error('Fehler.'); }
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {(creating || editingTemplate) && (
        <EditChecklistDialog
          template={editingTemplate}
          open={true}
          onOpenChange={(open) => { if (!open) { setEditingTemplate(null); setCreating(false); } }}
          appointmentTypes={allAppointmentTypes}
        />
      )}
    </div>
  );
};

export default SettingsChecklists;
