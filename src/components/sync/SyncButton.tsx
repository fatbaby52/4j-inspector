// components/sync/SyncButton.tsx

import React from 'react';
import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/common/Button';

interface SyncButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SyncButton({
  variant = 'outline',
  size = 'md',
  showLabel = true,
  className,
}: SyncButtonProps) {
  const { sync, isSyncing, isOnline, pendingCount } = useSync();

  const handleSync = async () => {
    if (!isOnline) {
      alert('No internet connection. Please try again when online.');
      return;
    }

    const result = await sync();
    if (!result.success && result.errors.length > 0) {
      alert(`Sync completed with errors:\n${result.errors.join('\n')}`);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing || !isOnline}
      variant={variant}
      size={size}
      className={className}
    >
      {isSyncing ? (
        <>
          <span className="animate-spin mr-2">🔄</span>
          {showLabel && 'Syncing...'}
        </>
      ) : (
        <>
          <span className="mr-2">☁️</span>
          {showLabel && (
            <>
              Sync Now
              {pendingCount > 0 && (
                <span className="ml-1 bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </>
          )}
        </>
      )}
    </Button>
  );
}

export default SyncButton;
