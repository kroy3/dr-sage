export type CommunicationStyle = 'empathetic' | 'direct' | 'analytical' | 'motivational';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserProfile {
  name: string;
  goals: string[];
  communicationStyle: CommunicationStyle;
  onboardingComplete: boolean;
  consentGiven: boolean;
  consentTimestamp?: number;
}

export interface UserPreferences {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  dailyCheckInTime: string; // HH:mm format
  weeklyReportEnabled: boolean;
}
