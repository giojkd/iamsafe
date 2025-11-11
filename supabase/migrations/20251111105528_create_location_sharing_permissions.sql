/*
  # Create Location Sharing Permissions Table

  1. New Tables
    - `location_sharing_permissions`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references profiles) - User sharing their location
      - `viewer_id` (uuid, references profiles) - User viewing the location
      - `permission_type` (text) - Type of permission (explicit, booking, emergency)
      - `is_active` (boolean) - Whether the permission is currently active
      - `expires_at` (timestamptz) - Optional expiration time
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_locations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles, unique)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `accuracy` (numeric)
      - `heading` (numeric)
      - `speed` (numeric)
      - `is_sharing_enabled` (boolean)
      - `last_updated` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can manage their own permissions
    - Users can view locations they have permission for
*/

-- Create user_locations table if not exists
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy numeric,
  heading numeric,
  speed numeric,
  is_sharing_enabled boolean DEFAULT false,
  last_updated timestamptz DEFAULT now()
);

-- Create location_sharing_permissions table
CREATE TABLE IF NOT EXISTS location_sharing_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_type text NOT NULL CHECK (permission_type IN ('explicit', 'booking', 'emergency')),
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_sharing_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for user_locations
CREATE POLICY "Users can manage own location"
  ON user_locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view locations they have permission for"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM location_sharing_permissions
      WHERE location_sharing_permissions.owner_id = user_locations.user_id
        AND location_sharing_permissions.viewer_id = auth.uid()
        AND location_sharing_permissions.is_active = true
        AND (location_sharing_permissions.expires_at IS NULL OR location_sharing_permissions.expires_at > now())
    )
  );

-- Policies for location_sharing_permissions
CREATE POLICY "Users can manage permissions they own"
  ON location_sharing_permissions
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view permissions granted to them"
  ON location_sharing_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = viewer_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_location_permissions_owner ON location_sharing_permissions(owner_id);
CREATE INDEX IF NOT EXISTS idx_location_permissions_viewer ON location_sharing_permissions(viewer_id);
CREATE INDEX IF NOT EXISTS idx_location_permissions_active ON location_sharing_permissions(is_active) WHERE is_active = true;
