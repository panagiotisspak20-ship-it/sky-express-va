-- First, remove any existing Sky Corporate item so there are no duplicates
DELETE FROM shop_items
WHERE name = 'Sky Corporate';

-- Re-create Sky Corporate with a MUCH stronger, higher-contrast gradient
INSERT INTO shop_items (name, type, price, css_class, description)
VALUES (
    'Sky Corporate',
    'background',
    8000,
    -- Using a very bright 'Royal Blue' to 'Void Black' for maximum contrast
    'bg-gradient-to-br from-[#0052cc] to-[#020617] text-white shadow-inner',
    'High-contrast professional Navy gradient background.'
);

-- Verify the new colors heavily
SELECT name, css_class FROM shop_items WHERE name = 'Sky Corporate';
