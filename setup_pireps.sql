-- Create completed_flights table (PIREPs)
create table if not exists completed_flights (
  id uuid default gen_random_uuid() primary key,
  pilot_id uuid references auth.users(id) not null,
  flight_number text not null,
  departure_icao text not null,
  arrival_icao text not null,
  aircraft_type text not null,
  flight_time integer,
  landing_rate integer,
  revenue numeric,
  score integer default 100,
  flight_events jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_completed_flights_pilot on completed_flights(pilot_id);

-- RLS
alter table completed_flights enable row level security;

-- Policies
create policy "Public read all" on completed_flights for select using (true);
create policy "Pilots can insert own" on completed_flights for insert with check (auth.uid() = pilot_id);
