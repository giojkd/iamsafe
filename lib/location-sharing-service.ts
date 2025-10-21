import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type LocationData = {
  id?: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  is_sharing_enabled: boolean;
  last_updated: string;
};

export type SharingPermission = {
  id: string;
  owner_id: string;
  viewer_id: string;
  permission_type: 'explicit' | 'booking' | 'emergency';
  is_active: boolean;
  expires_at?: string;
};

export type UserWithLocation = {
  user_id: string;
  name: string;
  role: string;
  latitude: number;
  longitude: number;
  is_sharing_enabled: boolean;
  last_updated: string;
};

class LocationSharingService {
  private updateInterval: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, any> = new Map();

  async updateMyLocation(latitude: number, longitude: number, isSharing: boolean = true): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude,
          longitude,
          is_sharing_enabled: isSharing,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error updating location:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMyLocation:', error);
      return false;
    }
  }

  async toggleLocationSharing(enabled: boolean): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_locations')
        .update({ is_sharing_enabled: enabled })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling location sharing:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleLocationSharing:', error);
      return false;
    }
  }

  async grantLocationPermission(viewerUserId: string, permissionType: 'explicit' | 'booking' | 'emergency' = 'explicit', expiresAt?: Date): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('location_sharing_permissions')
        .insert({
          owner_id: user.id,
          viewer_id: viewerUserId,
          permission_type: permissionType,
          is_active: true,
          expires_at: expiresAt?.toISOString(),
        });

      if (error) {
        console.error('Error granting permission:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in grantLocationPermission:', error);
      return false;
    }
  }

  async revokeLocationPermission(viewerUserId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('location_sharing_permissions')
        .update({ is_active: false })
        .eq('owner_id', user.id)
        .eq('viewer_id', viewerUserId);

      if (error) {
        console.error('Error revoking permission:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in revokeLocationPermission:', error);
      return false;
    }
  }

  async getSharedLocations(): Promise<UserWithLocation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: permissions, error: permError } = await supabase
        .from('location_sharing_permissions')
        .select('owner_id')
        .eq('viewer_id', user.id)
        .eq('is_active', true);

      if (permError || !permissions) {
        console.error('Error fetching permissions:', permError);
        return [];
      }

      const ownerIds = permissions.map(p => p.owner_id);

      if (ownerIds.length === 0) return [];

      const { data: locations, error: locError } = await supabase
        .from('user_locations')
        .select(`
          user_id,
          latitude,
          longitude,
          is_sharing_enabled,
          last_updated
        `)
        .in('user_id', ownerIds)
        .eq('is_sharing_enabled', true);

      if (locError || !locations) {
        console.error('Error fetching locations:', locError);
        return [];
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', ownerIds);

      return locations.map(loc => {
        const profile = profiles?.find(p => p.id === loc.user_id);
        return {
          user_id: loc.user_id,
          name: profile?.full_name || 'Utente',
          role: profile?.role || 'user',
          latitude: loc.latitude,
          longitude: loc.longitude,
          is_sharing_enabled: loc.is_sharing_enabled,
          last_updated: loc.last_updated,
        };
      });
    } catch (error) {
      console.error('Error in getSharedLocations:', error);
      return [];
    }
  }

  async getMyPermissions(): Promise<SharingPermission[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('location_sharing_permissions')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMyPermissions:', error);
      return [];
    }
  }

  subscribeToSharedLocations(callback: (locations: UserWithLocation[]) => void): () => void {
    const channel = supabase
      .channel('shared_locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
        },
        async () => {
          const locations = await this.getSharedLocations();
          callback(locations);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  async startAutoUpdate(intervalMs: number = 10000): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Auto location update not available on web');
      return false;
    }

    if (this.updateInterval) {
      console.log('Auto update already running');
      return true;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission not granted');
      return false;
    }

    this.updateInterval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        await this.updateMyLocation(
          location.coords.latitude,
          location.coords.longitude,
          true
        );
      } catch (error) {
        console.error('Error in auto update:', error);
      }
    }, intervalMs);

    const initialLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    await this.updateMyLocation(
      initialLocation.coords.latitude,
      initialLocation.coords.longitude,
      true
    );

    return true;
  }

  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const locationSharingService = new LocationSharingService();
