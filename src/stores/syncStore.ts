// stores/syncStore.ts

import { create } from 'zustand';
import { getQueueStats, clearCompleted, retryFailed } from '@/db/syncQueue';

interface QueueStats {
  queued: number;
  inProgress: number;
  failed: number;
  completed: number;
  total: number;
}

interface SyncState {
  // Status
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  lastSyncError: string | null;

  // Queue stats
  queueStats: QueueStats;

  // Actions
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncTime: (time: Date) => void;
  setLastSyncError: (error: string | null) => void;
  refreshStats: () => Promise<void>;
  clearCompletedItems: () => Promise<void>;
  retryFailedItems: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncTime: null,
  lastSyncError: null,
  queueStats: {
    queued: 0,
    inProgress: 0,
    failed: 0,
    completed: 0,
    total: 0
  },

  setOnline: (isOnline) => set({ isOnline }),

  setSyncing: (isSyncing) => set({ isSyncing }),

  setLastSyncTime: (time) => set({ lastSyncTime: time, lastSyncError: null }),

  setLastSyncError: (error) => set({ lastSyncError: error }),

  refreshStats: async () => {
    const stats = await getQueueStats();
    set({ queueStats: stats });
  },

  clearCompletedItems: async () => {
    await clearCompleted();
    const stats = await getQueueStats();
    set({ queueStats: stats });
  },

  retryFailedItems: async () => {
    await retryFailed();
    const stats = await getQueueStats();
    set({ queueStats: stats });
  }
}));

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}

export default useSyncStore;
