CREATE POLICY \
Admins
can
update
all
completed
flights\ ON completed_flights FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
