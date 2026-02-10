// components/review/AIReviewPanel.tsx

import React, { useState } from 'react';

interface AIReviewPanelProps {
  originalText: string;
  aiText: string;
  onAccept: (text: string) => void;
  onReject: () => void;
  onRegenerate: (instructions?: string) => void;
  isRegenerating?: boolean;
  title?: string;
}

export function AIReviewPanel({
  originalText,
  aiText,
  onAccept,
  onReject,
  onRegenerate,
  isRegenerating = false,
  title = 'AI Suggestion',
}: AIReviewPanelProps) {
  const [editedText, setEditedText] = useState(aiText);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState('');

  const handleAccept = () => {
    onAccept(editedText);
  };

  const handleRegenerate = () => {
    onRegenerate(instructions || undefined);
    setInstructions('');
    setShowInstructions(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-medium text-blue-800">{title}</span>
        </div>
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showOriginal ? 'Hide original' : 'Show original'}
        </button>
      </div>

      {/* Original Text (collapsible) */}
      {showOriginal && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Original:</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{originalText}</p>
        </div>
      )}

      {/* Editable AI Text */}
      <div className="p-4">
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
          disabled={isRegenerating}
        />
      </div>

      {/* Regeneration Instructions */}
      {showInstructions && (
        <div className="px-4 pb-4">
          <label className="block text-sm text-gray-600 mb-2">
            How should we improve this?
          </label>
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., Make it more formal, add more detail..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            disabled={isRegenerating}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        <button
          onClick={handleAccept}
          disabled={isRegenerating}
          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          disabled={isRegenerating}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => {
            if (showInstructions && instructions) {
              handleRegenerate();
            } else {
              setShowInstructions(!showInstructions);
            }
          }}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 disabled:opacity-50 transition-colors"
        >
          {isRegenerating ? (
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
              Regenerating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {showInstructions ? 'Regenerate' : 'Revise'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default AIReviewPanel;
