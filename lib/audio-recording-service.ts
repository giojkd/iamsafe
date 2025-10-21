import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export type AudioRecording = {
  id: string;
  sos_alert_id: string;
  user_id: string;
  storage_path: string;
  duration_seconds: number;
  file_size_bytes: number;
  mime_type: string;
  is_processing: boolean;
  created_at: string;
  recorded_at: string;
};

class AudioRecordingService {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;
  private currentSOSAlertId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('[Audio Service] Web platform: requesting microphone access');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }

      console.log('[Audio Service] Requesting audio permissions');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('[Audio Service] Permission status:', status);
      return status === 'granted';
    } catch (error) {
      console.error('[Audio Service] Error requesting permissions:', error);
      return false;
    }
  }

  async startRecording(sosAlertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isRecording) {
        return { success: false, error: 'Registrazione già in corso' };
      }

      if (Platform.OS === 'web') {
        return this.startWebRecording(sosAlertId);
      }

      console.log('[Audio Service] Starting recording for SOS:', sosAlertId);
      this.currentSOSAlertId = sosAlertId;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { success: false, error: 'Permesso microfono negato' };
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      console.log('[Audio Service] Recording started successfully');
      return { success: true };
    } catch (error) {
      console.error('[Audio Service] Error starting recording:', error);
      return { success: false, error: 'Impossibile avviare registrazione' };
    }
  }

  async startWebRecording(sosAlertId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Audio Service] Starting web recording for SOS:', sosAlertId);
      this.currentSOSAlertId = sosAlertId;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await this.uploadWebRecording(audioBlob, sosAlertId);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      (this as any).webMediaRecorder = mediaRecorder;
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      console.log('[Audio Service] Web recording started successfully');
      return { success: true };
    } catch (error) {
      console.error('[Audio Service] Error starting web recording:', error);
      return { success: false, error: 'Impossibile avviare registrazione web' };
    }
  }

  async stopRecording(): Promise<{ success: boolean; uri?: string; error?: string }> {
    try {
      if (!this.isRecording) {
        return { success: false, error: 'Nessuna registrazione in corso' };
      }

      if (Platform.OS === 'web') {
        return this.stopWebRecording();
      }

      console.log('[Audio Service] Stopping recording');

      if (!this.recording) {
        return { success: false, error: 'Nessuna registrazione attiva' };
      }

      await this.recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      const duration = status.durationMillis ? Math.floor(status.durationMillis / 1000) : 0;

      this.recording = null;
      this.isRecording = false;

      if (uri && this.currentSOSAlertId) {
        await this.uploadRecording(uri, this.currentSOSAlertId, duration);
      }

      console.log('[Audio Service] Recording stopped successfully');
      return { success: true, uri: uri || undefined };
    } catch (error) {
      console.error('[Audio Service] Error stopping recording:', error);
      this.isRecording = false;
      return { success: false, error: 'Errore durante il salvataggio' };
    }
  }

  async stopWebRecording(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[Audio Service] Stopping web recording');
      const mediaRecorder = (this as any).webMediaRecorder as MediaRecorder;

      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }

      this.isRecording = false;
      (this as any).webMediaRecorder = null;

      console.log('[Audio Service] Web recording stopped successfully');
      return { success: true };
    } catch (error) {
      console.error('[Audio Service] Error stopping web recording:', error);
      this.isRecording = false;
      return { success: false, error: 'Errore durante il salvataggio web' };
    }
  }

  async uploadRecording(uri: string, sosAlertId: string, duration: number): Promise<boolean> {
    try {
      console.log('[Audio Service] Uploading recording:', { uri, sosAlertId, duration });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[Audio Service] User not authenticated');
        return false;
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${user.id}/${sosAlertId}_${Date.now()}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from('sos-audio-recordings')
        .upload(fileName, blob, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Audio Service] Upload error:', uploadError);
        return false;
      }

      const { error: dbError } = await supabase
        .from('sos_audio_recordings')
        .insert({
          sos_alert_id: sosAlertId,
          user_id: user.id,
          storage_path: fileName,
          duration_seconds: duration,
          file_size_bytes: blob.size,
          mime_type: 'audio/m4a',
          is_processing: false,
        });

      if (dbError) {
        console.error('[Audio Service] Database error:', dbError);
        return false;
      }

      console.log('[Audio Service] Recording uploaded successfully');
      return true;
    } catch (error) {
      console.error('[Audio Service] Error uploading recording:', error);
      return false;
    }
  }

  async uploadWebRecording(blob: Blob, sosAlertId: string): Promise<boolean> {
    try {
      console.log('[Audio Service] Uploading web recording:', { sosAlertId, size: blob.size });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[Audio Service] User not authenticated');
        return false;
      }

      const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      const fileName = `${user.id}/${sosAlertId}_${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from('sos-audio-recordings')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Audio Service] Web upload error:', uploadError);
        return false;
      }

      const { error: dbError } = await supabase
        .from('sos_audio_recordings')
        .insert({
          sos_alert_id: sosAlertId,
          user_id: user.id,
          storage_path: fileName,
          duration_seconds: duration,
          file_size_bytes: blob.size,
          mime_type: 'audio/webm',
          is_processing: false,
        });

      if (dbError) {
        console.error('[Audio Service] Database error:', dbError);
        return false;
      }

      console.log('[Audio Service] Web recording uploaded successfully');
      return true;
    } catch (error) {
      console.error('[Audio Service] Error uploading web recording:', error);
      return false;
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getRecordingDuration(): number {
    if (!this.isRecording || this.recordingStartTime === 0) {
      return 0;
    }
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }

  async getRecordingsForSOS(sosAlertId: string): Promise<AudioRecording[]> {
    try {
      const { data, error } = await supabase
        .from('sos_audio_recordings')
        .select('*')
        .eq('sos_alert_id', sosAlertId)
        .order('recorded_at', { ascending: false });

      if (error || !data) {
        console.error('[Audio Service] Error fetching recordings:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('[Audio Service] Error in getRecordingsForSOS:', error);
      return [];
    }
  }

  async getAudioURL(storagePath: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from('sos-audio-recordings')
        .createSignedUrl(storagePath, 3600);

      return data?.signedUrl || null;
    } catch (error) {
      console.error('[Audio Service] Error getting audio URL:', error);
      return null;
    }
  }

  async deleteRecording(recordingId: string): Promise<boolean> {
    try {
      const { data: recording } = await supabase
        .from('sos_audio_recordings')
        .select('storage_path')
        .eq('id', recordingId)
        .single();

      if (!recording) return false;

      await supabase.storage
        .from('sos-audio-recordings')
        .remove([recording.storage_path]);

      const { error } = await supabase
        .from('sos_audio_recordings')
        .delete()
        .eq('id', recordingId);

      return !error;
    } catch (error) {
      console.error('[Audio Service] Error deleting recording:', error);
      return false;
    }
  }
}

export const audioRecordingService = new AudioRecordingService();
