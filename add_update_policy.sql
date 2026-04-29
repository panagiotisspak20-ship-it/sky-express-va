CREATE POLICY \
Pilots
can
update
own
flights
for
deletion
requests\ ON completed_flights FOR UPDATE USING (auth.uid() = pilot_id) WITH CHECK (auth.uid() = pilot_id);
