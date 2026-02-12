-- Create RANKS table
create table if not exists public.ranks (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  min_hours integer not null,
  image_url text, -- optional epaulette image
  pay_rate numeric default 100, -- hourly salary
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.ranks enable row level security;
create policy "Ranks are viewable by everyone" on public.ranks for select using (true);
create policy "Ranks insertable by admins" on public.ranks for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Seed Ranks
INSERT INTO public.ranks (name, min_hours, pay_rate) VALUES
('Cadet', 0, 100),
('Second Officer', 10, 250),
('First Officer', 50, 600),
('Senior First Officer', 150, 1200),
('Captain', 300, 2500),
('Senior Captain', 600, 5000)
ON CONFLICT DO NOTHING;

-- Update PROFILES to link to ranks
-- We will store rank_id. If missing, we assume lowest rank.
alter table public.profiles 
add column if not exists rank_id uuid references public.ranks(id);

-- Update existing profiles to have the default rank (Cadet) if null
DO $$
DECLARE
  cadet_id uuid;
BEGIN
  SELECT id INTO cadet_id FROM public.ranks WHERE name = 'Cadet' LIMIT 1;
  
  UPDATE public.profiles 
  SET rank_id = cadet_id 
  WHERE rank_id IS NULL;
END $$;
