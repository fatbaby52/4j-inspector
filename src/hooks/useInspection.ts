// hooks/useInspection.ts

import { useState, useEffect, useCallback } from 'react';
import { inspectionDB } from '@/db/database';
import { useInspectionStore } from '@/stores/inspectionStore';
import type { Inspection } from '@/types/inspection';

interface UseInspectionReturn {
  inspection: Inspection | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useInspection(inspectionId: string): UseInspectionReturn {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentInspection, loadInspection } = useInspectionStore();

  const reload = useCallback(async () => {
    if (!inspectionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to load from store first
      if (currentInspection?.id === inspectionId) {
        setInspection(currentInspection);
      } else {
        // Load from database
        const data = await inspectionDB.inspections.get(inspectionId);
        if (data) {
          setInspection(data);
          loadInspection(inspectionId);
        } else {
          setError('Inspection not found');
        }
      }
    } catch (err) {
      console.error('Failed to load inspection:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inspection');
    } finally {
      setIsLoading(false);
    }
  }, [inspectionId, currentInspection, loadInspection]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep in sync with store
  useEffect(() => {
    if (currentInspection?.id === inspectionId) {
      setInspection(currentInspection);
    }
  }, [currentInspection, inspectionId]);

  return {
    inspection,
    isLoading,
    error,
    reload,
  };
}

export default useInspection;
