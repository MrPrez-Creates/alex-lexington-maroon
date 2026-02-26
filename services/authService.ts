/**
 * Auth Service for Maroon Customer App
 * Supabase Auth — handles login, registration, and OAuth
 */

import { supabase } from '../lib/supabase';
import { syncCustomerToApi } from './apiService';

// --- Auth Functions (Supabase) ---

export const loginWithEmail = async (email: string, pass: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass
  });

  if (error) throw error;

  // Sync to Command Center API on login (non-blocking)
  syncCustomerToApi().catch(e => console.warn('API sync failed:', e));

  return data;
};

export const registerWithEmail = async (email: string, pass: string, name: string, _photoFile: File | null) => {
  // Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: name,
        display_name: name,
      }
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registration failed - no user returned');

  // Note: Profile photo upload will be re-enabled when storage migration is complete
  // Note: Firestore user profile doc creation removed - using API customer record instead

  // Sync to Command Center API (non-blocking)
  syncCustomerToApi().catch(e => console.warn('API sync failed:', e));

  return data;
};

export const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        prompt: 'select_account'
      }
    }
  });

  if (error) throw error;

  // Note: API sync will happen on redirect back via onAuthStateChange
  return data;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const sendPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) throw error;
};

export const deleteUserAccount = async () => {
  // Note: Full account deletion requires admin privileges in Supabase
  await supabase.auth.signOut();
};
