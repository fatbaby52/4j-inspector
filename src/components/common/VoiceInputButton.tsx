// components/common/VoiceInputButton.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  onPress: () => void;
  isListening?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Large, prominent button that indicates voice input is available.
 * On press, focuses the associated textarea so user can use iOS dictation.
 */
export function VoiceInputButton({
  onPress,
  isListening = false,
  disabled = false,
  size = 'md',
  className,
}: VoiceInputButtonProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={cn(
        'rounded-full flex items-center justify-center transition-all duration-200',
        sizeClasses[size],
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-primary text-white hover:bg-primary-dark active:scale-95',
        className
      )}
      aria-label="Voice input - tap to dictate"
    >
      <svg
        className={iconSizes[size]}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </button>
  );
}

export default VoiceInputButton;
