// stores/authStore.ts

import { create } from 'zustand';
import {
  getCurrentUser,
  signInWithEmail,
  signInWithMagicLink,
  signUp,
  signOut,
  onAuthStateChange,
  type AuthUser,
} from '@/services/authService';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInMagicLink: (email: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;

    set({ isLoading: true });

    try {
      const user = await getCurrentUser();
      set({ user, isInitialized: true });

      // Set up auth state listener
      onAuthStateChange((user) => {
        set({ user });
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { user, error } = await signInWithEmail(email, password);

      if (error) {
        set({ error, isLoading: false });
        return false;
      }

      set({ user, isLoading: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  signInMagicLink: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const { success, error } = await signInWithMagicLink(email);

      if (error) {
        set({ error, isLoading: false });
        return false;
      }

      set({ isLoading: false });
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send magic link';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true, error: null });

    try {
      const { user, error } = await signUp(email, password, fullName);

      if (error) {
        set({ error, isLoading: false });
        return false;
      }

      set({ user, isLoading: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await signOut();
      set({ user: null, isLoading: false });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
