import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import { CheckCircle, AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams<{ phone: string; role: 'client' | 'bodyguard' }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setLoading(true);
    setError('');

    try {
      const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
      const demoEmail = `user${cleanPhone}@guardme.app`;
      const demoPassword = 'SecureDemo2024!';

      let userData = null;

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (!signInError && signInData?.user) {
        userData = signInData.user;
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              phone: phone,
            },
            emailRedirectTo: undefined,
          }
        });

        if (signUpError) {
          console.error('Error signing up:', signUpError);
          if (signUpError.message.includes('email')) {
            setError('Configurazione email non valida. Verifica le impostazioni Supabase Auth.');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }

        if (signUpData?.user) {
          userData = signUpData.user;

          await new Promise(resolve => setTimeout(resolve, 500));

          const { data: sessionData } = await supabase.auth.getSession();
          console.log('Session after signup:', sessionData?.session ? 'Active' : 'Not active');
        }
      }

      if (userData) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .maybeSingle();

        if (profile?.profile_completed && profile.role) {
          if (profile.role === 'client') {
            router.replace('/client-tabs');
          } else {
            router.replace('/bodyguard-tabs');
          }
          return;
        }

        router.replace({
          pathname: '/auth/complete-profile',
          params: { phone, role, userId: userData.id },
        });
        return;
      }

      setError('Impossibile creare l\'account. Riprova.');
    } catch (err) {
      console.error('Error during authentication:', err);
      setError('Errore imprevisto durante l\'autenticazione.');
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

        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    flex: 1,
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
