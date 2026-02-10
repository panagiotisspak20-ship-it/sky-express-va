-- Social Hub Tables

-- 1. Social Connections (Follows/Friends)
create table if not exists social_connections (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users(id) not null,
  following_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

-- RLS
alter table social_connections enable row level security;
create policy "Read public" on social_connections for select using (true);
create policy "User can follow" on social_connections for insert with check (auth.uid() = follower_id);
create policy "User can unfollow" on social_connections for delete using (auth.uid() = follower_id);

-- 2. Direct Messages (Simple)
create table if not exists direct_messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table direct_messages enable row level security;
create policy "Read own messages" on direct_messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Send messages" on direct_messages for insert with check (auth.uid() = sender_id);
