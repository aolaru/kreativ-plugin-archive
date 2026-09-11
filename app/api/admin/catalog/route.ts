import { requireAdmin } from '@/lib/admin';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.supabase) return Response.json({ error: auth.error }, { status: 401 });

  const [{ data: developers, error: developerError }, { data: products, error: productError }] = await Promise.all([
    auth.supabase.from('developers').select('id, name, slug').order('name'),
    auth.supabase.from('products').select('id, name, slug, status, initial_release_year, developers(name, slug)').order('updated_at', { ascending: false }).limit(12),
  ]);

  if (developerError || productError) return Response.json({ error: 'The editor catalog could not be loaded.' }, { status: 500 });
  return Response.json({ profile: auth.profile, developers, products });
}
