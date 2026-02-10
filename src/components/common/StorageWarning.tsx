// components/common/StorageWarning.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface StorageWarningProps {
  photoCount: number;
  maxPhotos?: number;
  className?: string;
}

export function StorageWarning({
  photoCount,
  maxPhotos = 100,
  className
}: StorageWarningProps) {
  if (photoCount < 75) return null;

  const isAtLimit = photoCount >= maxPhotos;
  const isNearLimit = photoCount >= 75 && photoCount < maxPhotos;

  return (
    <div
      className={cn(
        'p-3 rounded-lg flex items-center gap-2',
        isAtLimit
          ? 'bg-red-100 text-red-800 border border-red-200'
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        className
      )}
    >
      <span className="text-xl">{isAtLimit ? '🚫' : '⚠️'}</span>
      <span className="text-sm">
        {isAtLimit
          ? `Photo limit reached (${photoCount}/${maxPhotos}). Delete some photos to add more.`
          : `Approaching photo limit (${photoCount}/${maxPhotos}).`}
      </span>
    </div>
  );
}

export default StorageWarning;
