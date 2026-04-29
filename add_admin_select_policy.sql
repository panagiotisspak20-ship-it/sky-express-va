CREATE POLICY \
Admins
can
view
all
completed
flights\ ON completed_flights FOR SELECT USING ( EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true ) );
