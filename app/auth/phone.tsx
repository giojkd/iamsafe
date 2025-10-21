import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import { useState } from 'react';

export default function PhoneScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'client' | 'bodyguard' }>();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!phone || phone.length < 9) {
      setError('Inserisci un numero di telefono valido');
      return;
    }

    setError('');
    router.push({
      pathname: '/auth/verify-otp',
      params: { phone: '+39' + phone, role },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inserisci il tuo numero</Text>
      <Text style={styles.subtitle}>Ti invieremo un codice di verifica</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.prefix}>+39</Text>
        <TextInput
          style={styles.input}
          placeholder="3XX XXX XXXX"
          placeholderTextColor={theme.colors.textSecondary}
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (error) setError('');
          }}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  prefix: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '500',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
    paddingVertical: 16,
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
