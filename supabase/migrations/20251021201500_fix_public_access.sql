/*
  # Fix Public Access to Bodyguard Profiles

  1. Changes
    - Drop existing restrictive policies
    - Add new policies allowing anyone (including unauthenticated users) to view bodyguard profiles
    - Add policy allowing anyone to view bodyguard work zones for search

  2. Security
    - Bodyguard profiles remain viewable by all users (necessary for search functionality)
    - Client profiles remain private (only visible to authenticated users)
    - Only authenticated users can modify their own profiles
*/

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Clients can view all work zones for search" ON bodyguard_work_zones;

-- Allow anyone (including anon) to view bodyguard profiles
CREATE POLICY "Bodyguard profiles are publicly viewable"
  ON profiles
  FOR SELECT
  USING (role = 'bodyguard');

-- Allow authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anyone to view work zones (needed for search)
CREATE POLICY "Anyone can view work zones for search"
  ON bodyguard_work_zones
  FOR SELECT
  USING (true);
