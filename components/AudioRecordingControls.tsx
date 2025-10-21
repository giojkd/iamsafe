import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react-native';
import { theme } from '../theme';
import { audioRecordingService } from '../lib/audio-recording-service';

type AudioRecordingControlsProps = {
  sosAlertId: string | null;
  isSOSActive: boolean;
};

export default function AudioRecordingControls({ sosAlertId, isSOSActive }: AudioRecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(audioRecordingService.getRecordingDuration());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const checkPermissions = async () => {
    const granted = await audioRecordingService.requestPermissions();
    setHasPermission(granted);
  };

  const handleStartRecording = async () => {
    if (!sosAlertId) {
      alert('Errore: Nessun SOS attivo');
      return;
    }

    if (hasPermission === false) {
      const granted = await audioRecordingService.requestPermissions();
      if (!granted) {
        alert('Permesso microfono necessario per registrare audio');
        return;
      }
      setHasPermission(true);
    }

    const result = await audioRecordingService.startRecording(sosAlertId);
    if (result.success) {
      setIsRecording(true);
      setRecordingDuration(0);
    } else {
      alert('Errore: ' + (result.error || 'Impossibile avviare registrazione'));
    }
  };

  const handleStopRecording = async () => {
    const result = await audioRecordingService.stopRecording();
    if (result.success) {
      setIsRecording(false);
      setRecordingDuration(0);
      alert('Registrazione salvata e inviata ai contatti di emergenza');
    } else {
      alert('Errore: ' + (result.error || 'Impossibile salvare registrazione'));
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSOSActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Mic size={20} color={isRecording ? '#EF4444' : theme.colors.textSecondary} />
        <Text style={styles.headerText}>Registrazione Audio</Text>
      </View>

      {isRecording ? (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingIndicator}>
            <View style={styles.pulsingDot} />
            <Text style={styles.recordingText}>REC</Text>
            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={handleStopRecording}
          >
            <Square size={20} color={theme.colors.background} />
            <Text style={styles.buttonText}>Ferma Registrazione</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.controlButton, styles.startButton]}
          onPress={handleStartRecording}
        >
          <Mic size={20} color={theme.colors.background} />
          <Text style={styles.buttonText}>Avvia Registrazione Audio</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.infoText}>
        {isRecording
          ? 'La registrazione verrà inviata ai tuoi contatti di emergenza'
          : 'Premi per registrare audio durante l\'emergenza'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  recordingContainer: {
    gap: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: '#EF4444',
  },
  stopButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.background,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
