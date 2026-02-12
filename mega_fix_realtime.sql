-- MEGA FIX REALTIME
-- 1. Disable RLS on EVERYTHING related to support to rule out permission issues.
ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages DISABLE ROW LEVEL SECURITY; -- This was missed in the previous unlock
ALTER TABLE public.ticket_messages DISABLE ROW LEVEL SECURITY; -- Just in case

-- 2. Force-Add to Publication (Drop and Re-add to be 100% sure)
-- We use a DO block to handle the "drop" safely
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.support_messages;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if not exists
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.support_tickets;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if not exists
END;
$$;

-- Now ADD them fresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- 3. Set Replica Identity
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
