import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react-native';
import { theme } from '../theme';
import { sosService } from '../lib/sos-service';
import { useRouter } from 'expo-router';

type SOSButtonProps = {
  onSOSActivated?: () => void;
  onSOSDeactivated?: () => void;
};

export default function SOSButton({ onSOSActivated, onSOSDeactivated }: SOSButtonProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkActiveStatus();
  }, []);

  useEffect(() => {
    if (isActive) {
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  const checkActiveStatus = async () => {
    const activeSOS = await sosService.getActiveSOS();
    if (activeSOS) {
      setIsActive(true);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handlePress = () => {
    console.log('SOS Button pressed, isActive:', isActive);
    if (isActive) {
      handleDeactivate();
    } else {
      handleActivate();
    }
  };

  const handleActivate = () => {
    console.log('Attempting to activate SOS');
    if (confirm('ATTIVARE SOS?\n\nQuesta azione invierà un allerta di emergenza a tutti i tuoi contatti preferiti e condividerà la tua posizione in tempo reale.\n\nConfermi?')) {
      activateSOS();
    }
  };

  const activateSOS = async () => {
    console.log('Activating SOS...');
    setIsLoading(true);
    const result = await sosService.triggerSOS();
    setIsLoading(false);

    console.log('SOS activation result:', result);

    if (result.success) {
      setIsActive(true);
      onSOSActivated?.();
      if (result.error) {
        alert('SOS Attivato (Demo)\n\n' + result.error);
      } else {
        router.push('/client-tabs/sos-active');
      }
    } else {
      alert('Errore\n\n' + (result.error || 'Impossibile attivare SOS. Riprova.'));
    }
  };

  const handleDeactivate = () => {
    console.log('Attempting to deactivate SOS');
    if (confirm('DISATTIVARE SOS?\n\nConfermi di voler disattivare l\'allerta di emergenza?')) {
      deactivateSOS();
    }
  };

  const deactivateSOS = async () => {
    console.log('Deactivating SOS...');
    setIsLoading(true);

    try {
      const success = await sosService.deactivateSOS();
      setIsLoading(false);

      console.log('SOS deactivation result:', success);

      if (success) {
        setIsActive(false);
        onSOSDeactivated?.();
        alert('SOS Disattivato\n\nL\'allerta di emergenza è stata disattivata.');
      } else {
        console.error('deactivateSOS returned false');
        alert('Errore\n\nImpossibile disattivare SOS. Controlla i log della console per maggiori dettagli.');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Exception in deactivateSOS:', error);
      alert('Errore\n\nEccezione durante la disattivazione: ' + error);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isActive && { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, isActive && styles.buttonActive]}
        onPress={handlePress}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isActive ? (
          <>
            <View style={styles.activeIndicator} />
            <X size={32} color={theme.colors.background} strokeWidth={3} />
            <Text style={styles.buttonText}>DISATTIVA</Text>
            <Text style={styles.buttonSubtext}>SOS ATTIVO</Text>
          </>
        ) : (
          <>
            <AlertCircle size={32} color={theme.colors.background} strokeWidth={3} />
            <Text style={styles.buttonText}>SOS</Text>
            <Text style={styles.buttonSubtext}>EMERGENZA</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonActive: {
    backgroundColor: theme.colors.success,
    shadowColor: theme.colors.success,
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeightBold,
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  buttonSubtext: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: '#FFFFFF',
    marginTop: 2,
    opacity: 0.9,
  },
});
