import { anonymousClient } from '@/lib/admin';

const text = (value: unknown, limit = 2000) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const year = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1950 && parsed <= 2100 ? parsed : null;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (text(body?.company)) return Response.json({ error: 'Unable to accept this submission.' }, { status: 400 });

  const developerName = text(body?.developerName, 160);
  const productName = text(body?.productName, 160);
  const contactEmail = text(body?.contactEmail, 254).toLowerCase();
  const officialUrl = text(body?.officialUrl, 1000);
  const description = text(body?.description, 5000);
  const supabase = anonymousClient();

  if (!supabase || !developerName || !productName || !officialUrl || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return Response.json({ error: 'Please provide your name, product name, contact email, and official product page.' }, { status: 400 });
  }

  const { error } = await supabase.from('developer_submissions').insert({
    developer_name: developerName,
    developer_website: text(body?.developerWebsite, 1000) || null,
    contact_email: contactEmail,
    product_name: productName,
    product_type: text(body?.productType, 160) || null,
    initial_release_year: year(body?.initialReleaseYear),
    official_url: officialUrl,
    description: description || null,
    source_url: text(body?.sourceUrl, 1000) || null,
    status: 'pending',
  });

  if (error) return Response.json({ error: 'Your submission could not be saved. Please try again.' }, { status: 400 });
  return Response.json({ message: 'Thanks — your submission is now awaiting editorial review.' }, { status: 201 });
}
