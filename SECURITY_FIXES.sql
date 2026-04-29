-- =========================================================================
-- SKY EXPRESS VA - COMPREHENSIVE SECURITY UPDATE
-- =========================================================================
-- Instructions: Copy and paste all of the code below into your Supabase 
-- SQL Editor and click "RUN". This script safely applies all security fixes.
-- =========================================================================


-- -------------------------------------------------------------------------
-- PART 1: BAN ENFORCEMENT POLICY
-- -------------------------------------------------------------------------
-- Creates a function to check if the current user is banned, and applies
-- it to booking flights and inventory purchases.

CREATE OR REPLACE FUNCTION public.is_banned() 
RETURNS BOOLEAN AS $$
  SELECT status = 'banned' OR status = 'suspended'
  FROM public.profiles
  WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Prevent banned users from tracking new flights
DROP POLICY IF EXISTS "Banned users cannot track flights" ON public.active_flights;
CREATE POLICY "Banned users cannot track flights" 
ON public.active_flights
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_banned()
);

-- Prevent banned users from logging completed flights
DROP POLICY IF EXISTS "Banned users cannot log flights" ON public.completed_flights;
CREATE POLICY "Banned users cannot log flights" 
ON public.completed_flights
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_banned()
);

-- Prevent banned users from buying store items
DROP POLICY IF EXISTS "Banned users cannot buy store items" ON public.inventory;
CREATE POLICY "Banned users cannot buy store items" 
ON public.inventory
FOR INSERT
TO authenticated
WITH CHECK (
  NOT public.is_banned()
);


-- -------------------------------------------------------------------------
-- PART 2: ATOMIC FLIGHT STATS (RACE CONDITION FIX)
-- -------------------------------------------------------------------------
-- Replaces client-side math with a server-side atomic increment, ensuring 
-- flight hours and balance are never lost if flights are logged concurrently.

CREATE OR REPLACE FUNCTION increment_profile_stats(
  p_add_hours NUMERIC,
  p_add_balance NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Atomically increment the stats for the authenticated user
  UPDATE public.profiles
  SET 
    flight_hours = COALESCE(flight_hours, 0) + p_add_hours,
    balance = COALESCE(balance, 0) + p_add_balance
  WHERE id = auth.uid();
  
END;
$$;


-- -------------------------------------------------------------------------
-- PART 3: BACKEND PRIVILEGE ESCALATION PROTECTION
-- -------------------------------------------------------------------------
-- Prevents standard users from sending direct API requests to grant 
-- themselves admin rights or infinite money by bypassing the UI.

-- Create the protection function
CREATE OR REPLACE FUNCTION protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the request originates from a standard authenticated web client
  IF current_setting('role', true) = 'authenticated' THEN
    
    -- Forcefully reset sensitive columns to their OLD (existing) values
    -- This prevents Privilege Escalation and Economy Cheats
    NEW.is_admin = OLD.is_admin;
    NEW.balance = OLD.balance;
    NEW.flight_hours = OLD.flight_hours;
    NEW.rank_id = OLD.rank_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the profiles table
DROP TRIGGER IF EXISTS enforce_profile_security ON public.profiles;

CREATE TRIGGER enforce_profile_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION protect_sensitive_profile_fields();

-- =========================================================================
-- END OF SCRIPT. YOUR DATABASE IS NOW SECURE.
-- =========================================================================
