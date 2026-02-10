-- Enable Realtime for Social Tables
-- This allows the React app to receive instant updates when these tables change.

begin;

  -- Add friend_requests to the publication (for notifications)
  alter publication supabase_realtime add table friend_requests;

  -- Add social_connections to the publication (for "Connect" button state updates)
  alter publication supabase_realtime add table social_connections;

commit;
