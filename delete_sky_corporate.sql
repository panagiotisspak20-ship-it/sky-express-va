-- Deleting the Sky Corporate item
DELETE FROM shop_items
WHERE name = 'Sky Corporate';

-- Verification (should return 0 rows)
SELECT * FROM shop_items WHERE name = 'Sky Corporate';
