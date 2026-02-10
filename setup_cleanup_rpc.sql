-- Setup cleanup RPC
create or replace function cleanup_database_functions()
returns void
language plpgsql
as $$
begin
  -- Drop potentially conflicting old functions
  drop function if exists cleanup_duplicates();
  drop function if exists remove_duplicates();
end;
$$;
