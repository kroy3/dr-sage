import { MoodLevel } from '../types/mood';

export interface MoodEmojiConfig {
  emoji: string;
  label: string;
  color: string;
}

export const MOOD_EMOJIS: Record<MoodLevel, MoodEmojiConfig> = {
  1: { emoji: '😢', label: 'Terrible', color: '#E74C3C' },
  2: { emoji: '😟', label: 'Bad', color: '#E67E22' },
  3: { emoji: '😐', label: 'Okay', color: '#F1C40F' },
  4: { emoji: '🙂', label: 'Good', color: '#2ECC71' },
  5: { emoji: '😄', label: 'Great', color: '#27AE60' },
};
