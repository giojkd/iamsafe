import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import { CheckCircle } from 'lucide-react-native';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams<{ phone: string; role: 'client' | 'bodyguard' }>();

  const handleContinue = () => {
    router.push({
      pathname: '/auth/complete-profile',
      params: { phone, role },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckCircle size={80} color={theme.colors.primary} />
        <Text style={styles.title}>Demo Mode</Text>
        <Text style={styles.subtitle}>Codice inviato a {phone}</Text>
        <Text style={styles.info}>
          In produzione qui inseriresti il codice OTP ricevuto via SMS.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continua</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.background,
  },
});
