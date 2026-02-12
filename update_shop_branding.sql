-- SQL Migration: Rebrand Shop to Sky Express Colors

-- 1. COLORS (Chat/Callsign)
-- Rename generic Blue to Sky Navy
UPDATE public.shop_items
SET name = 'Sky Navy', 
    description = 'Official Sky Express Navy Blue.',
    css_class = 'text-sky-navy',
    price = 2500
WHERE name = 'Blue' OR css_class LIKE '%text-blue%';

-- Rename generic Red to Sky Magenta
UPDATE public.shop_items
SET name = 'Sky Magenta', 
    description = 'Official Sky Express Magenta.',
    css_class = 'text-sky-magenta',
    price = 2500
WHERE name = 'Red' OR css_class LIKE '%text-red%' OR css_class LIKE '%text-rose%';

-- Rename generic Green to Sky Cyan
UPDATE public.shop_items
SET name = 'Sky Cyan', 
    description = 'Official Sky Express Cyan.',
    css_class = 'text-sky-cyan',
    price = 2500
WHERE name = 'Green' OR css_class LIKE '%text-green%' OR css_class LIKE '%text-emerald%';


-- 2. FRAMES
-- Add a Corporate Navy Frame (replacing simple Blue/Silver if exists, or updating Neon)
-- Let's update "Neon Frame" to be "Magenta Pulse"
UPDATE public.shop_items
SET name = 'Magenta Pulse',
    description = 'Glowing Sky Express Magenta border.',
    css_class = 'border-2 border-sky-magenta rounded-xl shadow-[0_0_10px_#E1007E]',
    price = 12000
WHERE name = 'Neon Frame';

-- Update "Gold Frame" to "Captain''s Gold" (Keep it as premium, but ensure it''s square)
-- (Already updated shape in previous step, but ensuring naming is premium)
UPDATE public.shop_items
SET name = 'Captain''s Gold',
    description = 'Premium gold frame for senior pilots.'
WHERE name = 'Gold Frame';

-- Insert a NEW standard "Sky Navy Frame" if it matches nothing, or replace a cheap one?
-- We can Insert if not exists, since we want *more* airline branding.
INSERT INTO public.shop_items (type, name, description, price, css_class)
VALUES ('frame', 'Corporate Navy', 'Standard Sky Express Navy frame.', 5000, 'border-4 border-sky-navy rounded-xl shadow-md')
ON CONFLICT DO NOTHING; -- In case we run multiple times (requires unique name constraint usually, or just ignore errors)


-- 3. BACKGROUNDS
-- Update "Night Sky" to "Sky Corporate" (Navy Gradient)
UPDATE public.shop_items
SET name = 'Sky Corporate',
    description = 'Professional Navy background.',
    css_class = 'bg-gradient-to-br from-sky-navy to-slate-900 text-white shadow-inner'
WHERE name = 'Night Sky';

-- Update "Sunset" to "Sky Branding" (Magenta/Navy Gradient)
UPDATE public.shop_items
SET name = 'Sky Branding',
    description = 'The full Sky Express color spectrum.',
    css_class = 'bg-gradient-to-r from-sky-navy via-purple-900 to-sky-magenta text-white'
WHERE name = 'Sunset';


-- 4. PROPAGATION
-- Force update profiles to match the new CSS classes for equipped items.
-- This ensures users see the changes immediately without re-equipping.

-- Update Frames
UPDATE public.profiles
SET equipped_frame = s.css_class
FROM public.inventory i
JOIN public.shop_items s ON i.item_id = s.id
WHERE public.profiles.id = i.pilot_id 
  AND i.is_equipped = true 
  AND s.type = 'frame';

-- Update Backgrounds
UPDATE public.profiles
SET equipped_background = s.css_class
FROM public.inventory i
JOIN public.shop_items s ON i.item_id = s.id
WHERE public.profiles.id = i.pilot_id 
  AND i.is_equipped = true 
  AND s.type = 'background';

-- Update Colors
UPDATE public.profiles
SET equipped_color = s.css_class
FROM public.inventory i
JOIN public.shop_items s ON i.item_id = s.id
WHERE public.profiles.id = i.pilot_id 
  AND i.is_equipped = true 
  AND s.type = 'color';
