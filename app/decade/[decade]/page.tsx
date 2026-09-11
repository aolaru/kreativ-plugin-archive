import { ArrowRight } from 'lucide-react';
import { getProducts, type ArchiveProduct } from '@/lib/archive';

export const dynamic = 'force-dynamic';

function developerOf(product: ArchiveProduct) {
  return Array.isArray(product.developers) ? product.developers[0] : product.developers;
}

export default async function DecadePage({ params }: { params: { decade: string } }) {
  const startYear = Number(params.decade.replace(/s$/, ''));
  const records = Number.isInteger(startYear) ? (await getProducts()).filter((record) => record.initial_release_year && record.initial_release_year >= startYear && record.initial_release_year < startYear + 10) : [];
  return <main className="browse-page"><header className="record-header"><a className="wordmark" href="/"><span className="mark">A</span><span>audioplugin.io</span><small>archive</small></a><nav><a href="/">Archive</a><a href="/developer/native-instruments">Developers</a><a href="/status/discontinued">Discontinued</a></nav></header><section className="browse-hero"><p className="eyebrow">Decade index</p><h1>{params.decade}</h1><p>A growing index of audio software first released during the {params.decade}.</p></section><section className="browse-list"><div className="browse-controls"><b>{records.length} documented release{records.length === 1 ? '' : 's'}</b><div><a href="/status/discontinued">Discontinued</a><a href="/">All records</a></div></div>{records.length ? records.map((record, index) => { const developer = developerOf(record); return <a href={`/plugin/${developer?.slug ?? 'unknown'}/${record.slug}`} className="browse-row" key={record.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{record.name}</b><span>{developer?.name ?? 'Unknown developer'}</span><span>{record.initial_release_year ?? '—'}</span><i>{record.product_type ?? 'Software'}</i><ArrowRight size={15}/></a>; }) : <p className="empty-state">No releases from this decade have been documented yet.</p>}</section></main>;
}
