export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type MoodTag =
  | 'anxious'
  | 'stressed'
  | 'lonely'
  | 'angry'
  | 'sad'
  | 'calm'
  | 'happy'
  | 'grateful'
  | 'motivated'
  | 'tired'
  | 'overwhelmed'
  | 'hopeful'
  | 'frustrated'
  | 'content'
  | 'confused';

export interface MoodEntry {
  id: string;
  level: MoodLevel;
  note?: string;
  tags: MoodTag[];
  timestamp: number;
}
