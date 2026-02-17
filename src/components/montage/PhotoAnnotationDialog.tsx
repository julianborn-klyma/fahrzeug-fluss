import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Undo2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  imageUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newUrl: string) => void;
  bucketPath: string; // e.g. "checklists/{checklistId}/{stepId}"
}

const COLORS = [
  { name: 'Rot', value: '#ef4444' },
  { name: 'Blau', value: '#3b82f6' },
  { name: 'Schwarz', value: '#000000' },
  { name: 'Weiss', value: '#ffffff' },
];

const STROKE_WIDTHS = [2, 4, 6, 8];

const PhotoAnnotationDialog: React.FC<Props> = ({ imageUrl, open, onOpenChange, onSave, bucketPath }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image onto canvas
  useEffect(() => {
    if (!open) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Scale to fit screen while keeping aspect ratio
      const maxW = Math.min(window.innerWidth - 32, 800);
      const maxH = Math.min(window.innerHeight - 200, 600);
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    };
    img.src = imageUrl;
  }, [imageUrl, open]);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }, []);

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [color, strokeWidth, getPos]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, [isDrawing]);

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Canvas export failed');

      const filePath = `${bucketPath}/annotated_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('job-documents').upload(filePath, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage.from('job-documents').createSignedUrl(filePath, 31536000);
      if (!signedData?.signedUrl) throw new Error('No signed URL');

      onSave(signedData.signedUrl);
      onOpenChange(false);
      toast.success('Annotiertes Bild gespeichert.');
    } catch {
      toast.error('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-3 overflow-hidden flex flex-col gap-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {COLORS.map(c => (
              <button
                key={c.value}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c.value ? 'scale-110 border-primary ring-2 ring-primary/30' : 'border-muted-foreground/30'}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setColor(c.value)}
                title={c.name}
              />
            ))}
          </div>

          <div className="flex gap-1 ml-2">
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                className={`h-7 w-7 rounded border flex items-center justify-center text-xs ${strokeWidth === w ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                onClick={() => setStrokeWidth(w)}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="flex gap-1 ml-auto">
            <Button variant="outline" size="sm" onClick={undo} disabled={history.length <= 1}>
              <Undo2 className="h-4 w-4 mr-1" /> Rückgängig
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Speichert…' : 'Speichern'}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center overflow-auto touch-none">
          <canvas
            ref={canvasRef}
            className="border rounded-md cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoAnnotationDialog;
