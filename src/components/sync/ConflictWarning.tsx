// components/sync/ConflictWarning.tsx

import React from 'react';

interface ConflictWarningProps {
  isOpen: boolean;
  onKeepLocal: () => void;
  onKeepRemote: () => void;
  onMerge?: () => void;
  localTimestamp?: string;
  remoteTimestamp?: string;
  fieldName?: string;
}

export function ConflictWarning({
  isOpen,
  onKeepLocal,
  onKeepRemote,
  onMerge,
  localTimestamp,
  remoteTimestamp,
  fieldName = 'This field',
}: ConflictWarningProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sync Conflict</h2>
              <p className="text-sm text-white/80">Changes detected from another device</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-gray-600">
            {fieldName} was modified on another device. How would you like to resolve this?
          </p>

          {/* Version comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">This device</span>
              </div>
              {localTimestamp && (
                <p className="text-xs text-gray-500">
                  {new Date(localTimestamp).toLocaleString()}
                </p>
              )}
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Cloud</span>
              </div>
              {remoteTimestamp && (
                <p className="text-xs text-gray-500">
                  {new Date(remoteTimestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onKeepLocal}
              className="px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Keep mine
            </button>
            <button
              onClick={onKeepRemote}
              className="px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Keep cloud
            </button>
          </div>
          {onMerge && (
            <button
              onClick={onMerge}
              className="w-full px-4 py-2 text-sm text-primary hover:underline"
            >
              Try to merge both versions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConflictWarning;
