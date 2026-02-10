// components/inspection/FieldCompleteChecklist.tsx

import React from 'react';

interface ChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
  isRequired: boolean;
  onClick?: () => void;
}

interface FieldCompleteChecklistProps {
  items: ChecklistItem[];
  onContinue?: () => void;
  continueLabel?: string;
  showSummary?: boolean;
}

export function FieldCompleteChecklist({
  items,
  onContinue,
  continueLabel = 'Continue',
  showSummary = true,
}: FieldCompleteChecklistProps) {
  const requiredItems = items.filter((item) => item.isRequired);
  const optionalItems = items.filter((item) => !item.isRequired);
  const completedRequired = requiredItems.filter((item) => item.isComplete).length;
  const completedOptional = optionalItems.filter((item) => item.isComplete).length;
  const allRequiredComplete = completedRequired === requiredItems.length;

  const renderItem = (item: ChecklistItem) => (
    <div
      key={item.id}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-colors
        ${item.isComplete
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
        }
        ${item.onClick ? 'cursor-pointer' : ''}
      `}
      onClick={item.onClick}
    >
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
          ${item.isComplete
            ? 'bg-green-500'
            : 'border-2 border-gray-300'
          }
        `}
      >
        {item.isComplete && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`flex-1 text-sm ${item.isComplete ? 'text-green-800' : 'text-gray-700'}`}>
        {item.label}
      </span>
      {!item.isComplete && item.onClick && (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {showSummary && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Completion Status</span>
            <span
              className={`text-sm font-medium ${
                allRequiredComplete ? 'text-green-600' : 'text-orange-600'
              }`}
            >
              {allRequiredComplete ? 'Ready to submit' : `${requiredItems.length - completedRequired} required items left`}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${allRequiredComplete ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{
                width: `${requiredItems.length > 0 ? (completedRequired / requiredItems.length) * 100 : 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Required Items */}
      {requiredItems.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Required
          </h3>
          <div className="space-y-2">
            {requiredItems.map(renderItem)}
          </div>
        </div>
      )}

      {/* Optional Items */}
      {optionalItems.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Optional
          </h3>
          <div className="space-y-2">
            {optionalItems.map(renderItem)}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {onContinue && (
        <button
          onClick={onContinue}
          disabled={!allRequiredComplete}
          className={`
            w-full py-4 rounded-lg font-semibold text-lg transition-colors
            ${allRequiredComplete
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {continueLabel}
        </button>
      )}

      {!allRequiredComplete && (
        <p className="text-center text-sm text-gray-500">
          Complete all required items to continue
        </p>
      )}
    </div>
  );
}

export default FieldCompleteChecklist;
