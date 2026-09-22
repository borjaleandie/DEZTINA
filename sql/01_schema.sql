-- =========================================================
-- DESTINA — Database Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor)
-- =========================================================

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. PROFILES
-- Mirrors auth.users, adds app-specific fields (role, name, avatar)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null default '',
  email        text not null,
  avatar_url   text,
  role         text not null default 'user' check (role in ('user', 'admin')),
  status       text not null default 'active' check (status in ('active', 'disabled')),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2. CATEGORIES
-- ---------------------------------------------------------
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  description  text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. DESTINATIONS
-- ---------------------------------------------------------
create table if not exists public.destinations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text not null default '',
  location        text not null,           -- e.g. "Palawan, Philippines"
  address         text,
  category_id     uuid references public.categories(id) on delete set null,
  image_url       text,
  latitude        double precision not null,
  longitude       double precision not null,
  contact         text,
  opening_hours   text,
  entrance_fee    text,
  website         text,
  status          text not null default 'published' check (status in ('published', 'draft')),
  popularity      integer not null default 0,  -- incremented on views/favorites, used by recommender
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_destinations_category on public.destinations(category_id);
create index if not exists idx_destinations_status on public.destinations(status);

-- ---------------------------------------------------------
-- 4. FAVORITES
-- ---------------------------------------------------------
create table if not exists public.favorites (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  destination_id  uuid not null references public.destinations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (user_id, destination_id)
);

-- ---------------------------------------------------------
-- 5. REVIEWS
-- ---------------------------------------------------------
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  destination_id  uuid not null references public.destinations(id) on delete cascade,
  rating          integer not null check (rating between 1 and 5),
  comment         text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, destination_id) -- one review per user per destination
);

create index if not exists idx_reviews_destination on public.reviews(destination_id);
create index if not exists idx_reviews_user on public.reviews(user_id);

-- ---------------------------------------------------------
-- 6. updated_at auto-touch trigger
-- ---------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_destinations_updated_at on public.destinations;
create trigger trg_destinations_updated_at
before update on public.destinations
for each row execute function public.touch_updated_at();

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------
-- 7. Auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- 8. Convenience view: destinations with average rating + review count
-- ---------------------------------------------------------
create or replace view public.destination_stats as
select
  d.id as destination_id,
  coalesce(avg(r.rating), 0)::numeric(3,2) as avg_rating,
  count(r.id) as review_count
from public.destinations d
left join public.reviews r on r.destination_id = d.id
group by d.id;
