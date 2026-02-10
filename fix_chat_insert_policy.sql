-- Allow users to insert messages for tickets they own
create policy "Users can insert messages to own tickets" 
on support_messages 
for insert 
with check (
  auth.uid() = sender_id 
  and 
  exists (
    select 1 from support_tickets 
    where id = ticket_id 
    and user_id = auth.uid()
  )
);
