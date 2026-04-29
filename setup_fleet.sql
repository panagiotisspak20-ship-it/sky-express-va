-- Create Fleet Table
create table if not exists public.fleet (
  id uuid default gen_random_uuid() primary key,
  registration text not null unique,
  type text not null,
  hub text not null, -- ICAO
  current_location text not null, -- ICAO
  total_hours float default 0,
  status text default 'Available', -- Available, In Flight, Maintenance
  condition int default 100,
  last_maintenance timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.fleet enable row level security;

-- Policies
drop policy if exists "Fleet is viewable by everyone" on public.fleet;
create policy "Fleet is viewable by everyone"
  on public.fleet for select
  using (true);

drop policy if exists "Admins can insert fleet" on public.fleet;
create policy "Admins can insert fleet"
  on public.fleet for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can update fleet" on public.fleet;
create policy "Admins can update fleet"
  on public.fleet for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can delete fleet" on public.fleet;
create policy "Admins can delete fleet"
  on public.fleet for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );
