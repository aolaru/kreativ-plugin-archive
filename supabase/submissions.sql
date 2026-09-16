-- Public plugin-developer intake and editor review queue.
create table if not exists public.developer_submissions (
  id uuid primary key default gen_random_uuid(),
  developer_name text not null check (char_length(developer_name) between 1 and 160),
  developer_website text,
  contact_email text not null check (char_length(contact_email) between 3 and 254),
  product_name text not null check (char_length(product_name) between 1 and 160),
  product_type text,
  initial_release_year smallint,
  official_url text not null,
  description text,
  source_url text,
  status public.moderation_status not null default 'pending',
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  check (initial_release_year is null or initial_release_year between 1950 and 2100)
);

-- Safe to run on an archive where the intake table already exists.
alter table public.developer_submissions
  add column if not exists review_note text;

alter table public.developer_submissions enable row level security;
drop policy if exists "anyone can submit plugins" on public.developer_submissions;
drop policy if exists "archive admins review submissions" on public.developer_submissions;
create policy "anyone can submit plugins" on public.developer_submissions for insert to anon, authenticated with check (status = 'pending');
create policy "archive admins review submissions" on public.developer_submissions for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin());
