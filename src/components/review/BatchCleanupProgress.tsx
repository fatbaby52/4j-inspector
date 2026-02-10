// components/review/BatchCleanupProgress.tsx

import React from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

interface BatchCleanupProgressProps {
  current: number;
  total: number;
  isComplete: boolean;
  successCount: number;
  failedCount: number;
  onClose: () => void;
}

export function BatchCleanupProgress({
  current,
  total,
  isComplete,
  successCount,
  failedCount,
  onClose,
}: BatchCleanupProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <Card className="fixed bottom-24 left-4 right-4 z-50 shadow-lg border-2 border-primary">
      <CardContent>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              {isComplete ? 'Batch Cleanup Complete' : 'Processing Notes...'}
            </h4>
            {isComplete && (
              <Button size="sm" variant="secondary" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {current} / {total} notes processed
            </span>
            {isComplete && (
              <div className="flex gap-3">
                <span className="text-green-600">✓ {successCount} cleaned</span>
                {failedCount > 0 && (
                  <span className="text-red-600">✕ {failedCount} failed</span>
                )}
              </div>
            )}
          </div>

          {/* Loading animation */}
          {!isComplete && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span className="animate-spin">🔄</span>
              <span>AI is polishing your notes...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BatchCleanupProgress;
