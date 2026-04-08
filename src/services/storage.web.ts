import type { Message, ChatSession, KnowledgeReference } from '@/types/chat';
import type { MoodEntry, MoodTag } from '@/types/mood';

// Web fallback for storage.ts — uses localStorage instead of expo-sqlite,
// which is native-only. Same public API as the native implementation.

const SESSIONS_KEY = 'drsage:sessions';
const MESSAGES_KEY = 'drsage:messages';
const MOODS_KEY = 'drsage:moods';

interface StoredSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  summary?: string;
  moodAtStart?: number;
}

function read<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export async function initDatabase(): Promise<void> {
  // No-op on web; localStorage needs no schema.
}

// ---------------- Sessions ----------------

export async function createSession(session: ChatSession): Promise<void> {
  const sessions = read<StoredSession>(SESSIONS_KEY);
  sessions.push({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    summary: session.summary,
    moodAtStart: session.moodAtStart,
  });
  write(SESSIONS_KEY, sessions);
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<ChatSession, 'title' | 'summary' | 'updatedAt'>>,
): Promise<void> {
  const sessions = read<StoredSession>(SESSIONS_KEY);
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return;
  sessions[idx] = { ...sessions[idx], ...updates };
  write(SESSIONS_KEY, sessions);
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const sessions = read<StoredSession>(SESSIONS_KEY);
  const s = sessions.find((x) => x.id === sessionId);
  if (!s) return null;
  const messages = read<Message>(MESSAGES_KEY).filter((m) => m.sessionId === sessionId);
  return { ...s, messageCount: messages.length };
}

export async function getRecentSessions(limit: number = 20): Promise<ChatSession[]> {
  const sessions = read<StoredSession>(SESSIONS_KEY)
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
  const allMessages = read<Message>(MESSAGES_KEY);
  return sessions.map((s) => ({
    ...s,
    messageCount: allMessages.filter((m) => m.sessionId === s.id).length,
  }));
}

export async function deleteSession(sessionId: string): Promise<void> {
  write(
    SESSIONS_KEY,
    read<StoredSession>(SESSIONS_KEY).filter((s) => s.id !== sessionId),
  );
  write(
    MESSAGES_KEY,
    read<Message>(MESSAGES_KEY).filter((m) => m.sessionId !== sessionId),
  );
}

// ---------------- Messages ----------------

export async function addMessage(message: Message): Promise<void> {
  const messages = read<Message>(MESSAGES_KEY);
  messages.push(message);
  write(MESSAGES_KEY, messages);
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  return read<Message>(MESSAGES_KEY)
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => a.timestamp - b.timestamp);
}

// ---------------- Mood Entries ----------------

export async function addMoodEntry(entry: MoodEntry): Promise<void> {
  const moods = read<MoodEntry>(MOODS_KEY);
  moods.push(entry);
  write(MOODS_KEY, moods);
}

export async function updateMoodEntry(
  entryId: string,
  updates: Partial<Pick<MoodEntry, 'level' | 'note' | 'tags'>>,
): Promise<void> {
  const moods = read<MoodEntry>(MOODS_KEY);
  const idx = moods.findIndex((m) => m.id === entryId);
  if (idx === -1) return;
  moods[idx] = { ...moods[idx], ...updates };
  write(MOODS_KEY, moods);
}

export async function deleteMoodEntry(entryId: string): Promise<void> {
  write(
    MOODS_KEY,
    read<MoodEntry>(MOODS_KEY).filter((m) => m.id !== entryId),
  );
}

export async function getMoodEntries(
  fromDate: number,
  toDate: number,
): Promise<MoodEntry[]> {
  return read<MoodEntry>(MOODS_KEY)
    .filter((m) => m.timestamp >= fromDate && m.timestamp <= toDate)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function getAllMoodEntries(): Promise<MoodEntry[]> {
  return read<MoodEntry>(MOODS_KEY)
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function getMoodStreak(): Promise<number> {
  const moods = read<MoodEntry>(MOODS_KEY);
  if (moods.length === 0) return 0;

  const days = new Set<string>();
  for (const m of moods) {
    const d = new Date(m.timestamp);
    d.setHours(0, 0, 0, 0);
    days.add(d.toISOString().slice(0, 10));
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ---------------- Danger Zone ----------------

export async function clearAllData(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(MESSAGES_KEY);
  localStorage.removeItem(MOODS_KEY);
}
