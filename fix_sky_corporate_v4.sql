-- Fix V4 for "Sky Corporate" background
-- User Request: "dark blue and a light white gradient very tiny"
-- Implementation: Vertical gradient from Sky Navy (#1a365d) to White.
-- Added 'text-white' so the Dashboard text logic renders the header text in white (against the dark top).

UPDATE shop_items
SET css_class = 'bg-gradient-to-b from-[#1a365d] to-white text-white border-0 shadow-md'
WHERE name = 'Sky Corporate';

-- Update Profiles
UPDATE profiles
SET equipped_background = 'bg-gradient-to-b from-[#1a365d] to-white text-white border-0 shadow-md'
WHERE equipped_background LIKE '%Sky Corporate%' 
   OR equipped_background LIKE '%from-[#1a365d]%' 
   OR equipped_background LIKE '%from-white%';
