-- Friend Request Tables
create table if not exists friend_requests (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sender_id, receiver_id)
);

-- RLS
alter table friend_requests enable row level security;
create policy "Read requests" on friend_requests for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Send requests" on friend_requests for insert with check (auth.uid() = sender_id);
create policy "Update requests" on friend_requests for update using (auth.uid() = receiver_id);
create policy "Delete requests" on friend_requests for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);
