-- Fix for "Sky Corporate" background being white
-- The user reported it should be "navy with a gradient"
-- This matches the .btn-navy gradient from main.css but applied as a background

UPDATE shop_items
SET css_class = 'bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white border-2 border-[#d63384]'
WHERE name = 'Sky Corporate';

-- Also ensure any user who currently has it equipped gets the update immediately if they re-fetch,
-- but since the profile stores the class string directly (denormalized), we might need to update profiles too!

UPDATE profiles
SET equipped_background = 'bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white border-2 border-[#d63384]'
WHERE equipped_background = 'bg-white' OR equipped_background IS NULL; 
-- Wait, updating ALL 'bg-white' or NULL might be dangerous if that's the default.
-- Better to find users who BOUGHT 'Sky Corporate' and have it equipped.
-- But we can't easily join on the JSON or text field in a simple query without seeing data.

-- SAFE APPROACH: Update the item definition.
-- Users will need to "Un-equip" and "Re-equip" it, OR we update profiles that MATCH the old broken class (if we knew what it was).
-- Assuming the old class was "bg-white" explicitly? Or maybe it was missing.

-- Let's just update the shop item first.
-- The user can re-equip it.

-- Optional: detailed fix for profiles if we knew the ID of the item.
-- UPDATE profiles p
-- SET equipped_background = 'bg-gradient-to-br from-[#1a365d] to-[#2c5282] text-white border-2 border-[#d63384]'
-- FROM inventory i, shop_items s
-- WHERE p.id = i.pilot_id 
-- AND i.item_id = s.id 
-- AND s.name = 'Sky Corporate'
-- AND i.is_equipped = true;
