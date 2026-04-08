import { create } from 'zustand';
import type { MoodEntry, MoodLevel, MoodTag } from '@/types/mood';
import {
  addMoodEntry as insertMoodEntry,
  getMoodEntries,
  getMoodStreak,
} from '@/services/storage';

interface MoodState {
  entries: MoodEntry[];
  currentStreak: number;
  isLoading: boolean;
  // Actions
  logMood: (level: MoodLevel, note?: string, tags?: MoodTag[]) => Promise<void>;
  loadEntries: (days?: number) => Promise<void>;
  getWeeklyAverage: () => number;
  getTodaysMood: () => MoodEntry | null;
  loadStreak: () => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const useMoodStore = create<MoodState>()((set, get) => ({
  entries: [],
  currentStreak: 0,
  isLoading: false,

  logMood: async (level: MoodLevel, note?: string, tags?: MoodTag[]) => {
    const entry: MoodEntry = {
      id: generateId(),
      level,
      note,
      tags: tags ?? [],
      timestamp: Date.now(),
    };

    try {
      set({ isLoading: true });
      await insertMoodEntry(entry);
      set((state) => ({
        entries: [entry, ...state.entries],
        isLoading: false,
      }));
      // Refresh streak after logging
      await get().loadStreak();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loadEntries: async (days = 30) => {
    try {
      set({ isLoading: true });
      const fromDate = Date.now() - days * 24 * 60 * 60 * 1000;
      const entries = await getMoodEntries(fromDate, Date.now());
      set({ entries, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  getWeeklyAverage: () => {
    const { entries } = get();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekEntries = entries.filter((e) => e.timestamp >= oneWeekAgo);
    if (weekEntries.length === 0) return 0;
    const sum = weekEntries.reduce((acc, e) => acc + e.level, 0);
    return Math.round((sum / weekEntries.length) * 10) / 10;
  },

  getTodaysMood: () => {
    const { entries } = get();
    const todayStart = startOfDay(Date.now());
    return entries.find((e) => e.timestamp >= todayStart) ?? null;
  },

  loadStreak: async () => {
    try {
      const streak = await getMoodStreak();
      set({ currentStreak: streak });
    } catch {
      // Streak loading is non-critical; silently ignore
    }
  },
}));
