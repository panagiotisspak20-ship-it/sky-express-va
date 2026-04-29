-- Insert all 24 Sky Express fleet aircraft
-- Note: SX-GRA and SX-GRB are A21N in real life but mapped to A20N for app compatibility

INSERT INTO fleet (registration, type, hub, current_location, total_hours, status, condition, last_maintenance)
VALUES 
  ('SX-CRE', 'A320', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-EIT', 'AT46', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-ELV', 'AT76', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-GNA', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-GRA', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-GRB', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-GRE', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-GRI', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-IOA', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-IOB', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-IOC', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-IOG', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-NTE', 'AT76', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-ONE', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-SEH', 'A320', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-SIX', 'AT46', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-SKY', 'A320', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-TEC', 'A20N', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-TEN', 'AT46', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-TNO', 'AT76', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-TSV', 'AT76', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-TWO', 'AT46', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-TWR', 'AT76', 'LGAV', 'LGAV', 0, 'Available', 100, now()),
  ('SX-VSL', 'A320', 'LGAV', 'LGAV', 0, 'Available', 100, now());
