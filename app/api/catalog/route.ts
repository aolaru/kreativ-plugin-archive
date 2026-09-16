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
  const [
    productsResult,
    productCountResult,
    developerCountResult,
    contributorCountResult,
    firstReleaseResult,
  ] = await Promise.all([
    supabase
      .from('products')
      .select(
        'name, slug, product_type, status, initial_release_year, discontinued_year, short_description, overview, updated_at, developers(name, slug), product_versions(version_number, release_date), product_formats(formats(code, name)), screenshots(image_url, sort_order)',
      )
      .order('updated_at', { ascending: false })
      .limit(200),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('developers').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('initial_release_year')
      .not('initial_release_year', 'is', null)
      .order('initial_release_year')
      .limit(1)
      .maybeSingle(),
  ]);

  if (productsResult.error) {
    return Response.json({ products: [] }, { status: 503 });
  }

  const categorySlugs = [
    'synthesizer',
    'sampler',
    'drum-machine',
    'reverb',
    'delay',
    'compressor',
    'daw',
    'audio-editor',
    'plugin-host',
  ];
  const { data: categoryRows } = await supabase
    .from('categories')
    .select('id, slug, name, group_name')
    .in('slug', categorySlugs);
  const categoryIds = categoryRows?.map((category) => category.id) ?? [];
  const { data: categoryJoins } = categoryIds.length
    ? await supabase
        .from('product_categories')
        .select('category_id')
        .in('category_id', categoryIds)
    : { data: [] as Array<{ category_id: string }> };
  const categoryCounts = (categoryJoins ?? []).reduce<Record<string, number>>(
    (counts, join) => {
      counts[join.category_id] = (counts[join.category_id] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const categories = categorySlugs
    .map((slug) => {
      const category = categoryRows?.find((item) => item.slug === slug);
      return category
        ? {
            slug,
            name: category.name,
            group: category.group_name,
            count: categoryCounts[category.id] ?? 0,
          }
        : null;
    })
    .filter(Boolean);

  return Response.json({
    products: productsResult.data ?? [],
    stats: {
      products: productCountResult.count ?? 0,
      developers: developerCountResult.count ?? 0,
      contributors: contributorCountResult.count ?? 0,
      earliestReleaseYear:
        firstReleaseResult.data?.initial_release_year ?? null,
    },
    categories,
  });
}
