import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import { CheckCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { userProfileService } from '../../lib/user-profile-service';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams<{ phone: string; role: 'client' | 'bodyguard' }>();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);

    const user = await userProfileService.getCurrentUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    router.replace({
      pathname: '/auth/complete-profile',
      params: { phone, role, userId: user.id },
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

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.buttonText}>Continua</Text>
        )}
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.background,
  },
});
