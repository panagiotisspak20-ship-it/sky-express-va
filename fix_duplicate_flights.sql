-- ============================================================
-- FIX DUPLICATE FLIGHTS - Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Check how many duplicates exist
SELECT 
  flight_number, 
  departure_time, 
  COUNT(*) as copies
FROM flight_schedules
GROUP BY flight_number, departure_time
HAVING COUNT(*) > 1
ORDER BY copies DESC
LIMIT 20;

-- Step 2: Delete all duplicates, keeping only the latest row per (flight_number, departure_time)
DELETE FROM flight_schedules
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY flight_number, departure_time
        ORDER BY updated_at DESC, id DESC
      ) AS rnum
    FROM flight_schedules
  ) t
  WHERE t.rnum > 1
);

-- Step 3: Add a UNIQUE constraint so duplicates can NEVER come back
ALTER TABLE flight_schedules
  ADD CONSTRAINT unique_flight_departure UNIQUE (flight_number, departure_time);

-- Step 4: Verify - check total count after cleanup
SELECT COUNT(*) AS total_flights FROM flight_schedules;

-- Step 5: Update the upsert RPC to use ON CONFLICT instead of manual logic
CREATE OR REPLACE FUNCTION upsert_flight_schedules_v5(flights jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  f jsonb;
BEGIN
  FOR f IN SELECT * FROM jsonb_array_elements(flights)
  LOOP
    INSERT INTO flight_schedules (
      flight_number, airline_iata, airline_icao,
      dep_icao, arr_icao, departure_time, arrival_time,
      duration, aircraft_type, status, updated_at
    ) VALUES (
      f->>'flight_number', f->>'airline_iata', f->>'airline_icao',
      f->>'dep_icao', f->>'arr_icao', (f->>'departure_time')::timestamptz, (f->>'arrival_time')::timestamptz,
      (f->>'duration')::int, f->>'aircraft_type', f->>'status', now()
    )
    ON CONFLICT (flight_number, departure_time)
    DO UPDATE SET
      arrival_time = EXCLUDED.arrival_time,
      aircraft_type = EXCLUDED.aircraft_type,
      status = EXCLUDED.status,
      updated_at = now();
  END LOOP;
END;
$$;
