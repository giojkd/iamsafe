import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type LocationCoordinates = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

export type LocationUpdateCallback = (location: LocationCoordinates) => void;

class LocationService {
  private subscription: Location.LocationSubscription | null = null;
  private callbacks: Set<LocationUpdateCallback> = new Set();
  private hasPermission: boolean = false;
  private currentLocation: LocationCoordinates | null = null;

  async initialize(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Location tracking is not supported on web');
      return false;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    this.hasPermission = status === 'granted';

    if (!this.hasPermission) {
      console.warn('Location permission not granted');
      return false;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };

      this.notifyCallbacks(this.currentLocation);
      return true;
    } catch (error) {
      console.error('Error getting initial location:', error);
      return false;
    }
  }

  async startTracking(): Promise<boolean> {
    if (!this.hasPermission) {
      const success = await this.initialize();
      if (!success) return false;
    }

    if (this.subscription) {
      console.log('Location tracking already active');
      return true;
    }

    try {
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          };

          this.notifyCallbacks(this.currentLocation);
        }
      );

      console.log('Location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  stopTracking(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
      console.log('Location tracking stopped');
    }
  }

  subscribe(callback: LocationUpdateCallback): () => void {
    this.callbacks.add(callback);

    if (this.currentLocation) {
      callback(this.currentLocation);
    }

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(location: LocationCoordinates): void {
    this.callbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  getCurrentLocation(): LocationCoordinates | null {
    return this.currentLocation;
  }

  isTracking(): boolean {
    return this.subscription !== null;
  }

  hasLocationPermission(): boolean {
    return this.hasPermission;
  }
}

export const locationService = new LocationService();
