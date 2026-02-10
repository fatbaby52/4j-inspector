// services/authService.ts

import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  company?: string;
  role: 'inspector' | 'admin' | 'reviewer';
  avatarUrl?: string;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: profile.email,
    fullName: profile.full_name,
    company: profile.company,
    role: profile.role,
    avatarUrl: profile.avatar_url,
  };
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ============================================
// SIGN IN
// ============================================

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  const user = await getCurrentUser();
  return { user, error: null };
}

export async function signInWithMagicLink(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// SIGN UP
// ============================================

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  // Note: User might need to confirm email depending on Supabase settings
  if (data.user && !data.session) {
    return { user: null, error: 'Please check your email to confirm your account.' };
  }

  const user = await getCurrentUser();
  return { user, error: null };
}

// ============================================
// SIGN OUT
// ============================================

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// ============================================
// PASSWORD RESET
// ============================================

export async function resetPassword(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// PROFILE UPDATE
// ============================================

export async function updateProfile(
  updates: Partial<Pick<AuthUser, 'fullName' | 'company' | 'avatarUrl'>>
): Promise<{ success: boolean; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.fullName,
      company: updates.company,
      avatar_url: updates.avatarUrl,
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// AUTH STATE LISTENER
// ============================================

export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        const user = await getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}
