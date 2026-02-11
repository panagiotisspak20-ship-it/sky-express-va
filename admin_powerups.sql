-- 1. Add status column to profiles table for Ban/Suspend functionality
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Optional: Add a check constraint to ensure valid status values
ALTER TABLE profiles 
ADD CONSTRAINT check_status CHECK (status IN ('active', 'suspended', 'banned'));

-- 2. Create system_announcements table
CREATE TABLE IF NOT EXISTS system_announcements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message text NOT NULL,
    author_id uuid REFERENCES profiles(id),
    created_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true
);

-- 3. Enable Row Level Security (RLS) on the new table
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for system_announcements

-- Policy: Everyone can READ active announcements
CREATE POLICY "Everyone can read active announcements" 
ON system_announcements FOR SELECT 
USING (true);

-- Policy: Only Admins can INSERT/UPDATE/DELETE (Assuming profiles.is_admin exists)
-- This relies on the user being authenticated and having is_admin = true in their profile.
-- Note: This is an example policy. You might need to adjust based on your specific RLS setup.
CREATE POLICY "Admins can manage announcements" 
ON system_announcements FOR ALL 
USING (
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
);
