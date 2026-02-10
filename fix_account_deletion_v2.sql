-- Drop old function
drop function if exists delete_user();

-- Create secure delete function
create or replace function delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  
  -- Delete dependent data (Cascading might handle this, but explicit is safer)
  delete from profiles where id = current_user_id;
  delete from social_connections where follower_id = current_user_id or following_id = current_user_id;
  delete from friend_requests where sender_id = current_user_id or receiver_id = current_user_id;
  delete from support_tickets where user_id = current_user_id;
  
  -- Finally delete the auth user
  delete from auth.users where id = current_user_id;
end;
$$;
