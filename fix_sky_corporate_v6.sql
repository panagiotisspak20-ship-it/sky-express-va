-- Fix V6 for "Sky Corporate" background
-- User Request: "to much white i want 90% of it to by navy blue"
-- Solution: Use arbitrary CSS value in Tailwind to force the stop position.
-- Syntax: linear-gradient(to bottom, #1a365d 90%, white)
-- This keeps it solid Navy until 90% down, then quick fade to white.

UPDATE shop_items
SET css_class = 'bg-[linear-gradient(to_bottom,#1a365d_90%,white)] text-white border-0 shadow-md'
WHERE name = 'Sky Corporate';

-- Update Profiles
UPDATE profiles
SET equipped_background = 'bg-[linear-gradient(to_bottom,#1a365d_90%,white)] text-white border-0 shadow-md'
WHERE equipped_background LIKE '%Sky Corporate%' 
   OR equipped_background LIKE '%from-[#1a365d]%' 
   OR equipped_background LIKE '%to-white%';
