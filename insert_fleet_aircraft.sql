-- SQL Script to seed the fleet with the four official aircraft types
-- This will insert 4 brand new aircraft into your Sky Express fleet

INSERT INTO fleet (registration, type, hub, current_location, total_hours, status, condition, last_maintenance)
VALUES 
  ('SX-NEA', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-SKY', 'A320', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-FOU', 'AT46', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-SEV', 'AT76', 'LGAV', 'LGAV', 0, 'Available', 100, now());
