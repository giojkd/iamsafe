import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Search, Shield, Clock, CheckCircle } from 'lucide-react-native';
import { theme } from '../../theme';
import { locationSharingService, SharingPermission } from '../../lib/location-sharing-service';
import { supabase } from '../../lib/supabase';

type Contact = {
  id: string;
  full_name: string;
  role: string;
  has_permission: boolean;
};

export default function LocationSharingScreen() {
  const [permissions, setPermissions] = useState<SharingPermission[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    const perms = await locationSharingService.getMyPermissions();
    setPermissions(perms);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .neq('id', (await supabase.auth.getUser()).data.user?.id || '');

    if (profiles) {
      const contactsWithPermissions = profiles.map(profile => ({
        ...profile,
        has_permission: perms.some(p => p.viewer_id === profile.id && p.is_active),
      }));
      setContacts(contactsWithPermissions);
    }

    setIsLoading(false);
  };

  const togglePermission = async (userId: string, currentState: boolean) => {
    if (currentState) {
      const success = await locationSharingService.revokeLocationPermission(userId);
      if (success) {
        await loadData();
      } else {
        Alert.alert('Errore', 'Impossibile revocare il permesso');
      }
    } else {
      const success = await locationSharingService.grantLocationPermission(userId, 'explicit');
      if (success) {
        await loadData();
      } else {
        Alert.alert('Errore', 'Impossibile concedere il permesso');
      }
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePermissions = permissions.filter(p => p.is_active);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Condivisione Posizione</Text>
        <Text style={styles.subtitle}>
          Gestisci chi può vedere la tua posizione in tempo reale
        </Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Users size={24} color={theme.colors.primary} />
          <Text style={styles.statNumber}>{activePermissions.length}</Text>
          <Text style={styles.statLabel}>Condivisioni Attive</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca contatto..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.contactsList}>
        {filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nessun contatto trovato</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Prova con un altro nome' : 'Non ci sono contatti disponibili'}
            </Text>
          </View>
        ) : (
          filteredContacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactAvatar}>
                {contact.role === 'bodyguard' ? (
                  <Shield size={24} color="#10B981" />
                ) : (
                  <Users size={24} color={theme.colors.primary} />
                )}
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.full_name}</Text>
                <Text style={styles.contactRole}>
                  {contact.role === 'bodyguard' ? 'Bodyguard' : 'Utente'}
                </Text>
              </View>

              <Switch
                value={contact.has_permission}
                onValueChange={() => togglePermission(contact.id, contact.has_permission)}
                trackColor={{ false: theme.colors.border, true: '#10B981' + '50' }}
                thumbColor={contact.has_permission ? '#10B981' : theme.colors.textSecondary}
              />
            </View>
          ))
        )}
      </ScrollView>

      {activePermissions.length > 0 && (
        <View style={styles.infoCard}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.infoText}>
            {activePermissions.length} {activePermissions.length === 1 ? 'persona può' : 'persone possono'} vedere la tua posizione
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  statsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: '#10B981' + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981' + '30',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});
