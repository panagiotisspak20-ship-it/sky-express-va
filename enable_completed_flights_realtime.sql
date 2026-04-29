-- Enable Realtime for completed_flights table
-- This allows postgres_changes events to fire when rows are inserted, updated, or deleted.
-- Run this in the Supabase SQL Editor.

ALTER PUBLICATION supabase_realtime ADD TABLE completed_flights;
ALTER TABLE completed_flights REPLICA IDENTITY FULL;
