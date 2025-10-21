# Location Tracking Schema

This document outlines the Supabase database schema needed for production real-time location tracking.

## Database Tables

### `user_locations`

Stores real-time location data for both clients and bodyguards.

```sql
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  accuracy decimal(10, 2),
  heading decimal(5, 2),
  speed decimal(10, 2),
  timestamp timestamptz NOT NULL DEFAULT now(),
  is_tracking_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast location lookups
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_timestamp ON user_locations(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own location
CREATE POLICY "Users can insert own location"
  ON user_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own location
CREATE POLICY "Users can update own location"
  ON user_locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own location
CREATE POLICY "Users can view own location"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### `bookings`

Links clients to bodyguards during active bookings (if not already exists).

```sql
-- This table might already exist, add these columns if needed
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS allow_location_sharing boolean DEFAULT true;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location_sharing_enabled boolean DEFAULT false;

-- Policy: Allow viewing location of paired user during active booking
CREATE POLICY "View paired user location during booking"
  ON user_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE (
        (bookings.client_id = auth.uid() AND bookings.bodyguard_id = user_locations.user_id)
        OR
        (bookings.bodyguard_id = auth.uid() AND bookings.client_id = user_locations.user_id)
      )
      AND bookings.status = 'active'
      AND bookings.location_sharing_enabled = true
      AND user_locations.is_tracking_enabled = true
    )
  );
```

## Real-time Subscriptions

Enable real-time updates for location changes:

```typescript
import { supabase } from './supabase';

// Subscribe to location updates for a specific user
function subscribeToUserLocation(userId: string, callback: (location: any) => void) {
  return supabase
    .channel(`location:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_locations',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}

// Update user location
async function updateUserLocation(latitude: number, longitude: number) {
  const { data, error } = await supabase
    .from('user_locations')
    .upsert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  return { data, error };
}
```

## Integration Steps

1. Create the tables using Supabase migration tool
2. Update the location service to use Supabase instead of local state
3. Implement real-time subscriptions in map components
4. Add location sharing toggle in booking flow
5. Test RLS policies ensure proper privacy

## Privacy Considerations

- Location tracking should be opt-in during bookings
- Users can disable tracking at any time
- Location data should be automatically cleared after booking ends
- Only paired users (client-bodyguard) can see each other's location during active bookings
