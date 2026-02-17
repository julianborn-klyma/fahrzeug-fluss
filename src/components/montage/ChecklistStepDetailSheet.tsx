import { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, ChevronLeft, ChevronRight, Check, X, Upload, Pencil, Type, CheckSquare as CheckIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PhotoAnnotationDialog from './PhotoAnnotationDialog';

// Using 'any' for step data since the DB types include fields not in the TS interface
type StepData = any;

interface Props {
  step: StepData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allSteps: StepData[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onRefresh: () => void;
  checklistName: string;
  readonly?: boolean;
}

const ChecklistStepDetailSheet: React.FC<Props> = ({
  step,
  open,
  onOpenChange,
  allSteps,
  currentIndex,
  onNavigate,
  onRefresh,
  checklistName,
  readonly = false,
}) => {
  const [editingText, setEditingText] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [annotation, setAnnotation] = useState<{ url: string; index: number } | null>(null);
  const [sliderIndex, setSliderIndex] = useState<number | null>(null);

  const photos = step ? (step.photo_urls?.filter(Boolean) || (step.photo_url ? [step.photo_url] : [])) : [];
  const totalSteps = allSteps.length;
  const progress = totalSteps > 0 ? Math.round(((currentIndex + 1) / totalSteps) * 100) : 0;

  const typeLabel = step?.step_type === 'checkbox' ? 'Aufgabe' : step?.step_type === 'photo' ? 'Foto' : 'Textfeld';

  const toggleStep = useCallback(async () => {
    if (!step || readonly) return;
    const newVal = !step.is_completed;
    try {
      await supabase.from('job_checklist_steps').update({
        is_completed: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
      } as any).eq('id', step.id);
      onRefresh();
    } catch { toast.error('Fehler.'); }
  }, [step, onRefresh, readonly]);

  const saveText = useCallback(async () => {
    if (!step) return;
    try {
      await supabase.from('job_checklist_steps').update({ text_value: textValue } as any).eq('id', step.id);
      onRefresh();
      setEditingText(false);
      toast.success('Gespeichert.');
    } catch { toast.error('Fehler.'); }
  }, [step, textValue, onRefresh]);

  const handlePhotoUpload = useCallback(async (files: FileList) => {
    if (!step) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const filePath = `checklists/${step.checklist_id}/${step.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('job-documents').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: signedData } = await supabase.storage.from('job-documents').createSignedUrl(filePath, 31536000);
        if (signedData?.signedUrl) newUrls.push(signedData.signedUrl);
      }
      const allUrls = [...photos, ...newUrls];
      await supabase.from('job_checklist_steps').update({
        photo_urls: allUrls,
        photo_url: allUrls[0] || '',
        is_completed: allUrls.length > 0,
        completed_at: allUrls.length > 0 ? new Date().toISOString() : null,
      } as any).eq('id', step.id);
      onRefresh();
      toast.success(`${newUrls.length} Foto(s) hochgeladen.`);
    } catch { toast.error('Fehler beim Hochladen.'); }
    finally { setUploading(false); }
  }, [step, photos, onRefresh]);

  const deletePhoto = useCallback(async (photoUrl: string) => {
    if (!step) return;
    try {
      const pathMatch = photoUrl.match(/job-documents\/(.+?)(\?|$)/);
      if (pathMatch) await supabase.storage.from('job-documents').remove([decodeURIComponent(pathMatch[1])]);
      const remaining = photos.filter(u => u !== photoUrl);
      await supabase.from('job_checklist_steps').update({
        photo_urls: remaining,
        photo_url: remaining[0] || '',
        is_completed: remaining.length > 0,
        completed_at: remaining.length > 0 ? new Date().toISOString() : null,
      } as any).eq('id', step.id);
      onRefresh();
      toast.success('Foto gelöscht.');
    } catch { toast.error('Fehler.'); }
  }, [step, photos, onRefresh]);

  const handleAnnotationSave = useCallback(async (newUrl: string) => {
    if (!step || annotation === null) return;
    const updated = [...photos];
    updated[annotation.index] = newUrl;
    try {
      await supabase.from('job_checklist_steps').update({
        photo_urls: updated,
        photo_url: updated[0] || '',
      } as any).eq('id', step.id);
      onRefresh();
    } catch { toast.error('Fehler.'); }
  }, [step, annotation, photos, onRefresh]);

  if (!step) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base">{step.title}</SheetTitle>
                <p className="text-xs text-muted-foreground">{typeLabel} · {checklistName}</p>
              </div>
              {step.step_type === 'checkbox' && (
                <Checkbox
                  checked={step.is_completed}
                  onCheckedChange={toggleStep}
                  className="h-6 w-6"
                  disabled={readonly}
                />
              )}
            </div>
          </SheetHeader>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) handlePhotoUpload(e.target.files);
              e.target.value = '';
            }}
          />

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Photos grid */}
            {(step.step_type === 'photo' || photos.length > 0) && (
              <div className="space-y-2">
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="rounded-md aspect-square object-cover border cursor-pointer w-full hover:opacity-90 transition-opacity"
                          onClick={() => setSliderIndex(i)}
                        />
                        {!readonly && (
                          <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="secondary" size="icon" className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); setAnnotation({ url, index: i }); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); deletePhoto(url); }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!readonly && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Wird hochgeladen…
                      </span>
                    ) : (
                      <><Camera className="h-4 w-4" /> {photos.length > 0 ? 'Weitere Fotos' : 'Foto aufnehmen'}</>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Text / annotation field */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Anmerkung</p>
              {!readonly && editingText ? (
                <div className="flex gap-1">
                  <Input
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    className="flex-1"
                    autoFocus
                    placeholder="Anmerkung eingeben…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveText();
                      if (e.key === 'Escape') setEditingText(false);
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={saveText}><Check className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditingText(false)}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div
                  className={`flex items-center gap-2 p-2 rounded-md border bg-muted/30 min-h-[40px] ${readonly ? '' : 'cursor-pointer'}`}
                  onClick={() => { if (!readonly) { setEditingText(true); setTextValue(step.text_value || ''); } }}
                >
                  <span className="text-sm flex-1">{step.text_value || '—'}</span>
                  {!readonly && <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </div>
              )}
            </div>

            {step.is_completed && step.completed_at && (
              <p className="text-xs text-muted-foreground">
                Erledigt am {new Date(step.completed_at).toLocaleDateString('de-DE')}
              </p>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="border-t px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10">{currentIndex + 1}/{totalSteps}</span>
              <Progress value={progress} className="h-2 flex-1" />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1"
                disabled={currentIndex <= 0}
                onClick={() => onNavigate(currentIndex - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Zurück
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1"
                disabled={currentIndex >= totalSteps - 1}
                onClick={() => onNavigate(currentIndex + 1)}
              >
                Weiter <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Photo slider (fullscreen) */}
      {sliderIndex !== null && photos.length > 0 && (
        <Sheet open onOpenChange={() => setSliderIndex(null)}>
          <SheetContent side="bottom" className="h-[85vh] p-0 bg-black/95 border-none">
            <div className="relative flex items-center justify-center h-full">
              <img src={photos[sliderIndex]} alt="" className="max-h-[75vh] max-w-full object-contain" />
              {photos.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={() => setSliderIndex(i => (i! > 0 ? i! - 1 : photos.length - 1))}>
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={() => setSliderIndex(i => (i! < photos.length - 1 ? i! + 1 : 0))}>
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/80 text-xs bg-black/50 px-2 py-0.5 rounded">
                {sliderIndex + 1} / {photos.length}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Photo annotation */}
      {annotation && step && (
        <PhotoAnnotationDialog
          imageUrl={annotation.url}
          open={!!annotation}
          onOpenChange={(o) => { if (!o) setAnnotation(null); }}
          onSave={handleAnnotationSave}
          bucketPath={`checklists/${step.checklist_id}/${step.id}`}
        />
      )}
    </>
  );
};

export default ChecklistStepDetailSheet;
