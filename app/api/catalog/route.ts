import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return Response.json({ products: [] });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from('products')
    .select('name, slug, product_type, status, initial_release_year, developers(name, slug)')
    .order('updated_at', { ascending: false })
    .limit(8);

  if (error) {
    return Response.json({ products: [] }, { status: 503 });
  }

  return Response.json({ products: data });
}
