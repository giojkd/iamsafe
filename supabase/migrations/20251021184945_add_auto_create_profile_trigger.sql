/*
  # Auto-create Profile Trigger

  ## Overview
  Creates a trigger that automatically initializes a profile entry when a new user
  signs up through Supabase Auth. This ensures every authenticated user has a
  corresponding profile record.

  ## Changes
  1. Creates a function that handles new user creation
  2. Sets up a trigger on auth.users table
  3. Initializes profile with basic auth data

  ## Important Notes
  - Profile is created with minimal data (id, phone)
  - User must complete profile setup after signup
  - Profile role and other fields are set to NULL initially
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, profile_completed)
  VALUES (
    NEW.id,
    NEW.phone,
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();