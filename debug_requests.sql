-- Force Refresh & detailed inspection
-- 1. Tell Supabase API to reload its schema cache (to pick up the new keys)
NOTIFY pgrst, 'reload config';

-- 2. Show me the requests (Are there any?)
select 
  fr.id,
  fr.status,
  sender.callsign as sender_name,
  receiver.callsign as receiver_name
from friend_requests fr
left join profiles sender on fr.sender_id = sender.id
left join profiles receiver on fr.receiver_id = receiver.id;
