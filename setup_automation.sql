-- Database function to cleanup duplicates (Used by cron)
create or replace function cleanup_flight_duplicates()
returns void
language plpgsql
as $$
begin
  delete from flight_schedules
  where id in (
    select id
    from (
      select id,
      row_number() over (
        partition by flight_number, departure, arrival
        order by updated_at desc
      ) as rnum
      from flight_schedules
    ) t
    where t.rnum > 1
  );
end;
$$;
