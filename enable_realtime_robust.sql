-- Enable Realtime (Robust Version)
-- This script safely adds tables to the publication, ignoring errors if they are already added.

-- 1. Support Tickets
do $$
begin
  alter publication supabase_realtime add table support_tickets;
exception when duplicate_object then
  null; -- Already exists, ignore
end;
$$;

-- 2. Ticket Messages
do $$
begin
  alter publication supabase_realtime add table ticket_messages;
exception when duplicate_object then
  null; -- Already exists, ignore
end;
$$;

-- 3. Ensure Replica Identity (Important for Update/Delete events)
alter table support_tickets replica identity full;
alter table ticket_messages replica identity full;
