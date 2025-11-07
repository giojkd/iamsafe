import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { theme } from '../../theme';
import { Shield, MapPin, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SOSButton from '../../components/SOSButton';
import { supabase } from '../../lib/supabase';

export default function ClientHomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Cliente');

  useEffect(() => {
    loadUserProfile();
  }, []);

  async function loadUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.full_name) {
        const firstName = profile.full_name.split(' ')[0];
        setUserName(firstName);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ciao,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/client-tabs/profile')}>
          <View style={styles.profileIcon}>
            <User size={20} color={theme.colors.text} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Shield size={80} color={theme.colors.primary} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>Dove hai bisogno di protezione?</Text>
          <Text style={styles.heroSubtitle}>
            Trova bodyguard professionisti nelle vicinanze
          </Text>
        </View>

        <View style={styles.searchCard}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/search-location')}
          >
            <View style={styles.searchIcon}>
              <MapPin size={20} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.searchPlaceholder}>Dove cerchi?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/client-tabs/bookings')}
          >
            <View style={styles.actionIconContainer}>
              <Shield size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Le Mie</Text>
            <Text style={styles.actionTitle}>Prenotazioni</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardHighlight]}
            onPress={() => router.push('/client-tabs/sos-alerts')}
          >
            <View style={styles.actionIconContainerHighlight}>
              <Shield size={24} color={theme.colors.error} />
            </View>
            <Text style={styles.actionTitle}>Cronologia</Text>
            <Text style={styles.actionTitle}>Emergenze</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sosSection}>
          <Text style={styles.sosTitle}>Emergenza?</Text>
          <Text style={styles.sosDescription}>
            Premi il pulsante per attivare immediatamente l'SOS
          </Text>
          <SOSButton />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  greeting: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeightRegular,
  },
  userName: {
    fontSize: theme.typography.fontSizeL,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.m,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  heroTitle: {
    fontSize: theme.typography.fontSizeL,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  searchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.l,
    ...theme.shadows.small,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    gap: theme.spacing.m,
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPlaceholder: {
    fontSize: theme.typography.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeightMedium,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  actionCardHighlight: {
    backgroundColor: theme.colors.errorLight,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  actionIconContainerHighlight: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  actionTitle: {
    fontSize: theme.typography.fontSizeS,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  sosSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  sosTitle: {
    fontSize: theme.typography.fontSizeM,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  sosDescription: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
    lineHeight: 20,
  },
});
