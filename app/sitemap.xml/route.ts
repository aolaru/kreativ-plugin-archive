import { getProducts } from '@/lib/archive';

export const dynamic = 'force-dynamic';

const origin = 'https://audioplugin.io';
const xml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character] ?? character);

export async function GET() {
  const products = await getProducts();
  const paths = ['', '/submit', '/status/discontinued', '/editorial-guidelines', '/sources-policy', '/privacy'];
  const urls = [
    ...paths.map((path) => `${origin}${path}`),
    ...products.map((product) => `${origin}/plugin/${product.developers?.slug ?? 'archive'}/${product.slug}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${xml(url)}</loc></url>`).join('\n')}\n</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
