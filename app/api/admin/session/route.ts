import { anonymousClient } from '@/lib/admin';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const action = body?.action;
  const supabase = anonymousClient();

  if (!supabase || !email || !password) return Response.json({ error: 'Email and password are required.' }, { status: 400 });

  if (action === 'sign_up') {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ confirmationRequired: !data.session });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return Response.json({ error: error?.message ?? 'Unable to sign in.' }, { status: 401 });
  return Response.json({ accessToken: data.session.access_token, email: data.user.email });
}
