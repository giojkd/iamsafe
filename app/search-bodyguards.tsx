import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { theme } from '../theme';
import { Shield, Star, MapPin, ArrowLeft, Filter, Car } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { isWithinRadius } from '../lib/italian-cities';
import { supabase } from '../lib/supabase';

type VehicleType = 'sedan' | 'suv' | 'luxury' | 'none';

type WorkZone = {
  city: string;
  radius_km: number;
};

type Bodyguard = {
  id: string;
  full_name: string;
  bio: string;
  hourly_rate: number;
  rating: number;
  total_reviews: number;
  is_available: boolean;
  latitude: number;
  longitude: number;
  experience_years: number;
  vehicle_type: VehicleType;
  workZones: WorkZone[];
};


const VEHICLE_LABELS: Record<VehicleType, string> = {
  sedan: 'Berlina',
  suv: 'SUV',
  luxury: 'Auto di lusso',
  none: 'Nessun veicolo',
};

export default function SearchBodyguardsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    location?: string;
    city?: string;
    address?: string;
    serviceType?: string;
    vehicleType?: string;
    minRating?: string;
    maxPrice?: string;
    minExperience?: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [bodyguards, setBodyguards] = useState<Bodyguard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const location = params.location || 'Milano';
  const locationAddress = params.address || 'Milano, Italia';
  const serviceType = params.serviceType || 'any';

  const vehicleFromParams = params.vehicleType as VehicleType | undefined;

  const minRating = params.minRating ? parseFloat(params.minRating) : 0;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice) : 100;
  const minExperience = params.minExperience ? parseInt(params.minExperience) : 0;

  const searchCity = params.city || location;

  useEffect(() => {
    fetchBodyguards();
  }, []);

  async function fetchBodyguards() {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching bodyguards...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'bodyguard');

      console.log('Profiles result:', { profiles, error: profilesError });
      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setBodyguards([]);
        setLoading(false);
        return;
      }

      const bodyguardIds = profiles.map(p => p.id);
      const { data: workZones, error: zonesError } = await supabase
        .from('bodyguard_work_zones')
        .select('*')
        .in('bodyguard_id', bodyguardIds);

      if (zonesError) throw zonesError;

      const bodyguardsWithZones: Bodyguard[] = profiles.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || 'Nome non disponibile',
        bio: profile.bio || 'Nessuna descrizione',
        hourly_rate: profile.hourly_rate || 0,
        rating: 4.5,
        total_reviews: 0,
        is_available: true,
        latitude: 0,
        longitude: 0,
        experience_years: profile.experience_years || 0,
        vehicle_type: (profile.vehicle_type as VehicleType) || 'none',
        workZones: workZones
          ?.filter(wz => wz.bodyguard_id === profile.id)
          .map(wz => ({
            city: wz.city,
            radius_km: wz.radius_km
          })) || []
      }));

      setBodyguards(bodyguardsWithZones);
    } catch (err) {
      console.error('Error fetching bodyguards:', err);
      setError('Errore nel caricamento dei bodyguard');
    } finally {
      setLoading(false);
    }
  }

  const filteredBodyguards = bodyguards.filter(bg => {
    const isInWorkZone = bg.workZones.some(zone =>
      isWithinRadius(searchCity, zone.city, zone.radius_km)
    );
    if (!isInWorkZone) {
      return false;
    }

    if (serviceType === 'with_vehicle' && bg.vehicle_type === 'none') {
      return false;
    }
    if (serviceType === 'without_vehicle' && bg.vehicle_type !== 'none') {
      return false;
    }
    if (vehicleFromParams && serviceType === 'with_vehicle' && bg.vehicle_type !== vehicleFromParams) {
      return false;
    }
    if (bg.rating < minRating) {
      return false;
    }
    if (bg.hourly_rate > maxPrice) {
      return false;
    }
    if (bg.experience_years < minExperience) {
      return false;
    }
    return true;
  });

  const activeFiltersCount =
    (serviceType !== 'any' ? 1 : 0) +
    (vehicleFromParams && serviceType === 'with_vehicle' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (maxPrice < 100 ? 1 : 0) +
    (minExperience > 0 ? 1 : 0);

  const renderBodyguard = ({ item }: { item: Bodyguard }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        const defaultService = serviceType === 'with_vehicle' ? 'trip' : 'protection';
        router.push({
          pathname: `/bodyguard-detail/${item.id}`,
          params: {
            defaultService: defaultService
          }
        });
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Shield size={32} color={theme.colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.full_name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color={theme.colors.warning} fill={theme.colors.warning} />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({item.total_reviews} recensioni)</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>€{item.hourly_rate}</Text>
          <Text style={styles.priceLabel}>/ora</Text>
        </View>
      </View>
      <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.locationContainer}>
          <MapPin size={14} color={theme.colors.textSecondary} />
          <Text style={styles.distance}>2.5 km da te</Text>
        </View>
        {item.vehicle_type !== 'none' && (
          <View style={styles.vehicleBadge}>
            <Car size={12} color={theme.colors.primary} />
            <Text style={styles.vehicleBadgeText}>{VEHICLE_LABELS[item.vehicle_type]}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Cerca Bodyguard</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Bodyguard</Text>
          <TouchableOpacity
            style={styles.locationBadge}
            onPress={() => router.back()}
          >
            <MapPin size={14} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.locationText}>{location}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.filterButton}>
          <Filter size={20} color={theme.colors.text} strokeWidth={2} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>
            {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro attivo' : 'filtri attivi'}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.modifyFiltersText}>Modifica</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredBodyguards}
        renderItem={renderBodyguard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Shield size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>Nessun bodyguard trovato</Text>
            <Text style={styles.emptySubtext}>Prova a modificare i filtri</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: theme.typography.fontSizeM,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: theme.borderRadius.s,
  },
  locationText: {
    fontSize: theme.typography.fontSizeXS,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeightMedium,
  },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.accentLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  activeFiltersText: {
    fontSize: theme.typography.fontSizeS,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.accent,
  },
  modifyFiltersText: {
    fontSize: theme.typography.fontSizeS,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.accent,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reviews: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bio: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.background,
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    maxHeight: 320,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterSection: {
    padding: 16,
    gap: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  filterChipTextActive: {
    color: theme.colors.background,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
