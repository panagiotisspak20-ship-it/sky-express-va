-- -----------------------------------------------------------------------------
-- SCRIPT: Sky Express VA - Fix Tour Cancellation Policy
-- -----------------------------------------------------------------------------

-- The original setup_tours.sql file forgot to add a DELETE policy for pilot_tours.
-- This script safely enables pilots to abort their own tours.

DROP POLICY IF EXISTS "Pilots can cancel their own tour progress" ON public.pilot_tours;

CREATE POLICY "Pilots can cancel their own tour progress" 
ON public.pilot_tours 
FOR DELETE 
USING (auth.uid() = pilot_id);
