import { supabase } from './supabase';

export type UserProfile = {
  id: string;
  full_name: string;
  phone: string;
  role: 'client' | 'bodyguard';
  date_of_birth?: string;
  address?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  experience_years?: number;
  specializations?: string[];
  languages?: string[];
  hourly_rate?: number;
  vehicle_available?: boolean;
  vehicle_type?: string;
  bio?: string;
  certifications?: string[];
  profile_completed: boolean;
  created_at?: string;
  updated_at?: string;
};

class UserProfileService {
  private cachedProfile: UserProfile | null = null;

  async signUpWithPhone(phone: string): Promise<{ error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing up with phone:', error);
      return { error: error as Error };
    }
  }

  async verifyOtp(phone: string, token: string): Promise<{ error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms',
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { error: error as Error };
    }
  }

  async createProfile(userId: string, data: Partial<UserProfile>): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          profile_completed: false,
        });

      if (error) throw error;
      this.cachedProfile = null;
      return { error: null };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { error: error as Error };
    }
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) throw error;
      this.cachedProfile = null;
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error as Error };
    }
  }

  async getProfile(userId?: string): Promise<UserProfile | null> {
    try {
      let targetUserId = userId;

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        targetUserId = user.id;
      }

      if (this.cachedProfile && this.cachedProfile.id === targetUserId) {
        return this.cachedProfile;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (error) throw error;

      this.cachedProfile = data;
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async signOut() {
    try {
      await supabase.auth.signOut();
      this.cachedProfile = null;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  clearCache() {
    this.cachedProfile = null;
  }

  getFullName(): string {
    return this.cachedProfile?.full_name || 'Utente';
  }

  getPhone(): string {
    return this.cachedProfile?.phone || '';
  }

  getRole(): 'client' | 'bodyguard' | null {
    return this.cachedProfile?.role || null;
  }
}

export const userProfileService = new UserProfileService();
