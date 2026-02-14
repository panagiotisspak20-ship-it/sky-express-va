-- Fix V7 for "Sky Corporate" background
-- User Request: "white only 10% (rest navy)"
-- Solution: Using a custom CSS class defined in main.css (.bg-sky-corporate)
-- This bypasses Tailwind JIT issues with arbitrary values in DB.

UPDATE shop_items
SET css_class = 'bg-sky-corporate text-white border-0 shadow-md'
WHERE name = 'Sky Corporate';

-- Update Profiles
UPDATE profiles
SET equipped_background = 'bg-sky-corporate text-white border-0 shadow-md'
WHERE equipped_background LIKE '%Sky Corporate%' 
   OR equipped_background LIKE '%from-[#1a365d]%' 
   OR equipped_background LIKE '%to-white%'
   OR equipped_background LIKE '%linear-gradient%';
