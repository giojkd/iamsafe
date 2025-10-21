import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import { CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams<{ phone: string; role: 'client' | 'bodyguard' }>();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);

    try {
      const demoEmail = `demo_${phone.replace(/\+/g, '').replace(/\s/g, '')}@example.com`;
      const demoPassword = 'demo123456';

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
        });

        if (signUpError) {
          console.error('Error signing up:', signUpError);
          setLoading(false);
          return;
        }

        if (signUpData.user) {
          router.replace({
            pathname: '/auth/complete-profile',
            params: { phone, role, userId: signUpData.user.id },
          });
          return;
        }
      }

      if (signInData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.profile_completed && profile.role) {
            if (profile.role === 'client') {
              router.replace('/client-tabs');
            } else {
              router.replace('/bodyguard-tabs');
            }
            return;
          }
        }

        router.replace({
          pathname: '/auth/complete-profile',
          params: { phone, role, userId: signInData.user.id },
        });
      }
    } catch (err) {
      console.error('Error during authentication:', err);
    } finally {
      setLoading(false);
    }
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
