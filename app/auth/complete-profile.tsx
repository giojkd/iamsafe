import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import { useState } from 'react';
import { userProfileService } from '../../lib/user-profile-service';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams<{ phone: string; role: 'client' | 'bodyguard' }>();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleComplete = () => {
    if (!fullName || fullName.trim().length < 2) {
      setError('Inserisci il tuo nome completo');
      return;
    }

    userProfileService.setProfile({
      fullName: fullName.trim(),
      phone: phone || '',
      role: role as 'client' | 'bodyguard',
    });

    setError('');
    if (role === 'client') {
      router.replace('/client-tabs');
    } else {
      router.replace('/bodyguard-tabs');
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
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleComplete}
      >
        <Text style={styles.buttonText}>Completa</Text>
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
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.background,
  },
});
