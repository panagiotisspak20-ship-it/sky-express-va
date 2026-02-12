-- FIX PROFILES RLS FOR ADMIN CHECK
-- The admin check relies on reading the 'profiles' table.
-- If users cannot read their own profile, the check fails silently.

-- 1. Ensure RLS is enabled on profiles (it likely is)
alter table public.profiles enable row level security;

-- 2. Allow users to read their OWN profile
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  using ( auth.uid() = id );

-- 3. Allow admins to read ALL profiles (needed for User Management tab anyway)
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles
  for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) );

-- 4. Re-run publication setup just in case
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

COMMIT;
