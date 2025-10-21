import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { Calendar, Clock, MapPin, Navigation, User, Shield, DollarSign, X, Eye, EyeOff, Car, MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

type ConfirmedBooking = {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  hours: number;
  location: string;
  serviceType: 'location' | 'route';
  dropoffLocation?: string;
  totalPrice: number;
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

const MOCK_BOOKINGS: ConfirmedBooking[] = [
  {
    id: '1',
    clientId: 'client-1',
    clientName: 'Giovanni Ferrari',
    date: '24 Ottobre 2025',
    time: '14:00',
    hours: 4,
    location: 'Via Montenapoleone, Milano',
    serviceType: 'location',
    totalPrice: 200,
    discretionLevel: 'high',
    outfit: 'formal',
    useVehicle: false,
    vehicleType: 'none',
  },
  {
    id: '2',
    clientId: 'client-2',
    clientName: 'Maria Lombardi',
    date: '25 Ottobre 2025',
    time: '19:30',
    hours: 6,
    location: 'Teatro alla Scala, Milano',
    serviceType: 'route',
    dropoffLocation: 'Hotel Four Seasons, Milano',
    totalPrice: 300,
    discretionLevel: 'medium',
    outfit: 'formal',
    useVehicle: true,
    vehicleType: 'luxury',
  },
  {
    id: '3',
    clientId: 'client-3',
    clientName: 'Alessandra Conti',
    date: '27 Ottobre 2025',
    time: '20:00',
    hours: 5,
    location: 'Via della Spiga, Milano',
    serviceType: 'location',
    totalPrice: 250,
    discretionLevel: 'high',
    outfit: 'streetwear',
    useVehicle: false,
    vehicleType: 'none',
  },
];

export default function AgendaScreen() {
  const router = useRouter();
  const [bookings] = useState<ConfirmedBooking[]>(MOCK_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState<ConfirmedBooking | null>(null);

  const renderBooking = ({ item }: { item: ConfirmedBooking }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedBooking(item)}>
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
        <View style={styles.dateContainer}>
          <Calendar size={16} color={theme.colors.textSecondary} />
        </View>
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

        <View style={styles.detailRow}>
          <MapPin size={16} color={theme.colors.primary} />
          <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prenotazioni</Text>
        {bookings.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{bookings.length}</Text>
          </View>
        )}
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nessuna prenotazione</Text>
          <Text style={styles.emptySubtitle}>
            Le prenotazioni confermate appariranno qui
          </Text>
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
              <TouchableOpacity onPress={() => setSelectedBooking(null)} style={styles.closeButton}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalClientSection}>
                  <View style={styles.modalClientAvatar}>
                    <User size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.modalClientName}>{selectedBooking.clientName}</Text>
                  <View style={styles.modalPriceContainer}>
                    <DollarSign size={20} color={theme.colors.success} />
                    <Text style={styles.modalPrice}>€{selectedBooking.totalPrice}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Dettagli Servizio</Text>

                  <View style={styles.modalDetailRow}>
                    <Calendar size={18} color={theme.colors.primary} />
                    <Text style={styles.modalDetailText}>{selectedBooking.date}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Clock size={18} color={theme.colors.primary} />
                    <Text style={styles.modalDetailText}>{selectedBooking.time} - {selectedBooking.hours} ore</Text>
                  </View>

                  {selectedBooking.serviceType === 'route' ? (
                    <>
                      <View style={styles.modalDetailRow}>
                        <Navigation size={18} color={theme.colors.primary} />
                        <Text style={styles.modalDetailText}>{selectedBooking.location}</Text>
                      </View>
                      {selectedBooking.dropoffLocation && (
                        <View style={styles.modalDetailRow}>
                          <MapPin size={18} color={theme.colors.primary} />
                          <Text style={styles.modalDetailText}>{selectedBooking.dropoffLocation}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.modalDetailRow}>
                      <MapPin size={18} color={theme.colors.primary} />
                      <Text style={styles.modalDetailText}>{selectedBooking.location}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Preferenze Cliente</Text>

                  <View style={styles.modalDetailRow}>
                    {selectedBooking.discretionLevel === 'low' && <Eye size={18} color={theme.colors.textSecondary} />}
                    {selectedBooking.discretionLevel === 'medium' && <Shield size={18} color={theme.colors.textSecondary} />}
                    {selectedBooking.discretionLevel === 'high' && <EyeOff size={18} color={theme.colors.textSecondary} />}
                    <Text style={styles.modalDetailText}>{DISCRETION_LABELS[selectedBooking.discretionLevel]}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <User size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.modalDetailText}>{OUTFIT_LABELS[selectedBooking.outfit]}</Text>
                  </View>

                  {selectedBooking.useVehicle && selectedBooking.vehicleType && selectedBooking.vehicleType !== 'none' && (
                    <View style={styles.modalDetailRow}>
                      <Car size={18} color={theme.colors.textSecondary} />
                      <Text style={styles.modalDetailText}>Veicolo: {VEHICLE_LABELS[selectedBooking.vehicleType]}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalChatButton}
                onPress={() => {
                  if (selectedBooking) {
                    setSelectedBooking(null);
                    router.push({
                      pathname: '/chat/new',
                      params: {
                        bodyguardName: selectedBooking.clientName,
                        bodyguardId: selectedBooking.clientId,
                        bookingId: selectedBooking.id,
                      },
                    });
                  }
                }}
              >
                <MessageCircle size={20} color={theme.colors.background} />
                <Text style={styles.modalChatButtonText}>Chatta con il cliente</Text>
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
  dateContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalClientSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  modalClientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClientName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.success,
  },
  modalSection: {
    gap: 14,
    paddingVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalDetailText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
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
