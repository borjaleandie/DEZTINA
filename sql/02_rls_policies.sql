-- =========================================================
-- DESTINA — Row Level Security Policies
-- Run AFTER 01_schema.sql
-- =========================================================

-- Enable RLS on every table
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.destinations enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_admin_update_any" on public.profiles;
create policy "profiles_admin_update_any"
on public.profiles for update
using (public.is_admin());

-- ---------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
on public.categories for select
using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
on public.categories for insert
with check (public.is_admin());

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update"
on public.categories for update
using (public.is_admin());

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete"
on public.categories for delete
using (public.is_admin());

-- ---------------------------------------------------------
-- DESTINATIONS
-- ---------------------------------------------------------
drop policy if exists "destinations_select_all" on public.destinations;
create policy "destinations_select_all"
on public.destinations for select
using (true);

drop policy if exists "destinations_admin_insert" on public.destinations;
create policy "destinations_admin_insert"
on public.destinations for insert
with check (public.is_admin());

drop policy if exists "destinations_admin_update" on public.destinations;
create policy "destinations_admin_update"
on public.destinations for update
using (public.is_admin());

drop policy if exists "destinations_admin_delete" on public.destinations;
create policy "destinations_admin_delete"
on public.destinations for delete
using (public.is_admin());

-- ---------------------------------------------------------
-- FAVORITES
-- ---------------------------------------------------------
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites for select
using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites for insert
with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites for delete
using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
on public.reviews for select
using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
on public.reviews for insert
with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own_or_admin" on public.reviews;
create policy "reviews_update_own_or_admin"
on public.reviews for update
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin"
on public.reviews for delete
using (auth.uid() = user_id or public.is_admin());
