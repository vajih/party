import { supabase } from '../../services/supabaseClient.js';

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
export function onAuthChange(cb) {
  const { data: { subscription } } =
    supabase.auth.onAuthStateChange((_evt, session) => cb(session ?? null));
  return () => subscription?.unsubscribe();
}
export async function signInWithEmail(email, redirectTo) {
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
}
export async function signOut() { return supabase.auth.signOut(); }

/** Host if: owner OR exists in party_hosts by user_id or invite_email */
export async function isHostForParty(partyId, user) {
  if (!user || !partyId) return false;
  const { data: p } = await supabase.from('parties')
    .select('host_id').eq('id', partyId).limit(1).maybeSingle();
  if (p?.host_id === user.id) return true;

  const email = (user.email || '').toLowerCase();
  const { data: h } = await supabase.from('party_hosts')
    .select('id')
    .eq('party_id', partyId)
    .or(`user_id.eq.${user.id},invite_email.eq.${email}`)
    .limit(1);
  return Array.isArray(h) && h.length > 0;
}

/** Consume auth redirect (magic-link hash OR OAuth code) and set session */
export async function consumeAuthRedirect() {
  const url = new URL(window.location.href);

  // OAuth/PKCE ?code=...
  if (url.searchParams.get('code')) {
    try { await supabase.auth.exchangeCodeForSession(window.location.href); }
    catch (e) { console.warn('exchangeCodeForSession error', e); }
    url.searchParams.delete('code'); url.searchParams.delete('state');
    history.replaceState({}, '', url.pathname + (url.search ? `?${url.searchParams}` : ''));
    return;
  }

  // Magic link #access_token...
  const hash = url.hash.replace(/^#/, '');
  if (!hash) return;
  const hp = new URLSearchParams(hash);
  const access_token = hp.get('access_token');
  const refresh_token = hp.get('refresh_token');
  const error = hp.get('error');
  const error_description = hp.get('error_description');

  if (error) {
    try { sessionStorage.setItem('auth_error', `${error}: ${error_description || ''}`); } catch (_) {}
  }

  if (access_token && refresh_token) {
    try { await supabase.auth.setSession({ access_token, refresh_token }); }
    catch (e) { console.warn('setSession error', e); }
  }
  history.replaceState({}, '', url.pathname + url.search);
}
