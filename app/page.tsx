'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bookmark, ChevronRight, Menu, Search, Sparkles, X } from 'lucide-react';

type Product = { name: string; developer: string; developerSlug?: string; category: string; year: string; status: 'Active' | 'Discontinued'; slug: string; accent: string; note?: string };
const fallbackProducts: Product[] = [
  { name: 'Pro-53', developer: 'Native Instruments', category: 'Virtual Analog', year: '2002', status: 'Discontinued', slug: 'pro-53', accent: 'p53', note: 'Updated 2 days ago' },
  { name: 'Absynth 5', developer: 'Native Instruments', category: 'Semi-modular synthesizer', year: '2009', status: 'Discontinued', slug: 'absynth-5', accent: 'abs', note: 'Added yesterday' },
  { name: 'B-3 V2', developer: 'Native Instruments', category: 'Tonewheel organ', year: '2007', status: 'Discontinued', slug: 'b-3-v2', accent: 'b3', note: 'Updated 5 days ago' },
  { name: 'Repro-5', developer: 'u-he', category: 'Virtual Analog', year: '2017', status: 'Active', slug: 'repro-5', accent: 'repro', note: 'Added 8 days ago' },
  { name: 'Minimoog V', developer: 'Arturia', category: 'Virtual Analog', year: '2003', status: 'Active', slug: 'minimoog-v', accent: 'mini', note: 'Updated 12 days ago' },
  { name: 'Operator', developer: 'Ableton', category: 'FM synthesizer', year: '2004', status: 'Active', slug: 'operator', accent: 'operator', note: 'Added 14 days ago' },
];
const categories = [['Synthesizer', '238 entries'], ['Sampler', '104 entries'], ['Drum Machine', '67 entries'], ['Reverb', '186 entries'], ['Delay', '152 entries'], ['Compressor', '191 entries'], ['DAW', '92 entries'], ['Audio Editor', '41 entries'], ['Plugin Host', '36 entries']];

function ProductArt({ product, large = false }: { product: Product; large?: boolean }) {
  return <div className={`product-art ${product.accent} ${large ? 'large-art' : ''}`} aria-label={`${product.name} archival record artwork`}>
    <div className="art-brand">{product.developer.split(' ').map((word) => word[0]).join('')}</div><div className="art-screen"><span className="art-display">{product.name}</span><div className="art-grid"><i /><i /><i /><i /><i /><i /></div></div><div className="art-controls"><b /><b /><b /><b /></div><span className="art-label">ARCHIVE RECORD</span>
  </div>;
}
function ProductCard({ product, index }: { product: Product; index: number }) {
  return <a className="product-card" href={`/plugin/${product.developerSlug ?? product.developer.toLowerCase().replace(' ', '-')}/${product.slug}`}><ProductArt product={product} /><div className="product-card-meta"><span className="index">{String(index + 1).padStart(2, '0')}</span><div><h3>{product.name}</h3><p>{product.developer}</p></div><span className={`status ${product.status === 'Discontinued' ? 'discontinued' : ''}`}>{product.status === 'Discontinued' ? 'Archived' : 'Current'}</span></div><p className="product-spec">{product.category} <b>·</b> {product.year}</p></a>;
}

