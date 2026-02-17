import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Image as ImageIcon, File, ChevronLeft, ChevronRight } from 'lucide-react';

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileUrl: string | null;
  loading?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
const PDF_EXTENSIONS = ['pdf'];

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

const DocumentPreviewDialog = ({ open, onOpenChange, fileName, fileUrl, loading, onPrev, onNext, hasPrev, hasNext }: DocumentPreviewDialogProps) => {
  const ext = getExtension(fileName);
  const isImage = IMAGE_EXTENSIONS.includes(ext);
  const isPdf = PDF_EXTENSIONS.includes(ext);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
      e.preventDefault();
      onPrev();
    } else if (e.key === 'ArrowRight' && hasNext && onNext) {
      e.preventDefault();
      onNext();
    }
  }, [hasPrev, hasNext, onPrev, onNext]);

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm truncate">
            {isImage ? <ImageIcon className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
            <span className="truncate">{fileName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto relative">
          {loading || !fileUrl ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center p-2">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-[65vh] object-contain rounded-md"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-[65vh] rounded-md border"
              title={fileName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
              <File className="h-16 w-16" />
              <p className="text-sm">Vorschau für diesen Dateityp nicht verfügbar.</p>
            </div>
          )}

          {/* Arrow navigation overlay */}
          {hasPrev && onPrev && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 shadow-md"
              onClick={onPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {hasNext && onNext && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 shadow-md"
              onClick={onNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={fileUrl || '#'} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Im neuen Tab öffnen
            </a>
          </Button>
          <Button size="sm" className="gap-2" asChild>
            <a href={fileUrl || '#'} download={fileName}>
              <Download className="h-3.5 w-3.5" /> Herunterladen
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
