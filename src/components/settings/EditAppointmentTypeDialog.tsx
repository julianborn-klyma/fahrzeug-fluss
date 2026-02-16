import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useAppointmentTypeFields, useAppointmentTypeDocuments, useDocumentTypes } from '@/hooks/useAppointmentTypes';
import { TRADE_LABELS, type TradeType } from '@/types/montage';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textfeld' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'boolean', label: 'Ja/Nein' },
  { value: 'date', label: 'Datum' },
  { value: 'photo', label: 'Foto-Upload' },
];

interface Props {
  appointmentType: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditAppointmentTypeDialog: React.FC<Props> = ({ appointmentType, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const { fields, upsertField, deleteField } = useAppointmentTypeFields(appointmentType.id);
  const { documents, addDocument, removeDocument } = useAppointmentTypeDocuments(appointmentType.id);
  const { data: docTypes } = useDocumentTypes();

  // Settings state
  const [name, setName] = useState(appointmentType.name);
  const [description, setDescription] = useState(appointmentType.description || '');
  
  const [isInternal, setIsInternal] = useState(appointmentType.is_internal);
  const [isActive, setIsActive] = useState(appointmentType.is_active !== false);

  // New field state
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldWidth, setNewFieldWidth] = useState('half');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Doc add
  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');

  const handleSaveSettings = async () => {
    const { error } = await supabase.from('appointment_types').update({
      name, description, is_internal: isInternal, is_active: isActive,
    } as any).eq('id', appointmentType.id);
    if (error) { toast.error('Fehler.'); return; }
    queryClient.invalidateQueries({ queryKey: ['order-types'] });
    queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
    toast.success('Gespeichert.');
  };

  const handleAddField = async () => {
    if (!newFieldLabel.trim()) return;
    const options = newFieldType === 'dropdown' ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean) : [];
    try {
      await upsertField.mutateAsync({
        appointment_type_id: appointmentType.id,
        label: newFieldLabel.trim(),
        field_type: newFieldType,
        placeholder: newFieldPlaceholder,
        is_required: newFieldRequired,
        width: newFieldWidth,
        options: JSON.stringify(options),
        display_order: fields.length,
      });
      setShowNewField(false);
      setNewFieldLabel('');
      setNewFieldPlaceholder('');
      setNewFieldRequired(false);
      setNewFieldType('text');
      setNewFieldOptions('');
      toast.success('Feld hinzugefügt.');
    } catch { toast.error('Fehler.'); }
  };

  const handleAddDocument = async () => {
    if (!selectedDocTypeId) return;
    try {
      await addDocument.mutateAsync({ appointment_type_id: appointmentType.id, document_type_id: selectedDocTypeId });
      setSelectedDocTypeId('');
      toast.success('Dokument hinzugefügt.');
    } catch { toast.error('Fehler.'); }
  };

  const usedDocIds = documents.map((d: any) => d.document_type_id);
  const availableDocTypes = (docTypes || []).filter((dt: any) => !usedDocIds.includes(dt.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Terminart: {appointmentType.name}</DialogTitle></DialogHeader>

        <Tabs defaultValue="settings">
          <TabsList className="w-full">
            <TabsTrigger value="settings" className="flex-1">Einstellungen</TabsTrigger>
            <TabsTrigger value="fields" className="flex-1">Felder</TabsTrigger>
            <TabsTrigger value="documents" className="flex-1">Dokumente</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Beschreibung</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="flex items-center justify-between">
              <Label>Intern</Label>
              <Switch checked={isInternal} onCheckedChange={setIsInternal} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktiv</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <Button onClick={handleSaveSettings} className="w-full">Speichern</Button>
          </TabsContent>

          <TabsContent value="fields" className="space-y-3 mt-4">
            {fields.map((f: any) => (
              <Card key={f.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{f.label}</span>
                    <Badge variant="outline" className="text-xs">{FIELD_TYPES.find(ft => ft.value === f.field_type)?.label || f.field_type}</Badge>
                    {f.is_required && <Badge className="text-xs">Pflicht</Badge>}
                    <Badge variant="secondary" className="text-xs">{f.width === 'full' ? 'Volle Breite' : 'Halbe Breite'}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                    await deleteField.mutateAsync(f.id);
                    toast.success('Feld gelöscht.');
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {!showNewField ? (
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowNewField(true)}>
                <Plus className="h-4 w-4" /> Neues Feld
              </Button>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div><Label>Bezeichnung</Label><Input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} /></div>
                  <div>
                    <Label>Feldtyp</Label>
                    <Select value={newFieldType} onValueChange={setNewFieldType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {newFieldType === 'dropdown' && (
                    <div><Label>Optionen (kommagetrennt)</Label><Input value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} placeholder="Option 1, Option 2, ..." /></div>
                  )}
                  <div><Label>Platzhalter</Label><Input value={newFieldPlaceholder} onChange={(e) => setNewFieldPlaceholder(e.target.value)} /></div>
                  <div className="flex items-center justify-between">
                    <Label>Pflichtfeld</Label>
                    <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} />
                  </div>
                  <div>
                    <Label>Breite</Label>
                    <Select value={newFieldWidth} onValueChange={setNewFieldWidth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="half">Halbe Breite</SelectItem>
                        <SelectItem value="full">Volle Breite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowNewField(false)} className="flex-1">Abbrechen</Button>
                    <Button onClick={handleAddField} className="flex-1">Hinzufügen</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-3 mt-4">
            {documents.map((d: any) => (
              <Card key={d.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-sm">{d.document_types?.name || 'Unbekannt'}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                    await removeDocument.mutateAsync(d.id);
                    toast.success('Entfernt.');
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-2">
              <Select value={selectedDocTypeId} onValueChange={setSelectedDocTypeId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Dokumenttyp wählen…" /></SelectTrigger>
                <SelectContent>
                  {availableDocTypes.map((dt: any) => <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleAddDocument} disabled={!selectedDocTypeId}><Plus className="h-4 w-4" /></Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentTypeDialog;
