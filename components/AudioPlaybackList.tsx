import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Play, Pause, Download, Clock } from 'lucide-react-native';
import { theme } from '../theme';
import { audioRecordingService, AudioRecording } from '../lib/audio-recording-service';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

type AudioPlaybackListProps = {
  sosAlertId: string;
};

export default function AudioPlaybackList({ sosAlertId }: AudioPlaybackListProps) {
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecordings();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sosAlertId]);

  const loadRecordings = async () => {
    setIsLoading(true);
    const data = await audioRecordingService.getRecordingsForSOS(sosAlertId);
    setRecordings(data);
    setIsLoading(false);
  };

  const handlePlayPause = async (recording: AudioRecording) => {
    try {
      if (playingId === recording.id) {
        if (sound) {
          await sound.pauseAsync();
          setPlayingId(null);
        }
        return;
      }

      if (sound) {
        await sound.unloadAsync();
      }

      const url = await audioRecordingService.getAudioURL(recording.storage_path);
      if (!url) {
        alert('Errore: Impossibile caricare l\'audio');
        return;
      }

      if (Platform.OS === 'web') {
        const audio = new window.Audio(url);
        audio.play();
        audio.onended = () => setPlayingId(null);
        setPlayingId(recording.id);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingId(recording.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Errore durante la riproduzione');
    }
  };

  const handleDownload = async (recording: AudioRecording) => {
    try {
      const url = await audioRecordingService.getAudioURL(recording.storage_path);
      if (!url) {
        alert('Errore: Impossibile scaricare l\'audio');
        return;
      }

      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        alert('Download disponibile solo su web per ora');
      }
    } catch (error) {
      console.error('Error downloading audio:', error);
      alert('Errore durante il download');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Caricamento registrazioni...</Text>
      </View>
    );
  }

  if (recordings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Play size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nessuna registrazione</Text>
          <Text style={styles.emptyText}>
            Le registrazioni audio dell'emergenza appariranno qui
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registrazioni Audio</Text>
        <Text style={styles.headerSubtitle}>{recordings.length} registrazioni</Text>
      </View>

      <ScrollView style={styles.list}>
        {recordings.map((recording) => (
          <View key={recording.id} style={styles.recordingItem}>
            <View style={styles.recordingInfo}>
              <View style={styles.recordingHeader}>
                <Clock size={16} color={theme.colors.textSecondary} />
                <Text style={styles.recordingDate}>
                  {formatDate(recording.recorded_at)}
                </Text>
              </View>
              <Text style={styles.recordingDuration}>
                Durata: {formatDuration(recording.duration_seconds)}
              </Text>
            </View>

            <View style={styles.recordingActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  playingId === recording.id && styles.actionButtonActive,
                ]}
                onPress={() => handlePlayPause(recording)}
              >
                {playingId === recording.id ? (
                  <Pause size={20} color={theme.colors.background} />
                ) : (
                  <Play size={20} color={theme.colors.background} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDownload(recording)}
              >
                <Download size={20} color={theme.colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  list: {
    maxHeight: 300,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recordingDate: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  recordingDuration: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#EF4444',
  },
});
