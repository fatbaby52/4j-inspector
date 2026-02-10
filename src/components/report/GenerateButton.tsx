// components/report/GenerateButton.tsx

import React from 'react';

interface GenerateButtonProps {
  onClick: () => void;
  isGenerating?: boolean;
  isDisabled?: boolean;
  progress?: number; // 0-100
  label?: string;
  generatingLabel?: string;
}

export function GenerateButton({
  onClick,
  isGenerating = false,
  isDisabled = false,
  progress,
  label = 'Generate Report',
  generatingLabel = 'Generating...',
}: GenerateButtonProps) {
  const showProgress = isGenerating && progress !== undefined;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isGenerating}
      className={`
        relative w-full py-4 rounded-lg font-semibold text-lg transition-all overflow-hidden
        ${isDisabled
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : isGenerating
          ? 'bg-primary/80 text-white cursor-wait'
          : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.99]'
        }
      `}
    >
      {/* Progress bar background */}
      {showProgress && (
        <div
          className="absolute inset-0 bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-3">
        {isGenerating ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
            {showProgress ? `${Math.round(progress)}%` : generatingLabel}
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {label}
          </>
        )}
      </span>
    </button>
  );
}

export default GenerateButton;
