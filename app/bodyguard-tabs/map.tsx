import { View, Text, StyleSheet, Platform, TouchableOpacity, Switch } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { MapPin, Navigation, User, Radio, Eye, EyeOff } from 'lucide-react-native';
import { theme } from '../../theme';

let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

type LocationData = {
  latitude: number;
  longitude: number;
};

export default function BodyguardMapScreen() {
  const [myLocation, setMyLocation] = useState<LocationData | null>(null);
  const [clientLocation, setClientLocation] = useState<LocationData>({
    latitude: 45.4685,
    longitude: 9.1810,
  });
  const [isTracking, setIsTracking] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setErrorMsg('Le mappe non sono supportate sul web. Usa l\'app mobile.');
        return;
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permesso di accesso alla posizione negato');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setMyLocation(newLocation);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setMyLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      );

      return () => {
        subscription.remove();
      };
    })();

    const clientInterval = setInterval(() => {
      setClientLocation(prev => ({
        latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
      }));
    }, 10000);

    return () => {
      clearInterval(clientInterval);
    };
  }, []);

  if (Platform.OS === 'web' || errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <MapPin size={64} color={theme.colors.textSecondary} />
        <Text style={styles.errorTitle}>Mappa non disponibile</Text>
        <Text style={styles.errorText}>
          {errorMsg || 'Le mappe non sono supportate sul web. Usa l\'app mobile.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: clientLocation.latitude,
          longitude: clientLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={true}
      >
        {myLocation && (
          <Marker
            coordinate={myLocation}
            title="La mia posizione"
            description="Sono qui"
          >
            <View style={styles.bodyguardMarker}>
              <Navigation size={20} color={theme.colors.background} />
            </View>
          </Marker>
        )}

        <Marker
          coordinate={clientLocation}
          title="Cliente"
          description="Laura Bianchi"
        >
          <View style={styles.clientMarker}>
            <User size={20} color={theme.colors.background} />
          </View>
        </Marker>
      </MapView>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoHeader}>
            <Radio size={20} color={isTracking ? '#10B981' : theme.colors.textSecondary} />
            <Text style={styles.infoTitle}>
              {isTracking ? 'Tracking Attivo' : 'Tracking Disattivato'}
            </Text>
          </View>
          <Switch
            value={isTracking}
            onValueChange={setIsTracking}
            trackColor={{ false: theme.colors.border, true: '#10B981' + '50' }}
            thumbColor={isTracking ? '#10B981' : theme.colors.textSecondary}
          />
        </View>

        {isTracking && (
          <Text style={styles.infoSubtitle}>
            Il cliente può vedere la tua posizione in tempo reale
          </Text>
        )}

        {!isTracking && (
          <Text style={styles.infoSubtitleWarning}>
            Il cliente non può vedere la tua posizione
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.clientInfo}>
          <User size={18} color={theme.colors.primary} />
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>Laura Bianchi</Text>
            <Text style={styles.clientStatus}>Prenotazione attiva</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bodyguardMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clientMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoCard: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  infoSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  infoSubtitleWarning: {
    fontSize: 14,
    color: '#EF4444',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  clientStatus: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
