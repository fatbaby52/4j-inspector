// stores/settingsStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface SettingsState {
  // User info
  user: User | null;
  isAuthenticated: boolean;

  // App settings
  defaultInspectionType: 'home' | 'facility';
  autoSaveInterval: number; // milliseconds
  enableVoiceInput: boolean;
  showPhotoWarnings: boolean;

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      defaultInspectionType: 'home',
      autoSaveInterval: 30000, // 30 seconds
      enableVoiceInput: true,
      showPhotoWarnings: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false
        }),

      updateSettings: (settings) => set(settings)
    }),
    {
      name: '4j-settings',
      partialize: (state) => ({
        defaultInspectionType: state.defaultInspectionType,
        autoSaveInterval: state.autoSaveInterval,
        enableVoiceInput: state.enableVoiceInput,
        showPhotoWarnings: state.showPhotoWarnings
      })
    }
  )
);

export default useSettingsStore;
