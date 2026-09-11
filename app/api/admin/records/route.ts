import { requireAdmin, slugify } from '@/lib/admin';

type Text = string | null;
const text = (value: unknown): Text => typeof value === 'string' && value.trim() ? value.trim() : null;
const year = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1950 && parsed <= 2100 ? parsed : null;
};

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.supabase) return Response.json({ error: auth.error }, { status: 401 });
  const body = await request.json().catch(() => null);

  if (body?.kind === 'developer') {
    const name = text(body.name);
    if (!name) return Response.json({ error: 'A developer name is required.' }, { status: 400 });
    const { data, error } = await auth.supabase.from('developers').insert({
      name, slug: slugify(text(body.slug) ?? name), country: text(body.country),
      founded_year: year(body.foundedYear), website_url: text(body.websiteUrl), description: text(body.description),
    }).select('id, name, slug').single();
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ developer: data });
  }

  if (body?.kind === 'product') {
    const developerId = text(body.developerId);
    const name = text(body.name);
    if (!developerId || !name) return Response.json({ error: 'A developer and product name are required.' }, { status: 400 });
    const initialReleaseYear = year(body.initialReleaseYear);
    const discontinuedYear = year(body.discontinuedYear);
    if (initialReleaseYear && discontinuedYear && discontinuedYear < initialReleaseYear) return Response.json({ error: 'The discontinued year cannot be before the release year.' }, { status: 400 });

    const { data: product, error: productError } = await auth.supabase.from('products').insert({
      developer_id: developerId, name, slug: slugify(text(body.slug) ?? name), product_type: text(body.productType),
      status: body.status === 'discontinued' ? 'discontinued' : 'active',
      initial_release_year: initialReleaseYear, discontinued_year: discontinuedYear,
      short_description: text(body.shortDescription), overview: text(body.overview), official_url: text(body.officialUrl),
    }).select('id, name, slug').single();
    if (productError || !product) return Response.json({ error: productError?.message ?? 'Unable to create product.' }, { status: 400 });

    const versionNumber = text(body.versionNumber);
    if (versionNumber) {
      const { error } = await auth.supabase.from('product_versions').insert({ product_id: product.id, version_number: versionNumber, release_date: text(body.versionDate), notes: text(body.versionNotes) });
      if (error) return Response.json({ error: `Product created, but version could not be saved: ${error.message}` }, { status: 400 });
    }

    const screenshotUrl = text(body.screenshotUrl);
    if (screenshotUrl) {
      const { error } = await auth.supabase.from('screenshots').insert({ product_id: product.id, image_url: screenshotUrl, caption: text(body.screenshotCaption), source_url: text(body.screenshotSourceUrl) });
      if (error) return Response.json({ error: `Product created, but screenshot could not be saved: ${error.message}` }, { status: 400 });
    }

    const audioUrl = text(body.audioUrl);
    if (audioUrl) {
      const { error } = await auth.supabase.from('audio_demos').insert({ product_id: product.id, title: text(body.audioTitle) ?? `${name} demo`, url: audioUrl, source_type: body.audioSourceType ?? 'other_external', demo_type: body.audioDemoType ?? 'community', contributor_id: auth.user.id });
      if (error) return Response.json({ error: `Product created, but audio demo could not be saved: ${error.message}` }, { status: 400 });
    }

    return Response.json({ product });
  }

  return Response.json({ error: 'Unknown editor action.' }, { status: 400 });
}
