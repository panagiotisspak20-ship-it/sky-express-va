-- Add flight_data JSONB column to persist all extended flight summary details
alter table public.completed_flights
add column if not exists flight_data jsonb default '{}'::jsonb;

-- Comment on column
comment on column public.completed_flights.flight_data is 'Stores the complete rich logEntry object so no data is lost on history fetch';
