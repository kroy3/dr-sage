export const APP_NAME = 'Virtual Counselor';
export const COUNSELOR_NAME = 'Dr. Sage';

// Chat limits
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CONTEXT_MESSAGES = 20;
export const MAX_SESSIONS_STORED = 50;
export const MESSAGE_DEBOUNCE_MS = 300;

// Scheduling
export const DEFAULT_CHECK_IN_HOUR = 9; // 9 AM
export const WEEKLY_REPORT_DAY = 0; // Sunday

// API / network
export const API_RETRY_COUNT = 3;
export const API_RETRY_DELAY_MS = 1000;
export const API_TIMEOUT_MS = 30000;

// Mood tracking
export const MIN_MOOD_LEVEL = 1;
export const MAX_MOOD_LEVEL = 5;
export const MAX_MOOD_NOTE_LENGTH = 500;
export const MAX_MOOD_TAGS = 5;

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: '@vc_user_profile',
  USER_PREFERENCES: '@vc_user_preferences',
  CHAT_SESSIONS: '@vc_chat_sessions',
  MOOD_ENTRIES: '@vc_mood_entries',
  ONBOARDING_COMPLETE: '@vc_onboarding_complete',
} as const;

// Animation durations (ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Disclaimer shown at app start
export const DISCLAIMER =
  'This app is not a substitute for professional mental health care. ' +
  'If you are in crisis, please contact a licensed professional or call emergency services.';
