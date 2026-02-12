-- Check Realtime Publication Status
-- Run this to see which tables are ACTUALLY being broadcast.

select * from pg_publication_tables 
where pubname = 'supabase_realtime' 
and schemaname = 'public';
