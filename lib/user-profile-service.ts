type UserProfile = {
  fullName: string;
  phone: string;
  role: 'client' | 'bodyguard';
};

class UserProfileService {
  private profile: UserProfile | null = null;

  setProfile(profile: UserProfile) {
    this.profile = profile;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('userProfile', JSON.stringify(profile));
      } catch (error) {
        console.error('Error saving profile to localStorage:', error);
      }
    }
  }

  getProfile(): UserProfile | null {
    if (!this.profile && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('userProfile');
        if (stored) {
          this.profile = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error loading profile from localStorage:', error);
      }
    }
    return this.profile;
  }

  clearProfile() {
    this.profile = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('userProfile');
      } catch (error) {
        console.error('Error clearing profile from localStorage:', error);
      }
    }
  }

  getFullName(): string {
    return this.profile?.fullName || 'Cliente';
  }

  getPhone(): string {
    return this.profile?.phone || '';
  }

  getRole(): 'client' | 'bodyguard' | null {
    return this.profile?.role || null;
  }
}

export const userProfileService = new UserProfileService();
