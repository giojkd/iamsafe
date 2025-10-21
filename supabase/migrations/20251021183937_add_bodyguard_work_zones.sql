/*
  # Add Bodyguard Work Zones

  1. New Tables
    - `bodyguard_work_zones`
      - `id` (uuid, primary key)
      - `bodyguard_id` (uuid, foreign key to profiles)
      - `city` (text) - Nome della città (es. "Milano", "Roma")
      - `radius_km` (integer) - Raggio in km dalla città
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Allows bodyguards to specify multiple cities where they work
    - Each city has a customizable radius in kilometers
    - Used to match bodyguards with client search locations

  3. Security
    - Enable RLS on `bodyguard_work_zones` table
    - Bodyguards can manage their own work zones
    - Clients can view all work zones for search purposes
*/

CREATE TABLE IF NOT EXISTS bodyguard_work_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bodyguard_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city text NOT NULL,
  radius_km integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_radius CHECK (radius_km >= 10 AND radius_km <= 500)
);

ALTER TABLE bodyguard_work_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bodyguards can view own work zones"
  ON bodyguard_work_zones
  FOR SELECT
  TO authenticated
  USING (auth.uid() = bodyguard_id);

CREATE POLICY "Bodyguards can insert own work zones"
  ON bodyguard_work_zones
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bodyguard_id);

CREATE POLICY "Bodyguards can update own work zones"
  ON bodyguard_work_zones
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = bodyguard_id)
  WITH CHECK (auth.uid() = bodyguard_id);

CREATE POLICY "Bodyguards can delete own work zones"
  ON bodyguard_work_zones
  FOR DELETE
  TO authenticated
  USING (auth.uid() = bodyguard_id);

CREATE POLICY "Clients can view all work zones for search"
  ON bodyguard_work_zones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
    )
  );

CREATE INDEX IF NOT EXISTS idx_bodyguard_work_zones_bodyguard_id
  ON bodyguard_work_zones(bodyguard_id);

CREATE INDEX IF NOT EXISTS idx_bodyguard_work_zones_city
  ON bodyguard_work_zones(city);