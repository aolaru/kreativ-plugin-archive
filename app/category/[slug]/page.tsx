import { ArrowRight } from 'lucide-react';
import { getProducts, type ArchiveProduct } from '@/lib/archive';

export const dynamic = 'force-dynamic';

function developerOf(product: ArchiveProduct) {
  return Array.isArray(product.developers) ? product.developers[0] : product.developers;
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const label = params.slug.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const records = await getProducts({ category: params.slug });
  return <main className="browse-page"><header className="record-header"><a className="wordmark" href="/"><span className="mark">A</span><span>audioplugin.io</span><small>archive</small></a><nav><a href="/">Archive</a><a href="/developer/native-instruments">Developers</a><a href="/status/discontinued">Discontinued</a></nav></header><section className="browse-hero"><p className="eyebrow">Category index</p><h1>{label}</h1><p>Products currently catalogued in the {label.toLowerCase()} category. Entries may appear in multiple categories to reflect their design and intended use.</p></section><section className="browse-list"><div className="browse-controls"><b>{records.length} matching product{records.length === 1 ? '' : 's'}</b><div><a href="/">Current</a><a href="/status/discontinued">Discontinued</a><a href="#year">By year</a></div></div>{records.length ? records.map((record, index) => { const developer = developerOf(record); return <a href={`/plugin/${developer?.slug ?? 'unknown'}/${record.slug}`} className="browse-row" key={record.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{record.name}</b><span>{developer?.name ?? 'Unknown developer'}</span><span>{record.initial_release_year ?? '—'}</span><i>{record.product_type ?? 'Software'}</i><ArrowRight size={15}/></a>; }) : <p className="empty-state">No products in this category have been documented yet.</p>}</section></main>;
}
