/*
  # Create User Profiles System

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text) - User's full name
      - `phone` (text) - User's phone number
      - `role` (text) - 'client' or 'bodyguard'
      - `date_of_birth` (date) - User's date of birth
      - `address` (text) - User's address
      - `city` (text) - User's city
      - `emergency_contact_name` (text) - Emergency contact name (for clients)
      - `emergency_contact_phone` (text) - Emergency contact phone (for clients)
      - `experience_years` (integer) - Years of experience (for bodyguards)
      - `specializations` (text[]) - List of specializations (for bodyguards)
      - `languages` (text[]) - Languages spoken (for bodyguards)
      - `hourly_rate` (numeric) - Hourly rate in euros (for bodyguards)
      - `vehicle_available` (boolean) - Has vehicle available (for bodyguards)
      - `vehicle_type` (text) - Type of vehicle (for bodyguards)
      - `bio` (text) - Professional bio (for bodyguards)
      - `certifications` (text[]) - List of certifications (for bodyguards)
      - `profile_completed` (boolean) - Whether profile setup is complete
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on profiles table
    - Users can view all bodyguard profiles
    - Users can only update their own profile
    - Users can view their own profile

  3. Indexes
    - Index on role for filtering
    - Index on city for location-based search
*/

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text CHECK (role IN ('client', 'bodyguard')),
  date_of_birth date,
  address text,
  city text,
  emergency_contact_name text,
  emergency_contact_phone text,
  experience_years integer,
  specializations text[],
  languages text[],
  hourly_rate numeric,
  vehicle_available boolean DEFAULT false,
  vehicle_type text,
  bio text,
  certifications text[],
  profile_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_hourly_rate ON profiles(hourly_rate);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();