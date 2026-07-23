-- ============================================================================
-- Tortuca — ECS Network shared backend schema
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Profiles (mirrors auth.users) ----------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

-- Blog / CMS posts -----------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  author text not null default 'ECS Editorial',
  published boolean not null default false,
  published_at timestamptz not null default now(),
  cover_image text,
  tags text[],
  created_at timestamptz not null default now()
);

create index if not exists posts_published_idx
  on public.posts (published, published_at desc);

-- Contact submissions --------------------------------------------------------
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  created_at timestamptz not null default now()
);

-- Orders (tracking) ----------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  customer_email text not null,
  total numeric(10, 2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'processing',
  created_at timestamptz not null default now()
);

-- Row Level Security ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.orders enable row level security;

-- Profiles: a user can read and update their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Posts: published posts are readable by anyone.
drop policy if exists "posts_select_published" on public.posts;
create policy "posts_select_published" on public.posts
  for select using (published = true);

-- Contact submissions: anyone may submit; only service role reads (bypasses RLS).
drop policy if exists "contact_insert_anon" on public.contact_submissions;
create policy "contact_insert_anon" on public.contact_submissions
  for insert with check (true);

-- Auto-create a profile row when a new auth user signs up -------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
