/*
  # SOS Emergency System

  ## Overview
  Creates a comprehensive SOS emergency system that allows users to:
  - Trigger emergency alerts to designated contacts
  - Share real-time location during emergencies
  - Manage emergency contacts (favorites)
  - Track SOS alert history

  ## New Tables

  ### `emergency_contacts`
  Stores user's emergency contact list
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) - Owner of the contact list
  - `contact_user_id` (uuid, references auth.users) - Emergency contact person
  - `contact_name` (text) - Name of the contact
  - `contact_phone` (text) - Phone number
  - `priority` (int) - Contact priority (1 = highest)
  - `is_active` (boolean) - Whether contact is active
  - `created_at` (timestamptz)

  ### `sos_alerts`
  Tracks all SOS alerts triggered by users
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) - User who triggered SOS
  - `latitude` (decimal) - Location when SOS was triggered
  - `longitude` (decimal) - Location when SOS was triggered
  - `status` (text) - Status: 'active', 'resolved', 'cancelled'
  - `triggered_at` (timestamptz) - When SOS was triggered
  - `resolved_at` (timestamptz) - When SOS was resolved
  - `notes` (text) - Optional notes

  ### `sos_notifications`
  Tracks notifications sent to emergency contacts
  - `id` (uuid, primary key)
  - `sos_alert_id` (uuid, references sos_alerts)
  - `recipient_user_id` (uuid, references auth.users)
  - `sent_at` (timestamptz)
  - `read_at` (timestamptz)
  - `acknowledged_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can manage their own emergency contacts
  - Emergency contacts can view SOS alerts sent to them
  - Active SOS location is shared with emergency contacts

  ## Important Notes
  1. SOS alerts automatically enable location sharing with emergency contacts
  2. Location sharing continues until user manually deactivates SOS
  3. All emergency contacts receive immediate notifications
  4. System tracks notification delivery and acknowledgment
*/

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_phone text,
  priority int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_priority CHECK (priority > 0 AND priority <= 10)
);

-- Create sos_alerts table
CREATE TABLE IF NOT EXISTS sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  triggered_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  notes text,
  CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'cancelled'))
);

-- Create sos_notifications table
CREATE TABLE IF NOT EXISTS sos_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_alert_id uuid NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  acknowledged_at timestamptz
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active ON emergency_contacts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sos_notifications_alert ON sos_notifications(sos_alert_id);
CREATE INDEX IF NOT EXISTS idx_sos_notifications_recipient ON sos_notifications(recipient_user_id);

-- Enable Row Level Security
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergency_contacts

CREATE POLICY "Users can view own emergency contacts"
  ON emergency_contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view contacts where they are listed"
  ON emergency_contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = contact_user_id);

CREATE POLICY "Users can insert own emergency contacts"
  ON emergency_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contacts"
  ON emergency_contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contacts"
  ON emergency_contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for sos_alerts

CREATE POLICY "Users can view own SOS alerts"
  ON sos_alerts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Emergency contacts can view SOS alerts"
  ON sos_alerts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emergency_contacts
      WHERE emergency_contacts.user_id = sos_alerts.user_id
      AND emergency_contacts.contact_user_id = auth.uid()
      AND emergency_contacts.is_active = true
    )
  );

CREATE POLICY "Users can insert own SOS alerts"
  ON sos_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SOS alerts"
  ON sos_alerts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for sos_notifications

CREATE POLICY "Users can view notifications sent to them"
  ON sos_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users can view notifications they triggered"
  ON sos_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sos_alerts
      WHERE sos_alerts.id = sos_notifications.sos_alert_id
      AND sos_alerts.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert notifications"
  ON sos_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sos_alerts
      WHERE sos_alerts.id = sos_notifications.sos_alert_id
      AND sos_alerts.user_id = auth.uid()
    )
  );

CREATE POLICY "Recipients can update their notifications"
  ON sos_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);

-- Function to automatically create location sharing permissions when SOS is triggered
CREATE OR REPLACE FUNCTION create_sos_location_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    -- Enable location sharing for the user
    UPDATE user_locations
    SET is_sharing_enabled = true
    WHERE user_id = NEW.user_id;

    -- Create location sharing permissions for all emergency contacts
    INSERT INTO location_sharing_permissions (owner_id, viewer_id, permission_type, is_active)
    SELECT
      NEW.user_id,
      ec.contact_user_id,
      'emergency',
      true
    FROM emergency_contacts ec
    WHERE ec.user_id = NEW.user_id
    AND ec.contact_user_id IS NOT NULL
    AND ec.is_active = true
    ON CONFLICT (owner_id, viewer_id)
    DO UPDATE SET
      is_active = true,
      permission_type = 'emergency';

    -- Create notifications for all emergency contacts
    INSERT INTO sos_notifications (sos_alert_id, recipient_user_id)
    SELECT
      NEW.id,
      ec.contact_user_id
    FROM emergency_contacts ec
    WHERE ec.user_id = NEW.user_id
    AND ec.contact_user_id IS NOT NULL
    AND ec.is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function when SOS is created
DROP TRIGGER IF EXISTS trigger_sos_location_permissions ON sos_alerts;
CREATE TRIGGER trigger_sos_location_permissions
  AFTER INSERT ON sos_alerts
  FOR EACH ROW
  EXECUTE FUNCTION create_sos_location_permissions();

-- Function to clean up when SOS is resolved or cancelled
CREATE OR REPLACE FUNCTION cleanup_sos_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('resolved', 'cancelled') AND OLD.status = 'active' THEN
    -- Remove emergency location sharing permissions
    UPDATE location_sharing_permissions
    SET is_active = false
    WHERE owner_id = NEW.user_id
    AND permission_type = 'emergency';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute cleanup when SOS status changes
DROP TRIGGER IF EXISTS trigger_cleanup_sos ON sos_alerts;
CREATE TRIGGER trigger_cleanup_sos
  AFTER UPDATE ON sos_alerts
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION cleanup_sos_permissions();
