// components/sync/SyncManager.tsx

import { useEffect, useState } from 'react';
import { useSync } from '@/hooks/useSync';
import { useOffline } from '@/hooks/useOffline';
import { SyncQueue } from './SyncQueue';
import { ConflictWarning } from './ConflictWarning';

interface SyncManagerProps {
  showQueue?: boolean;
  autoSync?: boolean;
  syncInterval?: number; // ms
}

export function SyncManager({
  showQueue = false,
  autoSync = true,
  syncInterval = 30000, // 30 seconds
}: SyncManagerProps) {
  const { isOnline } = useOffline();
  const { isSyncing, pendingCount, error, sync } = useSync();
  const [showConflict, setShowConflict] = useState(false);

  // Auto-sync when online
  useEffect(() => {
    if (!autoSync || !isOnline || isSyncing) return;

    const interval = setInterval(() => {
      if (pendingCount > 0) {
        sync();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, isOnline, isSyncing, pendingCount, sync, syncInterval]);

  // Check for conflicts
  useEffect(() => {
    if (error?.includes('conflict')) {
      setShowConflict(true);
    }
  }, [error]);

  // Minimal UI - just status indicator
  return (
    <>
      {/* Status indicator */}
      <div className="fixed bottom-20 right-4 z-40">
        {isSyncing && (
          <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200">
            <div className="animate-spin">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-600">Syncing...</span>
          </div>
        )}

        {!isSyncing && error && (
          <button
            onClick={() => sync()}
            className="bg-red-50 border border-red-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-600">Sync failed - Tap to retry</span>
          </button>
        )}

        {!isOnline && pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span className="text-sm text-yellow-700">{pendingCount} changes pending</span>
          </div>
        )}
      </div>

      {/* Sync Queue Modal */}
      {showQueue && (
        <SyncQueue
          isOpen={showQueue}
          onClose={() => {}}
        />
      )}

      {/* Conflict Warning */}
      <ConflictWarning
        isOpen={showConflict}
        onKeepLocal={() => setShowConflict(false)}
        onKeepRemote={() => setShowConflict(false)}
        onMerge={() => setShowConflict(false)}
      />
    </>
  );
}

export default SyncManager;
