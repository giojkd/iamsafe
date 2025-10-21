import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle } from 'lucide-react-native';

export default function SignupScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'client' | 'bodyguard' }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Compila tutti i campi');
      return;
    }

    if (!validateEmail(email)) {
      setError('Inserisci un\'email valida');
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError('Email o password errati');
          setLoading(false);
          return;
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile?.profile_completed && profile.role) {
            if (profile.role === 'client') {
              router.replace('/client-tabs');
            } else {
              router.replace('/bodyguard-tabs');
            }
          } else {
            router.replace({
              pathname: '/auth/complete-profile',
              params: { role: profile?.role || role, userId: data.user.id },
            });
          }
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Email già registrata. Prova ad accedere.');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          await new Promise(resolve => setTimeout(resolve, 1000));

          router.replace({
            pathname: '/auth/complete-profile',
            params: { role, userId: data.user.id },
          });
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Errore durante l\'autenticazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLogin ? 'Accedi' : 'Registrati'}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? 'Benvenuto di nuovo!'
            : `Crea il tuo account ${role === 'client' ? 'Cliente' : 'Bodyguard'}`
          }
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (error) setError('');
          }}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          editable={!loading}
        />

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Conferma Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError('');
            }}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Accedi' : 'Registrati'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            {isLogin
              ? 'Non hai un account? Registrati'
              : 'Hai già un account? Accedi'
            }
          </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
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
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.background,
  },
  switchButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  switchText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
