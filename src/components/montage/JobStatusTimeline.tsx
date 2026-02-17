import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER } from '@/types/montage';
import type { JobStatus, Job } from '@/types/montage';
import { cn } from '@/lib/utils';

interface JobStatusTimelineProps {
  job: Job;
  onStatusChange: (newStatus: JobStatus) => Promise<void>;
}

const JobStatusTimeline = ({ job, onStatusChange }: JobStatusTimelineProps) => {
  const [loading, setLoading] = useState(false);
  const currentIdx = JOB_STATUS_ORDER.indexOf(job.status as JobStatus);

  const handleStatusChange = async (targetStatus: JobStatus) => {
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
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {JOB_STATUS_ORDER.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div className={cn("h-0.5 w-6 md:w-10", isDone || isCurrent ? "bg-primary" : "bg-border")} />
              )}
              <div className="flex flex-col items-center gap-1 min-w-[60px] md:min-w-[80px]">
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

      <div className="flex gap-2">
        {prevStatus && (
          <Button variant="outline" size="sm" disabled={loading} onClick={() => handleStatusChange(prevStatus)}>
            ← {JOB_STATUS_LABELS[prevStatus]}
          </Button>
        )}
        {nextStatus && (
          <Button size="sm" disabled={loading} onClick={() => handleStatusChange(nextStatus)}>
            {JOB_STATUS_LABELS[nextStatus]} →
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobStatusTimeline;
