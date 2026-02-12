-- EMERGENCY UNLOCK
-- Disabling Security Policies temporarily to restore your profile access.

BEGIN;

-- 1. Disable RLS on Profiles (This allows ALL reads/writes)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on Ranks (This allows ALL reads)
ALTER TABLE public.ranks DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on Support (Just in case)
ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages DISABLE ROW LEVEL SECURITY;

COMMIT;
