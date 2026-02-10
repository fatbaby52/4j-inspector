// components/common/OfflineIndicator.tsx

import React from 'react';
import { useSyncStore } from '@/stores/syncStore';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export function OfflineIndicator({ className, showWhenOnline = false }: OfflineIndicatorProps) {
  const { isOnline } = useSyncStore();

  if (isOnline && !showWhenOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        isOnline
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700',
        className
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
        )}
      />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}

// Banner version for more prominent display
export function OfflineBanner() {
  const { isOnline } = useSyncStore();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
      <span className="mr-2">📴</span>
      You&apos;re offline. Changes will sync when connection is restored.
    </div>
  );
}

export default OfflineIndicator;
