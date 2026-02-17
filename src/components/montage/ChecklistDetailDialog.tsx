import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckSquare, Type, Camera, FolderOpen, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  checklist: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_ICONS: Record<string, any> = {
  checkbox: CheckSquare,
  text: Type,
  photo: Camera,
  group: FolderOpen,
};

const ChecklistDetailDialog: React.FC<Props> = ({ checklist, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const steps: any[] = checklist?.steps || [];
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const topLevel = steps.filter(s => !s.parent_step_id);
  const childrenOf = (parentId: string) => steps.filter(s => s.parent_step_id === parentId);

  const totalDone = steps.filter(s => s.is_completed).length;
  const totalAll = steps.length;
  const percent = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const toggleStep = async (step: any) => {
    const newVal = !step.is_completed;
    try {
      await supabase.from('job_checklist_steps').update({
        is_completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      } as any).eq('id', step.id);
      queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['job-checklists'] });
    } catch { toast.error('Fehler.'); }
  };

  const updateTextValue = async (stepId: string, value: string) => {
    try {
      await supabase.from('job_checklist_steps').update({ text_value: value } as any).eq('id', stepId);
      queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['job-checklists'] });
      setEditingStep(null);
      toast.success('Gespeichert.');
    } catch { toast.error('Fehler.'); }
  };

  const groupProgress = (groupId: string) => {
    const children = childrenOf(groupId);
    const done = children.filter(c => c.is_completed).length;
    return { done, total: children.length, percent: children.length > 0 ? Math.round((done / children.length) * 100) : 0 };
  };

  const renderStep = (step: any, indent = false) => {
    const Icon = STEP_ICONS[step.step_type] || CheckSquare;
    const isEditing = editingStep === step.id;

    return (
      <div key={step.id} className={`flex items-start gap-2 p-2 rounded-md border bg-background ${indent ? 'ml-5' : ''}`}>
        {step.step_type === 'checkbox' && (
          <Checkbox
            checked={step.is_completed}
            onCheckedChange={() => toggleStep(step)}
            className="mt-0.5"
          />
        )}
        {step.step_type !== 'checkbox' && step.step_type !== 'group' && (
          <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${step.is_completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
              {step.title}
            </span>
            {step.is_required && <Badge variant="destructive" className="text-[10px] px-1 py-0">Pflicht</Badge>}
          </div>

          {/* Text field */}
          {step.step_type === 'text' && (
            <div className="mt-1">
              {isEditing ? (
                <div className="flex gap-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateTextValue(step.id, editValue)}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingStep(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{step.text_value || '—'}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingStep(step.id); setEditValue(step.text_value || ''); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Photo */}
          {step.step_type === 'photo' && step.photo_url && (
            <img src={step.photo_url} alt={step.title} className="mt-1 rounded max-h-20 object-cover" />
          )}

          {/* Completed info */}
          {step.is_completed && step.completed_at && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Erledigt am {new Date(step.completed_at).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {checklist?.name || 'Checkliste'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mb-3">
          <Progress value={percent} className="h-2 flex-1" />
          <span className="text-sm font-medium text-muted-foreground">{totalDone}/{totalAll} ({percent}%)</span>
        </div>

        <div className="space-y-2">
          {topLevel.map(step => {
            if (step.step_type === 'group') {
              const gp = groupProgress(step.id);
              return (
                <Collapsible key={step.id} defaultOpen>
                  <div className="rounded-md border overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-2 bg-muted/50 hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-90" />
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{step.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={gp.percent} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground">{gp.done}/{gp.total}</span>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-2 space-y-1.5">
                        {childrenOf(step.id).map(child => renderStep(child, false))}
                        {childrenOf(step.id).length === 0 && (
                          <p className="text-xs text-muted-foreground py-1">Keine Schritte in dieser Gruppe.</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            }
            return renderStep(step);
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChecklistDetailDialog;
