import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { Shield, Calendar, MapPin, Clock, Plus, Navigation, Car, Eye, EyeOff, User, X, MessageCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

type Booking = {
  id: string;
  bodyguardId?: string;
  bodyguardName: string;
  date: string;
  time: string;
  location: string;
  hours: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  serviceType?: 'location' | 'route';
  dropoffLocation?: string;
  useVehicle?: boolean;
  vehicleType?: 'sedan' | 'suv' | 'luxury' | 'none';
  discretionLevel?: 'low' | 'medium' | 'high';
  outfit?: 'formal' | 'casual' | 'streetwear' | 'tactical';
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

const STATUS_LABELS = {
  pending: 'In attesa',
  confirmed: 'Confermata',
  in_progress: 'In corso',
  completed: 'Completata',
  cancelled: 'Annullata',
};

const STATUS_COLORS = {
  pending: theme.colors.warning,
  confirmed: theme.colors.primary,
  in_progress: theme.colors.primary,
  completed: theme.colors.success,
  cancelled: theme.colors.error,
};

export default function BookingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [processedBookingId, setProcessedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (params.newBooking === 'true' && params.bodyguardId) {
      const bookingId = `${params.bodyguardId}-${params.hours}-${Date.now()}`;

      if (bookingId !== processedBookingId) {
        const newBooking: Booking = {
          id: bookingId,
          bodyguardId: params.bodyguardId as string,
          bodyguardName: params.bodyguardName as string || 'Bodyguard',
          date: new Date().toLocaleDateString('it-IT'),
          time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
          location: params.pickupLocation as string || 'Milano, Italia',
          hours: parseInt(params.hours as string || '2'),
          totalPrice: parseFloat(params.totalPrice as string || '100'),
          status: 'pending',
          serviceType: params.serviceType as 'location' | 'route',
          dropoffLocation: params.dropoffLocation as string,
          useVehicle: params.useVehicle === 'true',
          vehicleType: params.vehicleType as 'sedan' | 'suv' | 'luxury' | 'none',
          discretionLevel: params.discretionLevel as 'low' | 'medium' | 'high',
          outfit: params.outfit as 'formal' | 'casual' | 'streetwear' | 'tactical',
        };

        setBookings(prev => {
          const exists = prev.some(b =>
            b.bodyguardName === newBooking.bodyguardName &&
            b.date === newBooking.date &&
            b.time === newBooking.time
          );

          if (exists) {
            return prev;
          }

          return [newBooking, ...prev];
        });

        setProcessedBookingId(bookingId);
      }
    }
  }, [params.newBooking, params.bodyguardId, params.hours, processedBookingId]);

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Shield size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.bodyguardName}>{item.bodyguardName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.price}>€{item.totalPrice}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.date} - {item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.hours} ore</Text>
        </View>

        {item.serviceType === 'route' ? (
          <>
            <View style={styles.detailRow}>
              <Navigation size={16} color={theme.colors.textSecondary} />
              <Text style={styles.detailText}>Da: {item.location}</Text>
            </View>
            {item.dropoffLocation && (
              <View style={styles.detailRow}>
                <MapPin size={16} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>A: {item.dropoffLocation}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.detailRow}>
            <MapPin size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}

        {item.useVehicle && item.vehicleType && item.vehicleType !== 'none' && (
          <View style={styles.detailRow}>
            <Car size={16} color={theme.colors.primary} />
            <Text style={[styles.detailText, { color: theme.colors.primary }]}>
              Veicolo: {VEHICLE_LABELS[item.vehicleType]}
            </Text>
          </View>
        )}

        {item.discretionLevel && (
          <View style={styles.detailRow}>
            {item.discretionLevel === 'low' && <Eye size={16} color={theme.colors.textSecondary} />}
            {item.discretionLevel === 'medium' && <Shield size={16} color={theme.colors.textSecondary} />}
            {item.discretionLevel === 'high' && <EyeOff size={16} color={theme.colors.textSecondary} />}
            <Text style={styles.detailText}>{DISCRETION_LABELS[item.discretionLevel]}</Text>
          </View>
        )}

        {item.outfit && (
          <View style={styles.detailRow}>
            <User size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{OUTFIT_LABELS[item.outfit]}</Text>
          </View>
        )}
      </View>

      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setSelectedBooking(item)}
        >
          <Text style={styles.actionButtonText}>Vedi dettagli</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Le tue prenotazioni</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/search-bodyguards')}
        >
          <Plus size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Shield size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nessuna prenotazione</Text>
          <Text style={styles.emptySubtitle}>
            Prenota un bodyguard per iniziare
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/search-bodyguards')}
          >
            <Text style={styles.emptyButtonText}>Cerca bodyguard</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={selectedBooking !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dettagli Prenotazione</Text>
              <TouchableOpacity onPress={() => setSelectedBooking(null)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <View style={styles.modalAvatar}>
                    <Shield size={48} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.modalBodyguardName}>{selectedBooking.bodyguardName}</Text>
                  <View style={[styles.modalStatusBadge, { backgroundColor: STATUS_COLORS[selectedBooking.status] + '20' }]}>
                    <Text style={[styles.modalStatusText, { color: STATUS_COLORS[selectedBooking.status] }]}>
                      {STATUS_LABELS[selectedBooking.status]}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Informazioni Generali</Text>

                  <View style={styles.modalDetailRow}>
                    <Calendar size={20} color={theme.colors.primary} />
                    <View style={styles.modalDetailText}>
                      <Text style={styles.modalLabel}>Data e Ora</Text>
                      <Text style={styles.modalValue}>{selectedBooking.date} - {selectedBooking.time}</Text>
                    </View>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Clock size={20} color={theme.colors.primary} />
                    <View style={styles.modalDetailText}>
                      <Text style={styles.modalLabel}>Durata</Text>
                      <Text style={styles.modalValue}>{selectedBooking.hours} ore</Text>
                    </View>
                  </View>

                  {selectedBooking.serviceType === 'route' ? (
                    <>
                      <View style={styles.modalDetailRow}>
                        <Navigation size={20} color={theme.colors.primary} />
                        <View style={styles.modalDetailText}>
                          <Text style={styles.modalLabel}>Partenza</Text>
                          <Text style={styles.modalValue}>{selectedBooking.location}</Text>
                        </View>
                      </View>
                      {selectedBooking.dropoffLocation && (
                        <View style={styles.modalDetailRow}>
                          <MapPin size={20} color={theme.colors.primary} />
                          <View style={styles.modalDetailText}>
                            <Text style={styles.modalLabel}>Destinazione</Text>
                            <Text style={styles.modalValue}>{selectedBooking.dropoffLocation}</Text>
                          </View>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.modalDetailRow}>
                      <MapPin size={20} color={theme.colors.primary} />
                      <View style={styles.modalDetailText}>
                        <Text style={styles.modalLabel}>Posizione</Text>
                        <Text style={styles.modalValue}>{selectedBooking.location}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Preferenze Servizio</Text>

                  {selectedBooking.discretionLevel && (
                    <View style={styles.modalDetailRow}>
                      {selectedBooking.discretionLevel === 'low' && <Eye size={20} color={theme.colors.primary} />}
                      {selectedBooking.discretionLevel === 'medium' && <Shield size={20} color={theme.colors.primary} />}
                      {selectedBooking.discretionLevel === 'high' && <EyeOff size={20} color={theme.colors.primary} />}
                      <View style={styles.modalDetailText}>
                        <Text style={styles.modalLabel}>Discrezionalità</Text>
                        <Text style={styles.modalValue}>{DISCRETION_LABELS[selectedBooking.discretionLevel]}</Text>
                      </View>
                    </View>
                  )}

                  {selectedBooking.outfit && (
                    <View style={styles.modalDetailRow}>
                      <User size={20} color={theme.colors.primary} />
                      <View style={styles.modalDetailText}>
                        <Text style={styles.modalLabel}>Outfit</Text>
                        <Text style={styles.modalValue}>{OUTFIT_LABELS[selectedBooking.outfit]}</Text>
                      </View>
                    </View>
                  )}

                  {selectedBooking.useVehicle && selectedBooking.vehicleType && selectedBooking.vehicleType !== 'none' && (
                    <View style={styles.modalDetailRow}>
                      <Car size={20} color={theme.colors.primary} />
                      <View style={styles.modalDetailText}>
                        <Text style={styles.modalLabel}>Veicolo</Text>
                        <Text style={styles.modalValue}>{VEHICLE_LABELS[selectedBooking.vehicleType]}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalSection}>
                  <View style={styles.modalPriceContainer}>
                    <Text style={styles.modalPriceLabel}>Totale</Text>
                    <Text style={styles.modalPriceValue}>€{selectedBooking.totalPrice}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalChatButton}
                onPress={() => {
                  setSelectedBooking(null);
                  router.push({
                    pathname: '/chat/new',
                    params: {
                      bodyguardName: selectedBooking.bodyguardName,
                      bodyguardId: selectedBooking.bodyguardId || '',
                      bookingId: selectedBooking.id,
                    },
                  });
                }}
              >
                <MessageCircle size={20} color={theme.colors.background} />
                <Text style={styles.modalChatButtonText}>Chatta con il bodyguard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedBooking(null)}
              >
                <Text style={styles.modalCloseButtonText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.background,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  bodyguardName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  modalSection: {
    gap: 16,
    marginBottom: 8,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalBodyguardName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  modalStatusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalDetailText: {
    flex: 1,
    gap: 4,
  },
  modalLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  modalPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 16,
  },
  modalPriceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalPriceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
  },
  modalChatButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalChatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.background,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
