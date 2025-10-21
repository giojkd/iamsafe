import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { User, LogOut, MapPin, Shield, ChevronRight } from 'lucide-react-native';
import { theme } from '../../theme';
import { userProfileService } from '../../lib/user-profile-service';

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Cliente');
  const [userPhone, setUserPhone] = useState('+39 XXX XXX XXXX');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await userProfileService.getProfile();
      if (profile) {
        setUserName(profile.full_name);
        if (profile.phone) {
          setUserPhone(profile.phone);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await userProfileService.signOut();
    router.replace('/splash');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={40} color={theme.colors.text} strokeWidth={1.5} />
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.phone}>{userPhone}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SICUREZZA</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/client-tabs/emergency-contacts')}
            >
              <View style={styles.menuIcon}>
                <Shield size={20} color={theme.colors.error} strokeWidth={2} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Contatti di Emergenza</Text>
                <Text style={styles.menuSubtitle}>Gestisci i contatti SOS</Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/client-tabs/location-sharing')}
            >
              <View style={styles.menuIcon}>
                <MapPin size={20} color={theme.colors.accent} strokeWidth={2} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Condivisione Posizione</Text>
                <Text style={styles.menuSubtitle}>Gestisci le autorizzazioni</Text>
              </View>
              <ChevronRight size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color={theme.colors.error} strokeWidth={2} />
          <Text style={styles.logoutText}>Esci</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  name: {
    fontSize: theme.typography.fontSizeL,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: theme.typography.fontSize,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.m,
  },
  section: {
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizeXS,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    marginLeft: 60,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.small,
  },
  logoutText: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.error,
  },
});
