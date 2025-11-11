/*
  # Add profile image URL field

  1. Changes
    - Add `profile_image_url` column to `profiles` table to store profile images
    
  2. Notes
    - This field will store URLs to profile images (can be Pexels links or uploaded images)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_image_url text;
  END IF;
END $$;