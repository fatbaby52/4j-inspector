// components/inspection/QuickNAButton.tsx

import { useState, useEffect } from 'react';

interface QuickNAButtonProps {
  onMarkNA: () => void;
  onUndo?: () => void;
  isNA?: boolean;
  undoTimeout?: number; // ms to show undo option
}

export function QuickNAButton({
  onMarkNA,
  onUndo,
  isNA = false,
  undoTimeout = 5000,
}: QuickNAButtonProps) {
  const [showUndo, setShowUndo] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    if (showUndo) {
      setTimeRemaining(undoTimeout);

      interval = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 100));
      }, 100);

      timeout = setTimeout(() => {
        setShowUndo(false);
      }, undoTimeout);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [showUndo, undoTimeout]);

  const handleClick = () => {
    if (isNA && onUndo) {
      onUndo();
    } else {
      onMarkNA();
      setShowUndo(true);
    }
  };

  const handleUndo = () => {
    setShowUndo(false);
    onUndo?.();
  };

  if (showUndo && onUndo) {
    const progress = (timeRemaining / undoTimeout) * 100;

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Marked N/A</span>
        <button
          onClick={handleUndo}
          className="relative px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-gray-200 transition-all"
            style={{ width: `${progress}%` }}
          />
          <span className="relative z-10">Undo</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${isNA
          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        }
      `}
    >
      {isNA ? 'Marked N/A' : 'Mark N/A'}
    </button>
  );
}

export default QuickNAButton;
