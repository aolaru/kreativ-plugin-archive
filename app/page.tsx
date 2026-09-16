'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

type Product = {
  name: string;
  developer: string;
  developerSlug: string;
  category: string;
  productType: string;
  year: string;
  status: 'Active' | 'Discontinued';
  discontinuedYear?: string;
  slug: string;
  accent: string;
  shortDescription: string;
  formats: string;
  latestVersion: string;
  latestVersionYear?: string;
  updatedAt: string;
  note: string;
  screenshotUrl?: string;
};

type CatalogStats = {
  products: number;
  developers: number;
  contributors: number;
  earliestReleaseYear: number | null;
};

type CatalogCategory = {
  slug: string;
  name: string;
  group: string;
  count: number;
};

const categoryGroups = [
  { name: 'Instruments', slugs: ['synthesizer', 'sampler', 'drum-machine'] },
  { name: 'Effects', slugs: ['reverb', 'delay', 'compressor'] },
  { name: 'Software', slugs: ['daw', 'audio-editor', 'plugin-host'] },
];

const categoryNames: Record<string, string> = {
  synthesizer: 'Synthesizer',
  sampler: 'Sampler',
  'drum-machine': 'Drum Machine',
  reverb: 'Reverb',
  delay: 'Delay',
  compressor: 'Compressor',
  daw: 'DAW',
  'audio-editor': 'Audio Editor',
  'plugin-host': 'Plugin Host',
};

function accentForSlug(slug: string) {
  const accents = ['p53', 'abs', 'b3', 'repro', 'mini', 'operator'];
  const score = Array.from(slug).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return accents[score % accents.length];
}

function relativeUpdate(value: string) {
  if (!value) return 'Recently documented';
  const elapsedDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
  if (elapsedDays === 0) return 'Updated today';
  if (elapsedDays === 1) return 'Updated yesterday';
  if (elapsedDays < 30) return `Updated ${elapsedDays} days ago`;
  return `Updated ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))}`;
}

