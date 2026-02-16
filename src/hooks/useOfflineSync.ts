import { useState, useEffect, useCallback, useRef } from 'react';

interface PendingChange {
  id: string;
  vehicleId: string;
  materialId: string;
  quantity: number;
  timestamp: number;
}

const PENDING_KEY = 'klyma_pending_changes';
const LAST_SYNC_KEY = 'klyma_last_sync';

function loadPending(): PendingChange[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePending(changes: PendingChange[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(changes));
}

type SyncApplyFn = (changes: PendingChange[]) => Promise<void>;

export function useOfflineSync(applyFn?: SyncApplyFn) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>(loadPending);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    localStorage.getItem(LAST_SYNC_KEY)
  );
  const [syncing, setSyncing] = useState(false);
  const applyFnRef = useRef(applyFn);
  applyFnRef.current = applyFn;
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Core sync logic
  const doSync = useCallback(async () => {
    const fn = applyFnRef.current;
    if (!fn) return;
    const current = loadPending();
    if (current.length === 0) return;

    setSyncing(true);
    try {
      await fn(current);
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSyncedAt(now);
      savePending([]);
      setPendingChanges([]);
    } catch (err) {
      console.error('[Sync] Failed to sync:', err);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Debounced auto-sync: triggers 1s after last change (if online)
  const scheduleSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (navigator.onLine) doSync();
    }, 1000);
  }, [doSync]);

  // Queue a change
  const queueChange = useCallback((vehicleId: string, materialId: string, quantity: number) => {
    setPendingChanges(prev => {
      const filtered = prev.filter(
        c => !(c.vehicleId === vehicleId && c.materialId === materialId)
      );
      const updated = [
        ...filtered,
        { id: `${vehicleId}_${materialId}`, vehicleId, materialId, quantity, timestamp: Date.now() },
      ];
      savePending(updated);
      return updated;
    });
    // Auto-sync after short debounce if online
    scheduleSync();
  }, [scheduleSync]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      doSync();
    }
  }, [isOnline]); // intentionally only on isOnline change

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const markSynced = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, now);
    setLastSyncedAt(now);
  }, []);

  return {
    isOnline,
    pendingChanges,
    pendingCount: pendingChanges.length,
    lastSyncedAt,
    syncing,
    queueChange,
    doSync,
    markSynced,
  };
}
