import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, LogOut, Edit2, Check, X, Camera, Star, Euro, MapPin, Briefcase, Award, Languages, User, Car, Shirt } from 'lucide-react-native';
import { theme } from '../../theme';
import { useState } from 'react';
import { WorkZonesManager } from '../../components/WorkZonesManager';

type WorkZone = {
  id: string;
  city: string;
  radiusKm: number;
};

type BodyguardProfile = {
  fullName: string;
  phone: string;
  bio: string;
  hourlyRate: number;
  kmRate: number;
  city: string;
  experience: string;
  certifications: string[];
  languages: string[];
  specializations: string[];
  availability: boolean;
  outfitOptions: string[];
  vehicleAvailable: boolean;
  vehicleType: string;
  rating: number;
  totalReviews: number;
  workZones: WorkZone[];
};

const MOCK_PROFILE: BodyguardProfile = {
  fullName: 'Marco Rossi',
  phone: '+39 340 123 4567',
  bio: 'Professionista con oltre 10 anni di esperienza nel settore della sicurezza personale. Specializzato in protezione esecutiva e gestione di situazioni ad alto rischio.',
  hourlyRate: 50,
  kmRate: 1.5,
  city: 'Milano',
  experience: '10+ anni',
  certifications: ['Protezione Esecutiva', 'Primo Soccorso', 'Gestione Crisi'],
  languages: ['Italiano', 'Inglese', 'Francese'],
  specializations: ['Eventi VIP', 'Security aziendale', 'Accompagnamento'],
  availability: true,
  outfitOptions: ['Formale', 'Casual Elegante', 'Tattico'],
  vehicleAvailable: true,
  vehicleType: 'SUV Blindato',
  rating: 4.9,
  totalReviews: 234,
  workZones: [
    { id: '1', city: 'Milano', radiusKm: 50 },
    { id: '2', city: 'Roma', radiusKm: 30 },
  ],
};

const AVAILABLE_OUTFITS = ['Formale', 'Casual Elegante', 'Streetwear', 'Tattico'];
const AVAILABLE_CERTIFICATIONS = ['Protezione Esecutiva', 'Primo Soccorso', 'Gestione Crisi', 'Difesa Personale', 'Armi da Fuoco', 'Tecniche Anticrimine'];
const AVAILABLE_SPECIALIZATIONS = ['Eventi VIP', 'Security aziendale', 'Accompagnamento', 'Protezione Residenziale', 'Scorta Armata', 'Anti-Paparazzi'];
const AVAILABLE_VEHICLE_TYPES = ['Nessuno', 'Auto Standard', 'Auto di Lusso', 'SUV', 'SUV Blindato', 'Van'];
const AVAILABLE_LANGUAGES = ['Italiano', 'Inglese', 'Francese', 'Tedesco', 'Spagnolo', 'Russo', 'Arabo', 'Cinese', 'Giapponese'];


