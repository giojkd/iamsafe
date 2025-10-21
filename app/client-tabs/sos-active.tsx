import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { AlertCircle, MapPin, Clock, X } from 'lucide-react-native';
import { theme } from '../../theme';
import { sosService } from '../../lib/sos-service';
import AudioRecordingControls from '../../components/AudioRecordingControls';
import { useRouter } from 'expo-router';

export default function SOSActiveScreen() {
  const router = useRouter();
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    checkActiveStatus();

    const interval = setInterval(() => {
      if (activeSOS) {
        const diff = Math.floor((Date.now() - new Date(activeSOS.triggered_at).getTime()) / 1000);
        setDuration(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSOS]);

  const checkActiveStatus = async () => {
    const sos = await sosService.getActiveSOS();
    if (sos) {
      setActiveSOS(sos);
    } else {
      router.back();
    }
  };

  const handleDeactivate = async () => {
    if (confirm('DISATTIVARE SOS?\n\nConfermi di voler disattivare l\'allerta di emergenza?')) {
      const success = await sosService.deactivateSOS();
      if (success) {
        alert('SOS Disattivato\n\nL\'allerta di emergenza è stata disattivata.');
        router.back();
      } else {
        alert('Errore\n\nImpossibile disattivare SOS. Riprova.');
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  if (!activeSOS) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.alertBadge}>
            <AlertCircle size={20} color="#FFF" />
            <Text style={styles.alertBadgeText}>SOS ATTIVO</Text>
          </View>
        </View>
        <Text style={styles.title}>Emergenza in Corso</Text>
        <Text style={styles.subtitle}>I tuoi contatti sono stati notificati</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.pulsingIndicator}>
              <View style={styles.pulsingDot} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Allerta Attiva</Text>
              <View style={styles.durationContainer}>
                <Clock size={16} color={theme.colors.textSecondary} />
                <Text style={styles.durationText}>{formatDuration(duration)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Stato Attuale</Text>
          <View style={styles.infoItem}>
            <MapPin size={18} color={theme.colors.primary} />
            <Text style={styles.infoText}>Posizione condivisa in tempo reale</Text>
          </View>
          <View style={styles.infoItem}>
            <AlertCircle size={18} color={theme.colors.primary} />
            <Text style={styles.infoText}>Contatti di emergenza notificati</Text>
          </View>
        </View>

        <AudioRecordingControls sosAlertId={activeSOS.id} isSOSActive={true} />

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.deactivateButton}
            onPress={handleDeactivate}
          >
            <X size={24} color={theme.colors.background} />
            <Text style={styles.deactivateButtonText}>Disattiva SOS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            La modalità SOS rimarrà attiva finché non la disattivi manualmente.
            I tuoi contatti di emergenza continueranno a ricevere aggiornamenti sulla tua posizione.
          </Text>
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#EF4444',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  alertBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pulsingIndicator: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
  },
  actionsContainer: {
    marginVertical: 16,
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#059669',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deactivateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.background,
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  warningText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 20,
    textAlign: 'center',
  },
});
