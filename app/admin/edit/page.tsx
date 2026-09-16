'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Check, FileText, ImagePlus, Pencil, Plus } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  slug: string;
  status: string;
  initial_release_year: number | null;
  developers?: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

type ProductDetail = Product & {
  product_type: string | null;
  discontinued_year: number | null;
  short_description: string | null;
  overview: string | null;
  official_url: string | null;
  product_versions?: Array<{ id: string; version_number: string; release_date: string | null; notes: string | null }>;
  screenshots?: Array<{ id: string; image_url: string; caption: string | null; source_url: string | null }>;
  product_sources?: Array<{ sources?: { id: string; title: string; url: string; publisher: string | null; source_type: string } | null }>;
};

const blank = {
  status: 'active', productType: '', initialReleaseYear: '', discontinuedYear: '', shortDescription: '', overview: '', officialUrl: '',
  versionNumber: '', versionDate: '', versionNotes: '', screenshotUrl: '', screenshotCaption: '', screenshotSourceUrl: '', screenshotAttribution: '',
  sourceTitle: '', sourceUrl: '', sourcePublisher: '', sourceType: 'official_website',
};

function developerName(product: Product) {
  return Array.isArray(product.developers) ? product.developers[0]?.name : product.developers?.name;
}

export default function EditArchivePage() {
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [form, setForm] = useState(blank);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCatalog(accessToken: string) {
    const response = await fetch('/api/admin/catalog', { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Unable to load archive records.');
    setProducts(data.products ?? []);
  }

  async function loadProduct(accessToken: string, id: string) {
    if (!id) { setDetail(null); return; }
    setLoading(true); setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to load this record.');
      const product = data.product as ProductDetail;
      setDetail(product);
      setForm({ ...blank, status: product.status, productType: product.product_type ?? '', initialReleaseYear: product.initial_release_year?.toString() ?? '', discontinuedYear: product.discontinued_year?.toString() ?? '', shortDescription: product.short_description ?? '', overview: product.overview ?? '', officialUrl: product.official_url ?? '' });
    } catch (error) { setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Unable to load this record.' }); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const stored = window.localStorage.getItem('pluginpedia_admin_token');
    if (!stored) return;
    setToken(stored);
    loadCatalog(stored).catch((error) => setNotice({ tone: 'error', message: error.message }));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedId) return;
    setLoading(true); setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${selectedId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to update the record.');
      setNotice({ tone: 'success', message: 'Archive record updated.' });
      await Promise.all([loadCatalog(token), loadProduct(token, selectedId)]);
    } catch (error) { setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Unable to update the record.' }); }
    finally { setLoading(false); }
  }

  if (!token) return <main className="admin-shell"><header className="admin-header"><a className="wordmark" href="/"><span className="mark">A</span><span>audioplugin.io</span><small>editor</small></a><a href="/admin">Sign in</a></header><section className="admin-login"><p className="eyebrow">Private workspace</p><h1>Sign in required</h1><p>Use the archive editor sign-in before managing existing records.</p><a className="admin-primary" href="/admin">Open archive editor <ArrowRight size={16}/></a></section></main>;

  return <main className="admin-shell"><header className="admin-header"><a className="wordmark" href="/"><span className="mark">A</span><span>audioplugin.io</span><small>editor</small></a><div><a href="/admin">Add records</a><a href="/" target="_blank" rel="noreferrer">View archive <ArrowRight size={15}/></a></div></header><section className="admin-intro"><div><p className="eyebrow">Private workspace / record maintenance</p><h1>Update an entry</h1><p>Correct a record, add a release version, attach a sourced interface image, or link the evidence that supports it.</p></div><div className="admin-safety"><Pencil size={18}/><span>Editor access verified</span></div></section>{notice && <p className={`admin-notice floating ${notice.tone}`}>{notice.tone === 'success' && <Check size={16}/>} {notice.message}</p>}<section className="editor-maintenance"><aside className="maintenance-list"><p className="eyebrow">Catalog</p><h2>Select an entry</h2><select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); loadProduct(token, event.target.value); }}><option value="">Choose a product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {developerName(product) ?? 'Unknown developer'}</option>)}</select>{products.map((product) => <button type="button" key={product.id} className={selectedId === product.id ? 'selected' : ''} onClick={() => { setSelectedId(product.id); loadProduct(token, product.id); }}><b>{product.name}</b><span>{developerName(product) ?? 'Unknown developer'} · {product.initial_release_year ?? 'Year unknown'}</span></button>)}</aside><section className="maintenance-form"><div className="admin-section-heading"><div><p className="eyebrow">Record editor</p><h2>{detail ? detail.name : 'Choose a record'}</h2></div><Pencil size={19}/></div>{detail ? <form className="admin-form" onSubmit={save}><div className="two-inputs"><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Current</option><option value="discontinued">Archived</option></select></label><label>Type<input value={form.productType} onChange={(event) => setForm({ ...form, productType: event.target.value })} /></label></div><div className="two-inputs"><label>Initial release year<input type="number" min="1950" max="2100" value={form.initialReleaseYear} onChange={(event) => setForm({ ...form, initialReleaseYear: event.target.value })} /></label><label>Discontinued year<input type="number" min="1950" max="2100" value={form.discontinuedYear} onChange={(event) => setForm({ ...form, discontinuedYear: event.target.value })} /></label></div><label>Official or archived product page<input type="url" value={form.officialUrl} onChange={(event) => setForm({ ...form, officialUrl: event.target.value })} /></label><label>Short description<textarea rows={3} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></label><label>Archive notes<textarea rows={5} value={form.overview} onChange={(event) => setForm({ ...form, overview: event.target.value })} /></label><details><summary><ImagePlus size={15}/> Add a sourced screenshot</summary><div className="optional-fields"><label>Image URL<input type="url" value={form.screenshotUrl} onChange={(event) => setForm({ ...form, screenshotUrl: event.target.value })} placeholder="https://…" /></label><label>Caption<input value={form.screenshotCaption} onChange={(event) => setForm({ ...form, screenshotCaption: event.target.value })} /></label><div className="two-inputs"><label>Source page<input type="url" value={form.screenshotSourceUrl} onChange={(event) => setForm({ ...form, screenshotSourceUrl: event.target.value })} placeholder="https://…" /></label><label>Attribution<input value={form.screenshotAttribution} onChange={(event) => setForm({ ...form, screenshotAttribution: event.target.value })} /></label></div></div></details><details><summary><Plus size={15}/> Add or revise a version</summary><div className="optional-fields"><div className="two-inputs"><label>Version number<input value={form.versionNumber} onChange={(event) => setForm({ ...form, versionNumber: event.target.value })} placeholder="e.g. 2.0" /></label><label>Release date<input type="date" value={form.versionDate} onChange={(event) => setForm({ ...form, versionDate: event.target.value })} /></label></div><label>Version notes<textarea rows={3} value={form.versionNotes} onChange={(event) => setForm({ ...form, versionNotes: event.target.value })} /></label></div></details><details><summary><FileText size={15}/> Add supporting source</summary><div className="optional-fields"><label>Source title<input value={form.sourceTitle} onChange={(event) => setForm({ ...form, sourceTitle: event.target.value })} /></label><label>Source URL<input type="url" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="https://…" /></label><div className="two-inputs"><label>Publisher<input value={form.sourcePublisher} onChange={(event) => setForm({ ...form, sourcePublisher: event.target.value })} /></label><label>Source type<select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value })}><option value="official_website">Official website</option><option value="archived_official_website">Archived official website</option><option value="manual">Manual</option><option value="documentation">Documentation</option><option value="review">Review</option><option value="other">Other</option></select></label></div></div></details><button className="admin-primary" disabled={loading}>{loading ? 'Saving…' : 'Save record updates'} <ArrowRight size={16}/></button></form> : <p className="maintenance-empty">Choose an entry from the catalog to begin.</p>}</section><aside className="maintenance-evidence"><p className="eyebrow">Existing material</p>{detail ? <><h2>{detail.screenshots?.length ?? 0} screenshots</h2>{detail.screenshots?.length ? detail.screenshots.map((screenshot) => <a key={screenshot.id} href={screenshot.source_url ?? screenshot.image_url} target="_blank" rel="noreferrer">{screenshot.caption ?? 'Screenshot'} <ArrowRight size={14}/></a>) : <p>No screenshot yet.</p>}<h2>Sources</h2>{detail.product_sources?.length ? detail.product_sources.map((entry) => entry.sources && <a key={entry.sources.id} href={entry.sources.url} target="_blank" rel="noreferrer">{entry.sources.title} <ArrowRight size={14}/></a>) : <p>No supporting sources yet.</p>}<h2>Versions</h2>{detail.product_versions?.length ? detail.product_versions.map((version) => <p key={version.id}><b>{version.version_number}</b><span>{version.release_date?.slice(0, 10) ?? 'Undated'}</span></p>) : <p>No versions documented yet.</p>}</> : <p>Select a product to review its existing evidence.</p>}</aside></section></main>;
}
