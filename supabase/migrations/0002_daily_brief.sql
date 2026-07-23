-- ============================================================================
-- Daily Brief — personal task tracker & metrics
-- ============================================================================

-- Tasks (daily to-dos) -------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  done boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tasks_created_idx on public.tasks (created_at desc);

-- Trackers (counters e.g. "Songs written") ----------------------------------
create table if not exists public.trackers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value integer not null default 0,
  unit text,
  category text,
  updated_at timestamptz not null default now()
);

-- Row Level Security ---------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.trackers enable row level security;

-- Single-user personal dashboard: allow read/write for authenticated users.
-- Tighten these (e.g. scope by owner id) before multi-user production use.
drop policy if exists "tasks_all_authenticated" on public.tasks;
create policy "tasks_all_authenticated" on public.tasks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "trackers_all_authenticated" on public.trackers;
create policy "trackers_all_authenticated" on public.trackers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
