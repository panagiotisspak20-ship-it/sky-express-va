-- Update Sky Corporate background to use the correct gradient
UPDATE shop_items
SET css_class = 'bg-gradient-to-br from-[#003366] to-[#0f172a] text-white shadow-inner',
    description = 'Professional Navy gradient background.'
WHERE name = 'Sky Corporate';

-- Verification
SELECT name, css_class FROM shop_items WHERE name = 'Sky Corporate';
