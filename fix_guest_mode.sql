-- FIX GUEST MODE (Final Attempt)
-- This script ensures complete public access to Profiles and Ranks to fix the "Guest" issue.

BEGIN;

-- 1. RANKS
alter table public.ranks enable row level security;
drop policy if exists "Ranks are viewable by everyone" on public.ranks;
create policy "Ranks are viewable by everyone" on public.ranks for select using (true);

-- 2. PROFILES
alter table public.profiles enable row level security;
drop policy if exists "Public profiles" on public.profiles;
create policy "Public profiles" on public.profiles for select using (true);

-- 3. UPDATES (For settings/customization)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

COMMIT;
