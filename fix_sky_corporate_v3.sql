-- Fix V3 for "Sky Corporate" background
-- Changes:
-- 1. Light gradient (White to Blue-100) per user request ("more white than blue", "not heavy")
-- 2. Explicitly sets "text-slate-900" (dark text) for Corporate
-- 3. Updates "Sky Branding" (Purple) to have "text-white" so Dashboard detects it correctly

-- 1. Update Sky Corporate (Light)
UPDATE shop_items
SET css_class = 'bg-gradient-to-b from-white to-blue-100 border border-slate-200 shadow-sm text-slate-900'
WHERE name = 'Sky Corporate';

-- 2. Ensure Sky Branding has 'text-white' flag for the Dashboard to use white text
UPDATE shop_items
SET css_class = css_class || ' text-white'
WHERE name = 'Sky Branding' AND css_class NOT LIKE '%text-white%';

-- 3. Update Profiles

-- Update Corporate users
UPDATE profiles
SET equipped_background = 'bg-gradient-to-b from-white to-blue-100 border border-slate-200 shadow-sm text-slate-900'
WHERE equipped_background LIKE '%from-[#1a365d]%' OR equipped_background LIKE '%bg-white%';

-- Update Branding users (if they need the text-white flag)
UPDATE profiles
SET equipped_background = equipped_background || ' text-white'
WHERE equipped_background LIKE '%Sky Branding%' AND equipped_background NOT LIKE '%text-white%';
-- Note: 'Sky Branding' might not be in the profile string, but the color hexes might.
-- Let's try matching the purple gradient if we can guess it, or just rely on user re-equipping.
-- Safe bet: just update the shop items and let users re-equip if text is wrong.
-- But for Corporate, we definitely want to push the fix.
