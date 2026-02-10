-- Add missing columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS simbrief_username text,
ADD COLUMN IF NOT EXISTS simbrief_id text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add comment
COMMENT ON COLUMN profiles.simbrief_username IS 'SimBrief Username for fetching OFPs';
COMMENT ON COLUMN profiles.simbrief_id IS 'SimBrief Pilot ID';
