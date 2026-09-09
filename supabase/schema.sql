-- Pluginpedia V1: PostgreSQL / Supabase schema
-- Auth identity is owned by auth.users; profiles holds application-facing data.
create type public.user_role as enum ('user', 'moderator', 'admin');
create type public.product_status as enum ('active', 'discontinued');
create type public.release_status as enum ('released', 'beta', 'alpha', 'cancelled');
create type public.source_type as enum ('official_website', 'archived_official_website', 'manual', 'magazine_article', 'news_article', 'review', 'documentation', 'other');
create type public.demo_source_type as enum ('hosted', 'youtube', 'soundcloud', 'official_external', 'other_external');
create type public.demo_type as enum ('official', 'community', 'factory_presets', 'sound_design', 'standardized_archive_demo', 'other');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.relationship_type as enum ('predecessor', 'successor', 'inspired_by', 'alternative', 'same_family', 'bundled_with');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,32}$'),
  display_name text not null, avatar_url text, role public.user_role not null default 'user', joined_at timestamptz not null default now()
);
create table public.developers (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null unique, description text, founded_year smallint, country text, website_url text, logo_url text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(), developer_id uuid not null references public.developers(id) on delete restrict,
  slug text not null, name text not null, product_type text, status public.product_status not null default 'active', initial_release_year smallint,
  discontinued_year smallint, short_description text, overview text, official_url text, archived_url text, thumbnail_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (developer_id, slug),
  check (discontinued_year is null or initial_release_year is null or discontinued_year >= initial_release_year)
);
create table public.categories (id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null unique, group_name text not null check (group_name in ('instrument', 'effect', 'software')));
create table public.product_categories (product_id uuid references public.products(id) on delete cascade, category_id uuid references public.categories(id) on delete restrict, primary key (product_id, category_id));
create table public.formats (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null unique);
create table public.product_formats (product_id uuid references public.products(id) on delete cascade, format_id uuid references public.formats(id) on delete restrict, primary key (product_id, format_id));
create table public.operating_systems (id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null unique);
create table public.product_versions (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, version_number text not null,
  release_date date, notes text, cpu_architecture text, release_status public.release_status not null default 'released', created_at timestamptz not null default now(), unique(product_id, version_number)
);
create table public.version_formats (version_id uuid references public.product_versions(id) on delete cascade, format_id uuid references public.formats(id) on delete restrict, primary key (version_id, format_id));
create table public.version_operating_systems (version_id uuid references public.product_versions(id) on delete cascade, operating_system_id uuid references public.operating_systems(id) on delete restrict, primary key (version_id, operating_system_id));
create table public.screenshots (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, version_id uuid references public.product_versions(id) on delete set null, image_url text not null, caption text, source_url text, attribution text, sort_order integer not null default 0, created_at timestamptz not null default now());
create table public.audio_demos (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, version_id uuid references public.product_versions(id) on delete set null, title text not null, description text, source_type public.demo_source_type not null, url text, hosted_audio_url text, contributor_id uuid references public.profiles(id) on delete set null, demo_type public.demo_type not null, created_at timestamptz not null default now(), check (url is not null or hosted_audio_url is not null));
create table public.sources (id uuid primary key default gen_random_uuid(), title text not null, url text not null, publisher text, publication_date date, accessed_date date, notes text, source_type public.source_type not null, created_at timestamptz not null default now(), unique(url));
create table public.product_sources (product_id uuid references public.products(id) on delete cascade, source_id uuid references public.sources(id) on delete cascade, primary key (product_id, source_id));
create table public.version_sources (version_id uuid references public.product_versions(id) on delete cascade, source_id uuid references public.sources(id) on delete cascade, primary key (version_id, source_id));
create table public.comments (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, parent_id uuid references public.comments(id) on delete cascade, body text not null check (char_length(body) between 1 and 5000), moderation_status public.moderation_status not null default 'pending', created_at timestamptz not null default now());
create table public.comment_votes (comment_id uuid references public.comments(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, created_at timestamptz not null default now(), primary key (comment_id, user_id));
create table public.product_signals (product_id uuid references public.products(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, signal text not null check (signal in ('used_this', 'still_use_this', 'love_it')), created_at timestamptz not null default now(), primary key (product_id, user_id, signal));
create table public.edit_suggestions (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, proposed_change text not null, explanation text, source_url text, status public.moderation_status not null default 'pending', created_at timestamptz not null default now(), reviewed_by uuid references public.profiles(id), reviewed_at timestamptz);
create table public.product_relationships (product_id uuid references public.products(id) on delete cascade, related_product_id uuid references public.products(id) on delete cascade, relationship public.relationship_type not null, primary key (product_id, related_product_id, relationship), check (product_id <> related_product_id));
create table public.news (id uuid primary key default gen_random_uuid(), title text not null, short_summary text not null, source_website text, original_url text not null, published_at timestamptz, created_at timestamptz not null default now());

create index products_search_idx on public.products using gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(short_description,'') || ' ' || coalesce(overview,'')));
create index products_developer_status_year_idx on public.products (developer_id, status, initial_release_year);
create index versions_product_date_idx on public.product_versions (product_id, release_date desc);
create index comments_product_status_idx on public.comments (product_id, moderation_status, created_at desc);
create index screenshots_product_sort_idx on public.screenshots (product_id, sort_order);

alter table public.profiles enable row level security; alter table public.comments enable row level security; alter table public.edit_suggestions enable row level security;
create policy "public profiles are readable" on public.profiles for select using (true);
create policy "approved comments are readable" on public.comments for select using (moderation_status = 'approved' or auth.uid() = user_id);
create policy "signed in users create comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "users read own suggestions" on public.edit_suggestions for select using (auth.uid() = user_id);
create policy "signed in users suggest edits" on public.edit_suggestions for insert to authenticated with check (auth.uid() = user_id);
