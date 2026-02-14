-- Fix V5 for "Sky Corporate" background
-- User Request: "there is to much white now"
-- Solution: Use a "via" utility to extend the Navy Blue color further down.
-- Logic: from-navy (0%) -> via-navy (50%) -> to-white (100%)
-- This ensures the top half is solid blue, and the fade to white only happens in the bottom half.

UPDATE shop_items
SET css_class = 'bg-gradient-to-b from-[#1a365d] via-[#1a365d] to-white text-white border-0 shadow-md'
WHERE name = 'Sky Corporate';

-- Update Profiles
UPDATE profiles
SET equipped_background = 'bg-gradient-to-b from-[#1a365d] via-[#1a365d] to-white text-white border-0 shadow-md'
WHERE equipped_background LIKE '%Sky Corporate%' 
   OR equipped_background LIKE '%from-[#1a365d]%' 
   OR equipped_background LIKE '%to-white%';
