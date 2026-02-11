-- Enable Realtime for social and announcement tables
-- This safely skips any table that is already enabled

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['system_announcements', 'friend_requests', 'social_connections', 'direct_messages'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
      RAISE NOTICE 'Added % to supabase_realtime', t;
    ELSE
      RAISE NOTICE '% is already in supabase_realtime, skipping', t;
    END IF;
  END LOOP;
END $$;
