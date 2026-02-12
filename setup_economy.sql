-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Shop Items Table
create table if not exists public.shop_items (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'background', 'frame', 'color', 'aircraft_lease'
  name text not null,
  description text,
  price integer not null default 0,
  image_url text,
  css_class text, -- For applying styles directly
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Inventory Table (What pilots own)
create table if not exists public.inventory (
  id uuid default uuid_generate_v4() primary key,
  pilot_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.shop_items(id) on delete cascade not null,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_equipped boolean default false
);

-- 3. Transactions Table (Audit log)
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  pilot_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null, -- Positive for income, negative for expense
  type text not null, -- 'flight_pay', 'shop_purchase', 'bonus', 'penalty'
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Update Profiles
-- Add balance and equipped items columns if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'balance') then
        alter table public.profiles add column balance integer default 0;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'equipped_background') then
        alter table public.profiles add column equipped_background text; -- Store CSS class or URL
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'equipped_frame') then
        alter table public.profiles add column equipped_frame text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'equipped_color') then
        alter table public.profiles add column equipped_color text;
    end if;
end $$;

-- 5. RLS Policies
alter table public.shop_items enable row level security;
alter table public.inventory enable row level security;
alter table public.transactions enable row level security;

-- Shop Items: Everyone can read
create policy "Everyone can view shop items" 
on public.shop_items for select using (true);

-- Inventory: Pilots can view their own
create policy "Pilots can view own inventory" 
on public.inventory for select using (auth.uid() = pilot_id);

-- Inventory: Pilots can insert (buy) - verify in backend usually, but for now allow insert
create policy "Pilots can add to inventory" 
on public.inventory for insert with check (auth.uid() = pilot_id);

-- Transactions: Pilots can view own
create policy "Pilots can view own transactions" 
on public.transactions for select using (auth.uid() = pilot_id);

-- Transactions: Pilots can insert (for now, mainly backend driven but we allow it for simpler logic or triggers)
create policy "Pilots can insert transactions" 
on public.transactions for insert with check (auth.uid() = pilot_id);


-- 6. Initial Seed Data (Shop Items)
insert into public.shop_items (type, name, description, price, css_class)
values 
  ('color', 'Golden Pilot', 'Stand out with a golden username.', 5000, 'text-yellow-500 font-bold'),
  ('color', 'Neon Blue', 'Cyberpunk vibes.', 3000, 'text-cyan-400 drop-shadow-md'),
  ('color', 'Crimson Red', 'Aggressive styling.', 3000, 'text-red-600 font-bold'),
  
  ('background', 'Clouds', 'Soar above the clouds.', 8000, 'bg-gradient-to-r from-blue-200 to-blue-400'),
  ('background', 'Night Sky', 'Starry night theme.', 8000, 'bg-slate-900 text-white'),
  ('background', 'Sunset', 'Beautiful sunset gradients.', 10000, 'bg-gradient-to-r from-orange-400 to-rose-400'),
  
  ('frame', 'Gold Frame', 'A shiny gold border for your avatar.', 15000, 'border-4 border-yellow-400 shadow-lg'),
  ('frame', 'Neon Frame', 'Glowing neon border.', 12000, 'border-2 border-cyan-400 shadow-[0_0_10px_cyan]')
on conflict do nothing;
