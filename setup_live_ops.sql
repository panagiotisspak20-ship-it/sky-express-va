-- Create ACTIVE_FLIGHTS table for live tracking
create table if not exists public.active_flights (
  id uuid default uuid_generate_v4() primary key,
  pilot_id uuid references public.profiles(id) on delete cascade not null,
  flight_number text,
  aircraft text,
  departure text,
  arrival text,
  latitude double precision,
  longitude double precision,
  altitude integer,
  speed integer,
  heading integer,
  phase text,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one active record per pilot
  constraint unique_active_pilot unique (pilot_id)
);

-- RLS
alter table public.active_flights enable row level security;

-- Everyone can view active flights
create policy "Active flights are viewable by everyone" 
on public.active_flights for select using (true);

-- Pilots can insert/update their OWN active flight
create policy "Pilots can manage their own active flight" 
on public.active_flights for all using (auth.uid() = pilot_id);

-- Index for performance (filtering by liveness)
create index if not exists idx_active_flights_updated on public.active_flights(last_updated);

-- RPC to cleanup stale flights (optional, can be called by client or cron)
create or replace function cleanup_stale_flights()
returns void as $$
begin
  -- Delete flights not updated in last 10 minutes
  delete from public.active_flights
  where last_updated < (now() - interval '10 minutes');
end;
$$ language plpgsql security definer;
