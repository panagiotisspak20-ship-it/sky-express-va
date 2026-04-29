-- Create a table for flight deletion requests that require admin approval
CREATE TABLE IF NOT EXISTS flight_deletion_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  pilot_id uuid REFERENCES auth.users(id) NOT NULL,
  flight_id text NOT NULL, -- The PIREP / completed_flights ID
  flight_number text,
  reason text NOT NULL, -- Why the pilot wants to delete (must be a mistake)
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE flight_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Pilots can create requests for their own flights
CREATE POLICY "Pilots can create own deletion requests"
  ON flight_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = pilot_id);

-- Pilots can view their own requests
CREATE POLICY "Pilots can view own deletion requests"
  ON flight_deletion_requests FOR SELECT
  USING (auth.uid() = pilot_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all deletion requests"
  ON flight_deletion_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update deletion requests"
  ON flight_deletion_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can delete requests
CREATE POLICY "Admins can delete deletion requests"
  ON flight_deletion_requests FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
