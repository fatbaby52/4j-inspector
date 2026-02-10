// components/sync/SyncQueue.tsx

import { useSync } from '@/hooks/useSync';
import { retryFailed, resetAllItems } from '@/db/syncQueue';

interface SyncQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncQueue({ isOpen, onClose }: SyncQueueProps) {
  const { isSyncing, lastSyncTime, queueStats, pendingCount, error, sync } = useSync();

  if (!isOpen) return null;

  const failedCount = queueStats.failed;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Sync Queue</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{queueStats.queued}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
              <div className="text-xs text-gray-500">Synced</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="text-center text-sm text-gray-500">
              Last synced: {lastSyncTime.toLocaleString()}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sync Progress */}
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Syncing...</span>
                <span className="text-gray-500">
                  {queueStats.inProgress} in progress
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => sync()}
              disabled={isSyncing || pendingCount === 0}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
                  Syncing...
                </>
              ) : (
                'Sync Now'
              )}
            </button>
          </div>

          {/* Retry/Reset buttons for failed items */}
          {failedCount > 0 && (
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await retryFailed();
                  sync();
                }}
                disabled={isSyncing}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors text-sm"
              >
                Retry {failedCount} Failed
              </button>
              <button
                onClick={async () => {
                  if (confirm('Reset ALL items in the queue? This will re-sync everything.')) {
                    await resetAllItems();
                    sync();
                  }
                }}
                disabled={isSyncing}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors text-sm"
              >
                Reset All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SyncQueue;
