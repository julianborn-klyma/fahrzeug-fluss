import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckSquare, Type, Camera, FolderOpen, ChevronRight, Pencil, Check, X, Upload, Trash2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  checklist: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChecklistDetailDialog: React.FC<Props> = ({ checklist, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const steps: any[] = checklist?.steps || [];
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const topLevel = steps.filter(s => !s.parent_step_id);
  const childrenOf = (parentId: string) => steps.filter(s => s.parent_step_id === parentId);

  const totalDone = steps.filter(s => s.is_completed && s.step_type !== 'group').length;
  const totalAll = steps.filter(s => s.step_type !== 'group').length;
  const percent = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['job-checklists'] });
  };

  const toggleStep = async (step: any) => {
    const newVal = !step.is_completed;
    try {
      await supabase.from('job_checklist_steps').update({
        is_completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      } as any).eq('id', step.id);
      invalidate();
    } catch { toast.error('Fehler.'); }
  };

  const updateTextValue = async (stepId: string, value: string) => {
    try {
      await supabase.from('job_checklist_steps').update({ text_value: value } as any).eq('id', stepId);
      invalidate();
      setEditingStep(null);
      toast.success('Gespeichert.');
    } catch { toast.error('Fehler.'); }
  };

  const handlePhotoUpload = async (stepId: string, file: File) => {
    setUploadingStepId(stepId);
    try {
      const filePath = `checklists/${checklist.id}/${stepId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('job-documents').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('job-documents').getPublicUrl(filePath);
      // Use signed URL since bucket is private
      const { data: signedData } = await supabase.storage.from('job-documents').createSignedUrl(filePath, 31536000); // 1 year

      await supabase.from('job_checklist_steps').update({
        photo_url: signedData?.signedUrl || urlData.publicUrl,
        is_completed: true,
        completed_at: new Date().toISOString(),
      } as any).eq('id', stepId);

      invalidate();
      toast.success('Foto hochgeladen.');
    } catch {
      toast.error('Fehler beim Hochladen.');
    } finally {
      setUploadingStepId(null);
    }
  };

  const handlePhotoDelete = async (stepId: string, photoUrl: string) => {
    try {
      // Extract path from signed URL
      const pathMatch = photoUrl.match(/job-documents\/(.+?)(\?|$)/);
      if (pathMatch) {
        await supabase.storage.from('job-documents').remove([decodeURIComponent(pathMatch[1])]);
      }
      await supabase.from('job_checklist_steps').update({
        photo_url: null,
        is_completed: false,
        completed_at: null,
      } as any).eq('id', stepId);
      invalidate();
      toast.success('Foto gelöscht.');
    } catch { toast.error('Fehler.'); }
  };

  const groupProgress = (groupId: string) => {
    const children = childrenOf(groupId);
    const nonGroup = children.filter(c => c.step_type !== 'group');
    const done = nonGroup.filter(c => c.is_completed).length;
    return { done, total: nonGroup.length, percent: nonGroup.length > 0 ? Math.round((done / nonGroup.length) * 100) : 0 };
  };

  const renderStep = (step: any) => {
    const isEditing = editingStep === step.id;
    const isUploading = uploadingStepId === step.id;

    return (
      <div key={step.id} className="flex items-start gap-2 p-2 rounded-md border bg-background">
        {step.step_type === 'checkbox' && (
          <Checkbox
            checked={step.is_completed}
            onCheckedChange={() => toggleStep(step)}
            className="mt-0.5"
          />
        )}
        {step.step_type === 'text' && (
          <Type className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        )}
        {step.step_type === 'photo' && (
          <Camera className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={`text-sm ${step.is_completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>
              {step.title}
            </span>
            {step.is_required && <span className="text-destructive font-bold">*</span>}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateTextValue(step.id, editValue);
                      if (e.key === 'Escape') setEditingStep(null);
                    }}
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

          {/* Checkbox edit mode */}
          {step.step_type === 'checkbox' && !isEditing && (
            <div className="flex items-center gap-1 mt-0.5">
              {step.text_value && <span className="text-xs text-muted-foreground">{step.text_value}</span>}
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingStep(step.id); setEditValue(step.text_value || ''); }}>
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          )}
          {step.step_type === 'checkbox' && isEditing && (
            <div className="flex gap-1 mt-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 text-xs"
                placeholder="Anmerkung hinzufügen…"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateTextValue(step.id, editValue);
                  if (e.key === 'Escape') setEditingStep(null);
                }}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateTextValue(step.id, editValue)}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingStep(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Photo */}
          {step.step_type === 'photo' && (
            <div className="mt-1.5">
              {step.photo_url ? (
                <div className="space-y-1.5">
                  <img src={step.photo_url} alt={step.title} className="rounded max-h-32 object-cover border" />
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => {
                        fileInputRef.current?.setAttribute('data-step-id', step.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      <Pencil className="h-3 w-3" /> Ändern
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs gap-1 text-destructive"
                      onClick={() => handlePhotoDelete(step.id, step.photo_url)}
                    >
                      <Trash2 className="h-3 w-3" /> Löschen
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={isUploading}
                  onClick={() => {
                    fileInputRef.current?.setAttribute('data-step-id', step.id);
                    fileInputRef.current?.click();
                  }}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-1">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Wird hochgeladen…
                    </span>
                  ) : (
                    <>
                      <Upload className="h-3 w-3" /> Foto hochladen
                    </>
                  )}
                </Button>
              )}
            </div>
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

        {/* Hidden file input for photo uploads */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            const stepId = fileInputRef.current?.getAttribute('data-step-id');
            if (file && stepId) handlePhotoUpload(stepId, file);
            e.target.value = '';
          }}
        />

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
                        {childrenOf(step.id).map(child => renderStep(child))}
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
