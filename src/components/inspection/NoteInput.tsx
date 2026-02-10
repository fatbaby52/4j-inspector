// components/inspection/NoteInput.tsx

import { useState, useRef, useEffect } from 'react';
import { VoiceInputButton } from '@/components/common/VoiceInputButton';

interface NoteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  showVoiceInput?: boolean;
  label?: string;
}

export function NoteInput({
  value,
  onChange,
  placeholder = 'Enter notes...',
  rows = 4,
  maxLength = 2000,
  autoFocus = false,
  disabled = false,
  showVoiceInput = true,
  label,
}: NoteInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleVoicePress = () => {
    // Focus the textarea to enable iOS dictation
    textareaRef.current?.focus();
  };

  const remainingChars = maxLength - value.length;
  const showCharCount = remainingChars < 200 || isFocused;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-3 border rounded-lg resize-none border-gray-300
            focus:ring-2 focus:ring-primary focus:border-primary
            disabled:bg-gray-100 disabled:text-gray-500
            ${showVoiceInput ? 'pr-14' : ''}
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
        />
        {showVoiceInput && !disabled && (
          <div className="absolute right-2 bottom-2">
            <VoiceInputButton
              onPress={handleVoicePress}
              size="sm"
            />
          </div>
        )}
      </div>
      {showCharCount && (
        <p className={`text-xs text-right ${remainingChars < 50 ? 'text-orange-500' : 'text-gray-400'}`}>
          {remainingChars} characters remaining
        </p>
      )}
    </div>
  );
}

export default NoteInput;
