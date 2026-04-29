-- Add columns for Advanced Flight Analysis
alter table public.completed_flights 
add column if not exists flight_path jsonb default '[]'::jsonb,
add column if not exists landing_data jsonb default '[]'::jsonb;

-- Comment on columns
comment on column public.completed_flights.flight_path is 'Array of {lat, lng, alt, speed, heading, timestamp} recorded during flight';
comment on column public.completed_flights.landing_data is 'High frequency array of {alt, vs, g, timestamp} during last 500ft';