function archiveDate(value: string) {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function ProductArt({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return (
    <div
      className={`product-art ${product.accent} ${large ? 'large-art' : ''} ${product.screenshotUrl ? 'has-screenshot' : ''}`}
      role="img"
      aria-label={
        product.screenshotUrl
          ? `${product.name} interface screenshot`
          : `Abstract archive illustration for ${product.name}`
      }
    >
      {product.screenshotUrl ? (
        <img
          className="product-screenshot"
          src={product.screenshotUrl}
          alt=""
        />
      ) : (
        <>
          <div className="art-brand">
            {product.developer
              .split(' ')
              .map((word) => word[0])
              .join('')}
          </div>
          <div className="art-screen">
            <span className="art-display">{product.name}</span>
            <div className="art-grid">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="art-controls">
            <b />
            <b />
            <b />
            <b />
          </div>
          <span className="art-label">ARCHIVE ILLUSTRATION</span>
        </>
      )}
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <a
      className="product-card"
      href={`/plugin/${product.developerSlug}/${product.slug}`}
    >
      <ProductArt product={product} />
      <div className="product-card-meta">
        <span className="index">{String(index + 1).padStart(2, '0')}</span>
        <div>
          <h3>{product.name}</h3>
          <p>{product.developer}</p>
        </div>
        <span
          className={`status ${product.status === 'Discontinued' ? 'discontinued' : ''}`}
        >
          {product.status === 'Discontinued' ? 'Archived' : 'Current'}
        </span>
      </div>
      <p className="product-spec">
        {product.category} <b>·</b> {product.year}
      </p>
      <p className="product-note">{product.note}</p>
    </a>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [browseFilters, setBrowseFilters] = useState({
    developer: '',
    type: '',
    format: '',
    status: '',
    decade: '',
  });
  const [catalogStatus, setCatalogStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading');

  useEffect(() => {
    fetch('/api/catalog')
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error('Catalog unavailable')),
      )
      .then((payload) => {
        const mapped = (payload.products ?? []).map((product: any) => {
          const developer = Array.isArray(product.developers)
            ? product.developers[0]
            : product.developers;
          const versions = [...(product.product_versions ?? [])].sort(
            (a: any, b: any) =>
              (b.release_date ?? '').localeCompare(a.release_date ?? ''),
          );
          const latestVersion = versions[0];
          const formats = (product.product_formats ?? [])
            .map((item: any) => item.formats?.code)
            .filter(Boolean)
            .join(' · ');
          const screenshots = [...(product.screenshots ?? [])].sort(
            (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
          );
          return {
            name: product.name,
            slug: product.slug,
            developer: developer?.name ?? 'Unknown developer',
            developerSlug: developer?.slug ?? 'unknown-developer',
            category: product.product_type ?? 'Audio software',
            productType: product.product_type ?? 'Audio software',
            year: product.initial_release_year?.toString() ?? 'Year unknown',
            status:
              product.status === 'discontinued' ? 'Discontinued' : 'Active',
            discontinuedYear: product.discontinued_year?.toString(),
            accent: accentForSlug(product.slug),
            shortDescription:
              product.short_description ??
              'A documented audio software product in the archive.',
            formats: formats || 'Not documented',
            latestVersion: latestVersion?.version_number ?? 'Not documented',
            latestVersionYear: latestVersion?.release_date?.slice(0, 4),
            updatedAt: product.updated_at ?? '',
            note: relativeUpdate(product.updated_at ?? ''),
            screenshotUrl: screenshots[0]?.image_url,
          } satisfies Product;
        });
        setProducts(mapped);
        setStats(payload.stats ?? null);
        setCategories(payload.categories ?? []);
        setCatalogStatus('ready');
      })
      .catch(() => setCatalogStatus('error'));
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('archive-search')?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const featuredProduct =
    products.find((product) => product.slug === 'pro-53') ?? products[0];
  const recentProducts = products
    .filter((product) => product.slug !== featuredProduct?.slug)
    .slice(0, 4);
  const results = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.developer} ${product.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [query, products],
  );
  const browseProducts = useMemo(
    () =>
      products.filter((product) => {
        const year = Number(product.year);
        return (
          (!browseFilters.developer ||
            product.developer === browseFilters.developer) &&
          (!browseFilters.type || product.productType === browseFilters.type) &&
          (!browseFilters.format ||
            product.formats.split(' · ').includes(browseFilters.format)) &&
          (!browseFilters.status || product.status === browseFilters.status) &&
          (!browseFilters.decade ||
            (Number.isFinite(year) &&
              year >= Number(browseFilters.decade) &&
              year < Number(browseFilters.decade) + 10))
        );
      }),
    [browseFilters, products],
  );
  const browseOptions = useMemo(
    () => ({
      developers: [...new Set(products.map((product) => product.developer))].sort(),
      types: [...new Set(products.map((product) => product.productType))].sort(),
      formats: [
        ...new Set(
          products.flatMap((product) =>
            product.formats === 'Not documented'
              ? []
              : product.formats.split(' · '),
          ),
        ),
      ].sort(),
      decades: [...new Set(
        products
          .map((product) => Number(product.year))
          .filter(Number.isFinite)
          .map((year) => Math.floor(year / 10) * 10),
      )].sort((a, b) => a - b),
    }),
    [products],
  );
  const number = new Intl.NumberFormat('en');

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="/">
          <span className="mark">A</span>
          <span>audioplugin.io</span>
          <small>archive</small>
        </a>
        <nav
          id="primary-navigation"
          className={menuOpen ? 'mobile-nav open' : 'mobile-nav'}
          aria-label="Primary navigation"
        >
          <a href="#browse">Browse</a>
          <a href="#recent">Recent changes</a>
          <a href="/status/discontinued">Discontinued</a>
          <a href="#about">About</a>
        </nav>
        <div className="header-actions">
          <a className="contribute" href="/submit">
            Submit a plugin
          </a>
          <a className="contribute" href="/admin">
            Editor access
          </a>
          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <section className="masthead">
        <div className="mast-copy">
          <p className="eyebrow">A community-maintained historical archive</p>
          <h1>
            Audio software,
            <br />
            <em>with a past.</em>
          </h1>
          <p className="intro">
            A factual, evolving record of the instruments, effects, and tools
            that shaped recorded music.
          </p>
        </div>
        <div className="search-panel">
          <label htmlFor="archive-search">Search the archive</label>
          <div className="search-box">
            <Search size={20} />
            <input
              id="archive-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “Pro-53”, “reverb”, or a developer"
              autoComplete="off"
            />
            <kbd>⌘ K</kbd>
          </div>
          <p>
            {catalogStatus === 'error'
              ? 'The live catalog is temporarily unavailable.'
              : 'Search products, developers, and instrument types.'}
          </p>
          {query && (
            <div className="search-results" aria-live="polite">
              <span>
                {results.length} product{results.length === 1 ? '' : 's'}{' '}
                matching “{query}”
              </span>
              {results.length ? (
                results.slice(0, 8).map((product) => (
                  <a
                    key={`${product.developerSlug}-${product.slug}`}
                    href={`/plugin/${product.developerSlug}/${product.slug}`}
                  >
                    <b>{product.name}</b>
                    <small>
                      {product.developer} · {product.year}
                    </small>
                    <ChevronRight size={15} />
                  </a>
                ))
              ) : (
                <p>
                  {catalogStatus === 'loading'
                    ? 'Loading the archive…'
                    : 'No archive entries match that search yet.'}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      <section className="archive-stats" aria-label="Live archive totals">
        <span>
          <b>{stats ? number.format(stats.products) : '—'}</b> products indexed
        </span>
        <span>
          <b>{stats ? number.format(stats.developers) : '—'}</b> developers
          documented
        </span>
        <span>
          <b>
            {stats?.earliestReleaseYear
              ? `${stats.earliestReleaseYear}–today`
              : '—'}
          </b>{' '}
          release history
        </span>
        <span>
          <b>{stats ? number.format(stats.contributors) : '—'}</b> community
          contributors
        </span>
      </section>

      <section className="content-section feature-section" id="featured">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured archive entry</p>
            <h2>
              {featuredProduct?.slug === 'pro-53' ? (
                <>
                  A living record of
                  <br />
                  the <em>Prophet-5</em> legacy.
                </>
              ) : featuredProduct ? (
                <>
                  A closer look at
                  <br />
                  <em>{featuredProduct.name}</em>.
                </>
              ) : (
                'Loading the featured record…'
              )}
            </h2>
          </div>
          {featuredProduct && (
            <a
              href={`/plugin/${featuredProduct.developerSlug}/${featuredProduct.slug}`}
              className="text-link"
            >
              View complete entry <ArrowRight size={16} />
            </a>
          )}
        </div>
        {featuredProduct ? (
          <div className="feature-entry">
            <div className="feature-art">
              <ProductArt product={featuredProduct} large />
            </div>
            <article className="feature-copy">
              <div className="entry-kicker">
                <span
                  className={`status ${featuredProduct.status === 'Discontinued' ? 'discontinued' : ''}`}
                >
                  {featuredProduct.status}
                </span>
                <span>
                  {featuredProduct.year}
                  {featuredProduct.discontinuedYear
                    ? `–${featuredProduct.discontinuedYear}`
                    : '–today'}
                </span>
              </div>
              <h3>
                {featuredProduct.developer}
                <br />
                <strong>{featuredProduct.name}</strong>
              </h3>
              <p>{featuredProduct.shortDescription}</p>
              <dl>
                <div>
                  <dt>Type</dt>
                  <dd>{featuredProduct.productType}</dd>
                </div>
                <div>
                  <dt>Formats</dt>
                  <dd>{featuredProduct.formats}</dd>
                </div>
                <div>
                  <dt>Latest version</dt>
                  <dd>
                    {featuredProduct.latestVersion}{' '}
                    {featuredProduct.latestVersionYear && (
                      <small>{featuredProduct.latestVersionYear}</small>
                    )}
                  </dd>
                </div>
              </dl>
              <a
                className="entry-link"
                href={`/plugin/${featuredProduct.developerSlug}/${featuredProduct.slug}`}
              >
                Explore entry <ArrowRight size={17} />
              </a>
            </article>
          </div>
        ) : (
          <div className="catalog-loading" role="status">
            {catalogStatus === 'error'
              ? 'The featured record could not be loaded.'
              : 'Loading the archive…'}
          </div>
        )}
      </section>

      <section className="content-section recent-section" id="recent">
        <div className="section-heading">
          <div>
            <p className="eyebrow">New & revised</p>
            <h2>Recently in the archive</h2>
          </div>
          <a href="#browse" className="text-link">
            Browse the collection <ArrowRight size={16} />
          </a>
        </div>
        {recentProducts.length ? (
          <div className="product-grid">
            {recentProducts.map((product, index) => (
              <ProductCard
                key={`${product.developerSlug}-${product.slug}`}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="catalog-loading" role="status">
            {catalogStatus === 'error'
              ? 'Recent records could not be loaded.'
              : 'Loading recent records…'}
          </div>
        )}
      </section>

      <section className="content-section browse-section" id="browse">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explore the collection</p>
            <h2>Browse by category</h2>
          </div>
          <p className="section-note">
            Software organized by function, history, and the people who made it.
          </p>
        </div>
        <div className="category-columns">
          {categoryGroups.map((group) => (
            <div key={group.name}>
              <h3>{group.name}</h3>
              {group.slugs.map((slug) => {
                const category = categories.find((item) => item.slug === slug);
                return (
                  <a key={slug} href={`/category/${slug}`}>
                    <span>{category?.name ?? categoryNames[slug]}</span>
                    <small>
                      {catalogStatus === 'ready'
                        ? `${category?.count ?? 0} ${(category?.count ?? 0) === 1 ? 'entry' : 'entries'}`
                        : '—'}
                    </small>
                    <ArrowRight size={15} />
                  </a>
                );
              })}
            </div>
          ))}
        </div>
        <div className="archive-browser" aria-label="Filter archive entries">
          <div className="browser-heading">
            <div>
              <p className="eyebrow">Full catalog</p>
              <h3>Find a specific release</h3>
            </div>
            <span>{browseProducts.length} matching entries</span>
          </div>
          <div className="browser-filters">
            <label>Developer<select value={browseFilters.developer} onChange={(event) => setBrowseFilters({ ...browseFilters, developer: event.target.value })}><option value="">All developers</option>{browseOptions.developers.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Type<select value={browseFilters.type} onChange={(event) => setBrowseFilters({ ...browseFilters, type: event.target.value })}><option value="">All types</option>{browseOptions.types.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Format<select value={browseFilters.format} onChange={(event) => setBrowseFilters({ ...browseFilters, format: event.target.value })}><option value="">All formats</option>{browseOptions.formats.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Status<select value={browseFilters.status} onChange={(event) => setBrowseFilters({ ...browseFilters, status: event.target.value })}><option value="">All statuses</option><option value="Active">Current</option><option value="Discontinued">Archived</option></select></label>
            <label>Decade<select value={browseFilters.decade} onChange={(event) => setBrowseFilters({ ...browseFilters, decade: event.target.value })}><option value="">All decades</option>{browseOptions.decades.map((value) => <option key={value} value={value}>{value}s</option>)}</select></label>
            <button type="button" onClick={() => setBrowseFilters({ developer: '', type: '', format: '', status: '', decade: '' })}>Clear filters</button>
          </div>
          <div className="browser-results">
            {browseProducts.length ? browseProducts.map((product) => (
              <a key={`browse-${product.developerSlug}-${product.slug}`} href={`/plugin/${product.developerSlug}/${product.slug}`}>
                <span>{product.year}</span><b>{product.name}</b><span>{product.developer}</span><small>{product.productType} · {product.formats}</small><ArrowRight size={15}/>
              </a>
            )) : <p className="empty-state">No entries match those filters yet.</p>}
          </div>
        </div>
      </section>

      <section className="content-section split-section">
        <div className="vintage-panel">
          <div>
            <p className="eyebrow">History is not obsolete</p>
            <h2>
              Discontinued,
              <br />
              <em>not forgotten.</em>
            </h2>
            <p>
              Browse software that left the market but remains part of the
              musical record.
            </p>
            <a href="/status/discontinued" className="dark-link">
              Explore the archive <ArrowRight size={16} />
            </a>
          </div>
          <div className="decade-list">
            <a href="/decade/1980s">
              <b>1980s</b>
              <span>Foundations</span>
            </a>
            <a href="/decade/1990s">
              <b>1990s</b>
              <span>The plugin era</span>
            </a>
            <a href="/decade/2000s">
              <b>2000s</b>
              <span>Virtual analog</span>
            </a>
            <a href="/decade/2010s">
              <b>2010s</b>
              <span>New standards</span>
            </a>
          </div>
        </div>
        <aside className="news-panel">
          <div className="section-mini-title">
            <Sparkles size={16} /> Recent archive activity
          </div>
          {recentProducts.slice(0, 2).map((product) => (
            <article key={`activity-${product.developerSlug}-${product.slug}`}>
              <time dateTime={product.updatedAt}>
                {archiveDate(product.updatedAt)}
              </time>
              <h3>{product.name} archive record added or revised</h3>
              <a href={`/plugin/${product.developerSlug}/${product.slug}`}>
                Read entry <ArrowRight size={14} />
              </a>
            </article>
          ))}
          {!recentProducts.length && (
            <p className="activity-empty">Recent activity is loading.</p>
          )}
          <a className="all-news" href="#recent">
            See recent records <ArrowRight size={15} />
          </a>
        </aside>
      </section>
      <section className="contribute-banner" id="contribute">
        <div>
          <Bookmark size={22} />
          <p className="eyebrow">Keep the record accurate</p>
          <h2>
            Know a release date, format,
            <br />
            or missing source?
          </h2>
        </div>
        <div>
          <p>audioplugin.io is built one well-sourced correction at a time.</p>
          <a href="/submit" className="button-light">
            Submit a plugin <ArrowRight size={16} />
          </a>
        </div>
      </section>
      <footer id="about">
        <a className="wordmark" href="/">
          <span className="mark">A</span>
          <span>audioplugin.io</span>
          <small>archive</small>
        </a>
        <p>A community-driven encyclopedia for audio software history.</p>
        <div>
          <a href="#about">About</a>
          <a href="#guidelines">Editorial guidelines</a>
          <a href="#sources">Sources policy</a>
          <a href="#privacy">Privacy</a>
        </div>
      </footer>
    </main>
  );
}
