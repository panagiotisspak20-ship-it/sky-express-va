-- Create support_messages table if missing
create table if not exists support_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table support_messages enable row level security;
create policy "Read access" on support_messages for select using (true);
create policy "Insert access" on support_messages for insert with check (auth.uid() = sender_id);
