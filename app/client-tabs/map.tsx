import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { MapPin, Navigation, User, Shield, Users, ChevronDown, ChevronUp } from 'lucide-react-native';
import { theme } from '../../theme';
import { locationSharingService, UserWithLocation } from '../../lib/location-sharing-service';

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

export default function ClientMapScreen() {
  const [myLocation, setMyLocation] = useState<LocationData | null>(null);
  const [sharedLocations, setSharedLocations] = useState<UserWithLocation[]>([]);
  const [isSharingEnabled, setIsSharingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLocationList, setShowLocationList] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let locationSubscription: any;
    let realtimeUnsubscribe: (() => void) | undefined;

    (async () => {
      if (Platform.OS === 'web') {
        setErrorMsg('Le mappe non sono supportate sul web. Usa l\'app mobile.');
        setIsLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permesso di accesso alla posizione negato');
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
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

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (newLocation) => {
          const coords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setMyLocation(coords);

          if (isSharingEnabled) {
            await locationSharingService.updateMyLocation(
              coords.latitude,
              coords.longitude,
              true
            );
          }
        }
      );

      const locations = await locationSharingService.getSharedLocations();
      setSharedLocations(locations);

      realtimeUnsubscribe = locationSharingService.subscribeToSharedLocations((locations) => {
        setSharedLocations(locations);
      });

      setIsLoading(false);
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
      }
    };
  }, [isSharingEnabled]);

  const toggleSharing = async (enabled: boolean) => {
    setIsSharingEnabled(enabled);
    await locationSharingService.toggleLocationSharing(enabled);

    if (enabled && myLocation) {
      await locationSharingService.updateMyLocation(
        myLocation.latitude,
        myLocation.longitude,
        true
      );
    }
  };

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

  const bodyguards = sharedLocations.filter(loc => loc.role === 'bodyguard');
  const otherUsers = sharedLocations.filter(loc => loc.role !== 'bodyguard');

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Caricamento mappa...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: myLocation?.latitude || 45.4642,
              longitude: myLocation?.longitude || 9.1900,
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
                description="Sei qui"
              >
                <View style={styles.myMarker}>
                  <User size={20} color={theme.colors.background} />
                </View>
              </Marker>
            )}

            {bodyguards.map((bodyguard) => (
              <Marker
                key={bodyguard.user_id}
                coordinate={{
                  latitude: bodyguard.latitude,
                  longitude: bodyguard.longitude,
                }}
                title={bodyguard.name}
                description="Bodyguard"
              >
                <View style={styles.bodyguardMarker}>
                  <Shield size={20} color={theme.colors.background} />
                </View>
              </Marker>
            ))}

            {otherUsers.map((user) => (
              <Marker
                key={user.user_id}
                coordinate={{
                  latitude: user.latitude,
                  longitude: user.longitude,
                }}
                title={user.name}
                description="Utente condiviso"
              >
                <View style={styles.sharedUserMarker}>
                  <Users size={18} color={theme.colors.background} />
                </View>
              </Marker>
            ))}
          </MapView>

          <View style={styles.controlsCard}>
            <View style={styles.sharingControl}>
              <View style={styles.sharingHeader}>
                <MapPin size={20} color={isSharingEnabled ? '#10B981' : theme.colors.textSecondary} />
                <Text style={styles.sharingTitle}>
                  {isSharingEnabled ? 'Condivisione Attiva' : 'Condivisione Disattivata'}
                </Text>
              </View>
              <Switch
                value={isSharingEnabled}
                onValueChange={toggleSharing}
                trackColor={{ false: theme.colors.border, true: '#10B981' + '50' }}
                thumbColor={isSharingEnabled ? '#10B981' : theme.colors.textSecondary}
              />
            </View>

            <Text style={styles.sharingSubtitle}>
              {isSharingEnabled
                ? 'Gli utenti autorizzati possono vedere la tua posizione'
                : 'Attiva per condividere la tua posizione'}
            </Text>
          </View>

          {sharedLocations.length > 0 && (
            <View style={styles.locationsCard}>
              <TouchableOpacity
                style={styles.locationsHeader}
                onPress={() => setShowLocationList(!showLocationList)}
                activeOpacity={0.7}
              >
                <Text style={styles.locationsTitle}>
                  Posizioni Condivise ({sharedLocations.length})
                </Text>
                {showLocationList ? (
                  <ChevronUp size={20} color={theme.colors.text} />
                ) : (
                  <ChevronDown size={20} color={theme.colors.text} />
                )}
              </TouchableOpacity>

              {showLocationList && (
                <ScrollView style={styles.locationsList}>
                  {bodyguards.length > 0 && (
                    <>
                      <Text style={styles.categoryLabel}>Bodyguards</Text>
                      {bodyguards.map((bodyguard) => (
                        <View key={bodyguard.user_id} style={styles.locationItem}>
                          <View style={styles.locationIcon}>
                            <Shield size={18} color="#10B981" />
                          </View>
                          <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{bodyguard.name}</Text>
                            <Text style={styles.locationStatus}>
                              Ultimo aggiornamento: {new Date(bodyguard.last_updated).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}

                  {otherUsers.length > 0 && (
                    <>
                      <Text style={styles.categoryLabel}>Altri Utenti</Text>
                      {otherUsers.map((user) => (
                        <View key={user.user_id} style={styles.locationItem}>
                          <View style={styles.locationIcon}>
                            <Users size={18} color={theme.colors.primary} />
                          </View>
                          <View style={styles.locationInfo}>
                            <Text style={styles.locationName}>{user.name}</Text>
                            <Text style={styles.locationStatus}>
                              Ultimo aggiornamento: {new Date(user.last_updated).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </ScrollView>
              )}
            </View>
          )}
        </>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
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
  myMarker: {
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
  sharedUserMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
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
  controlsCard: {
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
  sharingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sharingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sharingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sharingSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  locationsCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  locationsList: {
    maxHeight: 200,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  locationStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
