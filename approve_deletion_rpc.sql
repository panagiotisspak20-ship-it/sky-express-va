-- Migration: Create Admin RPC to Approve Flight Deletion

-- This function safely reverts the pilot's flight hours and balance
-- based on the specific flight, and then deletes the flight record.
CREATE OR REPLACE FUNCTION admin_approve_flight_deletion(p_flight_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as DB owner to bypass RLS for deletion
AS $$
DECLARE
    v_pilot_id UUID;
    v_flight_time NUMERIC;
    v_revenue NUMERIC;
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Security Check: Is the caller an admin?
    SELECT is_admin INTO v_is_admin
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve flight deletions';
    END IF;

    -- 2. Fetch the flight details
    SELECT pilot_id, flight_time, revenue
    INTO v_pilot_id, v_flight_time, v_revenue
    FROM public.completed_flights
    WHERE id = p_flight_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Flight not found';
    END IF;

    -- 3. Calculate hours to deduct (flight_time is in minutes)
    -- Deducting hours and balance from the pilot's profile
    UPDATE public.profiles
    SET 
        flight_hours = GREATEST(flight_hours - (v_flight_time / 60.0), 0),
        balance = GREATEST(balance - v_revenue, 0)
    WHERE id = v_pilot_id;

    -- 4. Delete the flight record
    DELETE FROM public.completed_flights
    WHERE id = p_flight_id;

    RETURN TRUE;
END;
$$;
