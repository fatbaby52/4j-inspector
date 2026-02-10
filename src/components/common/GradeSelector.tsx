// components/common/GradeSelector.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import type { Grade } from '@/types/inspection';

interface GradeSelectorProps {
  value: Grade | null;
  onChange: (grade: Grade) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const grades: { value: Grade; label: string; color: string; activeColor: string }[] = [
  {
    value: 'good',
    label: 'Good',
    color: 'border-green-500 text-green-600',
    activeColor: 'bg-green-500 text-white border-green-500'
  },
  {
    value: 'fair',
    label: 'Fair',
    color: 'border-yellow-500 text-yellow-600',
    activeColor: 'bg-yellow-500 text-white border-yellow-500'
  },
  {
    value: 'poor',
    label: 'Poor',
    color: 'border-red-500 text-red-600',
    activeColor: 'bg-red-500 text-white border-red-500'
  },
  {
    value: 'na',
    label: 'N/A',
    color: 'border-gray-400 text-gray-500',
    activeColor: 'bg-gray-400 text-white border-gray-400'
  }
];

export function GradeSelector({
  value,
  onChange,
  disabled = false,
  size = 'md'
}: GradeSelectorProps) {
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <div className="flex gap-2">
      {grades.map((grade) => {
        const isActive = value === grade.value;

        return (
          <button
            key={grade.value}
            type="button"
            onClick={() => onChange(grade.value)}
            disabled={disabled}
            className={cn(
              'flex-1 rounded-lg font-medium border-2 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
              'active:scale-95 touch-manipulation',
              sizes[size],
              isActive ? grade.activeColor : `bg-white ${grade.color}`,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {grade.label}
          </button>
        );
      })}
    </div>
  );
}

// Compact version for lists
export function GradeBadge({ grade, size = 'sm' }: { grade: Grade; size?: 'xs' | 'sm' | 'md' }) {
  const colors: Record<Grade, string> = {
    good: 'bg-green-100 text-green-800',
    fair: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800',
    na: 'bg-gray-100 text-gray-600'
  };

  const labels: Record<Grade, string> = {
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    na: 'N/A'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span className={cn('rounded-full font-medium', colors[grade], sizes[size])}>
      {labels[grade]}
    </span>
  );
}

export default GradeSelector;
