-- Enable Realtime for Support Tables
-- If this is not run, the client "subscribe()" will succeed but receive no events.

-- 1. Add support_tickets to the publication
alter publication supabase_realtime add table support_tickets;

-- 2. Add ticket_messages to the publication
alter publication supabase_realtime add table ticket_messages;

-- 3. Ensure Replica Identity is set (good practice for updates/deletes)
alter table support_tickets replica identity full;
alter table ticket_messages replica identity full;
