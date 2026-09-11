import { requireAdmin, slugify } from '@/lib/admin';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.supabase) return Response.json({ error: auth.error }, { status: 401 });
  const { data, error } = await auth.supabase
    .from('developer_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(30);
  if (error) return Response.json({ error: 'Unable to load submissions.' }, { status: 500 });
  return Response.json({ submissions: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.supabase) return Response.json({ error: auth.error }, { status: 401 });
  const body = await request.json().catch(() => null);
  const submissionId = typeof body?.submissionId === 'string' ? body.submissionId : '';
  const decision = body?.decision;
  if (!submissionId || !['accepted', 'rejected'].includes(decision)) return Response.json({ error: 'Invalid review action.' }, { status: 400 });

  const { data: submission, error: findError } = await auth.supabase
    .from('developer_submissions')
    .select('*')
    .eq('id', submissionId)
    .eq('status', 'pending')
    .maybeSingle();
  if (findError || !submission) return Response.json({ error: 'This submission is no longer awaiting review.' }, { status: 404 });

  if (decision === 'accepted') {
    const developerSlug = slugify(submission.developer_name);
    const { data: developer, error: developerError } = await auth.supabase
      .from('developers')
      .upsert({ slug: developerSlug, name: submission.developer_name, website_url: submission.developer_website }, { onConflict: 'slug' })
      .select('id')
      .single();
    if (developerError || !developer) return Response.json({ error: 'Unable to create the developer record.' }, { status: 400 });

    const { error: productError } = await auth.supabase.from('products').upsert({
      developer_id: developer.id,
      slug: slugify(submission.product_name),
      name: submission.product_name,
      product_type: submission.product_type,
      initial_release_year: submission.initial_release_year,
      short_description: submission.description,
      official_url: submission.official_url,
      status: 'active',
    }, { onConflict: 'developer_id,slug' });
    if (productError) return Response.json({ error: 'Unable to create the product record.' }, { status: 400 });
  }

  const { error: updateError } = await auth.supabase.from('developer_submissions').update({
    status: decision,
    reviewed_by: auth.user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', submissionId);
  if (updateError) return Response.json({ error: 'Unable to complete this review.' }, { status: 400 });
  return Response.json({ message: decision === 'accepted' ? 'Submission approved and published to the archive.' : 'Submission marked as not accepted.' });
}
