-- Force a Friend Request between the 2 existing pilots
do $$
declare
  pilot_1 uuid;
  pilot_2 uuid;
begin
  -- 1. Grab any two pilots
  select id into pilot_1 from profiles limit 1;
  select id into pilot_2 from profiles where id != pilot_1 limit 1;

  if pilot_1 is null or pilot_2 is null then
    raise exception 'Could not find 2 pilots! found %, %', pilot_1, pilot_2;
  end if;

  -- 2. Clear any existing requests between them (to ensure a fresh "Insert" event fires)
  delete from friend_requests 
  where (sender_id = pilot_1 and receiver_id = pilot_2)
     or (sender_id = pilot_2 and receiver_id = pilot_1);

  -- 3. Insert a fresh request (Pilot 2 asks Pilot 1)
  insert into friend_requests (sender_id, receiver_id, status)
  values (pilot_2, pilot_1, 'pending');

  raise notice 'Created request from % to %', pilot_2, pilot_1;

end;
$$;
