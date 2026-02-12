-- FINAL FIX FOR REALTIME UPDATES (Corrected)
-- Run this script to RESET and FIX all permissions and realtime settings.

BEGIN;

-- 1. Ensure Tables Exist
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  subject text not null,
  message text not null,
  status text check (status in ('open', 'resolved', 'closed')) default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- 3. DROP ALL EXISTING POLICIES (Clean Slate)
drop policy if exists "Admin read all" on public.support_tickets;
drop policy if exists "Admins Full Access Tickets" on public.support_tickets;
drop policy if exists "Users can delete own tickets" on public.support_tickets;
drop policy if exists "Users can view own tickets" on public.support_tickets;
drop policy if exists "Users can create tickets" on public.support_tickets;

drop policy if exists "Admins Full Access Messages" on public.ticket_messages;
drop policy if exists "Users view own ticket messages" on public.ticket_messages;
drop policy if exists "Users send messages to own tickets" on public.ticket_messages;

drop policy if exists "admin_full_access_tickets" on public.support_tickets;
drop policy if exists "user_view_own_tickets" on public.support_tickets;
drop policy if exists "user_create_tickets" on public.support_tickets;
drop policy if exists "user_delete_own_tickets" on public.support_tickets;
drop policy if exists "admin_full_access_messages" on public.ticket_messages;
drop policy if exists "user_view_messages" on public.ticket_messages;
drop policy if exists "user_send_messages" on public.ticket_messages;

-- 4. RE-CREATE POLICIES

-- SUPPORT TICKETS
-- Admin: Full Access
create policy "admin_full_access_tickets" on public.support_tickets
  for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) );

-- User: View/Edit Own
create policy "user_view_own_tickets" on public.support_tickets
  for select using ( auth.uid() = user_id );

create policy "user_create_tickets" on public.support_tickets
  for insert with check ( auth.uid() = user_id );

create policy "user_delete_own_tickets" on public.support_tickets
  for delete using ( auth.uid() = user_id );

-- TICKET MESSAGES
-- Admin: Full Access
create policy "admin_full_access_messages" on public.ticket_messages
  for all
  using ( exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) );

-- User: View Messages for their tickets
create policy "user_view_messages" on public.ticket_messages
  for select
  using (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = ticket_messages.ticket_id
      and support_tickets.user_id = auth.uid()
    )
  );

-- User: Send Messages to their tickets
create policy "user_send_messages" on public.ticket_messages
  for insert
  with check (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = ticket_messages.ticket_id
      and support_tickets.user_id = auth.uid()
    )
  );

-- 5. REALTIME PUBLICATION
-- Done via DO blocks to avoid errors if already added
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Ignore if already exists
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- Ignore if already exists
END;
$$;

-- Set Replica Identity
alter table public.support_tickets replica identity full;
alter table public.ticket_messages replica identity full;

COMMIT;
