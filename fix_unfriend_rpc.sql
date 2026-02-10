-- Create a secure function to handle bi-directional unfriending entirely on the server
-- This bypasses RLS issues by using SECURITY DEFINER

create or replace function break_connection(target_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  
  -- 1. Delete social connections (both directions)
  delete from social_connections 
  where (follower_id = current_user_id and following_id = target_id)
     or (follower_id = target_id and following_id = current_user_id);
     
  -- 2. Delete friend requests (both directions)
  delete from friend_requests
  where (sender_id = current_user_id and receiver_id = target_id)
     or (sender_id = target_id and receiver_id = current_user_id);
end;
$$;
