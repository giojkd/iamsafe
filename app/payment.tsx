import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../theme';
import { ArrowLeft, CreditCard, Wallet, Shield, MapPin, Clock, Car, Check } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { bookingService } from '../lib/booking-service';

type PaymentMethod = 'card' | 'wallet';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bodyguardId: string;
    bodyguardName: string;
    hours: string;
    totalPrice: string;
    serviceType: string;
    pickupLocation: string;
    dropoffLocation?: string;
    useVehicle: string;
    vehicleType: string;
    discretionLevel: string;
    outfit: string;
  }>();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [processing, setProcessing] = useState(false);

  const totalPrice = parseFloat(params.totalPrice || '0');
  const serviceFee = totalPrice * 0.1;
  const finalTotal = totalPrice + serviceFee;

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\//g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    if (cleaned.length <= 16 && /^\d*$/.test(cleaned)) {
      setCardNumber(formatCardNumber(cleaned));
    }
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\//g, '');
    if (cleaned.length <= 4 && /^\d*$/.test(cleaned)) {
      setCardExpiry(formatExpiry(cleaned));
    }
  };

  const handleCvvChange = (text: string) => {
    if (text.length <= 3 && /^\d*$/.test(text)) {
      setCardCvv(text);
    }
  };

  const validatePayment = (): boolean => {
    if (paymentMethod === 'card') {
      const cleanedCard = cardNumber.replace(/\s/g, '');
      if (cleanedCard.length !== 16) {
        Alert.alert('Errore', 'Inserisci un numero di carta valido');
        return false;
      }
      if (!cardExpiry || cardExpiry.length !== 5) {
        Alert.alert('Errore', 'Inserisci una data di scadenza valida (MM/AA)');
        return false;
      }
      if (cardCvv.length !== 3) {
        Alert.alert('Errore', 'Inserisci un CVV valido');
        return false;
      }
      if (!cardHolder.trim()) {
        Alert.alert('Errore', 'Inserisci il nome del titolare');
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    console.log('Payment button clicked');

    setProcessing(true);

    try {
      console.log('Starting payment process (TEST MODE - simulating success)...');

      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Payment simulation completed successfully');
      setProcessing(false);

      console.log('Navigating to bookings with params:', {
        newBooking: 'true',
        bodyguardId: params.bodyguardId,
        bodyguardName: params.bodyguardName,
        totalPrice: finalTotal.toFixed(2),
      });

      router.replace({
        pathname: '/client-tabs/bookings',
        params: {
          newBooking: 'true',
          bodyguardId: params.bodyguardId,
          bodyguardName: params.bodyguardName,
          hours: params.hours,
          totalPrice: finalTotal.toFixed(2),
          serviceType: params.serviceType,
          pickupLocation: params.pickupLocation,
          dropoffLocation: params.dropoffLocation || '',
          useVehicle: params.useVehicle,
          vehicleType: params.vehicleType,
          discretionLevel: params.discretionLevel,
          outfit: params.outfit,
        },
      });
    } catch (error: any) {
      console.error('Payment process error:', error);
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Riepilogo Prenotazione</Text>

            <View style={styles.summaryRow}>
              <Shield size={18} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.summaryLabel}>Bodyguard</Text>
              <Text style={styles.summaryValue}>{params.bodyguardName}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Clock size={18} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.summaryLabel}>Durata</Text>
              <Text style={styles.summaryValue}>{params.hours} ore</Text>
            </View>

            <View style={styles.summaryRow}>
              <MapPin size={18} color={theme.colors.textSecondary} strokeWidth={2} />
              <Text style={styles.summaryLabel}>
                {params.serviceType === 'route' ? 'Partenza' : 'Luogo'}
              </Text>
              <Text style={styles.summaryValue}>{params.pickupLocation}</Text>
            </View>

            {params.serviceType === 'route' && params.dropoffLocation && (
              <View style={styles.summaryRow}>
                <MapPin size={18} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={styles.summaryLabel}>Destinazione</Text>
                <Text style={styles.summaryValue}>{params.dropoffLocation}</Text>
              </View>
            )}

            {params.useVehicle === 'true' && (
              <View style={styles.summaryRow}>
                <Car size={18} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={styles.summaryLabel}>Veicolo</Text>
                <Text style={styles.summaryValue}>Incluso</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Servizio</Text>
              <Text style={styles.priceValue}>€{totalPrice.toFixed(2)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Commissione piattaforma (10%)</Text>
              <Text style={styles.priceValue}>€{serviceFee.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Totale</Text>
              <Text style={styles.totalValue}>€{finalTotal.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Metodo di Pagamento</Text>

            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  paymentMethod === 'card' && styles.paymentMethodCardActive,
                ]}
                onPress={() => setPaymentMethod('card')}
              >
                <CreditCard
                  size={24}
                  color={paymentMethod === 'card' ? theme.colors.primary : theme.colors.textSecondary}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.paymentMethodLabel,
                    paymentMethod === 'card' && styles.paymentMethodLabelActive,
                  ]}
                >
                  Carta di Credito
                </Text>
                {paymentMethod === 'card' && (
                  <Check size={20} color={theme.colors.primary} strokeWidth={2} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  paymentMethod === 'wallet' && styles.paymentMethodCardActive,
                ]}
                onPress={() => setPaymentMethod('wallet')}
              >
                <Wallet
                  size={24}
                  color={paymentMethod === 'wallet' ? theme.colors.primary : theme.colors.textSecondary}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.paymentMethodLabel,
                    paymentMethod === 'wallet' && styles.paymentMethodLabelActive,
                  ]}
                >
                  Portafoglio
                </Text>
                {paymentMethod === 'wallet' && (
                  <Check size={20} color={theme.colors.primary} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>

            {paymentMethod === 'card' && (
              <View style={styles.cardForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Numero Carta</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Scadenza</Text>
                    <TextInput
                      style={styles.input}
                      value={cardExpiry}
                      onChangeText={handleExpiryChange}
                      placeholder="MM/AA"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cardCvv}
                      onChangeText={handleCvvChange}
                      placeholder="123"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="number-pad"
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Titolare Carta</Text>
                  <TextInput
                    style={styles.input}
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    placeholder="NOME COGNOME"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            {paymentMethod === 'wallet' && (
              <View style={styles.walletInfo}>
                <Text style={styles.walletBalance}>Saldo disponibile: €250.00</Text>
                <Text style={styles.walletNote}>
                  Il pagamento verrà addebitato dal tuo portafoglio
                </Text>
              </View>
            )}
          </View>

          <View style={styles.securityNote}>
            <Shield size={16} color={theme.colors.success} strokeWidth={2} />
            <Text style={styles.securityText}>
              Pagamento sicuro con crittografia SSL
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <>
              <Text style={styles.payButtonText}>Paga €{finalTotal.toFixed(2)}</Text>
            </>
          )}
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
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
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  paymentSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  paymentMethodCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  paymentMethodLabelActive: {
    color: theme.colors.primary,
  },
  cardForm: {
    gap: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  walletInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.success,
  },
  walletNote: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  securityText: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.background,
  },
});
