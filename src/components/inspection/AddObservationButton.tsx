// components/inspection/AddObservationButton.tsx

import React from 'react';

interface AddObservationButtonProps {
  onClick: () => void;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  disabled?: boolean;
}

export function AddObservationButton({
  onClick,
  label = 'Add Observation',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
}: AddObservationButtonProps) {
  const baseClasses = 'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'border-2 border-dashed border-gray-300 text-gray-600 hover:border-primary hover:text-primary bg-transparent',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

export default AddObservationButton;
