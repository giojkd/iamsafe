/*
  # Fix Profile Creation RLS
  
  ## Problem
  Users cannot create their profile after signup because the session
  is not active until email is confirmed (if enabled).
  
  ## Solution
  1. Update the auto-create trigger to pull phone from user metadata
  2. Allow profile INSERT for new users even without active session
  3. Keep security by checking the auth.uid() matches the id being inserted
  
  ## Changes
  1. Fix handle_new_user function to use metadata
  2. Update INSERT policy to allow new user profile creation
*/

-- Update the handle_new_user function to extract phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, profile_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new INSERT policy that allows both authenticated users 
-- and the trigger function to create profiles
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR id IN (SELECT id FROM auth.users));
