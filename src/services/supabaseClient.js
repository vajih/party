import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Support both patterns used across the repo:
// - window.SUPABASE_URL / window.SUPABASE_ANON_KEY (set by config/env.local.js)
// - window.CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY } (legacy js/config.js)
const url = (typeof window !== 'undefined' && (window.SUPABASE_URL || (window.CONFIG && window.CONFIG.SUPABASE_URL))) || '';
const key = (typeof window !== 'undefined' && (window.SUPABASE_ANON_KEY || (window.CONFIG && window.CONFIG.SUPABASE_ANON_KEY))) || '';

if (!url || !key) {
  console.warn('[supabaseClient] Missing SUPABASE_URL or SUPABASE_ANON_KEY; requests will fail until these are provided.');
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// expose for quick console debugging during dev:
if (typeof window !== 'undefined') window._sb = supabase;
