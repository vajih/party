import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CONFIG } from './config.js';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

export const auth = {
  getSession: () => supabase.auth.getSession(),
  onChange: (cb) => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => cb(session));
    return () => subscription?.unsubscribe();
  },
  signInWithEmail: (email, redirectTo) =>
    supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } }),
  signOut: () => supabase.auth.signOut(),
};
