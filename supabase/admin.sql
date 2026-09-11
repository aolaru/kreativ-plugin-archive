-- Pluginpedia editor access
-- Run this once in Supabase SQL Editor before using /admin.

create or replace function public.is_archive_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    left(coalesce(nullif(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9_]', '', 'g'), ''), 'member'), 23) || '_' || left(new.id::text, 8),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_profile();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'developers', 'products', 'categories', 'product_categories', 'formats',
    'product_formats', 'operating_systems', 'product_versions', 'version_formats',
    'version_operating_systems', 'screenshots', 'audio_demos', 'sources',
    'product_sources', 'version_sources', 'product_relationships', 'news'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "archive data is public" on public.%I', table_name);
    execute format('drop policy if exists "archive admins manage data" on public.%I', table_name);
    execute format('create policy "archive data is public" on public.%I for select using (true)', table_name);
    execute format('create policy "archive admins manage data" on public.%I for all to authenticated using (public.is_archive_admin()) with check (public.is_archive_admin())', table_name);
  end loop;
end $$;

-- After signing up through /admin, promote your account once:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_ID';
