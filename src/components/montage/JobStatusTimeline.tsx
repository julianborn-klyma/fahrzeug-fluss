import { useState } from 'react';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER } from '@/types/montage';
import type { JobStatus, Job } from '@/types/montage';
import { cn } from '@/lib/utils';

interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

interface JobStatusTimelineProps {
  job: Job;
  appointments: any[];
  documents: any[];
  onStatusChange: (newStatus: JobStatus) => Promise<void>;
}

function validateTransition(
  targetStatus: JobStatus,
  appointments: any[],
  documents: any[],
): ValidationResult {
  const warnings: string[] = [];

  if (targetStatus === 'vorbereitet') {
    // All required documents must be uploaded
    const requiredDocs: { docTypeId: string; docTypeName: string; uploaded: boolean }[] = [];
    for (const appt of appointments) {
      const reqDocs = appt.appointment_type?.required_documents || [];
      for (const rd of reqDocs) {
        const dt = (rd as any).document_types || rd.document_type;
        const docTypeId = rd.document_type_id;
        const uploaded = documents.some((d: any) => d.document_type_id === docTypeId);
        if (!uploaded) {
          requiredDocs.push({ docTypeId, docTypeName: dt?.name || 'Unbekannt', uploaded: false });
        }
      }
    }
    if (requiredDocs.length > 0) {
      warnings.push(`Fehlende Pflichtdokumente: ${requiredDocs.map(d => d.docTypeName).join(', ')}`);
    }

    // All required fields in appointments must be filled
    for (const appt of appointments) {
      const fields = appt.appointment_type?.fields || [];
      const values = appt.field_values || {};
      const missingFields = fields.filter((f: any) => f.is_required && !values[f.id]?.toString().trim());
      if (missingFields.length > 0) {
        warnings.push(`Termin "${appt.appointment_type?.name || 'Unbekannt'}": Pflichtfelder nicht ausgefüllt (${missingFields.map((f: any) => f.label).join(', ')})`);
      }
    }

    // Each appointment must have at least one checklist
    for (const appt of appointments) {
      const checklists = appt.checklists || [];
      if (checklists.length === 0) {
        warnings.push(`Termin "${appt.appointment_type?.name || 'Unbekannt'}" hat keine Checkliste.`);
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}

const JobStatusTimeline = ({ job, appointments, documents, onStatusChange }: JobStatusTimelineProps) => {
  const [loading, setLoading] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const currentIdx = JOB_STATUS_ORDER.indexOf(job.status);

  const handleStatusChange = async (targetStatus: JobStatus) => {
    const validation = validateTransition(targetStatus, appointments, documents);
    if (!validation.valid) {
      setValidationWarnings(validation.warnings);
      return;
    }
    setValidationWarnings([]);
    setLoading(true);
    try {
      await onStatusChange(targetStatus);
    } finally {
      setLoading(false);
    }
  };

  const nextStatus = currentIdx < JOB_STATUS_ORDER.length - 1 ? JOB_STATUS_ORDER[currentIdx + 1] : null;
  const prevStatus = currentIdx > 0 ? JOB_STATUS_ORDER[currentIdx - 1] : null;

  return (
    <div className="space-y-3">
      {/* Timeline */}
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {JOB_STATUS_ORDER.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div className={cn("h-0.5 w-6 md:w-10", isDone || isCurrent ? "bg-primary" : "bg-border")} />
              )}
              <div
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[60px] md:min-w-[80px]",
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCurrent ? "border-primary bg-primary text-primary-foreground" :
                  isDone ? "border-primary bg-primary/20 text-primary" :
                  "border-border bg-background text-muted-foreground"
                )}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </div>
                <span className={cn(
                  "text-[10px] md:text-xs text-center leading-tight",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                )}>
                  {JOB_STATUS_LABELS[s]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {prevStatus && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange(prevStatus)}
          >
            ← {JOB_STATUS_LABELS[prevStatus]}
          </Button>
        )}
        {nextStatus && (
          <Button
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange(nextStatus)}
          >
            {JOB_STATUS_LABELS[nextStatus]} →
          </Button>
        )}
      </div>

      {/* Validation warnings */}
      {validationWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Status kann nicht geändert werden:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-sm">
              {validationWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default JobStatusTimeline;
