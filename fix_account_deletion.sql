-- Setup Supabase Auth Deletion for Self-Service
-- 1. Create a function that allows a user to delete themselves (Bypassing the restriction that users can't delete from auth.users)
create or replace function delete_user()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
