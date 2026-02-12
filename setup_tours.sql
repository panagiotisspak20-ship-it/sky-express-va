-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. TOURS Table
create table if not exists public.tours (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  badge_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for tours
alter table public.tours enable row level security;
create policy "Tours are viewable by everyone" on public.tours for select using (true);
create policy "Tours are insertable by admins only" on public.tours for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- 2. TOUR LEGS Table
create table if not exists public.tour_legs (
  id uuid default uuid_generate_v4() primary key,
  tour_id uuid references public.tours(id) on delete cascade not null,
  sequence_order integer not null,
  departure_icao text not null,
  arrival_icao text not null,
  leg_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for tour_legs
alter table public.tour_legs enable row level security;
create policy "Tour legs are viewable by everyone" on public.tour_legs for select using (true);
create policy "Tour legs are insertable by admins only" on public.tour_legs for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- 3. PILOT TOURS (Progress Tracking)
create table if not exists public.pilot_tours (
  id uuid default uuid_generate_v4() primary key,
  pilot_id uuid references public.profiles(id) on delete cascade not null,
  tour_id uuid references public.tours(id) on delete cascade not null,
  current_leg_order integer default 1,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  status text default 'in-progress', -- 'in-progress' | 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(pilot_id, tour_id)
);

-- RLS for pilot_tours
alter table public.pilot_tours enable row level security;
create policy "Pilots can view their own tour progress" on public.pilot_tours for select using (auth.uid() = pilot_id);
create policy "Pilots can join tours (insert own)" on public.pilot_tours for insert with check (auth.uid() = pilot_id);
create policy "Pilots can update their own tour progress" on public.pilot_tours for update using (auth.uid() = pilot_id);

-- 4. PILOT BADGES (Awards)
create table if not exists public.pilot_badges (
  id uuid default uuid_generate_v4() primary key,
  pilot_id uuid references public.profiles(id) on delete cascade not null,
  badge_name text not null,
  badge_image_url text,
  tour_id uuid references public.tours(id) on delete set null, -- Optional link to source tour
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for pilot_badges
alter table public.pilot_badges enable row level security;
create policy "Badges are viewable by everyone" on public.pilot_badges for select using (true);
create policy "System/Admin can insert badges" on public.pilot_badges for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  OR
  (auth.uid() = pilot_id) -- Allow self-award via trusted backend/RPC in future, for now client-side logic might need this or we rely on RPC
);


-- SEED DATA (Example Tour: Greek Island Hopper)
WITH new_tour AS (
  INSERT INTO public.tours (title, description, badge_image_url)
  VALUES (
    'Greek Island Hopper', 
    'Experience the beauty of the Aegean by hopping between the most iconic Greek islands. Complete all 5 legs to earn the Island Hopper badge.',
    'https://raw.githubusercontent.com/panagiotisspak20-ship-it/sky-express-va/master/resources/badges/island_hopper.png'
  )
  RETURNING id
)
INSERT INTO public.tour_legs (tour_id, sequence_order, departure_icao, arrival_icao, leg_name)
VALUES 
  ((SELECT id FROM new_tour), 1, 'LGAV', 'LGMK', 'Athens to Mykonos'),
  ((SELECT id FROM new_tour), 2, 'LGMK', 'LGSR', 'Mykonos to Santorini'),
  ((SELECT id FROM new_tour), 3, 'LGSR', 'LGIR', 'Santorini to Heraklion'),
  ((SELECT id FROM new_tour), 4, 'LGIR', 'LGTS', 'Heraklion to Thessaloniki'),
  ((SELECT id FROM new_tour), 5, 'LGTS', 'LGAV', 'Thessaloniki to Athens');
