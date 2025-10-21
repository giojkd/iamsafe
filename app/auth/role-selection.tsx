import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, User } from 'lucide-react-native';
import { theme } from '../../theme';
import { useState } from 'react';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'client' | 'bodyguard' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push({
        pathname: '/auth/phone',
        params: { role: selectedRole },
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sei un Cliente o un Bodyguard?</Text>
      <Text style={styles.subtitle}>Seleziona il tuo ruolo</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.card, selectedRole === 'client' && styles.cardSelected]}
          onPress={() => setSelectedRole('client')}
        >
          <User size={48} color={selectedRole === 'client' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.cardTitle, selectedRole === 'client' && styles.cardTitleSelected]}>
            Cliente
          </Text>
          <Text style={styles.cardDescription}>Prenota un bodyguard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, selectedRole === 'bodyguard' && styles.cardSelected]}
          onPress={() => setSelectedRole('bodyguard')}
        >
          <Shield size={48} color={selectedRole === 'bodyguard' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[styles.cardTitle, selectedRole === 'bodyguard' && styles.cardTitleSelected]}>
            Bodyguard
          </Text>
          <Text style={styles.cardDescription}>Offri i tuoi servizi</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, !selectedRole && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selectedRole}
      >
        <Text style={[styles.buttonText, !selectedRole && styles.buttonTextDisabled]}>
          Continua
        </Text>
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
  cardContainer: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardTitleSelected: {
    color: theme.colors.primary,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.surfaceLight,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.background,
  },
  buttonTextDisabled: {
    color: theme.colors.textSecondary,
  },
});
