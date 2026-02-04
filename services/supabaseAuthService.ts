/**
 * Supabase Auth Service for Maroon Customer App
 * Replaces Firebase Auth functions while keeping Firestore for data storage
 */

import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { db, storage } from '../firebaseConfig';
import { UserProfile, SharedCustomer } from '../types';
import { syncCustomerToApi, USE_API_SYNC } from './apiService';

// Re-export types for consumers
export type { UserProfile, SharedCustomer };

// --- Helpers ---
const cleanPayload = (data: any): any => {
  if (data === null || data === undefined) return null;

  if (Array.isArray(data)) {
    return data.map(item => cleanPayload(item)).filter(i => i !== undefined);
  }

  if (typeof data === 'object') {
    if (data instanceof Date) return data;
    const newData: any = {};
    for (const key in data) {
      const value = data[key];
      if (value !== undefined) {
        newData[key] = cleanPayload(value);
      }
    }
    return newData;
  }

  return data;
};

// --- Auth Functions ---

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Sync to Command Center API on login (non-blocking)
  syncCustomerToApiSupabase().catch(e => console.warn('API sync failed:', e));

  return data;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  name: string,
  photoFile: File | null
) => {
  // Sign up with Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        display_name: name,
      }
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registration failed - no user returned');

  const user = data.user;

  // Upload profile photo if provided
  let photoURL = null;
  if (photoFile) {
    const ref = storage.ref(`profile_photos/${user.id}`);
    await ref.put(photoFile);
    photoURL = await ref.getDownloadURL();
  }

  // Parse first/last name
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Create User Profile Doc in Firestore (Maroon app internal)
  await db.collection('users').doc(user.id).set({
    uid: user.id,
    email: email,
    name: name,
    photoURL: photoURL,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    phoneNumber: '',
    kycStatus: 'unverified',
    billingAddress: {},
    cashBalance: 0,
    settings: { darkMode: true, currency: 'USD' }
  });

  // Create Shared Customer Doc (visible in Command Center)
  const sharedCustomer: SharedCustomer = {
    id: user.id,
    name: name,
    firstName: firstName,
    lastName: lastName,
    phone: '',
    email: email,
    type: 'RETAIL',
    kycStatus: 'unverified',
    maroonUserId: user.id, // Critical link field - now uses Supabase UID
    cashBalance: 0,
    lifetimeBuyTotal: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('customers').doc(user.id).set(cleanPayload(sharedCustomer));

  // Sync to Command Center API (non-blocking)
  syncCustomerToApiSupabase().catch(e => console.warn('API sync failed:', e));

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

export const requestPhoneCode = async (phoneNumber: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber
  });
  if (error) throw error;
  return 'code_sent';
};

export const verifyPhoneCode = async (phoneNumber: string, code: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: code,
    type: 'sms'
  });
  if (error) throw error;
  return data;
};

export const deleteUserAccount = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Delete Firestore user document
    await db.collection('users').doc(user.id).delete();
    // Note: Supabase user deletion requires admin privileges
    // For now, we just sign out - actual deletion should be handled by admin
    await supabase.auth.signOut();
  }
};

// --- Get Current User ---

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// --- Auth Token for API ---

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch (e) {
    console.warn('Failed to get auth token:', e);
    return null;
  }
};

// --- API Sync Helper (Supabase version) ---

const syncCustomerToApiSupabase = async (): Promise<void> => {
  if (!USE_API_SYNC) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // The existing syncCustomerToApi will work once we update apiService
  // For now, this is a placeholder that uses the Supabase user
  try {
    // Import dynamically to avoid circular dependency
    const { getMyCustomerProfile, createOrLinkCustomer } = await import('./apiService');

    const existing = await getMyCustomerProfile();
    if (!existing) {
      await createOrLinkCustomer({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        phone: '',
      });
    }
  } catch (e) {
    console.warn('Failed to sync customer to API:', e);
  }
};

// --- Auth State Listener ---

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null);
    }
  );

  return () => subscription.unsubscribe();
};
