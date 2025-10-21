import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { theme } from '../theme';
import { MapPin, Plus, X, Check } from 'lucide-react-native';
import { useState } from 'react';
import { ITALIAN_CITIES } from '../lib/italian-cities';

type WorkZone = {
  id: string;
  city: string;
  radiusKm: number;
};

type Props = {
  workZones: WorkZone[];
  onUpdate: (zones: WorkZone[]) => void;
  editable: boolean;
};

export function WorkZonesManager({ workZones, onUpdate, editable }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [radius, setRadius] = useState('50');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = ITALIAN_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddZone = () => {
    if (!selectedCity) {
      Alert.alert('Errore', 'Seleziona una città');
      return;
    }

    const radiusNum = parseInt(radius);
    if (isNaN(radiusNum) || radiusNum < 10 || radiusNum > 500) {
      Alert.alert('Errore', 'Il raggio deve essere tra 10 e 500 km');
      return;
    }

    const alreadyExists = workZones.some(zone => zone.city === selectedCity);
    if (alreadyExists) {
      Alert.alert('Errore', 'Questa città è già presente');
      return;
    }

    const newZone: WorkZone = {
      id: Date.now().toString(),
      city: selectedCity,
      radiusKm: radiusNum,
    };

    onUpdate([...workZones, newZone]);
    setShowAddModal(false);
    setSelectedCity('');
    setRadius('50');
    setSearchQuery('');
  };

  const handleRemoveZone = (id: string) => {
    Alert.alert(
      'Rimuovi zona',
      'Sei sicuro di voler rimuovere questa zona di lavoro?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: () => {
            onUpdate(workZones.filter(zone => zone.id !== id));
          },
        },
      ]
    );
  };

  const handleUpdateRadius = (id: string, newRadius: number) => {
    onUpdate(
      workZones.map(zone =>
        zone.id === id ? { ...zone, radiusKm: newRadius } : zone
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.zonesContainer}>
        {workZones.length === 0 ? (
          <Text style={styles.emptyText}>
            Nessuna zona di lavoro impostata
          </Text>
        ) : (
          workZones.map(zone => (
            <View key={zone.id} style={styles.zoneCard}>
              <View style={styles.zoneInfo}>
                <MapPin size={20} color={theme.colors.primary} strokeWidth={2} />
                <View style={styles.zoneDetails}>
                  <Text style={styles.cityName}>{zone.city}</Text>
                  <Text style={styles.radiusText}>
                    Raggio: {zone.radiusKm} km
                  </Text>
                </View>
              </View>
              {editable && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveZone(zone.id)}
                >
                  <X size={20} color={theme.colors.error} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {editable && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color={theme.colors.primary} strokeWidth={2} />
          <Text style={styles.addButtonText}>Aggiungi Zona</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aggiungi Zona di Lavoro</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={theme.colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca città..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              <View style={styles.citiesListContainer}>
                {filteredCities.map(city => (
                  <TouchableOpacity
                    key={city.name}
                    style={[
                      styles.cityItem,
                      selectedCity === city.name && styles.cityItemSelected,
                    ]}
                    onPress={() => setSelectedCity(city.name)}
                  >
                    <View>
                      <Text
                        style={[
                          styles.cityItemName,
                          selectedCity === city.name && styles.cityItemNameSelected,
                        ]}
                      >
                        {city.name}
                      </Text>
                      <Text style={styles.cityItemRegion}>{city.region}</Text>
                    </View>
                    {selectedCity === city.name && (
                      <Check size={20} color={theme.colors.primary} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.radiusSection}>
                <Text style={styles.radiusLabel}>Raggio di lavoro (km)</Text>
                <TextInput
                  style={styles.radiusInput}
                  value={radius}
                  onChangeText={setRadius}
                  keyboardType="number-pad"
                  placeholder="50"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <Text style={styles.radiusHint}>
                  Distanza massima dalla città (10-500 km)
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAddZone}>
                <Text style={styles.confirmButtonText}>Aggiungi</Text>
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
    gap: theme.spacing.m,
  },
  zonesContainer: {
    gap: theme.spacing.s,
  },
  emptyText: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.l,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    flex: 1,
  },
  zoneDetails: {
    flex: 1,
  },
  cityName: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
  },
  radiusText: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: theme.spacing.s,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.l,
    borderTopRightRadius: theme.borderRadius.l,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizeL,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.text,
  },
  modalBody: {
    padding: theme.spacing.l,
    maxHeight: '70%',
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    fontSize: theme.typography.fontSize,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.m,
  },
  citiesListContainer: {
    marginBottom: theme.spacing.l,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
    backgroundColor: theme.colors.surface,
  },
  cityItemSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  cityItemName: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
  },
  cityItemNameSelected: {
    color: theme.colors.primary,
  },
  cityItemRegion: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  radiusSection: {
    gap: theme.spacing.s,
  },
  radiusLabel: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
  },
  radiusInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    fontSize: theme.typography.fontSize,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  radiusHint: {
    fontSize: theme.typography.fontSizeS,
    color: theme.colors.textSecondary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    padding: theme.spacing.l,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.colors.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.colors.background,
  },
});
