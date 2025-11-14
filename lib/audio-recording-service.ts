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
  private streamingInterval: NodeJS.Timeout | null = null;
  private webMediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

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
      this.audioChunks = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      let chunkCounter = 0;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          chunkCounter++;
          console.log(`[Audio Service] Chunk ${chunkCounter} received, size: ${event.data.size}`);

          // Upload chunk immediately for streaming
          await this.uploadAudioChunk(event.data, sosAlertId, chunkCounter);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('[Audio Service] Recording stopped, total chunks:', this.audioChunks.length);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with timeslice for streaming (5 seconds chunks)
      mediaRecorder.start(5000);
      this.webMediaRecorder = mediaRecorder;
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      console.log('[Audio Service] Web streaming recording started successfully');
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

      if (this.webMediaRecorder && this.webMediaRecorder.state === 'recording') {
        this.webMediaRecorder.stop();
      }

      this.isRecording = false;
      this.webMediaRecorder = null;
      this.audioChunks = [];

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

  async uploadAudioChunk(chunk: Blob, sosAlertId: string, chunkNumber: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[Audio Service] User not authenticated');
        return false;
      }

      const fileName = `${user.id}/${sosAlertId}_chunk_${chunkNumber}_${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from('sos-audio-recordings')
        .upload(fileName, chunk, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Audio Service] Chunk upload error:', uploadError);
        return false;
      }

      // Save chunk metadata to database
      const { error: dbError } = await supabase
        .from('sos_audio_recordings')
        .insert({
          sos_alert_id: sosAlertId,
          user_id: user.id,
          storage_path: fileName,
          duration_seconds: 5, // Approximate chunk duration
          file_size_bytes: chunk.size,
          mime_type: 'audio/webm',
          is_processing: false,
        });

      if (dbError) {
        console.error('[Audio Service] Chunk database error:', dbError);
      }

      // Notify emergency contacts about new audio chunk
      await this.notifyEmergencyContactsOfNewAudio(sosAlertId, fileName);

      console.log(`[Audio Service] Chunk ${chunkNumber} uploaded and contacts notified`);
      return true;
    } catch (error) {
      console.error('[Audio Service] Error uploading audio chunk:', error);
      return false;
    }
  }

  async notifyEmergencyContactsOfNewAudio(sosAlertId: string, audioPath: string): Promise<void> {
    try {
      // Get emergency contacts for this SOS alert
      const { data: sosAlert } = await supabase
        .from('sos_alerts')
        .select('user_id')
        .eq('id', sosAlertId)
        .maybeSingle();

      if (!sosAlert) return;

      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('contact_user_id')
        .eq('user_id', sosAlert.user_id)
        .eq('is_active', true);

      if (!contacts || contacts.length === 0) return;

      // Get signed URL for audio
      const { data: urlData } = await supabase.storage
        .from('sos-audio-recordings')
        .createSignedUrl(audioPath, 3600);

      if (!urlData?.signedUrl) return;

      // Create chat messages for each emergency contact
      for (const contact of contacts) {
        if (!contact.contact_user_id) continue;

        // Find or create conversation
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`participant1.eq.${sosAlert.user_id},participant2.eq.${sosAlert.user_id}`)
          .or(`participant1.eq.${contact.contact_user_id},participant2.eq.${contact.contact_user_id}`)
          .limit(1);

        let conversationId: string;

        if (conversations && conversations.length > 0) {
          conversationId = conversations[0].id;
        } else {
          // Create new conversation
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              participant1: sosAlert.user_id,
              participant2: contact.contact_user_id,
            })
            .select('id')
            .maybeSingle();

          if (convError || !newConv) {
            console.error('[Audio Service] Error creating conversation:', convError);
            continue;
          }
          conversationId = newConv.id;
        }

        // Send audio message
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: sosAlert.user_id,
            content: `[SOS AUDIO] Registrazione audio di emergenza`,
            message_type: 'audio',
            audio_url: urlData.signedUrl,
          });
      }

      console.log('[Audio Service] Emergency contacts notified of new audio');
    } catch (error) {
      console.error('[Audio Service] Error notifying emergency contacts:', error);
    }
  }
}

export const audioRecordingService = new AudioRecordingService();
