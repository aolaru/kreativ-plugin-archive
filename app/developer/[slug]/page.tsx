import { ArrowRight, ExternalLink } from 'lucide-react';
import { getDeveloper, type ArchiveProduct } from '@/lib/archive';

export const dynamic = 'force-dynamic';

function developerOf(product: ArchiveProduct) {
  return Array.isArray(product.developers) ? product.developers[0] : product.developers;
}

export default async function DeveloperPage({ params }: { params: { slug: string } }) {
  const developer = await getDeveloper(params.slug);

  if (!developer) return <main className="browse-page"><section className="browse-hero"><p className="eyebrow">Developer record</p><h1>Record not found</h1><p>This developer has not been indexed yet.</p><a className="entry-link" href="/">Return to archive <ArrowRight size={15}/></a></section></main>;

  const products = developer.products as ArchiveProduct[];
  const latestYear = Math.max(...products.map((product) => product.initial_release_year ?? 0), developer.founded_year ?? 0);
  const country = developer.country ?? 'Location not documented';
  const initials = developer.name.split(' ').map((word: string) => word[0]).join('').slice(0, 2).toUpperCase();

  return <main className="developer-page"><header className="record-header"><a className="wordmark" href="/"><span className="mark">A</span><span>audioplugin.io</span><small>archive</small></a><nav><a href="/">Archive</a><a href="/developer/native-instruments">Developers</a><a href="/status/discontinued">Discontinued</a></nav><a className="record-contribute" href="#suggest">Suggest an edit</a></header><div className="record-breadcrumb"><a href="/">Archive</a><ArrowRight size={13}/><span>Developers</span><ArrowRight size={13}/><span>{developer.name}</span></div><section className="developer-hero"><div className="developer-monogram">{initials}</div><div><p className="eyebrow">Developer record</p><h1>{developer.name}</h1><p>{products.length ? `${products.length} product${products.length === 1 ? '' : 's'} currently documented in this growing archive.` : 'This developer is indexed, with releases awaiting documentation.'}</p>{developer.website_url && <a href={developer.website_url} target="_blank" rel="noreferrer">Official website <ExternalLink size={14}/></a>}</div><dl><dt>Founded</dt><dd>{developer.founded_year ?? 'Not documented'}</dd><dt>Based in</dt><dd>{country}</dd><dt>Products indexed</dt><dd>{products.length}</dd><dt>Latest release</dt><dd>{latestYear || 'Not documented'}</dd></dl></section><section className="developer-content"><div><p className="eyebrow">Catalog</p><h2>Products by {developer.name}</h2><div className="catalog-table"><div className="catalog-head"><span>Product</span><span>Initial release</span><span>Type</span><span>Status</span></div>{products.length ? products.map((product) => <a href={`/plugin/${developer.slug}/${product.slug}`} key={product.id}><b>{product.name}</b><span>{product.initial_release_year ?? '—'}</span><span>{product.product_type ?? 'Software'}</span><span className={product.status === 'discontinued' ? 'catalog-archived' : ''}>{product.status}</span><ArrowRight size={14}/></a>) : <p className="empty-state">No products are currently linked to this developer.</p>}</div></div><aside><p className="eyebrow">Archive timeline</p><div className="timeline">{developer.founded_year && <div><time>{developer.founded_year}</time><span>{developer.name} founded</span></div>}{products.map((product) => <div key={product.id}><time>{product.initial_release_year ?? '—'}</time><span>{product.name} first released</span></div>)}</div><a className="entry-link" href="#suggest">Add archive notes <ArrowRight size={15}/></a></aside></section></main>;
}
