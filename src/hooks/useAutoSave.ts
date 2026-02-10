// hooks/useAutoSave.ts

import { useEffect, useRef, useCallback } from 'react';

const DEFAULT_DEBOUNCE_MS = 1000;

export interface UseAutoSaveOptions {
  data: unknown;
  onSave: (data: unknown) => void | Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * Hook that automatically saves data after changes, with debouncing.
 */
export function useAutoSave({
  data,
  onSave,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  enabled = true,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef<boolean>(true);
  const lastSavedDataRef = useRef<string | undefined>(undefined);

  const save = useCallback(async () => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);

    // Don't save if data hasn't changed
    if (serialized === lastSavedDataRef.current) return;

    lastSavedDataRef.current = serialized;
    await onSave(data);
  }, [data, onSave, enabled]);

  useEffect(() => {
    // Skip first render to avoid saving initial data
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedDataRef.current = JSON.stringify(data);
      return;
    }

    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(save, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, debounceMs, enabled]);

  // Save immediately (bypasses debounce)
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  return { saveNow };
}

export default useAutoSave;
