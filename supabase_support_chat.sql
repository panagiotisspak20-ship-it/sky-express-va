-- Support System Tables
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  subject text not null,
  message text not null, -- Initial message content logic
  status text check (status in ('open', 'resolved', 'closed')) default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table support_tickets enable row level security;
create policy "Users can view own tickets" on support_tickets for select using (auth.uid() = user_id);
create policy "Users can create tickets" on support_tickets for insert with check (auth.uid() = user_id);
