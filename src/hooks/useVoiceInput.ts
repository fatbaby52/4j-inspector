// hooks/useVoiceInput.ts

import { useRef, useCallback } from 'react';

/**
 * Hook to facilitate voice input on iOS/iPadOS.
 *
 * Strategy: Focus the textarea, which makes the iOS keyboard appear.
 * User can then tap the microphone button on the iOS keyboard to dictate.
 */
export function useVoiceInput() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const triggerVoiceInput = useCallback(() => {
    if (inputRef.current) {
      // Focus the input to bring up keyboard
      inputRef.current.focus();

      // On iOS, this should position cursor at end
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  return {
    inputRef,
    triggerVoiceInput,
  };
}

export default useVoiceInput;
