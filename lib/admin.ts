import { createClient } from '@supabase/supabase-js';

function credentials() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function anonymousClient(accessToken?: string) {
  const config = credentials();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}

export async function requireAdmin(request: Request) {
  const header = request.headers.get('authorization');
  const accessToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const supabase = anonymousClient(accessToken ?? undefined);
  if (!supabase || !accessToken) return { supabase: null, error: 'Please sign in to continue.' };

  const { data: userData } = await supabase.auth.getUser(accessToken);
  if (!userData.user) return { supabase: null, error: 'Your session has expired. Please sign in again.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') return { supabase: null, error: 'This account does not have archive editor access yet.' };
  return { supabase, user: userData.user, profile };
}

export function slugify(value: string) {
  return value.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
