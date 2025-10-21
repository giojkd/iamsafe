import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, StatusBar } from 'react-native';
import { useState, useEffect } from 'react';
import { UserPlus, Phone, Shield, Trash2, X } from 'lucide-react-native';
import { theme } from '../../theme';
import { sosService, EmergencyContact } from '../../lib/sos-service';

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    const fetchedContacts = await sosService.getEmergencyContacts();
    setContacts(fetchedContacts);
    setIsLoading(false);
  };

  const handleAddContact = async () => {
    if (!newContactName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome del contatto');
      return;
    }

    const success = await sosService.addEmergencyContact(
      newContactName.trim(),
      newContactPhone.trim() || undefined,
      undefined,
      contacts.length + 1
    );

    if (success) {
      setShowAddModal(false);
      setNewContactName('');
      setNewContactPhone('');
      await loadContacts();
      Alert.alert('Successo', 'Contatto di emergenza aggiunto');
    } else {
      Alert.alert(
        'Errore Database',
        'Impossibile aggiungere il contatto. Le tabelle del database potrebbero non essere state create. Visita il pannello Supabase e esegui le migrazioni nella cartella supabase/migrations/'
      );
    }
  };

  const handleRemoveContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Rimuovere contatto?',
      `Vuoi rimuovere ${contact.contact_name} dai contatti di emergenza?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async () => {
            const success = await sosService.removeEmergencyContact(contact.id);
            if (success) {
              await loadContacts();
            } else {
              Alert.alert('Errore', 'Impossibile rimuovere il contatto');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Contatti di Emergenza</Text>
        <Text style={styles.subtitle}>
          Verranno notificati quando attivi SOS
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIconContainer}>
          <Shield size={18} color={theme.colors.error} strokeWidth={2} />
        </View>
        <Text style={styles.infoText}>
          In caso di emergenza riceveranno la tua posizione in tempo reale
        </Text>
      </View>

      <ScrollView style={styles.contactsList}>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <UserPlus size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nessun contatto di emergenza</Text>
            <Text style={styles.emptyText}>
              Aggiungi contatti che verranno notificati in caso di emergenza
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactAvatar}>
                <Phone size={24} color={theme.colors.primary} />
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.contact_name}</Text>
                {contact.contact_phone && (
                  <Text style={styles.contactPhone}>{contact.contact_phone}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemoveContact(contact)}
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <UserPlus size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.addButtonText}>Aggiungi Contatto</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuovo Contatto</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nome contatto"
              placeholderTextColor={theme.colors.textSecondary}
              value={newContactName}
              onChangeText={setNewContactName}
            />

            <TextInput
              style={styles.input}
              placeholder="Numero di telefono (opzionale)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newContactPhone}
              onChangeText={setNewContactPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddContact}
              >
                <Text style={styles.modalButtonText}>Aggiungi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  header: {
    padding: theme.spacing.m,
    paddingTop: 60,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSizeL,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.m,
    margin: theme.spacing.m,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.m,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.error,
    lineHeight: 20,
    paddingTop: 4,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.m,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizeM,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  emptyText: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.medium,
  },
  addButtonText: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
