-- Add the VATSIM ID column to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vatsim_id text;
