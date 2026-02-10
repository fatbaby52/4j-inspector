// components/common/MultiSelect.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  label,
  options,
  value = [],
  onChange,
  placeholder,
  disabled = false,
  className,
}: MultiSelectProps) {
  const toggleOption = (optionValue: string) => {
    if (disabled) return;

    const newValues = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    onChange(newValues);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {placeholder && value.length === 0 && (
        <p className="text-sm text-gray-500 mb-2">{placeholder}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              disabled={disabled}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                isSelected
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300',
                !disabled && !isSelected && 'hover:border-primary',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {value.length} selected
        </p>
      )}
    </div>
  );
}

export default MultiSelect;
