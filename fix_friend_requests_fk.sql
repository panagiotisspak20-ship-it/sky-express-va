-- Fix Friend Request Foreign Keys
-- This script relinks the friend_requests table to 'profiles' instead of 'auth.users'
-- so the app can correctly load the sender's Name and Avatar.

do $$
declare
  r record;
begin
  -- 1. Drop ALL existing Foreign Keys on the friend_requests table to start fresh
  -- (This removes links to auth.users if they exist)
  for r in (
      select constraint_name 
      from information_schema.table_constraints 
      where table_name = 'friend_requests' 
      and constraint_type = 'FOREIGN KEY'
  ) loop
      execute 'alter table friend_requests drop constraint ' || quote_ident(r.constraint_name);
  end loop;

  -- 2. Create NEW Foreign Keys pointing to public.profiles
  alter table friend_requests 
    add constraint friend_requests_sender_id_fkey 
    foreign key (sender_id) 
    references public.profiles(id) 
    on delete cascade;
    
  alter table friend_requests 
    add constraint friend_requests_receiver_id_fkey 
    foreign key (receiver_id) 
    references public.profiles(id) 
    on delete cascade;

end;
$$;
