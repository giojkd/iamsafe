import { supabase } from './supabase';
import { locationSharingService } from './location-sharing-service';
import { audioRecordingService } from './audio-recording-service';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type EmergencyContact = {
  id: string;
  user_id: string;
  contact_user_id?: string;
  contact_name: string;
  contact_phone?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
};

export type SOSAlert = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'resolved' | 'cancelled';
  triggered_at: string;
  resolved_at?: string;
  notes?: string;
};

export type SOSNotification = {
  id: string;
  sos_alert_id: string;
  recipient_user_id: string;
  sent_at: string;
  read_at?: string;
  acknowledged_at?: string;
};

class SOSService {
  private activeSOSId: string | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;

  async triggerSOS(): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      console.log('[SOS Service] Starting triggerSOS...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[SOS Service] Auth check:', { user: user?.id, authError });

      if (!user) {
        console.error('[SOS Service] User not authenticated - using mock mode');
        return {
          success: true,
          alertId: 'mock-' + Date.now(),
          error: 'Demo mode: utente non autenticato. In produzione, SOS verrebbe inviato ai contatti di emergenza.'
        };
      }

      if (this.activeSOSId) {
        console.warn('[SOS Service] SOS already active:', this.activeSOSId);
        return { success: false, error: 'SOS già attivo' };
      }

