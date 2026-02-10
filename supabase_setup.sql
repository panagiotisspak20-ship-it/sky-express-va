-- Create tables
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  callsign text unique,
  home_base text,
  flight_hours numeric default 0,
  balance numeric default 0,
  updated_at timestamp with time zone
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );
