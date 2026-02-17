import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckSquare, Type, Camera, FolderOpen, ChevronRight, Pencil, Check, X, Upload, Trash2, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  checklistId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── Fullscreen image slider ────────────────────────────── */
const PhotoSlider = ({
  urls,
  initialIndex,
  onClose,
}: {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [idx, setIdx] = useState(initialIndex);
  const prev = () => setIdx((i) => (i > 0 ? i - 1 : urls.length - 1));
  const next = () => setIdx((i) => (i < urls.length - 1 ? i + 1 : 0));

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-none">
        <div className="relative flex items-center justify-center min-h-[60vh]">
          <img
            src={urls[idx]}
            alt={`Foto ${idx + 1}`}
            className="max-h-[80vh] max-w-full object-contain"
          />

          {urls.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10"
                onClick={prev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10"
                onClick={next}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/80 text-xs bg-black/50 px-2 py-0.5 rounded">
            {idx + 1} / {urls.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Main dialog ────────────────────────────────────────── */
const ChecklistDetailDialog: React.FC<Props> = ({ checklistId, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadStepId, setActiveUploadStepId] = useState<string | null>(null);
  const [slider, setSlider] = useState<{ urls: string[]; index: number } | null>(null);

  const { data: checklist, refetch } = useQuery({
    queryKey: ['checklist-detail', checklistId],
    enabled: !!checklistId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_checklists')
        .select('*, job_checklist_steps(*)')
        .eq('id', checklistId!)
        .single();
      if (error) throw error;
      return {
        ...data,
        steps: ((data as any).job_checklist_steps || []).sort((a: any, b: any) => a.order_index - b.order_index),
      };
    },
  });

  const steps: any[] = checklist?.steps || [];
  const topLevel = steps.filter(s => !s.parent_step_id);
  const childrenOf = (parentId: string) => steps.filter(s => s.parent_step_id === parentId);

  const totalDone = steps.filter(s => s.is_completed && s.step_type !== 'group').length;
  const totalAll = steps.filter(s => s.step_type !== 'group').length;
  const percent = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const invalidate = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['job-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['job-checklists'] });
  };

  /* Helper: get photo_urls for a step (use new array, fall back to legacy field) */
  const getPhotos = (step: any): string[] => {
    const arr: string[] = (step.photo_urls as string[]) || [];
    if (arr.length > 0) return arr.filter(Boolean);
    // Legacy fallback
    if (step.photo_url && step.photo_url.length > 0) return [step.photo_url];
    return [];
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

  /* Upload one or more photos, appending to existing array */
  const handlePhotoUpload = async (stepId: string, files: FileList) => {
    setUploadingStepId(stepId);
    try {
      const step = steps.find(s => s.id === stepId);
      const existing = getPhotos(step);
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        const filePath = `checklists/${checklist?.id}/${stepId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('job-documents').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: signedData } = await supabase.storage.from('job-documents').createSignedUrl(filePath, 31536000);
        if (signedData?.signedUrl) newUrls.push(signedData.signedUrl);
      }

      const allUrls = [...existing, ...newUrls];

      await supabase.from('job_checklist_steps').update({
        photo_urls: allUrls,
        photo_url: allUrls[0] || '',
        is_completed: allUrls.length > 0,
        completed_at: allUrls.length > 0 ? new Date().toISOString() : null,
      } as any).eq('id', stepId);

      invalidate();
      toast.success(`${newUrls.length} Foto(s) hochgeladen.`);
    } catch {
      toast.error('Fehler beim Hochladen.');
    } finally {
      setUploadingStepId(null);
    }
  };

  /* Delete a single photo from the array */
  const handleDeleteSinglePhoto = async (stepId: string, photoUrl: string) => {
    try {
      const pathMatch = photoUrl.match(/job-documents\/(.+?)(\?|$)/);
      if (pathMatch) {
        await supabase.storage.from('job-documents').remove([decodeURIComponent(pathMatch[1])]);
      }

      const step = steps.find(s => s.id === stepId);
      const remaining = getPhotos(step).filter(u => u !== photoUrl);

      await supabase.from('job_checklist_steps').update({
        photo_urls: remaining,
        photo_url: remaining[0] || '',
        is_completed: remaining.length > 0,
        completed_at: remaining.length > 0 ? new Date().toISOString() : null,
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
    const photos = getPhotos(step);

    return (
      <div key={step.id} className="flex items-start gap-2 p-2 rounded-md border bg-background">
        {step.step_type === 'checkbox' && (
          <Checkbox checked={step.is_completed} onCheckedChange={() => toggleStep(step)} className="mt-0.5" />
        )}
        {step.step_type === 'text' && <Type className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
        {step.step_type === 'photo' && <Camera className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}

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
                  <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 text-xs" autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') updateTextValue(step.id, editValue); if (e.key === 'Escape') setEditingStep(null); }} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateTextValue(step.id, editValue)}><Check className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingStep(null)}><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{step.text_value || '—'}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingStep(step.id); setEditValue(step.text_value || ''); }}><Pencil className="h-3 w-3" /></Button>
                </div>
              )}
            </div>
          )}

          {/* Checkbox annotation */}
          {step.step_type === 'checkbox' && !isEditing && (
            <div className="flex items-center gap-1 mt-0.5">
              {step.text_value && <span className="text-xs text-muted-foreground">{step.text_value}</span>}
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingStep(step.id); setEditValue(step.text_value || ''); }}><Pencil className="h-3 w-3 text-muted-foreground" /></Button>
            </div>
          )}
          {step.step_type === 'checkbox' && isEditing && (
            <div className="flex gap-1 mt-1">
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 text-xs" placeholder="Anmerkung hinzufügen…" autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') updateTextValue(step.id, editValue); if (e.key === 'Escape') setEditingStep(null); }} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateTextValue(step.id, editValue)}><Check className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingStep(null)}><X className="h-3 w-3" /></Button>
            </div>
          )}

          {/* Photos – multi grid */}
          {step.step_type === 'photo' && (
            <div className="mt-1.5 space-y-2">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`${step.title} ${i + 1}`}
                        className="rounded aspect-square object-cover border cursor-pointer w-full hover:opacity-90 transition-opacity"
                        onClick={() => setSlider({ urls: photos, index: i })}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDeleteSinglePhoto(step.id, url); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={isUploading}
                onClick={() => {
                  setActiveUploadStepId(step.id);
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
                    <Upload className="h-3 w-3" /> {photos.length > 0 ? 'Weitere Fotos' : 'Foto hochladen'}
                  </>
                )}
              </Button>
            </div>
          )}

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              {checklist?.name || 'Checkliste'}
            </DialogTitle>
          </DialogHeader>

          {/* Hidden multi-file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0 && activeUploadStepId) {
                handlePhotoUpload(activeUploadStepId, files);
              }
              e.target.value = '';
              setActiveUploadStepId(null);
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

      {/* Fullscreen photo slider */}
      {slider && (
        <PhotoSlider
          urls={slider.urls}
          initialIndex={slider.index}
          onClose={() => setSlider(null)}
        />
      )}
    </>
  );
};

export default ChecklistDetailDialog;