      let latitude = 0;
      let longitude = 0;

      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } else {
        console.log('[SOS Service] Running on web, using default location (0,0)');
      }

      console.log('[SOS Service] Inserting SOS alert...', { user_id: user.id, latitude, longitude });

      const { data: alert, error } = await supabase
        .from('sos_alerts')
        .insert({
          user_id: user.id,
          latitude,
          longitude,
          status: 'active',
          triggered_at: new Date().toISOString(),
        })
        .select()
        .single();

      console.log('[SOS Service] Insert result:', { alert, error });

      if (error || !alert) {
        console.error('[SOS Service] Error creating SOS alert:', error);
        return { success: false, error: error?.message || 'Impossibile creare allerta SOS' };
      }

      this.activeSOSId = alert.id;

      await locationSharingService.toggleLocationSharing(true);

      if (Platform.OS !== 'web') {
        this.startLocationTracking();
      }

      // Start audio recording automatically
      const audioResult = await audioRecordingService.startRecording(alert.id);
      if (!audioResult.success) {
        console.warn('[SOS Service] Failed to start audio recording:', audioResult.error);
      }

      return { success: true, alertId: alert.id };
    } catch (error) {
      console.error('Error in triggerSOS:', error);
      return { success: false, error: 'Errore durante attivazione SOS' };
    }
  }

  async deactivateSOS(): Promise<boolean> {
    try {
      console.log('[SOS Service] deactivateSOS called, activeSOSId:', this.activeSOSId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[SOS Service] User not authenticated');
        return false;
      }

      if (!this.activeSOSId) {
        console.log('[SOS Service] No activeSOSId in memory, checking database...');
        const activeSOS = await this.getActiveSOS();
        if (!activeSOS) {
          console.error('[SOS Service] No active SOS found in database');
          return false;
        }
        this.activeSOSId = activeSOS.id;
        console.log('[SOS Service] Found active SOS in database:', this.activeSOSId);
      }

      console.log('[SOS Service] Updating SOS alert to resolved:', this.activeSOSId);
      const { data, error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', this.activeSOSId)
        .select();

      console.log('[SOS Service] Update response:', { data, error });

      if (error) {
        console.error('[SOS Service] Error deactivating SOS:', error);
        console.error('[SOS Service] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      if (!data || data.length === 0) {
        console.error('[SOS Service] No rows updated - SOS alert not found or no permission');
        return false;
      }

      console.log('[SOS Service] SOS deactivated successfully');
      this.stopLocationTracking();

      // Stop audio recording
      if (audioRecordingService.getIsRecording()) {
        await audioRecordingService.stopRecording();
      }

      this.activeSOSId = null;

      return true;
    } catch (error) {
      console.error('[SOS Service] Exception in deactivateSOS:', error);
      return false;
    }
  }

  async cancelSOS(): Promise<boolean> {
    try {
      if (!this.activeSOSId) {
        return false;
      }

      const { error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'cancelled',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', this.activeSOSId);

      if (error) {
        console.error('Error cancelling SOS:', error);
        return false;
      }

      this.stopLocationTracking();

      // Stop audio recording
      if (audioRecordingService.getIsRecording()) {
        await audioRecordingService.stopRecording();
      }

      this.activeSOSId = null;

      return true;
    } catch (error) {
      console.error('Error in cancelSOS:', error);
      return false;
    }
  }

  async getActiveSOS(): Promise<SOSAlert | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('triggered_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      this.activeSOSId = data.id;
      return data;
    } catch (error) {
      console.error('Error in getActiveSOS:', error);
      return null;
    }
  }

  private startLocationTracking() {
    if (this.locationUpdateInterval) {
      return;
    }

    this.locationUpdateInterval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        await locationSharingService.updateMyLocation(
          location.coords.latitude,
          location.coords.longitude,
          true
        );
      } catch (error) {
        console.error('Error updating SOS location:', error);
      }
    }, 5000);
  }

  private stopLocationTracking() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  async addEmergencyContact(
    contactName: string,
    contactPhone?: string,
    contactUserId?: string,
    priority: number = 1
  ): Promise<boolean> {
    try {
      console.log('[SOS Service] addEmergencyContact called', {
        contactName,
        contactPhone,
        contactUserId,
        priority
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[SOS Service] Auth check:', { userId: user?.id, authError });

      if (!user) {
        console.error('[SOS Service] No authenticated user');
        return false;
      }

      console.log('[SOS Service] Inserting emergency contact...');
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_user_id: contactUserId,
          priority,
          is_active: true,
        })
        .select();

      if (error) {
        console.error('[SOS Service] Database error adding emergency contact:', error);
        console.error('[SOS Service] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }

      console.log('[SOS Service] Emergency contact added successfully:', data);
      return true;
    } catch (error) {
      console.error('[SOS Service] Exception in addEmergencyContact:', error);
      return false;
    }
  }

  async removeEmergencyContact(contactId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        console.error('Error removing emergency contact:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeEmergencyContact:', error);
      return false;
    }
  }

  async toggleEmergencyContact(contactId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_active: isActive })
        .eq('id', contactId);

      if (error) {
        console.error('Error toggling emergency contact:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleEmergencyContact:', error);
      return false;
    }
  }

  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error || !data) {
        console.error('Error fetching emergency contacts:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in getEmergencyContacts:', error);
      return [];
    }
  }

  async getReceivedSOSAlerts(): Promise<Array<SOSAlert & { user_name: string }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: notifications, error: notifError } = await supabase
        .from('sos_notifications')
        .select('sos_alert_id')
        .eq('recipient_user_id', user.id);

      if (notifError || !notifications || notifications.length === 0) {
        return [];
      }

      const alertIds = notifications.map(n => n.sos_alert_id);

      const { data: alerts, error: alertsError } = await supabase
        .from('sos_alerts')
        .select('*')
        .in('id', alertIds)
        .eq('status', 'active')
        .order('triggered_at', { ascending: false });

      if (alertsError || !alerts) {
        return [];
      }

      const userIds = alerts.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      return alerts.map(alert => ({
        ...alert,
        user_name: profiles?.find(p => p.id === alert.user_id)?.full_name || 'Utente',
      }));
    } catch (error) {
      console.error('Error in getReceivedSOSAlerts:', error);
      return [];
    }
  }

  async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sos_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  subscribeToSOSAlerts(callback: (alerts: Array<SOSAlert & { user_name: string }>) => void): () => void {
    const channel = supabase
      .channel('sos_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts',
        },
        async () => {
          const alerts = await this.getReceivedSOSAlerts();
          callback(alerts);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}

export const sosService = new SOSService();