export default function BodyguardProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<BodyguardProfile>(MOCK_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<BodyguardProfile>(MOCK_PROFILE);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    Alert.alert('Profilo aggiornato', 'Le modifiche sono state salvate con successo');
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleSignOut = () => {
    router.replace('/splash');
  };

  const handlePhotoChange = () => {
    setShowPhotoOptions(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={isEditing ? handlePhotoChange : undefined}
          >
            <View style={styles.avatar}>
              <Shield size={48} color={theme.colors.primary} />
            </View>
            {isEditing && (
              <View style={styles.cameraButton}>
                <Camera size={16} color={theme.colors.background} />
              </View>
            )}
          </TouchableOpacity>

          {!isEditing ? (
            <>
              <Text style={styles.name}>{profile.fullName}</Text>
              <Text style={styles.phone}>{profile.phone}</Text>
              <View style={styles.ratingContainer}>
                <Star size={18} color={theme.colors.warning} fill={theme.colors.warning} />
                <Text style={styles.rating}>{profile.rating}</Text>
                <Text style={styles.reviews}>({profile.totalReviews} recensioni)</Text>
              </View>
            </>
          ) : (
            <View style={styles.editSection}>
              <TextInput
                style={styles.input}
                value={editedProfile.fullName}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, fullName: text })}
                placeholder="Nome completo"
                placeholderTextColor={theme.colors.textSecondary}
              />
              <TextInput
                style={styles.input}
                value={editedProfile.phone}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, phone: text })}
                placeholder="Telefono"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Edit2 size={18} color={theme.colors.primary} />
              <Text style={styles.editButtonText}>Modifica Profilo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Informazioni Personali</Text>
            </View>

            {!isEditing ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  <Text style={styles.infoValue}>{profile.bio}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.infoValue}>{profile.city}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Briefcase size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.infoValue}>Esperienza: {profile.experience}</Text>
                </View>
              </>
            ) : (
              <>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editedProfile.bio}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                  placeholder="Biografia"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
                <TextInput
                  style={styles.input}
                  value={editedProfile.city}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, city: text })}
                  placeholder="Città"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  value={editedProfile.experience}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, experience: text })}
                  placeholder="Esperienza"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Zone di Lavoro</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Specifica le città in cui sei disponibile a lavorare e il raggio di copertura
            </Text>
            <WorkZonesManager
              workZones={isEditing ? editedProfile.workZones : profile.workZones}
              onUpdate={(zones) =>
                setEditedProfile({ ...editedProfile, workZones: zones })
              }
              editable={isEditing}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Euro size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Tariffe e Disponibilità</Text>
            </View>

            {!isEditing ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tariffa oraria</Text>
                  <Text style={styles.priceValue}>€{profile.hourlyRate}/ora</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Costo al chilometro</Text>
                  <Text style={styles.priceValue}>€{profile.kmRate}/km</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Disponibile</Text>
                  <View style={[styles.statusBadge, profile.availability ? styles.availableBadge : styles.unavailableBadge]}>
                    <Text style={[styles.statusText, profile.availability ? styles.availableText : styles.unavailableText]}>
                      {profile.availability ? 'Disponibile' : 'Non disponibile'}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Tariffa oraria (€)</Text>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    value={editedProfile.hourlyRate.toString()}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, hourlyRate: parseInt(text) || 0 })}
                    placeholder="50"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Costo al chilometro (€)</Text>
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    value={editedProfile.kmRate.toString()}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, kmRate: parseFloat(text) || 0 })}
                    placeholder="1.5"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.inputLabel}>Disponibile per prenotazioni</Text>
                  <Switch
                    value={editedProfile.availability}
                    onValueChange={(value) => setEditedProfile({ ...editedProfile, availability: value })}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary + '50' }}
                    thumbColor={editedProfile.availability ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Certificazioni</Text>
            </View>

            {!isEditing ? (
              <View style={styles.chipContainer}>
                {profile.certifications.map((cert, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{cert}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.outfitSelector}>
                {AVAILABLE_CERTIFICATIONS.map((cert) => (
                  <TouchableOpacity
                    key={cert}
                    style={[
                      styles.outfitOption,
                      editedProfile.certifications.includes(cert) && styles.outfitOptionSelected
                    ]}
                    onPress={() => {
                      const isSelected = editedProfile.certifications.includes(cert);
                      if (isSelected) {
                        setEditedProfile({
                          ...editedProfile,
                          certifications: editedProfile.certifications.filter(c => c !== cert)
                        });
                      } else {
                        setEditedProfile({
                          ...editedProfile,
                          certifications: [...editedProfile.certifications, cert]
                        });
                      }
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      editedProfile.certifications.includes(cert) && styles.checkboxSelected
                    ]}>
                      {editedProfile.certifications.includes(cert) && (
                        <Check size={14} color={theme.colors.background} />
                      )}
                    </View>
                    <Text style={[
                      styles.outfitOptionText,
                      editedProfile.certifications.includes(cert) && styles.outfitOptionTextSelected
                    ]}>{cert}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Languages size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Lingue</Text>
            </View>

            {!isEditing ? (
              <View style={styles.chipContainer}>
                {profile.languages.map((lang, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{lang}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.outfitSelector}>
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.outfitOption,
                      editedProfile.languages.includes(lang) && styles.outfitOptionSelected
                    ]}
                    onPress={() => {
                      const isSelected = editedProfile.languages.includes(lang);
                      if (isSelected) {
                        setEditedProfile({
                          ...editedProfile,
                          languages: editedProfile.languages.filter(l => l !== lang)
                        });
                      } else {
                        setEditedProfile({
                          ...editedProfile,
                          languages: [...editedProfile.languages, lang]
                        });
                      }
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      editedProfile.languages.includes(lang) && styles.checkboxSelected
                    ]}>
                      {editedProfile.languages.includes(lang) && (
                        <Check size={14} color={theme.colors.background} />
                      )}
                    </View>
                    <Text style={[
                      styles.outfitOptionText,
                      editedProfile.languages.includes(lang) && styles.outfitOptionTextSelected
                    ]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Specializzazioni</Text>
            </View>

            {!isEditing ? (
              <View style={styles.chipContainer}>
                {profile.specializations.map((spec, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{spec}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.outfitSelector}>
                {AVAILABLE_SPECIALIZATIONS.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.outfitOption,
                      editedProfile.specializations.includes(spec) && styles.outfitOptionSelected
                    ]}
                    onPress={() => {
                      const isSelected = editedProfile.specializations.includes(spec);
                      if (isSelected) {
                        setEditedProfile({
                          ...editedProfile,
                          specializations: editedProfile.specializations.filter(s => s !== spec)
                        });
                      } else {
                        setEditedProfile({
                          ...editedProfile,
                          specializations: [...editedProfile.specializations, spec]
                        });
                      }
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      editedProfile.specializations.includes(spec) && styles.checkboxSelected
                    ]}>
                      {editedProfile.specializations.includes(spec) && (
                        <Check size={14} color={theme.colors.background} />
                      )}
                    </View>
                    <Text style={[
                      styles.outfitOptionText,
                      editedProfile.specializations.includes(spec) && styles.outfitOptionTextSelected
                    ]}>{spec}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shirt size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Outfit Disponibili</Text>
            </View>

            {!isEditing ? (
              <View style={styles.chipContainer}>
                {profile.outfitOptions.map((outfit, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{outfit}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.outfitSelector}>
                {AVAILABLE_OUTFITS.map((outfit) => (
                  <TouchableOpacity
                    key={outfit}
                    style={[
                      styles.outfitOption,
                      editedProfile.outfitOptions.includes(outfit) && styles.outfitOptionSelected
                    ]}
                    onPress={() => {
                      const isSelected = editedProfile.outfitOptions.includes(outfit);
                      if (isSelected) {
                        setEditedProfile({
                          ...editedProfile,
                          outfitOptions: editedProfile.outfitOptions.filter(o => o !== outfit)
                        });
                      } else {
                        setEditedProfile({
                          ...editedProfile,
                          outfitOptions: [...editedProfile.outfitOptions, outfit]
                        });
                      }
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      editedProfile.outfitOptions.includes(outfit) && styles.checkboxSelected
                    ]}>
                      {editedProfile.outfitOptions.includes(outfit) && (
                        <Check size={14} color={theme.colors.background} />
                      )}
                    </View>
                    <Text style={[
                      styles.outfitOptionText,
                      editedProfile.outfitOptions.includes(outfit) && styles.outfitOptionTextSelected
                    ]}>{outfit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Car size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Veicolo</Text>
            </View>

            {!isEditing ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{profile.vehicleType}</Text>
              </View>
            ) : (
              <View style={styles.outfitSelector}>
                {AVAILABLE_VEHICLE_TYPES.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle}
                    style={[
                      styles.outfitOption,
                      editedProfile.vehicleType === vehicle && styles.outfitOptionSelected
                    ]}
                    onPress={() => {
                      setEditedProfile({
                        ...editedProfile,
                        vehicleType: vehicle,
                        vehicleAvailable: vehicle !== 'Nessuno'
                      });
                    }}
                  >
                    <View style={[
                      styles.checkbox,
                      editedProfile.vehicleType === vehicle && styles.checkboxSelected
                    ]}>
                      {editedProfile.vehicleType === vehicle && (
                        <Check size={14} color={theme.colors.background} />
                      )}
                    </View>
                    <Text style={[
                      styles.outfitOptionText,
                      editedProfile.vehicleType === vehicle && styles.outfitOptionTextSelected
                    ]}>{vehicle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <X size={20} color={theme.colors.error} />
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Check size={20} color={theme.colors.background} />
                <Text style={styles.saveButtonText}>Salva</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
              <LogOut size={20} color={theme.colors.error} />
              <Text style={styles.logoutText}>Esci</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showPhotoOptions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoModal}>
            <Text style={styles.photoModalTitle}>Cambia foto profilo</Text>
            <TouchableOpacity
              style={styles.photoOption}
              onPress={() => {
                setShowPhotoOptions(false);
                Alert.alert('Fotocamera', 'Funzionalità fotocamera non ancora implementata');
              }}
            >
              <Camera size={20} color={theme.colors.primary} />
              <Text style={styles.photoOptionText}>Scatta foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoOption}
              onPress={() => {
                setShowPhotoOptions(false);
                Alert.alert('Galleria', 'Funzionalità galleria non ancora implementata');
              }}
            >
              <User size={20} color={theme.colors.primary} />
              <Text style={styles.photoOptionText}>Scegli dalla galleria</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoOption, styles.cancelOption]}
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={styles.cancelOptionText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  phone: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  rating: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  reviews: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 20,
    marginTop: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  editSection: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 12,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  infoRow: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.success,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  unavailableBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  availableText: {
    color: theme.colors.success,
  },
  unavailableText: {
    color: theme.colors.error,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  smallChip: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  smallChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  smallInput: {
    width: 100,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  photoModal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  cancelOption: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
    textAlign: 'center',
  },
  outfitSelector: {
    gap: 12,
  },
  outfitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  outfitOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  outfitOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  outfitOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
});
