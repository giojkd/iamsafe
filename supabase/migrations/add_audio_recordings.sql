/*
  # Audio Recordings System for SOS

  ## Overview
  Adds audio recording capability to SOS alerts, allowing users to manually
  record audio during emergencies which can be accessed by emergency contacts.

  ## New Tables

  ### `sos_audio_recordings`
  Stores metadata and links to audio recordings made during SOS alerts
  - `id` (uuid, primary key)
  - `sos_alert_id` (uuid, references sos_alerts) - Associated SOS alert
  - `user_id` (uuid, references auth.users) - User who made the recording
  - `storage_path` (text) - Path in Supabase Storage
  - `duration_seconds` (int) - Duration of recording
  - `file_size_bytes` (bigint) - Size of audio file
  - `mime_type` (text) - Audio file type (e.g., audio/m4a)
  - `is_processing` (boolean) - Whether file is still uploading/processing
  - `created_at` (timestamptz) - When recording was created
  - `recorded_at` (timestamptz) - When recording started

  ## Storage Bucket
  Creates a storage bucket for audio files with appropriate policies

  ## Security
  - RLS enabled on audio recordings table
  - Users can manage their own recordings
  - Emergency contacts can access recordings from SOS alerts sent to them
  - Storage bucket has policies for authenticated users

  ## Important Notes
  1. Audio recordings are linked to specific SOS alerts
  2. Files stored in Supabase Storage bucket 'sos-audio-recordings'
  3. Emergency contacts get automatic access to recordings
  4. Recordings preserved even after SOS is deactivated for evidence/review
*/

-- Create sos_audio_recordings table
CREATE TABLE IF NOT EXISTS sos_audio_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_alert_id uuid NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  duration_seconds int DEFAULT 0,
  file_size_bytes bigint DEFAULT 0,
  mime_type text DEFAULT 'audio/m4a',
  is_processing boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  recorded_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audio_recordings_sos_alert ON sos_audio_recordings(sos_alert_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user ON sos_audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_created ON sos_audio_recordings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sos_audio_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sos_audio_recordings

CREATE POLICY "Users can view own audio recordings"
  ON sos_audio_recordings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Emergency contacts can view SOS audio recordings"
  ON sos_audio_recordings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sos_alerts sa
      JOIN emergency_contacts ec ON ec.user_id = sa.user_id
      WHERE sa.id = sos_audio_recordings.sos_alert_id
      AND ec.contact_user_id = auth.uid()
      AND ec.is_active = true
    )
  );

CREATE POLICY "Users can insert own audio recordings"
  ON sos_audio_recordings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio recordings"
  ON sos_audio_recordings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio recordings"
  ON sos_audio_recordings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('sos-audio-recordings', 'sos-audio-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio recordings bucket

CREATE POLICY "Users can upload own audio recordings"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sos-audio-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own audio recordings"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sos-audio-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Emergency contacts can view SOS audio recordings"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sos-audio-recordings' AND
    EXISTS (
      SELECT 1 FROM sos_audio_recordings sar
      JOIN sos_alerts sa ON sa.id = sar.sos_alert_id
      JOIN emergency_contacts ec ON ec.user_id = sa.user_id
      WHERE sar.storage_path = name
      AND ec.contact_user_id = auth.uid()
      AND ec.is_active = true
    )
  );

CREATE POLICY "Users can update own audio recordings"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'sos-audio-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'sos-audio-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own audio recordings"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sos-audio-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to automatically notify contacts when audio is uploaded
CREATE OR REPLACE FUNCTION notify_contacts_of_audio()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the sos_alert to indicate new audio is available
  UPDATE sos_alerts
  SET notes = COALESCE(notes || E'\n', '') || 'Nuova registrazione audio disponibile'
  WHERE id = NEW.sos_alert_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify when audio recording is completed
DROP TRIGGER IF EXISTS trigger_audio_notification ON sos_audio_recordings;
CREATE TRIGGER trigger_audio_notification
  AFTER INSERT ON sos_audio_recordings
  FOR EACH ROW
  WHEN (NEW.is_processing = false)
  EXECUTE FUNCTION notify_contacts_of_audio();
