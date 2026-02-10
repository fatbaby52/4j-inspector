// components/review/EmptyRecommendations.tsx

import React from 'react';

interface EmptyRecommendationsProps {
  onGenerate?: () => void;
  onAddManual?: () => void;
  isGenerating?: boolean;
  message?: string;
}

export function EmptyRecommendations({
  onGenerate,
  onAddManual,
  isGenerating = false,
  message = 'No recommendations have been generated yet.',
}: EmptyRecommendationsProps) {
  return (
    <div className="text-center py-12 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Recommendations Yet
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
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
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generate with AI
              </>
            )}
          </button>
        )}

        {onAddManual && (
          <button
            onClick={onAddManual}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Manually
          </button>
        )}
      </div>

      {onGenerate && (
        <p className="mt-4 text-xs text-gray-400">
          AI recommendations are based on your inspection observations
        </p>
      )}
    </div>
  );
}

export default EmptyRecommendations;
