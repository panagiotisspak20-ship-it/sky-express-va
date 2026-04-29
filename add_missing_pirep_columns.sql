-- Add ALL missing columns to completed_flights table for full PIREP support
alter table public.completed_flights
add column if not exists distance numeric default 0,
add column if not exists max_bank numeric default 0,
add column if not exists max_g numeric default 1,
add column if not exists landing_lights_penalty boolean default false,
add column if not exists flight_path jsonb default '[]'::jsonb,
add column if not exists landing_data jsonb default '[]'::jsonb;
