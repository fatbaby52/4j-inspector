// hooks/useAI.ts

import { useState, useCallback } from 'react';
import { mockCleanupNote, mockGenerateExecutiveSummary, mockGenerateRecommendations } from '@/services/aiService';
import type { Inspection, Recommendation } from '@/types/inspection';

interface AIState {
  isProcessing: boolean;
  error: string | null;
  progress?: {
    current: number;
    total: number;
  };
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    isProcessing: false,
    error: null,
  });

  const cleanupNote = useCallback(async (
    noteText: string,
    context?: { itemName?: string; category?: string }
  ): Promise<string> => {
    setState({ isProcessing: true, error: null });
    try {
      const result = await mockCleanupNote(noteText);
      setState({ isProcessing: false, error: null });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clean up note';
      setState({ isProcessing: false, error: message });
      throw error;
    }
  }, []);

  const generateSummary = useCallback(async (
    inspection: Inspection
  ): Promise<string> => {
    setState({ isProcessing: true, error: null });
    try {
      const result = await mockGenerateExecutiveSummary(inspection);
      setState({ isProcessing: false, error: null });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate summary';
      setState({ isProcessing: false, error: message });
      throw error;
    }
  }, []);

  const generateRecommendations = useCallback(async (
    inspection: Inspection
  ): Promise<Recommendation[]> => {
    setState({ isProcessing: true, error: null });
    try {
      const result = await mockGenerateRecommendations(inspection);
      setState({ isProcessing: false, error: null });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate recommendations';
      setState({ isProcessing: false, error: message });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    cleanupNote,
    generateSummary,
    generateRecommendations,
    clearError,
  };
}

export default useAI;
