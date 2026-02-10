-- Admin Support
-- Update profiles to allow admin check
alter table profiles add column if not exists is_admin boolean default false;

-- Policy to allow admins to see all tickets
drop policy if exists "Admin read all" on support_tickets;
create policy "Admin read all" on support_tickets for select using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);
