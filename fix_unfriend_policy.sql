-- Fix Unfriend (Bidirectional) Policy

-- 1. Drop the restrictive "User can unfollow" policy
drop policy if exists "User can unfollow" on social_connections;

-- 2. Create a new flexible policy that allows either party to break the connection
create policy "User can remove connection"
on social_connections
for delete
using (
  auth.uid() = follower_id 
  or 
  auth.uid() = following_id
);
