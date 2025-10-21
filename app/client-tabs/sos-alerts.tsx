import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { AlertCircle, MapPin, Clock, User, ChevronDown, ChevronUp } from 'lucide-react-native';
import { theme } from '../../theme';
import { sosService } from '../../lib/sos-service';
import { useRouter } from 'expo-router';
import AudioPlaybackList from '../../components/AudioPlaybackList';
import SOSButton from '../../components/SOSButton';

type SOSAlertWithUser = {
  id: string;
  user_id: string;
  user_name: string;
  latitude: number;
  longitude: number;
  status: string;
  triggered_at: string;
};

export default function SOSAlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SOSAlertWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();

    const unsubscribe = sosService.subscribeToSOSAlerts((newAlerts) => {
      setAlerts(newAlerts);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadAlerts = async () => {
    setIsLoading(true);
    const fetchedAlerts = await sosService.getReceivedSOSAlerts();
    setAlerts(fetchedAlerts);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h fa`;

    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Centro SOS</Text>
        <Text style={styles.subtitle}>
          Attiva l'emergenza o visualizza le allerte ricevute
        </Text>
      </View>

      <View style={styles.sosButtonContainer}>
        <SOSButton />
        <Text style={styles.sosButtonLabel}>Premi per attivare SOS di emergenza</Text>
      </View>

      {alerts.length > 0 && (
        <View style={styles.alertBanner}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={styles.alertBannerText}>
            {alerts.length} {alerts.length === 1 ? 'allerta ricevuta' : 'allerte ricevute'}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.alertsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Caricamento...</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nessuna allerta</Text>
            <Text style={styles.emptyText}>
              Le allerte SOS dei tuoi contatti appariranno qui
            </Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIconContainer}>
                  <AlertCircle size={24} color="#EF4444" />
                </View>
                <View style={styles.alertInfo}>
                  <View style={styles.alertTitleRow}>
                    <Text style={styles.alertTitle}>SOS Attivo</Text>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ATTIVO</Text>
                    </View>
                  </View>
                  <View style={styles.alertUser}>
                    <User size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.alertUserName}>{alert.user_name}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.alertDetails}>
                <View style={styles.alertDetail}>
                  <Clock size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.alertDetailText}>
                    {formatTime(alert.triggered_at)}
                  </Text>
                </View>

                <View style={styles.alertDetail}>
                  <MapPin size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.alertDetailText}>
                    {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewLocationButton}
                onPress={() => router.push('/client-tabs/map')}
              >
                <MapPin size={18} color={theme.colors.background} />
                <Text style={styles.viewLocationButtonText}>
                  Visualizza su Mappa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.audioButton}
                onPress={() => setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)}
              >
                {expandedAlertId === alert.id ? (
                  <ChevronUp size={18} color={theme.colors.primary} />
                ) : (
                  <ChevronDown size={18} color={theme.colors.primary} />
                )}
                <Text style={styles.audioButtonText}>
                  {expandedAlertId === alert.id ? 'Nascondi' : 'Mostra'} Registrazioni Audio
                </Text>
              </TouchableOpacity>

              {expandedAlertId === alert.id && (
                <AudioPlaybackList sosAlertId={alert.id} />
              )}
            </View>
          ))
        )}
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  sosButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 16,
  },
  sosButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 2,
    borderBottomColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  alertBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
  },
  alertsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  alertItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  activeBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.background,
    letterSpacing: 0.5,
  },
  alertUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertUserName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  alertDetails: {
    gap: 8,
    marginBottom: 16,
  },
  alertDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDetailText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  viewLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewLocationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.background,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  audioButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
