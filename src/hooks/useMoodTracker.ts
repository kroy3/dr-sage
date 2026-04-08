import { useMemo, useEffect } from 'react';
import { useMoodStore } from '@/stores/useMoodStore';
import type { MoodLevel, MoodTag } from '@/types/mood';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function useMoodTracker() {
  const {
    entries,
    currentStreak,
    isLoading,
    logMood: storeMoodLog,
    loadEntries,
    getWeeklyAverage,
    getTodaysMood,
    loadStreak,
  } = useMoodStore();

  // Load data on mount
  useEffect(() => {
    loadEntries(30);
    loadStreak();
  }, [loadEntries, loadStreak]);

  const logMood = async (
    level: MoodLevel,
    note?: string,
    tags?: MoodTag[]
  ): Promise<void> => {
    await storeMoodLog(level, note, tags);
  };

  // Weekly chart data: average mood per day for the last 7 days
  const weeklyData = useMemo(() => {
    const now = new Date();
    const result: { day: string; average: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayEntries = entries.filter(
        (e) => e.timestamp >= dayStart && e.timestamp < dayEnd
      );

      const average =
        dayEntries.length > 0
          ? Math.round(
              (dayEntries.reduce((sum, e) => sum + e.level, 0) /
                dayEntries.length) *
                10
            ) / 10
          : 0;

      result.push({
        day: DAY_NAMES[date.getDay()],
        average,
      });
    }

    return result;
  }, [entries]);

  // Monthly data for calendar view: map of "YYYY-MM-DD" to average mood
  const monthlyData = useMemo(() => {
    const map: Record<string, { average: number; count: number }> = {};

    for (const entry of entries) {
      const date = new Date(entry.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!map[key]) {
        map[key] = { average: entry.level, count: 1 };
      } else {
        const existing = map[key];
        existing.average =
          (existing.average * existing.count + entry.level) /
          (existing.count + 1);
        existing.count += 1;
      }
    }

    return Object.entries(map).map(([date, data]) => ({
      date,
      average: Math.round(data.average * 10) / 10,
      count: data.count,
    }));
  }, [entries]);

  const todayLogged = getTodaysMood() !== null;

  return {
    entries,
    isLoading,
    logMood,
    weeklyData,
    monthlyData,
    streak: currentStreak,
    todayLogged,
    weeklyAverage: getWeeklyAverage(),
    todaysMood: getTodaysMood(),
  };
}
