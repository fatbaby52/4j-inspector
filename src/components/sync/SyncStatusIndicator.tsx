// components/sync/SyncStatusIndicator.tsx

import React, { useEffect } from 'react';
import { useSyncStore } from '@/stores/syncStore';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function SyncStatusIndicator({
  className,
  showLabel = true
}: SyncStatusIndicatorProps) {
  const { queueStats, isSyncing, refreshStats } = useSyncStore();

  // Refresh stats on mount and periodically
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  const pendingCount = queueStats.queued + queueStats.failed;

  return (
    <div className={cn('flex items-center gap-1.5 text-sm', className)}>
      {isSyncing ? (
        <>
          <span className="animate-spin text-blue-600">🔄</span>
          {showLabel && <span className="text-blue-600">Syncing...</span>}
        </>
      ) : pendingCount > 0 ? (
        <>
          <span className="text-yellow-600">🟡</span>
          {showLabel && (
            <span className="text-yellow-600">{pendingCount} pending</span>
          )}
        </>
      ) : (
        <>
          <span className="text-green-600">🟢</span>
          {showLabel && <span className="text-green-600">Synced</span>}
        </>
      )}

      {queueStats.failed > 0 && (
        <span className="text-red-600 text-xs ml-1">
          ({queueStats.failed} failed)
        </span>
      )}
    </div>
  );
}

export default SyncStatusIndicator;
