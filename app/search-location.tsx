import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, ScrollView } from 'react-native';
import { theme } from '../theme';
import { MapPin, ArrowLeft, Search, Target, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

type LocationSuggestion = {
  id: string;
  name: string;
  address: string;
  city: string;
  type: 'current' | 'recent' | 'city';
};

const POPULAR_CITIES: LocationSuggestion[] = [
  { id: '1', name: 'Milano', address: 'Milano, Lombardia', city: 'Milano', type: 'city' },
  { id: '2', name: 'Roma', address: 'Roma, Lazio', city: 'Roma', type: 'city' },
  { id: '3', name: 'Napoli', address: 'Napoli, Campania', city: 'Napoli', type: 'city' },
  { id: '4', name: 'Torino', address: 'Torino, Piemonte', city: 'Torino', type: 'city' },
  { id: '5', name: 'Firenze', address: 'Firenze, Toscana', city: 'Firenze', type: 'city' },
  { id: '6', name: 'Bologna', address: 'Bologna, Emilia-Romagna', city: 'Bologna', type: 'city' },
];

const RECENT_SEARCHES: LocationSuggestion[] = [
  { id: 'r1', name: 'Via Montenapoleone', address: 'Via Montenapoleone, Milano', city: 'Milano', type: 'recent' },
  { id: 'r2', name: 'Stazione Centrale', address: 'Piazza Duca d\'Aosta, Milano', city: 'Milano', type: 'recent' },
];

export default function SearchLocationScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState(POPULAR_CITIES);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredCities(POPULAR_CITIES);
    } else {
      const filtered = POPULAR_CITIES.filter(
        city =>
          city.name.toLowerCase().includes(text.toLowerCase()) ||
          city.address.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  };

  const handleLocationSelect = (location: LocationSuggestion) => {
    router.push({
      pathname: '/search-preferences',
      params: {
        location: location.name,
        city: location.city,
        address: location.address
      }
    });
  };

  const handleUseCurrentLocation = () => {
    router.push({
      pathname: '/search-preferences',
      params: {
        location: 'Posizione attuale',
        city: 'Milano',
        address: 'La tua posizione'
      }
    });
  };

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
        <Text style={styles.headerTitle}>Dove cerchi?</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={theme.colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca città o indirizzo"
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
        >
          <View style={styles.locationIcon}>
            <Target size={20} color={theme.colors.accent} strokeWidth={2} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>Posizione attuale</Text>
            <Text style={styles.locationAddress}>Usa la tua posizione GPS</Text>
          </View>
        </TouchableOpacity>

        {RECENT_SEARCHES.length > 0 && searchQuery === '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RICERCHE RECENTI</Text>
            {RECENT_SEARCHES.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(location)}
              >
                <View style={styles.locationIcon}>
                  <Clock size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'RISULTATI' : 'CITTÀ POPOLARI'}
          </Text>
          {filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <TouchableOpacity
                key={city.id}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(city)}
              >
                <View style={styles.locationIcon}>
                  <MapPin size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{city.name}</Text>
                  <Text style={styles.locationAddress}>{city.address}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MapPin size={48} color={theme.colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Nessun risultato</Text>
              <Text style={styles.emptyText}>
                Prova a cercare un'altra città o indirizzo
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: theme.spacing.m,
    paddingTop: 60,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSizeM,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    gap: theme.spacing.m,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeightMedium,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.m,
    marginTop: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.small,
  },
  section: {
    marginTop: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizeXS,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: theme.spacing.m,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizeM,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  emptyText: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 20,
  },
});
