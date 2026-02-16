import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SyncStatusBarProps {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  syncing: boolean;
  onSync?: () => void;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'gerade eben';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
}

const SyncStatusBar = ({ isOnline, pendingCount, lastSyncedAt, syncing, onSync }: SyncStatusBarProps) => {
  return (
    <div className={`flex items-center justify-between px-4 py-2 text-xs border-b ${
      isOnline ? 'bg-card' : 'bg-destructive/10'
    }`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-destructive" />
        )}
        <span className="text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {pendingCount} ausstehend
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {lastSyncedAt && (
          <span className="text-muted-foreground">
            Sync: {formatRelativeTime(lastSyncedAt)}
          </span>
        )}
        {!lastSyncedAt && (
          <span className="text-muted-foreground flex items-center gap-1">
            <CloudOff className="h-3 w-3" /> Noch nie synchronisiert
          </span>
        )}
        {isOnline && pendingCount > 0 && onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sync…' : 'Jetzt'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SyncStatusBar;
