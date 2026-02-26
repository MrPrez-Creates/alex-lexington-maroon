/**
 * Supabase Client for Maroon Customer App
 * Unified authentication with Command Center
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',          // Use PKCE — auth code comes via ?code= query param, not #access_token hash.
    persistSession: true,       // This avoids conflicts with the hash-based view routing in App.tsx.
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export default supabase
