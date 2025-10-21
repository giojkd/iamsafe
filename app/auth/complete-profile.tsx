import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import { useState } from 'react';
import { userProfileService } from '../../lib/user-profile-service';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { phone, role, userId } = useLocalSearchParams<{ phone: string; role: 'client' | 'bodyguard'; userId: string }>();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!fullName || fullName.trim().length < 2) {
      setError('Inserisci il tuo nome completo');
      return;
    }

    if (!userId) {
      setError('Errore: utente non trovato');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await userProfileService.updateProfile(userId, {
        full_name: fullName.trim(),
        phone: phone || '',
        role: role as 'client' | 'bodyguard',
        profile_completed: true,
      });

      if (result.error) {
        const createResult = await userProfileService.createProfile(userId, {
          full_name: fullName.trim(),
          phone: phone || '',
          role: role as 'client' | 'bodyguard',
          profile_completed: true,
        });

        if (createResult.error) {
          setError('Errore durante il salvataggio del profilo');
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      if (role === 'client') {
        router.replace('/client-tabs');
      } else {
        router.replace('/bodyguard-tabs');
      }
    } catch (err) {
      console.error('Error completing profile:', err);
      setError('Errore imprevisto');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completa il profilo</Text>
      <Text style={styles.subtitle}>Come ti chiami?</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome e Cognome"
        placeholderTextColor={theme.colors.textSecondary}
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          if (error) setError('');
        }}
        autoCapitalize="words"
        editable={!loading}
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.buttonText}>Completa</Text>
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
  },
  title: {
    fontSize: 28,
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
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 16,
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
