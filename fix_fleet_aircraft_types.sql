-- SQL Script to update existing aircraft types to the new official Sky Express fleet standard

-- Update to A20N
UPDATE fleet 
SET type = 'A20N' 
WHERE type ILIKE '%A320neo%' 
   OR type = 'A20N';

-- Update to A320 (assuming remaining A320s are A320-200)
UPDATE fleet 
SET type = 'A320' 
WHERE type ILIKE '%A320%' 
  AND type != 'A20N';

-- Update to AT76
UPDATE fleet 
SET type = 'AT76' 
WHERE type ILIKE '%ATR%72%' 
   OR type = 'AT76';

-- Update to AT46
UPDATE fleet 
SET type = 'AT46' 
WHERE type ILIKE '%ATR%42%' 
   OR type = 'AT46';

-- Optional: If there are other strange types that sneaked in, let's just make them A20Ns
UPDATE fleet 
SET type = 'A20N' 
WHERE type NOT IN ('A20N', 'A320', 'AT46', 'AT76');

-- Update completed_flights tracking table just in case any history is strictly tied to type string
UPDATE completed_flights
SET aircraft_type = 'A20N' WHERE aircraft_type ILIKE '%A320neo%';

UPDATE completed_flights
SET aircraft_type = 'A320' WHERE aircraft_type ILIKE '%A320%' AND aircraft_type != 'A20N';

UPDATE completed_flights
SET aircraft_type = 'AT76' WHERE aircraft_type ILIKE '%ATR%72%';

UPDATE completed_flights
SET aircraft_type = 'AT46' WHERE aircraft_type ILIKE '%ATR%42%';
