import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { Shield, Star, MapPin, Calendar, Clock, ArrowLeft, Navigation, Car, AlertCircle, Eye, EyeOff, User } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type DiscretionLevel = 'low' | 'medium' | 'high';
type OutfitType = 'formal' | 'casual' | 'streetwear' | 'tactical';

const DISCRETION_LEVELS = {
  low: {
    label: 'Bassa',
    description: 'Presenza visibile e deterrente',
    icon: Eye,
  },
  medium: {
    label: 'Media',
    description: 'Equilibrio tra visibilità e discrezione',
    icon: Shield,
  },
  high: {
    label: 'Alta',
    description: 'Protezione discreta e invisibile',
    icon: EyeOff,
  },
};

const OUTFIT_TYPES = {
  formal: {
    label: 'Abito Scuro',
    description: 'Completo elegante per eventi formali',
  },
  casual: {
    label: 'Casual Elegante',
    description: 'Look curato ma informale',
  },
  streetwear: {
    label: 'Streetwear',
    description: 'Abbigliamento urbano e moderno',
  },
  tactical: {
    label: 'Tattico',
    description: 'Equipaggiamento professionale',
  },
};

type Bodyguard = {
  id: string;
  full_name: string;
  bio: string;
  hourly_rate: number;
  rating: number;
  total_reviews: number;
  vehicle_type: string;
};

