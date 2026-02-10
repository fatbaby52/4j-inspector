// hooks/useSync.ts

import { useState, useEffect, useCallback } from 'react';
import { syncNow, getQueueStats, initSyncListeners } from '@/services/syncService';
import { useOffline } from './useOffline';

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  queueStats: {
    queued: number;
    inProgress: number;
    failed: number;
    completed: number;
  };
  pendingCount: number;
  hasPendingChanges: boolean;
  hasFailedItems: boolean;
}

export function useSync() {
  const { isOnline } = useOffline();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [queueStats, setQueueStats] = useState({
    queued: 0,
    inProgress: 0,
    failed: 0,
    completed: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize sync listeners on mount
  useEffect(() => {
    initSyncListeners();
    refreshStats();
  }, []);

  // Refresh stats when coming online
  useEffect(() => {
    if (isOnline) {
      refreshStats();
    }
  }, [isOnline]);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await getQueueStats();
      console.log('Queue stats:', stats);
      setQueueStats(stats);
    } catch (err) {
      console.error('Failed to get queue stats:', err);
    }
  }, []);

  const sync = useCallback(async () => {
    console.log('Sync called, isOnline:', isOnline);

    if (!isOnline) {
      setError('No internet connection');
      return { success: false, errors: ['No internet connection'] };
    }

    setIsSyncing(true);
    setError(null);

    try {
      console.log('Calling syncNow...');
      const result = await syncNow();
      console.log('Sync result:', result);

      if (!result.success && result.errors.length > 0) {
        setError(result.errors.join(', '));
      }

      setLastSyncTime(new Date());
      await refreshStats();

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMsg);
      return { success: false, errors: [errorMsg] };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, refreshStats]);

  const pendingCount = queueStats.queued + queueStats.failed;
  const hasPendingChanges = pendingCount > 0;
  const hasFailedItems = queueStats.failed > 0;

  return {
    // State
    isSyncing,
    lastSyncTime,
    queueStats,
    pendingCount,
    hasPendingChanges,
    hasFailedItems,
    error,
    isOnline,

    // Actions
    sync,
    refreshStats,
  };
}

export default useSync;
