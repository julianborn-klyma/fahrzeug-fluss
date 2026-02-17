import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Trash2, Plus, GripVertical, ChevronRight, CheckSquare, Type, Camera, FolderOpen, Pencil, Check, X } from 'lucide-react';
import { useChecklistTemplates } from '@/hooks/useChecklistTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STEP_TYPES = [
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'text', label: 'Freitext', icon: Type },
  { value: 'photo', label: 'Foto', icon: Camera },
  { value: 'group', label: 'Gruppe', icon: FolderOpen },
];

interface Props {
  template: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentTypes: any[];
}

const EditChecklistDialog: React.FC<Props> = ({ template, open, onOpenChange, appointmentTypes }) => {
  const { createTemplate, updateTemplate, addStep, deleteStep } = useChecklistTemplates();

  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [appointmentTypeId, setAppointmentTypeId] = useState(template?.appointment_type_id || '');
  const [isStandard, setIsStandard] = useState(template?.is_standard || false);
  const [templateId, setTemplateId] = useState<string | null>(template?.id || null);
  const [steps, setSteps] = useState<any[]>(template?.steps || []);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  // New step form
  const [showNewStep, setShowNewStep] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('checkbox');
  const [newOptions, setNewOptions] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [newRequired, setNewRequired] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name ist erforderlich.'); return; }
    try {
      if (templateId) {
        await updateTemplate.mutateAsync({
          id: templateId,
          name: name.trim(),
          description,
          appointment_type_id: appointmentTypeId || null,
          is_standard: isStandard,
        });
      } else {
        const result = await createTemplate.mutateAsync({
          name: name.trim(),
          description,
          appointment_type_id: appointmentTypeId || null,
          is_standard: isStandard,
        });
        setTemplateId((result as any).id);
      }
      toast.success('Gespeichert.');
    } catch { toast.error('Fehler.'); }
  };

  const handleAddStep = async () => {
    if (!newTitle.trim() || !templateId) return;
    const options = newOptions ? JSON.stringify(newOptions.split(',').map(s => s.trim()).filter(Boolean)) : '[]';
    try {
      const result = await addStep.mutateAsync({
        template_id: templateId,
        title: newTitle.trim(),
        description: newDescription,
        step_type: newType,
        order_index: steps.length,
        is_required: newRequired,
        parent_step_id: newParentId || null,
        options,
      });
      setSteps([...steps, result]);
      setShowNewStep(false);
      setNewTitle(''); setNewDescription(''); setNewType('checkbox'); setNewOptions(''); setNewParentId(''); setNewRequired(false);
      toast.success('Schritt hinzugefügt.');
    } catch { toast.error('Fehler.'); }
  };

  const handleDeleteStep = async (id: string) => {
    try {
      await deleteStep.mutateAsync(id);
      setSteps(steps.filter((s: any) => s.id !== id && s.parent_step_id !== id));
      toast.success('Schritt gelöscht.');
    } catch { toast.error('Fehler.'); }
  };

  const handleRenameGroup = async (stepId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const { error } = await supabase.from('checklist_template_steps').update({ title: newTitle.trim() } as any).eq('id', stepId);
      if (error) throw error;
      setSteps(steps.map(s => s.id === stepId ? { ...s, title: newTitle.trim() } : s));
      setEditingGroupId(null);
      toast.success('Gruppe umbenannt.');
    } catch { toast.error('Fehler.'); }
  };

  const groupSteps = steps.filter((s: any) => s.step_type === 'group');
  const topLevelSteps = steps.filter((s: any) => !s.parent_step_id);
  const childrenOf = (parentId: string) => steps.filter((s: any) => s.parent_step_id === parentId);

  const StepIcon = ({ type }: { type: string }) => {
    const st = STEP_TYPES.find(t => t.value === type);
    if (!st) return null;
    const Icon = st.icon;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const renderStep = (step: any, indent = false) => (
    <Card key={step.id} className={indent ? 'ml-6' : ''}>
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <StepIcon type={step.step_type} />
          <span className="text-sm font-medium">{step.title}</span>
          <Badge variant="outline" className="text-xs">{STEP_TYPES.find(t => t.value === step.step_type)?.label}</Badge>
          {step.is_required && <Badge className="text-xs">Pflicht</Badge>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteStep(step.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Checkliste bearbeiten' : 'Neue Checkliste'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Beschreibung</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div>
            <Label>Terminart</Label>
            <Select value={appointmentTypeId} onValueChange={setAppointmentTypeId}>
              <SelectTrigger><SelectValue placeholder="Keine Terminart" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Terminart</SelectItem>
                {appointmentTypes.map((at: any) => (
                  <SelectItem key={at.id} value={at.id}>{at.orderTypeName} → {at.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Standard-Checkliste</Label>
            <Switch checked={isStandard} onCheckedChange={setIsStandard} />
          </div>
          <Button onClick={handleSave} className="w-full">{templateId ? 'Speichern' : 'Erstellen & Schritte hinzufügen'}</Button>
        </div>

        {templateId && (
          <div className="space-y-3 mt-4 border-t pt-4">
            <h4 className="font-semibold text-sm">Schritte</h4>

            {topLevelSteps.map((step: any) => (
              <div key={step.id}>
                {step.step_type === 'group' ? (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="w-full">
                      <Card>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-90" />
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            {editingGroupId === step.id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  value={editGroupName}
                                  onChange={(e) => setEditGroupName(e.target.value)}
                                  className="h-7 text-sm w-40"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameGroup(step.id, editGroupName);
                                    if (e.key === 'Escape') setEditingGroupId(null);
                                  }}
                                />
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleRenameGroup(step.id, editGroupName); }}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingGroupId(null); }}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm font-medium">{step.title}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditingGroupId(step.id); setEditGroupName(step.title); }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <Badge variant="outline" className="text-xs">Gruppe</Badge>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-1">
                      {childrenOf(step.id).map((child: any) => renderStep(child, true))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : renderStep(step)}
              </div>
            ))}

            {!showNewStep ? (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => { setShowNewStep(true); setNewType('checkbox'); }}>
                  <Plus className="h-4 w-4" /> Schritt
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={async () => {
                  try {
                    const result = await addStep.mutateAsync({
                      template_id: templateId,
                      title: 'Neue Gruppe',
                      step_type: 'group',
                      order_index: steps.length,
                      options: '[]',
                    });
                    setSteps([...steps, result]);
                    toast.success('Gruppe hinzugefügt.');
                  } catch { toast.error('Fehler.'); }
                }}>
                  <FolderOpen className="h-4 w-4" /> Gruppe
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div><Label>Titel *</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></div>
                  <div><Label>Beschreibung</Label><Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} /></div>
                  <div>
                    <Label>Typ</Label>
                    <Select value={newType} onValueChange={setNewType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STEP_TYPES.filter(t => t.value !== 'group').map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newType === 'checkbox' && (
                    <div><Label>Antwortoptionen (kommagetrennt)</Label><Input value={newOptions} onChange={(e) => setNewOptions(e.target.value)} placeholder="Ja, Nein, Teilweise" /></div>
                  )}
                  {groupSteps.length > 0 && (
                    <div>
                      <Label>Übergeordneter Schritt</Label>
                      <Select value={newParentId} onValueChange={setNewParentId}>
                        <SelectTrigger><SelectValue placeholder="Kein übergeordneter Schritt" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kein übergeordneter Schritt</SelectItem>
                          {groupSteps.map((g: any) => (
                            <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label>Pflichtfeld</Label>
                    <Switch checked={newRequired} onCheckedChange={setNewRequired} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowNewStep(false)} className="flex-1">Abbrechen</Button>
                    <Button onClick={handleAddStep} className="flex-1">Hinzufügen</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditChecklistDialog;
