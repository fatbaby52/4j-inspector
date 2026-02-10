// stores/reviewStore.ts

import { create } from 'zustand';

interface ReviewState {
  // AI processing states
  isCleaningNotes: boolean;
  cleaningProgress: number; // 0-100
  isGeneratingSummary: boolean;
  isGeneratingRecommendations: boolean;

  // Errors
  aiError: string | null;

  // Actions
  setCleaningNotes: (isProcessing: boolean) => void;
  setCleaningProgress: (progress: number) => void;
  setGeneratingSummary: (isProcessing: boolean) => void;
  setGeneratingRecommendations: (isProcessing: boolean) => void;
  setAIError: (error: string | null) => void;
  clearAIError: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  isCleaningNotes: false,
  cleaningProgress: 0,
  isGeneratingSummary: false,
  isGeneratingRecommendations: false,
  aiError: null,

  setCleaningNotes: (isProcessing) =>
    set({
      isCleaningNotes: isProcessing,
      cleaningProgress: isProcessing ? 0 : 100
    }),

  setCleaningProgress: (progress) => set({ cleaningProgress: progress }),

  setGeneratingSummary: (isProcessing) => set({ isGeneratingSummary: isProcessing }),

  setGeneratingRecommendations: (isProcessing) =>
    set({ isGeneratingRecommendations: isProcessing }),

  setAIError: (error) => set({ aiError: error }),

  clearAIError: () => set({ aiError: null })
}));

export default useReviewStore;
