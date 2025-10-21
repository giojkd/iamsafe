/*
  # Create Bookings and Payments System

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to profiles)
      - `bodyguard_id` (uuid, foreign key to profiles)
      - `service_type` (text) - 'location' or 'route'
      - `pickup_location` (text) - Starting location
      - `dropoff_location` (text) - Destination (for route service)
      - `scheduled_date` (timestamptz) - When the service starts
      - `duration_hours` (numeric) - Duration of service
      - `use_vehicle` (boolean) - Whether bodyguard vehicle is used
      - `vehicle_type` (text) - Type of vehicle if used
      - `discretion_level` (text) - 'low', 'medium', 'high'
      - `outfit_type` (text) - Requested outfit
      - `notes` (text) - Additional notes
      - `service_price` (numeric) - Base service price
      - `vehicle_price` (numeric) - Additional vehicle cost
      - `platform_fee` (numeric) - Platform commission
      - `total_price` (numeric) - Total amount
      - `status` (text) - 'pending', 'confirmed', 'active', 'completed', 'cancelled'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payments`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key to bookings)
      - `client_id` (uuid, foreign key to profiles)
      - `amount` (numeric) - Payment amount
      - `payment_method` (text) - 'card' or 'wallet'
      - `status` (text) - 'pending', 'completed', 'failed', 'refunded'
      - `transaction_id` (text) - External payment transaction ID
      - `card_last_four` (text) - Last 4 digits of card (if card payment)
      - `processed_at` (timestamptz) - When payment was processed
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Clients can view and manage their own bookings
    - Bodyguards can view bookings assigned to them
    - Clients can view their own payments
    - Bodyguards can view payments for their bookings

  3. Indexes
    - Index on client_id and bodyguard_id for bookings
    - Index on booking_id for payments
    - Index on status for quick filtering
*/

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bodyguard_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('location', 'route')),
  pickup_location text NOT NULL,
  dropoff_location text,
  scheduled_date timestamptz NOT NULL,
  duration_hours numeric NOT NULL CHECK (duration_hours > 0),
  use_vehicle boolean DEFAULT false,
  vehicle_type text,
  discretion_level text DEFAULT 'medium' CHECK (discretion_level IN ('low', 'medium', 'high')),
  outfit_type text,
  notes text,
  service_price numeric NOT NULL CHECK (service_price >= 0),
  vehicle_price numeric DEFAULT 0 CHECK (vehicle_price >= 0),
  platform_fee numeric NOT NULL CHECK (platform_fee >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('card', 'wallet')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  card_last_four text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Bookings Policies
CREATE POLICY "Clients can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Bodyguards can view assigned bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = bodyguard_id);

CREATE POLICY "Clients can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Bodyguards can update assigned bookings status"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = bodyguard_id)
  WITH CHECK (auth.uid() = bodyguard_id);

-- Payments Policies
CREATE POLICY "Clients can view own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Bodyguards can view payments for their bookings"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.bodyguard_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bodyguard_id ON bookings(bodyguard_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Trigger for bookings (function defined in 00_create_profiles.sql)
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
