-- Create Dummy User & Send Request (For Testing)

do $$
declare
  dummy_id uuid := '00000000-0000-0000-0000-000000000001'; -- predictable fake ID
  my_id uuid;
begin
  -- 1. Find YOUR user ID (the first non-dummy one)
  select id into my_id from profiles where id != dummy_id limit 1;

  if my_id is null then
    raise notice 'No main user found!';
    return;
  end if;

  -- 2. Create Dummy User in auth.users (Using raw insert if RLS allows, or just profiles?)
  -- Warning: Inserting into auth.users directly is restricted on some setups, but usually allowed for service_role/postgres match.
  -- If this fails, we might need to just insert into profiles and fake the FK if we disabled it... 
  -- BUT we enabled FK to profiles, not auth.users. 
  -- So we actually ONLY need to insert into public.profiles because friend_requests now points to PUBLIC.PROFILES.
  -- We do NOT need a real auth.user for the FK constraint to be satisfied, unless profiles has an FK to auth.users.
  -- profiles.id REFERENCES auth.users. So yes, we need an auth user.
  
  -- Let's try to insert into auth.users.
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values (
    '00000000-0000-0000-0000-000000000000',
    dummy_id,
    'authenticated',
    'authenticated',
    'dummy@skyexpress.va',
    'fake_hash',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do nothing; -- If already exists, ignore

  -- 3. Create Dummy Profile
  insert into public.profiles (id, callsign, home_base, flight_hours, rank)
  values (dummy_id, 'TEST_PILOT', 'LGAV', 9999, 'Captain')
  on conflict (id) do nothing;

  -- 4. Send Friend Request (Dummy -> Me)
  insert into friend_requests (sender_id, receiver_id, status)
  values (dummy_id, my_id, 'pending')
  on conflict (sender_id, receiver_id) do nothing; -- If request exists, ignore

end;
$$;
