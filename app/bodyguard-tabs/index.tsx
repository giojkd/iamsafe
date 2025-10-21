import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { Calendar, Clock, MapPin, Navigation, User, Shield, DollarSign, CheckCircle, XCircle, Eye, EyeOff, Car } from 'lucide-react-native';
import { useState } from 'react';

type BookingRequest = {
  id: string;
  clientName: string;
  date: string;
  time: string;
  hours: number;
  location: string;
  serviceType: 'location' | 'route';
  dropoffLocation?: string;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'declined';
  discretionLevel: 'low' | 'medium' | 'high';
  outfit: 'formal' | 'casual' | 'streetwear' | 'tactical';
  useVehicle: boolean;
  vehicleType?: 'sedan' | 'suv' | 'luxury' | 'none';
};

const DISCRETION_LABELS = {
  low: 'Bassa discrezione',
  medium: 'Media discrezione',
  high: 'Alta discrezione',
};

const OUTFIT_LABELS = {
  formal: 'Abito Scuro',
  casual: 'Casual Elegante',
  streetwear: 'Streetwear',
  tactical: 'Tattico',
};

const VEHICLE_LABELS = {
  sedan: 'Berlina',
  suv: 'SUV',
  luxury: 'Auto di lusso',
  none: 'Nessun veicolo',
};

const MOCK_REQUESTS: BookingRequest[] = [
  {
    id: '1',
    clientName: 'Giovanni Ferrari',
    date: '24 Ottobre 2025',
    time: '14:00',
    hours: 4,
    location: 'Via Montenapoleone, Milano',
    serviceType: 'location',
    totalPrice: 200,
    status: 'pending',
    discretionLevel: 'high',
    outfit: 'formal',
    useVehicle: false,
    vehicleType: 'none',
  },
  {
    id: '2',
    clientName: 'Maria Lombardi',
    date: '25 Ottobre 2025',
    time: '19:30',
    hours: 6,
    location: 'Teatro alla Scala, Milano',
    serviceType: 'route',
    dropoffLocation: 'Hotel Four Seasons, Milano',
    totalPrice: 300,
    status: 'pending',
    discretionLevel: 'medium',
    outfit: 'formal',
    useVehicle: true,
    vehicleType: 'luxury',
  },
  {
    id: '3',
    clientName: 'Roberto Marchetti',
    date: '26 Ottobre 2025',
    time: '10:00',
    hours: 8,
    location: 'Aeroporto Malpensa',
    serviceType: 'route',
    dropoffLocation: 'Fiera Milano Congressi',
    totalPrice: 400,
    status: 'pending',
    discretionLevel: 'low',
    outfit: 'casual',
    useVehicle: true,
    vehicleType: 'suv',
  },
  {
    id: '4',
    clientName: 'Alessandra Conti',
    date: '27 Ottobre 2025',
    time: '20:00',
    hours: 5,
    location: 'Via della Spiga, Milano',
    serviceType: 'location',
    totalPrice: 250,
    status: 'pending',
    discretionLevel: 'high',
    outfit: 'streetwear',
    useVehicle: false,
    vehicleType: 'none',
  },
];

export default function RequestsScreen() {
  const [requests, setRequests] = useState<BookingRequest[]>(MOCK_REQUESTS);

  const handleAccept = (id: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'accepted' } : req
      )
    );
  };

  const handleDecline = (id: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: 'declined' } : req
      )
    );
  };

  const renderRequest = ({ item }: { item: BookingRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.clientAvatar}>
          <User size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <View style={styles.priceContainer}>
            <DollarSign size={14} color={theme.colors.success} />
            <Text style={styles.price}>€{item.totalPrice}</Text>
          </View>
        </View>
        {item.status !== 'pending' && (
          <View style={[
            styles.statusBadge,
            item.status === 'accepted' ? styles.acceptedBadge : styles.declinedBadge
          ]}>
            {item.status === 'accepted' ? (
              <CheckCircle size={16} color={theme.colors.success} />
            ) : (
              <XCircle size={16} color={theme.colors.error} />
            )}
            <Text style={[
              styles.statusText,
              item.status === 'accepted' ? styles.acceptedText : styles.declinedText
            ]}>
              {item.status === 'accepted' ? 'Accettato' : 'Rifiutato'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={theme.colors.primary} />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>

        <View style={styles.detailRow}>
          <Clock size={16} color={theme.colors.primary} />
          <Text style={styles.detailText}>{item.time} - {item.hours} ore</Text>
        </View>

        {item.serviceType === 'route' ? (
          <>
            <View style={styles.detailRow}>
              <Navigation size={16} color={theme.colors.primary} />
              <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
            </View>
            {item.dropoffLocation && (
              <View style={styles.detailRow}>
                <MapPin size={16} color={theme.colors.primary} />
                <Text style={styles.detailText} numberOfLines={1}>{item.dropoffLocation}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.detailRow}>
            <MapPin size={16} color={theme.colors.primary} />
            <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.preferences}>
        <Text style={styles.preferencesTitle}>Preferenze Cliente</Text>

        <View style={styles.preferenceRow}>
          {item.discretionLevel === 'low' && <Eye size={14} color={theme.colors.textSecondary} />}
          {item.discretionLevel === 'medium' && <Shield size={14} color={theme.colors.textSecondary} />}
          {item.discretionLevel === 'high' && <EyeOff size={14} color={theme.colors.textSecondary} />}
          <Text style={styles.preferenceText}>{DISCRETION_LABELS[item.discretionLevel]}</Text>
        </View>

        <View style={styles.preferenceRow}>
          <User size={14} color={theme.colors.textSecondary} />
          <Text style={styles.preferenceText}>{OUTFIT_LABELS[item.outfit]}</Text>
        </View>

        {item.useVehicle && item.vehicleType && item.vehicleType !== 'none' && (
          <View style={styles.preferenceRow}>
            <Car size={14} color={theme.colors.textSecondary} />
            <Text style={styles.preferenceText}>Veicolo: {VEHICLE_LABELS[item.vehicleType]}</Text>
          </View>
        )}
      </View>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDecline(item.id)}
          >
            <XCircle size={18} color={theme.colors.error} />
            <Text style={styles.declineButtonText}>Rifiuta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
          >
            <CheckCircle size={18} color={theme.colors.background} />
            <Text style={styles.acceptButtonText}>Accetta</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Richieste</Text>
        {pendingRequests.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingRequests.length}</Text>
          </View>
        )}
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Shield size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nessuna richiesta</Text>
          <Text style={styles.emptySubtitle}>
            Le nuove richieste dei clienti appariranno qui
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            pendingRequests.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Richieste in Attesa</Text>
                <Text style={styles.sectionCount}>{pendingRequests.length}</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
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
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
    gap: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.success,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  acceptedBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  declinedBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  acceptedText: {
    color: theme.colors.success,
  },
  declinedText: {
    color: theme.colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  details: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  preferences: {
    gap: 10,
  },
  preferencesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preferenceText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.background,
  },
  declineButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.error,
  },
});