export default function Home() {
  const [query, setQuery] = useState(''); const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  useEffect(() => {
    fetch('/api/catalog').then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const data = payload?.products;
        if (!data?.length) return;
        const accents = ['p53', 'abs', 'b3', 'repro', 'mini', 'operator'];
        setProducts(data.map((product, index) => {
          const developer = Array.isArray(product.developers) ? product.developers[0] : product.developers;
          return {
            name: product.name,
            slug: product.slug,
            developer: developer?.name ?? 'Unknown developer',
            developerSlug: developer?.slug,
            category: product.product_type ?? 'Audio software',
            year: product.initial_release_year?.toString() ?? 'Unknown year',
            status: product.status === 'discontinued' ? 'Discontinued' : 'Active',
            accent: accents[index % accents.length],
          };
        }));
      });
  }, []);
  const featuredProduct = products.find((product) => product.slug === 'pro-53') ?? products[0] ?? fallbackProducts[0];
  const results = useMemo(() => products.filter((p) => `${p.name} ${p.developer} ${p.category}`.toLowerCase().includes(query.toLowerCase())), [query, products]);
  return <main>
    <header className="site-header"><a className="wordmark" href="/"><span className="mark">P</span><span>pluginpedia</span><small>archive</small></a><nav className={menuOpen ? 'mobile-nav open' : 'mobile-nav'} aria-label="Primary navigation"><a href="#browse">Browse</a><a href="#recent">Recent changes</a><a href="/status/discontinued">Discontinued</a><a href="#about">About</a></nav><div className="header-actions"><a className="contribute" href="/admin">Editor access</a><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button></div></header>
    <section className="masthead"><div className="mast-copy"><p className="eyebrow">A community-maintained historical archive</p><h1>Audio software,<br /><em>with a past.</em></h1><p className="intro">A factual, evolving record of the instruments, effects, and tools that shaped recorded music.</p></div><div className="search-panel"><label htmlFor="archive-search">Search the archive</label><div className="search-box"><Search size={20} /><input id="archive-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “Pro-53”, “reverb”, or a developer" /><kbd>⌘ K</kbd></div><p>Search the growing archive of products, developers, and releases.</p>{query && <div className="search-results" aria-live="polite"><span>Products matching “{query}”</span>{results.length ? results.map((p) => <a key={p.slug} href={`/plugin/${p.developerSlug ?? p.developer.toLowerCase().replace(' ', '-')}/${p.slug}`}><b>{p.name}</b><small>{p.developer} · {p.year}</small><ChevronRight size={15} /></a>) : <p>No archive entries match that search yet.</p>}</div>}</div></section>
    <section className="archive-stats" aria-label="Archive totals"><span><b>4,281</b> products indexed</span><span><b>623</b> developers documented</span><span><b>1957–today</b> release history</span><span><b>1,842</b> community contributors</span></section>
    <section className="content-section feature-section" id="recent"><div className="section-heading"><div><p className="eyebrow">Featured archive entry</p><h2>A living record of<br />the <em>Prophet-5</em> legacy.</h2></div><a href={`/plugin/${featuredProduct.developerSlug ?? 'native-instruments'}/${featuredProduct.slug}`} className="text-link">View complete entry <ArrowRight size={16} /></a></div><div className="feature-entry"><div className="feature-art"><ProductArt product={featuredProduct} large /></div><article className="feature-copy"><div className="entry-kicker"><span className="status discontinued">Discontinued</span><span>2002–2010</span></div><h3>Native Instruments<br /><strong>Pro-53</strong></h3><p>Software emulation of the Sequential Circuits Prophet-5, developed in collaboration with creator Dave Smith. One of the defining virtual analog instruments of the early 2000s.</p><dl><div><dt>Type</dt><dd>Virtual Analog Synthesizer</dd></div><div><dt>Formats</dt><dd>VST · AU · RTAS · DXi</dd></div><div><dt>Latest version</dt><dd>3.0.1 <small>2009</small></dd></div></dl><a className="entry-link" href={`/plugin/${featuredProduct.developerSlug ?? 'native-instruments'}/${featuredProduct.slug}`}>Explore entry <ArrowRight size={17} /></a></article></div></section>
    <section className="content-section recent-section"><div className="section-heading"><div><p className="eyebrow">New & revised</p><h2>Recently in the archive</h2></div><a href="#browse" className="text-link">See all changes <ArrowRight size={16} /></a></div><div className="product-grid">{products.slice(1, 5).map((p, index) => <ProductCard key={p.slug} product={p} index={index} />)}</div></section>
    <section className="content-section browse-section" id="browse"><div className="section-heading"><div><p className="eyebrow">Explore the collection</p><h2>Browse by category</h2></div><p className="section-note">Software organized by function, history, and the people who made it.</p></div><div className="category-columns"><div><h3>Instruments</h3>{categories.slice(0, 3).map(([name, count]) => <a key={name} href={`/category/${name.toLowerCase().replaceAll(' ', '-')}`}><span>{name}</span><small>{count}</small><ArrowRight size={15} /></a>)}</div><div><h3>Effects</h3>{categories.slice(3, 6).map(([name, count]) => <a key={name} href={`/category/${name.toLowerCase().replaceAll(' ', '-')}`}><span>{name}</span><small>{count}</small><ArrowRight size={15} /></a>)}</div><div><h3>Software</h3>{categories.slice(6).map(([name, count]) => <a key={name} href={`/category/${name.toLowerCase().replaceAll(' ', '-')}`}><span>{name}</span><small>{count}</small><ArrowRight size={15} /></a>)}</div></div></section>
    <section className="content-section split-section"><div className="vintage-panel"><div><p className="eyebrow">History is not obsolete</p><h2>Discontinued,<br /><em>not forgotten.</em></h2><p>Browse software that left the market but remains part of the musical record.</p><a href="/status/discontinued" className="dark-link">Explore the archive <ArrowRight size={16} /></a></div><div className="decade-list"><a href="/decade/1980s"><b>1980s</b><span>Foundations</span></a><a href="/decade/1990s"><b>1990s</b><span>The plugin era</span></a><a href="/decade/2000s"><b>2000s</b><span>Virtual analog</span></a><a href="/decade/2010s"><b>2010s</b><span>New standards</span></a></div></div><aside className="news-panel"><div className="section-mini-title"><Sparkles size={16} /> Archive notes</div><article><time>Sep 08, 2026</time><h3>Pro-53 version history expanded with 2005 release notes</h3><a href="/plugin/native-instruments/pro-53">Read update <ArrowRight size={14} /></a></article><article><time>Sep 04, 2026</time><h3>Help identify early Windows screenshots for ReBirth RB-338</h3><a href="#contribute">Contribute evidence <ArrowRight size={14} /></a></article><a className="all-news" href="#news">All archive notes <ArrowRight size={15} /></a></aside></section>
    <section className="contribute-banner" id="contribute"><div><Bookmark size={22} /><p className="eyebrow">Keep the record accurate</p><h2>Know a release date, format,<br />or missing source?</h2></div><div><p>Pluginpedia is built one well-sourced correction at a time.</p><a href="#suggest" className="button-light">Suggest an edit <ArrowRight size={16} /></a></div></section>
    <footer id="about"><a className="wordmark" href="/"><span className="mark">P</span><span>pluginpedia</span><small>archive</small></a><p>A community-driven encyclopedia for audio software history.</p><div><a href="#about">About</a><a href="#guidelines">Editorial guidelines</a><a href="#sources">Sources policy</a><a href="#privacy">Privacy</a></div></footer>
  </main>;
}
