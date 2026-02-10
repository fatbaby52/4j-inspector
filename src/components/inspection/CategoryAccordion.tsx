// components/inspection/CategoryAccordion.tsx

import React, { useState } from 'react';
import type { InspectionCategory } from '@/types';

interface CategoryAccordionProps {
  category: InspectionCategory;
  completedCount: number;
  totalCount: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  onItemClick?: (itemId: string) => void;
  getItemStatus?: (itemId: string) => 'complete' | 'partial' | 'empty' | 'na';
}

export function CategoryAccordion({
  category,
  completedCount,
  totalCount,
  isExpanded: controlledExpanded,
  onToggle,
  onItemClick,
  getItemStatus,
}: CategoryAccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return (
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'partial':
        return (
          <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
          </div>
        );
      case 'na':
        return (
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xs text-gray-500 font-medium">-</span>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.icon}</span>
          <div className="text-left">
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500">
              {completedCount} of {totalCount} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-10">
              {Math.round(progressPercent)}%
            </span>
          </div>

          {/* Chevron */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Mobile progress bar */}
      <div className="sm:hidden px-4 pb-2">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Items list */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {category.items.map((item, index) => {
            const status = getItemStatus?.(item.id) || 'empty';

            return (
              <button
                key={item.id}
                onClick={() => onItemClick?.(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors
                  ${index !== category.items.length - 1 ? 'border-b border-gray-100' : ''}
                `}
              >
                {getStatusIcon(status)}
                <span className={`flex-1 text-sm ${status === 'na' ? 'text-gray-400' : 'text-gray-700'}`}>
                  {item.name}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoryAccordion;
