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
  
  ### `sos_alerts`
  Tracks all SOS alerts triggered by users
  
  ### `sos_notifications`
  Tracks notifications sent to emergency contacts

  ## Security
  - RLS enabled on all tables
  - Users can manage their own emergency contacts
  - Emergency contacts can view SOS alerts sent to them
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emergency_contacts' AND policyname = 'Users can view own emergency contacts') THEN
    CREATE POLICY "Users can view own emergency contacts"
      ON emergency_contacts FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emergency_contacts' AND policyname = 'Users can view contacts where they are listed') THEN
    CREATE POLICY "Users can view contacts where they are listed"
      ON emergency_contacts FOR SELECT TO authenticated
      USING (auth.uid() = contact_user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emergency_contacts' AND policyname = 'Users can insert own emergency contacts') THEN
    CREATE POLICY "Users can insert own emergency contacts"
      ON emergency_contacts FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emergency_contacts' AND policyname = 'Users can update own emergency contacts') THEN
    CREATE POLICY "Users can update own emergency contacts"
      ON emergency_contacts FOR UPDATE TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emergency_contacts' AND policyname = 'Users can delete own emergency contacts') THEN
    CREATE POLICY "Users can delete own emergency contacts"
      ON emergency_contacts FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for sos_alerts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sos_alerts' AND policyname = 'Users can view own SOS alerts') THEN
    CREATE POLICY "Users can view own SOS alerts"
      ON sos_alerts FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sos_alerts' AND policyname = 'Emergency contacts can view SOS alerts') THEN
    CREATE POLICY "Emergency contacts can view SOS alerts"
      ON sos_alerts FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM emergency_contacts
          WHERE emergency_contacts.user_id = sos_alerts.user_id
          AND emergency_contacts.contact_user_id = auth.uid()
          AND emergency_contacts.is_active = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sos_alerts' AND policyname = 'Users can insert own SOS alerts') THEN
    CREATE POLICY "Users can insert own SOS alerts"
      ON sos_alerts FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sos_alerts' AND policyname = 'Users can update own SOS alerts') THEN
    CREATE POLICY "Users can update own SOS alerts"
      ON sos_alerts FOR UPDATE TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for sos_notifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sos_notifications' AND policyname = 'Users can view notifications sent to them') THEN
    CREATE POLICY "Users can view notifications sent to them"
      ON sos_notifications FOR SELECT TO authenticated
      USING (auth.uid() = recipient_user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sos_notifications' AND policyname = 'Users can view notifications they triggered') THEN
    CREATE POLICY "Users can view notifications they triggered"
      ON sos_notifications FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM sos_alerts
          WHERE sos_alerts.id = sos_notifications.sos_alert_id
          AND sos_alerts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sos_notifications' AND policyname = 'System can insert notifications') THEN
    CREATE POLICY "System can insert notifications"
      ON sos_notifications FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM sos_alerts
          WHERE sos_alerts.id = sos_notifications.sos_alert_id
          AND sos_alerts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sos_notifications' AND policyname = 'Recipients can update their notifications') THEN
    CREATE POLICY "Recipients can update their notifications"
      ON sos_notifications FOR UPDATE TO authenticated
      USING (auth.uid() = recipient_user_id) WITH CHECK (auth.uid() = recipient_user_id);
  END IF;
END $$;

-- Function to automatically create location sharing permissions when SOS is triggered
CREATE OR REPLACE FUNCTION create_sos_location_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    -- Enable location sharing for the user
    INSERT INTO user_locations (user_id, latitude, longitude, is_sharing_enabled, last_updated)
    VALUES (NEW.user_id, NEW.latitude, NEW.longitude, true, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      latitude = NEW.latitude,
      longitude = NEW.longitude,
      is_sharing_enabled = true,
      last_updated = now();

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
    ON CONFLICT DO NOTHING;

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
