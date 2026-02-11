-- LiveMap Multiplayer Columns Migration
-- Adds columns needed for the LiveMap real-time position sharing feature.
-- Run this in the Supabase SQL Editor.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_location jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS heading integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS altitude integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS speed integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Optional: Enable Realtime for profiles if not already enabled
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
