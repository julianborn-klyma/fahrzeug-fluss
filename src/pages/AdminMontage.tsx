import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MapPin } from 'lucide-react';
import { JOB_STATUS_LABELS } from '@/types/montage';
import type { JobStatus } from '@/types/montage';
import CreateJobDialog from '@/components/montage/CreateJobDialog';

const statusColor: Record<JobStatus, string> = {
  erstellt: 'bg-muted text-muted-foreground',
  vorbereitet: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  verplant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  durchgefuehrt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  abgerechnet: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const AdminMontage = () => {
  const { jobs, loading } = useJobs();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.job_number.toLowerCase().includes(search.toLowerCase()) ||
      (j.property?.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Montage – Aufträge</h2>
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Neuer Auftrag
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Titel, Nummer, Ort…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Keine Aufträge gefunden.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((job) => (
              <Card
                key={job.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/admin/montage/job/${job.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{job.title || 'Ohne Titel'}</p>
                      <p className="text-xs text-muted-foreground">{job.job_number}</p>
                      {job.property && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {job.property.street_address}, {job.property.postal_code} {job.property.city}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className={statusColor[job.status]}>
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>
                  </div>
                  {job.trades.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {job.trades.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    </AdminLayout>
  );
};

export default AdminMontage;
