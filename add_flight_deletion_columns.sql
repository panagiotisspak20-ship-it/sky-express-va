-- Migration: Add Flight Deletion Queue to Completed_Flights

-- 1. Add columns to flag a flight for deletion and provide a pilot reason
ALTER TABLE public.completed_flights 
ADD COLUMN IF NOT EXISTS delete_requested BOOLEAN DEFAULT false;

ALTER TABLE public.completed_flights 
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- 2. Ensure RLS policies allow pilots to *update* their own flights 
--    (Specifically the delete_requested & delete_reason fields)
-- Note: You may already have an UPDATE policy, but let's make sure pilots can update their own rows

CREATE POLICY "Pilots can request deletion of their own flights" 
ON public.completed_flights 
FOR UPDATE 
USING (auth.uid() = pilot_id) 
WITH CHECK (auth.uid() = pilot_id);
