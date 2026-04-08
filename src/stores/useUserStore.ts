import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, UserPreferences, CommunicationStyle, ThemePreference } from '@/types/user';

interface UserState {
  profile: UserProfile;
  preferences: UserPreferences;
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  completeOnboarding: () => void;
  giveConsent: () => void;
  resetUser: () => void;
}

const defaultProfile: UserProfile = {
  name: '',
  goals: [],
  communicationStyle: 'empathetic',
  onboardingComplete: false,
  consentGiven: false,
  consentTimestamp: undefined,
};

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notificationsEnabled: false,
  dailyCheckInTime: '09:00',
  weeklyReportEnabled: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: { ...defaultProfile },
      preferences: { ...defaultPreferences },

      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),

      completeOnboarding: () =>
        set((state) => ({
          profile: { ...state.profile, onboardingComplete: true },
        })),

      giveConsent: () =>
        set((state) => ({
          profile: {
            ...state.profile,
            consentGiven: true,
            consentTimestamp: Date.now(),
          },
        })),

      resetUser: () =>
        set({
          profile: { ...defaultProfile },
          preferences: { ...defaultPreferences },
        }),
    }),
    {
      name: 'dr-sage-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
