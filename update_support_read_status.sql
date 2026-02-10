-- Add read status to DMs
alter table direct_messages 
add column if not exists is_read boolean default false;

-- Function to mark as read
create or replace function mark_messages_read(sender_uuid uuid)
returns void
language plpgsql
security definer
as $$
begin
  update direct_messages
  set is_read = true
  where receiver_id = auth.uid()
  and sender_id = sender_uuid
  and is_read = false;
end;
$$;
