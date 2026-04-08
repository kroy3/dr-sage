import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppStats {
  totalSessions: number;
  totalMessages: number;
  averageSessionLengthMs: number;
  moodEntriesCount: number;
  averageMood: number | null;
  moodTrend: MoodTrendPoint[];
  featureUsage: Record<string, number>;
  firstUsedAt: number | null;
  lastUsedAt: number | null;
}

export interface MoodTrendPoint {
  date: string; // YYYY-MM-DD
  average: number;
  count: number;
}

interface AnalyticsEvent {
  name: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

interface AnalyticsStore {
  events: AnalyticsEvent[];
  sessions: SessionRecord[];
  moodPoints: MoodPoint[];
  featureUsage: Record<string, number>;
  firstUsedAt: number | null;
}

interface SessionRecord {
  sessionId: string;
  startedAt: number;
  endedAt: number | null;
  messageCount: number;
}

interface MoodPoint {
  level: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Storage key & helpers
// ---------------------------------------------------------------------------

const ANALYTICS_KEY = '@vc_analytics';
const MAX_EVENTS = 500; // keep the store from growing unbounded

async function loadStore(): Promise<AnalyticsStore> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
    if (raw) return JSON.parse(raw) as AnalyticsStore;
  } catch {
    // corrupted or missing -- start fresh
  }
  return {
    events: [],
    sessions: [],
    moodPoints: [],
    featureUsage: {},
    firstUsedAt: null,
  };
}

async function saveStore(store: AnalyticsStore): Promise<void> {
  try {
    // Trim old events to keep storage bounded
    if (store.events.length > MAX_EVENTS) {
      store.events = store.events.slice(-MAX_EVENTS);
    }
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(store));
  } catch {
    // Silently ignore storage errors -- analytics are non-critical
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record a named event with optional structured data.
 *
 * Well-known event names:
 * - "session_start"   { sessionId }
 * - "session_end"     { sessionId }
 * - "message_sent"    { sessionId }
 * - "message_received" { sessionId }
 * - "mood_logged"     { level, tags }
 * - "feature_used"    { feature }
 * - "api_error"       { error }
 */
export function trackEvent(
  name: string,
  data?: Record<string, unknown>,
): void {
  // Fire-and-forget -- callers should not need to await analytics
  void trackEventAsync(name, data);
}

async function trackEventAsync(
  name: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const store = await loadStore();
  const now = Date.now();

  if (store.firstUsedAt === null) {
    store.firstUsedAt = now;
  }

  store.events.push({ name, timestamp: now, data });

  // ---------- Derived metrics ----------

  // Feature usage counter
  const featureName = data?.feature as string | undefined;
  if (name === 'feature_used' && featureName) {
    store.featureUsage[featureName] =
      (store.featureUsage[featureName] ?? 0) + 1;
  }

  // Session tracking
  if (name === 'session_start' && data?.sessionId) {
    store.sessions.push({
      sessionId: data.sessionId as string,
      startedAt: now,
      endedAt: null,
      messageCount: 0,
    });
  }

  if (name === 'session_end' && data?.sessionId) {
    const session = store.sessions.find(
      (s) => s.sessionId === data.sessionId && s.endedAt === null,
    );
    if (session) session.endedAt = now;
  }

  if (
    (name === 'message_sent' || name === 'message_received') &&
    data?.sessionId
  ) {
    const session = store.sessions.find(
      (s) => s.sessionId === data.sessionId,
    );
    if (session) session.messageCount++;
  }

  // Mood points
  if (name === 'mood_logged' && typeof data?.level === 'number') {
    store.moodPoints.push({ level: data.level, timestamp: now });
  }

  await saveStore(store);
}

/**
 * Return aggregated statistics about app usage.
 */
export async function getStats(): Promise<AppStats> {
  const store = await loadStore();

  const totalSessions = store.sessions.length;
  const totalMessages = store.sessions.reduce(
    (sum, s) => sum + s.messageCount,
    0,
  );

  // Average session length (only for completed sessions)
  const completed = store.sessions.filter((s) => s.endedAt !== null);
  const averageSessionLengthMs =
    completed.length > 0
      ? completed.reduce((sum, s) => sum + (s.endedAt! - s.startedAt), 0) /
        completed.length
      : 0;

  // Mood stats
  const moodEntriesCount = store.moodPoints.length;
  const averageMood =
    moodEntriesCount > 0
      ? store.moodPoints.reduce((sum, m) => sum + m.level, 0) /
        moodEntriesCount
      : null;

  // Mood trend grouped by day
  const moodTrend = computeMoodTrend(store.moodPoints);

  const lastEvent = store.events[store.events.length - 1];

  return {
    totalSessions,
    totalMessages,
    averageSessionLengthMs,
    moodEntriesCount,
    averageMood,
    moodTrend,
    featureUsage: { ...store.featureUsage },
    firstUsedAt: store.firstUsedAt,
    lastUsedAt: lastEvent?.timestamp ?? null,
  };
}

/**
 * Erase all analytics data.
 */
export async function clearAnalytics(): Promise<void> {
  await AsyncStorage.removeItem(ANALYTICS_KEY);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeMoodTrend(points: MoodPoint[]): MoodTrendPoint[] {
  if (points.length === 0) return [];

  const grouped = new Map<string, number[]>();

  for (const p of points) {
    const dateStr = new Date(p.timestamp).toISOString().slice(0, 10);
    const existing = grouped.get(dateStr);
    if (existing) {
      existing.push(p.level);
    } else {
      grouped.set(dateStr, [p.level]);
    }
  }

  const trend: MoodTrendPoint[] = [];
  for (const [date, levels] of grouped) {
    const average = levels.reduce((a, b) => a + b, 0) / levels.length;
    trend.push({
      date,
      average: Math.round(average * 100) / 100,
      count: levels.length,
    });
  }

  trend.sort((a, b) => a.date.localeCompare(b.date));
  return trend;
}
