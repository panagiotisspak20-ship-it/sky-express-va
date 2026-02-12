-- Admin Support Permissions Fix
-- Run this to ensure Admins can see/reply to tickets in Realtime

-- 1. Ensure RLS is explicitly enabled
alter table support_tickets enable row level security;
-- assuming ticket_messages exists
create table if not exists ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table ticket_messages enable row level security;

-- 2. Admin Policy for Support Tickets (ALL actions: Select, Update, Delete)
drop policy if exists "Admins Full Access Tickets" on support_tickets;
create policy "Admins Full Access Tickets" on support_tickets
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- 3. Admin Policy for Ticket Messages (ALL actions)
drop policy if exists "Admins Full Access Messages" on ticket_messages;
create policy "Admins Full Access Messages" on ticket_messages
  for all
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- 4. Ensure Users can view/reply to THEIR OWN ticket messages
-- (Use IF NOT EXISTS logic via checking names, or just drop/recreate to be safe)
drop policy if exists "Users view own ticket messages" on ticket_messages;
create policy "Users view own ticket messages" on ticket_messages
  for select
  using (
    exists (
      select 1 from support_tickets
      where support_tickets.id = ticket_messages.ticket_id
      and support_tickets.user_id = auth.uid()
    )
  );

drop policy if exists "Users send messages to own tickets" on ticket_messages;
create policy "Users send messages to own tickets" on ticket_messages
  for insert
  with check (
    exists (
      select 1 from support_tickets
      where support_tickets.id = ticket_messages.ticket_id
      and support_tickets.user_id = auth.uid()
    )
  );
