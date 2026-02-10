-- Test automation logic
select cleanup_flight_duplicates();
select count(*) from flight_schedules;
