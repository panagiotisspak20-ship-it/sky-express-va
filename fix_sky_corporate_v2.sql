-- Fix V2 for "Sky Corporate" background
-- Changes:
-- 1. REMOVED the pink border (border-[#d63384])
-- 2. Made the gradient "heavier" (Navy to Black) for more contrast

UPDATE shop_items
SET css_class = 'bg-gradient-to-br from-[#1a365d] to-black text-white shadow-xl'
WHERE name = 'Sky Corporate';

-- Update the profile again for users who have it equipped
-- Pass the NEW class
UPDATE profiles
SET equipped_background = 'bg-gradient-to-br from-[#1a365d] to-black text-white shadow-xl'
WHERE equipped_background LIKE '%from-[#1a365d]%'; 
-- This WHERE clause targets the previous version we just applied (which had the same 'from' color)
