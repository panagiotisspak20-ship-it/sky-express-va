select conname, confrelid::regclass from pg_constraint where conrelid = 'friend_requests'::regclass;
