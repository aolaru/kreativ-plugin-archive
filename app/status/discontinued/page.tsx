import { ArrowRight } from 'lucide-react';
import { getProducts, type ArchiveProduct } from '@/lib/archive';

export const dynamic = 'force-dynamic';

function developerOf(product: ArchiveProduct) {
  return Array.isArray(product.developers) ? product.developers[0] : product.developers;
}

export default async function DiscontinuedPage() {
  const entries = await getProducts({ status: 'discontinued' });
  return <main className="browse-page"><header className="record-header"><a className="wordmark" href="/"><span className="mark">A</span><span>audioplugin.io</span><small>archive</small></a><nav><a href="/">Archive</a><a href="/developer/native-instruments">Developers</a><a href="/status/discontinued">Discontinued</a></nav></header><section className="browse-hero"><p className="eyebrow">Historical software index</p><h1>Discontinued,<br/><em>not forgotten.</em></h1><p>Products no longer sold or supported by their original developers, preserved here as part of the audio software record.</p></section><section className="browse-list"><div className="browse-controls"><b>{entries.length} discontinued product{entries.length === 1 ? '' : 's'}</b><div><a href="/decade/1990s">1990s</a><a href="/decade/2000s">2000s</a><a href="/decade/2010s">2010s</a></div></div>{entries.length ? entries.map((entry, index) => { const developer = developerOf(entry); const dates = `${entry.initial_release_year ?? '—'}–${entry.discontinued_year ?? 'present'}`; return <a href={`/plugin/${developer?.slug ?? 'unknown'}/${entry.slug}`} className="browse-row" key={entry.id}><span>{String(index + 1).padStart(2, '0')}</span><b>{entry.name}</b><span>{developer?.name ?? 'Unknown developer'}</span><span>{dates}</span><i>Archived</i><ArrowRight size={15}/></a>; }) : <p className="empty-state">No discontinued products have been documented yet.</p>}</section></main>;
}
