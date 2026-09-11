import { createClient } from '@supabase/supabase-js';

export type ArchiveProduct = {
  id: string;
  slug: string;
  name: string;
  product_type: string | null;
  status: 'active' | 'discontinued';
  initial_release_year: number | null;
  discontinued_year: number | null;
  short_description: string | null;
  overview: string | null;
  official_url: string | null;
  developers?: { name: string; slug: string; founded_year?: number | null; country?: string | null } | null;
  product_versions?: Array<{ id: string; version_number: string; release_date: string | null; notes: string | null; release_status: string }>;
  product_categories?: Array<{ categories?: { name: string; slug: string } | null }>;
  product_formats?: Array<{ formats?: { code: string; name: string } | null }>;
};

function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function getProduct(developerSlug: string, productSlug: string) {
  const supabase = database();
  if (!supabase) return null;
  const { data } = await supabase.from('products')
    .select('*, developers!inner(name, slug, founded_year, country), product_versions(*), product_categories(categories(name, slug)), product_formats(formats(code, name))')
    .eq('developers.slug', developerSlug).eq('slug', productSlug).maybeSingle();
  return data as ArchiveProduct | null;
}

export async function getProducts(filters: { status?: string; year?: number; category?: string; developerId?: string } = {}) {
  const supabase = database();
  if (!supabase) return [] as ArchiveProduct[];
  if (filters.category) {
    const { data: category } = await supabase.from('categories').select('id').eq('slug', filters.category).maybeSingle();
    if (!category) return [] as ArchiveProduct[];
    const { data: joins } = await supabase.from('product_categories').select('product_id').eq('category_id', category.id);
    const ids = joins?.map((item) => item.product_id) ?? [];
    if (!ids.length) return [] as ArchiveProduct[];
    const { data } = await supabase.from('products').select('*, developers(name, slug)').in('id', ids).order('initial_release_year', { ascending: false });
    return (data ?? []) as ArchiveProduct[];
  }
  let query = supabase.from('products').select('*, developers(name, slug)').order('initial_release_year', { ascending: false });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.year) query = query.eq('initial_release_year', filters.year);
  if (filters.developerId) query = query.eq('developer_id', filters.developerId);
  const { data } = await query;
  return (data ?? []) as ArchiveProduct[];
}

export async function getDeveloper(slug: string) {
  const supabase = database();
  if (!supabase) return null;
  const { data } = await supabase.from('developers').select('*').eq('slug', slug).maybeSingle();
  if (!data) return null;
  return { ...data, products: await getProducts({ developerId: data.id }) };
}

export async function getCategories() {
  const supabase = database();
  if (!supabase) return [] as Array<{ slug: string; name: string; group_name: string }>;
  const { data } = await supabase.from('categories').select('*').order('name');
  return data ?? [];
}
