import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { theme } from '../theme';
import { ArrowLeft, Car, Star, Euro, Briefcase, ChevronRight, Shield } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

type ServiceType = 'any' | 'with_vehicle' | 'without_vehicle';
type VehicleType = 'sedan' | 'suv' | 'luxury';

const SERVICE_OPTIONS: { value: ServiceType; label: string; description: string }[] = [
  { value: 'any', label: 'Qualsiasi servizio', description: 'Con o senza auto' },
  { value: 'with_vehicle', label: 'Con tragitto in auto', description: 'Include trasporto' },
  { value: 'without_vehicle', label: 'Solo accompagnamento', description: 'Servizio a piedi' },
];

const VEHICLE_OPTIONS: { value: VehicleType; label: string; description: string }[] = [
  { value: 'sedan', label: 'Berlina', description: 'Auto standard' },
  { value: 'suv', label: 'SUV', description: 'Veicolo spazioso' },
  { value: 'luxury', label: 'Lusso', description: 'Auto di alta gamma' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Tutte le valutazioni', stars: 0 },
  { value: 3.5, label: '3.5+', stars: 3.5 },
  { value: 4.0, label: '4.0+', stars: 4.0 },
  { value: 4.5, label: '4.5+', stars: 4.5 },
  { value: 4.8, label: '4.8+', stars: 4.8 },
];

const PRICE_OPTIONS = [
  { value: 100, label: 'Qualsiasi prezzo' },
  { value: 40, label: 'Fino a €40/ora' },
  { value: 50, label: 'Fino a €50/ora' },
  { value: 60, label: 'Fino a €60/ora' },
  { value: 70, label: 'Fino a €70/ora' },
];

const EXPERIENCE_OPTIONS = [
  { value: 0, label: 'Qualsiasi esperienza' },
  { value: 3, label: 'Minimo 3 anni' },
  { value: 5, label: 'Minimo 5 anni' },
  { value: 7, label: 'Minimo 7 anni' },
  { value: 10, label: 'Minimo 10 anni' },
];

export default function SearchPreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ location?: string; city?: string; address?: string }>();

  const location = params.location || 'Milano';
  const locationAddress = params.address || 'Milano, Italia';

  const [selectedService, setSelectedService] = useState<ServiceType>('any');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('sedan');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedPrice, setSelectedPrice] = useState<number>(100);
  const [selectedExperience, setSelectedExperience] = useState<number>(0);

  const handleSearch = () => {
    router.push({
      pathname: '/search-bodyguards',
      params: {
        location: params.location,
        city: params.city,
        address: params.address,
        serviceType: selectedService,
        vehicleType: selectedService === 'with_vehicle' ? selectedVehicle : undefined,
        minRating: selectedRating.toString(),
        maxPrice: selectedPrice.toString(),
        minExperience: selectedExperience.toString(),
      }
    });
  };

  const activeFiltersCount =
    (selectedService !== 'any' ? 1 : 0) +
    (selectedService === 'with_vehicle' ? 1 : 0) +
    (selectedRating > 0 ? 1 : 0) +
    (selectedPrice < 100 ? 1 : 0) +
    (selectedExperience > 0 ? 1 : 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Preferenze</Text>
          <Text style={styles.subtitle}>{location}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={theme.colors.text} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Tipo di Servizio</Text>
          </View>
          <View style={styles.optionsContainer}>
            {SERVICE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  selectedService === option.value && styles.optionCardActive
                ]}
                onPress={() => setSelectedService(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    selectedService === option.value && styles.optionLabelActive
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                {selectedService === option.value && (
                  <View style={styles.checkmark}>
                    <View style={styles.checkmarkInner} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedService === 'with_vehicle' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Car size={20} color={theme.colors.text} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Tipo di Veicolo</Text>
            </View>
            <View style={styles.optionsContainer}>
              {VEHICLE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    selectedVehicle === option.value && styles.optionCardActive
                  ]}
                  onPress={() => setSelectedVehicle(option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      selectedVehicle === option.value && styles.optionLabelActive
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {selectedVehicle === option.value && (
                    <View style={styles.checkmark}>
                      <View style={styles.checkmarkInner} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star size={20} color={theme.colors.text} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Valutazione Minima</Text>
          </View>
          <View style={styles.optionsContainer}>
            {RATING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  selectedRating === option.value && styles.optionCardActive
                ]}
                onPress={() => setSelectedRating(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    selectedRating === option.value && styles.optionLabelActive
                  ]}>
                    {option.label}
                  </Text>
                  {option.stars > 0 && (
                    <View style={styles.starsRow}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          color={i < Math.floor(option.stars) ? theme.colors.warning : theme.colors.border}
                          fill={i < Math.floor(option.stars) ? theme.colors.warning : 'transparent'}
                          strokeWidth={1.5}
                        />
                      ))}
                    </View>
                  )}
                </View>
                {selectedRating === option.value && (
                  <View style={styles.checkmark}>
                    <View style={styles.checkmarkInner} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Euro size={20} color={theme.colors.text} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Tariffa Oraria Massima</Text>
          </View>
          <View style={styles.optionsContainer}>
            {PRICE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  selectedPrice === option.value && styles.optionCardActive
                ]}
                onPress={() => setSelectedPrice(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    selectedPrice === option.value && styles.optionLabelActive
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {selectedPrice === option.value && (
                  <View style={styles.checkmark}>
                    <View style={styles.checkmarkInner} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Briefcase size={20} color={theme.colors.text} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Esperienza Minima</Text>
          </View>
          <View style={styles.optionsContainer}>
            {EXPERIENCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  selectedExperience === option.value && styles.optionCardActive
                ]}
                onPress={() => setSelectedExperience(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    selectedExperience === option.value && styles.optionLabelActive
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {selectedExperience === option.value && (
                  <View style={styles.checkmark}>
                    <View style={styles.checkmarkInner} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>
            Cerca Bodyguard
            {activeFiltersCount > 0 && ` · ${activeFiltersCount} filtri`}
          </Text>
          <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>
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
  },
  title: {
    fontSize: theme.typography.fontSizeM,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
  },
  optionsContainer: {
    gap: theme.spacing.s,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  optionLabelActive: {
    color: theme.colors.primary,
  },
  optionDescription: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
    ...theme.shadows.large,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  searchButtonText: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    color: '#FFFFFF',
  },
});
