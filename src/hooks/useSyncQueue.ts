// hooks/useSyncQueue.ts

import { useState, useEffect, useCallback } from 'react';
import { syncQueueDB } from '@/db/syncQueue';
import type { SyncQueueItem } from '@/types/inspection';

interface SyncQueueState {
  items: SyncQueueItem[];
  pendingCount: number;
  failedCount: number;
  isProcessing: boolean;
}

export function useSyncQueue() {
  const [state, setState] = useState<SyncQueueState>({
    items: [],
    pendingCount: 0,
    failedCount: 0,
    isProcessing: false,
  });

  const loadQueue = useCallback(async () => {
    try {
      const items = await syncQueueDB.queue.toArray();
      const pending = items.filter((item: SyncQueueItem) => item.status === 'queued');
      const failed = items.filter((item: SyncQueueItem) => item.status === 'failed');

      setState((prev) => ({
        ...prev,
        items,
        pendingCount: pending.length,
        failedCount: failed.length,
      }));
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }, []);

  const retryFailed = useCallback(async () => {
    try {
      const failed = await syncQueueDB.queue
        .where('status')
        .equals('failed')
        .toArray();

      for (const item of failed) {
        await syncQueueDB.queue.update(item.id, { status: 'queued' });
      }
      await loadQueue();
    } catch (error) {
      console.error('Failed to retry failed items:', error);
    }
  }, [loadQueue]);

  const clearQueue = useCallback(async () => {
    try {
      await syncQueueDB.queue.clear();
      await loadQueue();
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }, [loadQueue]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  return {
    ...state,
    loadQueue,
    retryFailed,
    clearQueue,
  };
}

export default useSyncQueue;