export default function BodyguardDetailScreen() {
  const router = useRouter();
  const { id, defaultService } = useLocalSearchParams<{ id: string; defaultService?: string }>();

  const [bodyguard, setBodyguard] = useState<Bodyguard | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'location' | 'route'>('location');
  const [hours, setHours] = useState('2');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [useBodyguardVehicle, setUseBodyguardVehicle] = useState(false);
  const [discretionLevel, setDiscretionLevel] = useState<DiscretionLevel>('medium');
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitType>('formal');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBodyguard();
  }, [id]);

  useEffect(() => {
    if (bodyguard) {
      const initialServiceType = defaultService === 'trip' ? 'route' : 'location';
      const hasVehicle = bodyguard.vehicle_type !== 'none';
      const initialUseVehicle = defaultService === 'trip' && hasVehicle;

      setServiceType(initialServiceType);
      setUseBodyguardVehicle(initialUseVehicle);
    }
  }, [bodyguard, defaultService]);

  useEffect(() => {
    setError('');
  }, [hours, serviceType, pickupLocation, dropoffLocation]);

  async function loadBodyguard() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'bodyguard')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBodyguard({
          id: data.id,
          full_name: data.full_name || 'Nome non disponibile',
          bio: data.bio || 'Nessuna descrizione disponibile',
          hourly_rate: data.hourly_rate || 50,
          rating: 4.5,
          total_reviews: 0,
          vehicle_type: data.vehicle_type || 'none',
        });
      }
    } catch (err) {
      console.error('Error loading bodyguard:', err);
    } finally {
      setLoading(false);
    }
  }

  const calculateRouteEstimates = (pickup: string, dropoff: string): { distance: number; hours: number } => {
    if (!pickup || !dropoff) return { distance: 0, hours: 0 };

    const pickupLower = pickup.toLowerCase().trim();
    const dropoffLower = dropoff.toLowerCase().trim();

    const cityDistances: { [key: string]: { [key: string]: { km: number; hours: number } } } = {
      'firenze': {
        'napoli': { km: 475, hours: 4.5 },
        'roma': { km: 280, hours: 3 },
        'milano': { km: 300, hours: 3.5 },
        'venezia': { km: 260, hours: 3 },
        'torino': { km: 330, hours: 4 },
        'bologna': { km: 105, hours: 1.5 },
        'genova': { km: 230, hours: 2.5 },
        'verona': { km: 230, hours: 2.5 },
      },
      'napoli': {
        'firenze': { km: 475, hours: 4.5 },
        'roma': { km: 225, hours: 2.5 },
        'milano': { km: 775, hours: 7 },
        'torino': { km: 850, hours: 8 },
        'bologna': { km: 580, hours: 5.5 },
        'venezia': { km: 650, hours: 6 },
        'bari': { km: 260, hours: 2.5 },
        'palermo': { km: 425, hours: 5 },
      },
      'roma': {
        'milano': { km: 575, hours: 5.5 },
        'napoli': { km: 225, hours: 2.5 },
        'firenze': { km: 280, hours: 3 },
        'torino': { km: 670, hours: 6.5 },
        'bologna': { km: 380, hours: 4 },
        'venezia': { km: 530, hours: 5 },
        'bari': { km: 450, hours: 4.5 },
        'palermo': { km: 720, hours: 7 },
      },
      'milano': {
        'roma': { km: 575, hours: 5.5 },
        'firenze': { km: 300, hours: 3.5 },
        'napoli': { km: 775, hours: 7 },
        'torino': { km: 140, hours: 1.5 },
        'venezia': { km: 270, hours: 2.5 },
        'bologna': { km: 210, hours: 2 },
        'genova': { km: 145, hours: 1.5 },
        'verona': { km: 160, hours: 1.5 },
      },
      'torino': {
        'milano': { km: 140, hours: 1.5 },
        'roma': { km: 670, hours: 6.5 },
        'firenze': { km: 330, hours: 4 },
        'napoli': { km: 850, hours: 8 },
        'genova': { km: 170, hours: 2 },
        'bologna': { km: 330, hours: 3.5 },
        'venezia': { km: 395, hours: 4 },
      },
      'bologna': {
        'firenze': { km: 105, hours: 1.5 },
        'milano': { km: 210, hours: 2 },
        'roma': { km: 380, hours: 4 },
        'napoli': { km: 580, hours: 5.5 },
        'venezia': { km: 150, hours: 1.5 },
        'torino': { km: 330, hours: 3.5 },
        'verona': { km: 110, hours: 1.5 },
      },
      'venezia': {
        'milano': { km: 270, hours: 2.5 },
        'roma': { km: 530, hours: 5 },
        'firenze': { km: 260, hours: 3 },
        'napoli': { km: 650, hours: 6 },
        'bologna': { km: 150, hours: 1.5 },
        'torino': { km: 395, hours: 4 },
        'verona': { km: 120, hours: 1.5 },
      },
      'genova': {
        'milano': { km: 145, hours: 1.5 },
        'torino': { km: 170, hours: 2 },
        'firenze': { km: 230, hours: 2.5 },
        'roma': { km: 500, hours: 5 },
      },
      'verona': {
        'milano': { km: 160, hours: 1.5 },
        'venezia': { km: 120, hours: 1.5 },
        'bologna': { km: 110, hours: 1.5 },
        'firenze': { km: 230, hours: 2.5 },
      },
      'bari': {
        'napoli': { km: 260, hours: 2.5 },
        'roma': { km: 450, hours: 4.5 },
      },
      'palermo': {
        'napoli': { km: 425, hours: 5 },
        'roma': { km: 720, hours: 7 },
      },
    };

    for (const [city1, destinations] of Object.entries(cityDistances)) {
      if (pickupLower.includes(city1)) {
        for (const [city2, data] of Object.entries(destinations)) {
          if (dropoffLower.includes(city2)) {
            return data;
          }
        }
      }
      if (dropoffLower.includes(city1)) {
        for (const [city2, data] of Object.entries(destinations)) {
          if (pickupLower.includes(city2)) {
            return data;
          }
        }
      }
    }

    const estimatedKm = Math.floor(Math.random() * 30) + 10;
    return { km: estimatedKm, hours: Math.round((estimatedKm / 40) * 10) / 10 };
  };

  const routeEstimates = calculateRouteEstimates(pickupLocation, dropoffLocation);
  const estimatedDistance = serviceType === 'route' && pickupLocation && dropoffLocation ? routeEstimates.km : 0;
  const estimatedTravelTimeHours = routeEstimates.hours;
  const minHoursForRoute = estimatedTravelTimeHours;

  const pricePerKm = 2;
  const vehicleCost = useBodyguardVehicle && estimatedDistance > 0 ? estimatedDistance * pricePerKm : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dettagli Bodyguard</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!bodyguard) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dettagli Bodyguard</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Bodyguard non trovato</Text>
        </View>
      </View>
    );
  }

  const basePrice = bodyguard.hourly_rate * parseFloat(hours || '0');
  const totalPrice = basePrice + vehicleCost;

  const handleBooking = () => {
    if (!pickupLocation) {
      setError('Inserisci il luogo di partenza');
      return;
    }

    if (serviceType === 'route' && !dropoffLocation) {
      setError('Inserisci la destinazione');
      return;
    }

    if (!hours || parseFloat(hours) <= 0) {
      setError('Inserisci una durata valida');
      return;
    }

    if (serviceType === 'route' && parseFloat(hours) < minHoursForRoute) {
      setError(`La durata minima per questo tragitto è ${minHoursForRoute.toFixed(1)} ore`);
      return;
    }

    setError('');

    router.push({
      pathname: '/payment',
      params: {
        bodyguardId: id,
        bodyguardName: bodyguard.full_name,
        hours,
        totalPrice: totalPrice.toString(),
        serviceType,
        pickupLocation,
        dropoffLocation: serviceType === 'route' ? dropoffLocation : '',
        useVehicle: useBodyguardVehicle.toString(),
        vehicleType: bodyguard.vehicle_type,
        discretionLevel,
        outfit: selectedOutfit,
      },
    });
  };

  const canBook = hours && pickupLocation && (serviceType === 'location' || dropoffLocation);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dettagli Bodyguard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Shield size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.name}>{bodyguard.full_name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={20} color={theme.colors.warning} fill={theme.colors.warning} />
            <Text style={styles.rating}>{bodyguard.rating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({bodyguard.total_reviews} recensioni)</Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={theme.colors.textSecondary} />
            <Text style={styles.distance}>2.5 km da te</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrizione</Text>
          <Text style={styles.bio}>{bodyguard.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo di Servizio</Text>

          <View style={styles.serviceTypeContainer}>
            <TouchableOpacity
              style={[styles.serviceTypeButton, serviceType === 'location' && styles.serviceTypeButtonActive]}
              onPress={() => setServiceType('location')}
            >
              <MapPin size={24} color={serviceType === 'location' ? theme.colors.primary : theme.colors.textSecondary} />
              <View style={styles.serviceTypeTextContainer}>
                <Text style={[styles.serviceTypeTitle, serviceType === 'location' && styles.serviceTypeTextActive]}>
                  Protezione in loco
                </Text>
                <Text style={styles.serviceTypeDescription}>
                  Bodyguard in una posizione specifica
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.serviceTypeButton, serviceType === 'route' && styles.serviceTypeButtonActive]}
              onPress={() => setServiceType('route')}
            >
              <Navigation size={24} color={serviceType === 'route' ? theme.colors.primary : theme.colors.textSecondary} />
              <View style={styles.serviceTypeTextContainer}>
                <Text style={[styles.serviceTypeTitle, serviceType === 'route' && styles.serviceTypeTextActive]}>
                  Tragitto
                </Text>
                <Text style={styles.serviceTypeDescription}>
                  Scorta da punto A a punto B
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livello di Discrezionalità</Text>
          <View style={styles.discretionContainer}>
            {(Object.keys(DISCRETION_LEVELS) as DiscretionLevel[]).map((level) => {
              const config = DISCRETION_LEVELS[level];
              const IconComponent = config.icon;
              const isActive = discretionLevel === level;

              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.discretionButton, isActive && styles.discretionButtonActive]}
                  onPress={() => setDiscretionLevel(level)}
                >
                  <IconComponent
                    size={20}
                    color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <View style={styles.discretionTextContainer}>
                    <Text style={[styles.discretionTitle, isActive && styles.discretionTextActive]}>
                      {config.label}
                    </Text>
                    <Text style={styles.discretionDescription}>
                      {config.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outfit</Text>
          <View style={styles.outfitContainer}>
            {(Object.keys(OUTFIT_TYPES) as OutfitType[]).map((outfit) => {
              const config = OUTFIT_TYPES[outfit];
              const isActive = selectedOutfit === outfit;

              return (
                <TouchableOpacity
                  key={outfit}
                  style={[styles.outfitChip, isActive && styles.outfitChipActive]}
                  onPress={() => setSelectedOutfit(outfit)}
                >
                  <User size={16} color={isActive ? theme.colors.background : theme.colors.textSecondary} />
                  <View style={styles.outfitTextContainer}>
                    <Text style={[styles.outfitTitle, isActive && styles.outfitTextActive]}>
                      {config.label}
                    </Text>
                    <Text style={[styles.outfitDescription, isActive && styles.outfitDescriptionActive]}>
                      {config.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dettagli Prenotazione</Text>

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Clock size={16} color={theme.colors.textSecondary} />
              <Text style={styles.label}>Durata (ore)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
              placeholder="2"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <MapPin size={16} color={theme.colors.textSecondary} />
              <Text style={styles.label}>
                {serviceType === 'location' ? 'Luogo' : 'Punto di Partenza'}
              </Text>
            </View>
            <TextInput
              style={styles.input}
              value={pickupLocation}
              onChangeText={setPickupLocation}
              placeholder="Via Roma 123, Milano"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {serviceType === 'route' && (
            <>
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Navigation size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.label}>Destinazione</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={dropoffLocation}
                  onChangeText={setDropoffLocation}
                  placeholder="Piazza Duomo, Milano"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {estimatedDistance > 0 && (
                <View style={styles.routeInfoBox}>
                  <View style={styles.routeInfoRow}>
                    <Navigation size={16} color={theme.colors.primary} />
                    <Text style={styles.routeInfoText}>Distanza stimata: {estimatedDistance} km</Text>
                  </View>
                  <View style={styles.routeInfoRow}>
                    <Clock size={16} color={theme.colors.primary} />
                    <Text style={styles.routeInfoText}>
                      Tempo di viaggio: ~{estimatedTravelTimeHours >= 1
                        ? `${estimatedTravelTimeHours} ${estimatedTravelTimeHours === 1 ? 'ora' : 'ore'}`
                        : `${Math.round(estimatedTravelTimeHours * 60)} min`}
                    </Text>
                  </View>
                  <View style={styles.routeInfoRow}>
                    <AlertCircle size={16} color={theme.colors.warning} />
                    <Text style={styles.routeInfoTextSmall}>
                      Durata minima: {minHoursForRoute.toFixed(1)} ore
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {serviceType === 'route' && (
            <TouchableOpacity
              style={styles.vehicleOption}
              onPress={() => setUseBodyguardVehicle(!useBodyguardVehicle)}
            >
              <View style={styles.checkbox}>
                {useBodyguardVehicle && <View style={styles.checkboxChecked} />}
              </View>
              <Car size={20} color={theme.colors.textSecondary} />
              <View style={styles.vehicleTextContainer}>
                <Text style={styles.vehicleTitle}>Usa mezzo del bodyguard</Text>
                <Text style={styles.vehicleDescription}>
                  €{pricePerKm}/km {estimatedDistance > 0 ? `(~€${vehicleCost.toFixed(0)})` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Calendar size={16} color={theme.colors.textSecondary} />
              <Text style={styles.label}>Note aggiuntive (opzionale)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Servizio per evento aziendale..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tariffa oraria:</Text>
              <Text style={styles.priceValue}>€{bodyguard.hourly_rate}/ora</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Durata:</Text>
              <Text style={styles.priceValue}>{hours} ore</Text>
            </View>
            {useBodyguardVehicle && vehicleCost > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Mezzo di trasporto:</Text>
                <Text style={styles.priceValue}>€{vehicleCost.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Totale:</Text>
              <Text style={styles.totalValue}>€{totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBooking}
        >
          <Text style={styles.bookButtonText}>Prenota ora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reviews: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  bio: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  serviceTypeContainer: {
    gap: 12,
  },
  serviceTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  serviceTypeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  serviceTypeTextContainer: {
    flex: 1,
  },
  serviceTypeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  serviceTypeTextActive: {
    color: theme.colors.primary,
  },
  serviceTypeDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  formGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  vehicleTextContainer: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  vehicleDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  priceSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.background,
  },
  routeInfoBox: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  routeInfoTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.error + '15',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '600',
  },
  discretionContainer: {
    gap: 12,
  },
  discretionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  discretionButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  discretionTextContainer: {
    flex: 1,
  },
  discretionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  discretionTextActive: {
    color: theme.colors.primary,
  },
  discretionDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  outfitContainer: {
    gap: 10,
  },
  outfitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  outfitChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  outfitTextContainer: {
    flex: 1,
  },
  outfitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  outfitTextActive: {
    color: theme.colors.background,
  },
  outfitDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  outfitDescriptionActive: {
    color: theme.colors.background,
    opacity: 0.85,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
