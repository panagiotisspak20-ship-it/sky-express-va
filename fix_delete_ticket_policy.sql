-- Policy for deleting tickets
create policy "Users can delete own tickets" 
on support_tickets 
for delete 
using (auth.uid() = user_id);
