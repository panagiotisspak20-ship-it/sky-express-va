-- RESTORE PROFILES VISIBILITY
-- Don't worry! Your data is SAFE. It was just "hidden" by the security policy.
-- This script opens up "Read" access to everyone so you can see the profiles again.

-- 1. Restore Public Read Access to Profiles
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Public profiles" on public.profiles;

create policy "Public profiles"
  on public.profiles
  for select
  using ( true );

-- 2. Restore Insert/Update for users (so you can save settings)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using ( auth.uid() = id );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check ( auth.uid() = id );
