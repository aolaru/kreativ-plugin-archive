import { requireAdmin } from '@/lib/admin';

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
const year = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1950 && parsed <= 2100
    ? parsed
    : null;
};
const sourceTypes = new Set([
  'official_website',
  'archived_official_website',
  'manual',
  'magazine_article',
  'news_article',
  'review',
  'documentation',
  'other',
]);

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(request);
  if (!auth.supabase) return Response.json({ error: auth.error }, { status: 401 });
  const { data, error } = await auth.supabase
    .from('products')
    .select('*, developers(id, name, slug), product_versions(*), screenshots(*), product_sources(sources(id, title, url, publisher, publication_date, source_type))')
    .eq('id', params.id)
    .maybeSingle();
  if (error || !data)
    return Response.json({ error: 'This archive record could not be found.' }, { status: 404 });
  return Response.json({ product: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(request);
  if (!auth.supabase) return Response.json({ error: auth.error }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'No changes were supplied.' }, { status: 400 });

  const status = body.status === 'discontinued' ? 'discontinued' : 'active';
  const initialReleaseYear = year(body.initialReleaseYear);
  const discontinuedYear = year(body.discontinuedYear);
  if (initialReleaseYear && discontinuedYear && discontinuedYear < initialReleaseYear)
    return Response.json({ error: 'The discontinued year cannot precede the initial release.' }, { status: 400 });

  const { error: updateError } = await auth.supabase
    .from('products')
    .update({
      status,
      product_type: text(body.productType),
      initial_release_year: initialReleaseYear,
      discontinued_year: discontinuedYear,
      short_description: text(body.shortDescription),
      overview: text(body.overview),
      official_url: text(body.officialUrl),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id);
  if (updateError) return Response.json({ error: updateError.message }, { status: 400 });

  const versionNumber = text(body.versionNumber);
  if (versionNumber) {
    const { error } = await auth.supabase.from('product_versions').upsert(
      {
        product_id: params.id,
        version_number: versionNumber,
        release_date: text(body.versionDate),
        notes: text(body.versionNotes),
      },
      { onConflict: 'product_id,version_number' },
    );
    if (error) return Response.json({ error: `Record updated, but version could not be saved: ${error.message}` }, { status: 400 });
  }

  const screenshotUrl = text(body.screenshotUrl);
  if (screenshotUrl) {
    const { data: existing } = await auth.supabase
      .from('screenshots')
      .select('id')
      .eq('product_id', params.id)
      .eq('image_url', screenshotUrl)
      .maybeSingle();
    if (!existing) {
      const { error } = await auth.supabase.from('screenshots').insert({
        product_id: params.id,
        image_url: screenshotUrl,
        caption: text(body.screenshotCaption),
        source_url: text(body.screenshotSourceUrl),
        attribution: text(body.screenshotAttribution),
      });
      if (error) return Response.json({ error: `Record updated, but screenshot could not be saved: ${error.message}` }, { status: 400 });
    }
  }

  const sourceUrl = text(body.sourceUrl);
  if (sourceUrl) {
    const sourceType = sourceTypes.has(body.sourceType)
      ? body.sourceType
      : 'other';
    const { data: source, error: sourceError } = await auth.supabase
      .from('sources')
      .upsert(
        {
          url: sourceUrl,
          title: text(body.sourceTitle) ?? sourceUrl,
          publisher: text(body.sourcePublisher),
          source_type: sourceType,
          accessed_date: new Date().toISOString().slice(0, 10),
        },
        { onConflict: 'url' },
      )
      .select('id')
      .single();
    if (sourceError || !source)
      return Response.json({ error: sourceError?.message ?? 'Record updated, but the source could not be saved.' }, { status: 400 });
    const { error: linkError } = await auth.supabase
      .from('product_sources')
      .upsert({ product_id: params.id, source_id: source.id });
    if (linkError) return Response.json({ error: `Record updated, but source could not be linked: ${linkError.message}` }, { status: 400 });
  }

  return Response.json({ message: 'Archive record updated.' });
}
