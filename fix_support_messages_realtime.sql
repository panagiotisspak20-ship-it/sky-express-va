-- FIX REALTIME FOR SUPPORT_MESSAGES
-- The app uses 'support_messages', not 'ticket_messages'.
-- This script ensures 'support_messages' is configured correctly.

BEGIN;

-- 1. Ensure RLS is enabled
alter table public.support_messages enable row level security;

-- 2. Grant Admins access to support_messages
drop policy if exists "Admins Full Access Support Messages" on public.support_messages;
create policy "Admins Full Access Support Messages" on public.support_messages
  for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) );

-- 3. Grant Users access to their own messages
-- (Assuming standard logic: user can see messages for tickets they own)
drop policy if exists "Users view own support messages" on public.support_messages;
create policy "Users view own support messages" on public.support_messages
  for select
  using (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = support_messages.ticket_id
      and support_tickets.user_id = auth.uid()
    )
  );

drop policy if exists "Users send support messages" on public.support_messages;
create policy "Users send support messages" on public.support_messages
  for insert
  with check (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = support_messages.ticket_id
      and support_tickets.user_id = auth.uid()
    )
  );

-- 4. Ensure it's in the publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

-- 5. Replica Identity
alter table public.support_messages replica identity full;

COMMIT;
