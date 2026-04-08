import * as SQLite from 'expo-sqlite';
import type { Message, ChatSession, KnowledgeReference } from '@/types/chat';
import type { MoodEntry, MoodTag } from '@/types/mood';

const DB_NAME = 'drsage.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Open (or reuse) the database handle.
 */
function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Create all required tables if they do not already exist.
 * Call this once at app startup.
 */
export async function initDatabase(): Promise<void> {
  const database = getDb();

  database.execSync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      summary TEXT,
      mood_at_start INTEGER
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      references_json TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY NOT NULL,
      level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 5),
      note TEXT,
      tags_json TEXT,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_mood_timestamp ON mood_entries(timestamp);
    CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at);
  `);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createSession(session: ChatSession): Promise<void> {
  const database = getDb();
  database.runSync(
    `INSERT INTO sessions (id, title, created_at, updated_at, summary, mood_at_start)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.title,
      session.createdAt,
      session.updatedAt,
      session.summary ?? null,
      session.moodAtStart ?? null,
    ],
  );
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<ChatSession, 'title' | 'summary' | 'updatedAt'>>,
): Promise<void> {
  const database = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) {
    sets.push('title = ?');
    values.push(updates.title);
  }
  if (updates.summary !== undefined) {
    sets.push('summary = ?');
    values.push(updates.summary);
  }
  if (updates.updatedAt !== undefined) {
    sets.push('updated_at = ?');
    values.push(updates.updatedAt);
  }

  if (sets.length === 0) return;

  values.push(sessionId);
  database.runSync(
    `UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`,
    values as SQLite.SQLiteBindParams,
  );
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const database = getDb();
  const row = database.getFirstSync<SessionRow>(
    'SELECT * FROM sessions WHERE id = ?',
    [sessionId],
  );
  if (!row) return null;

  const messageCount = database.getFirstSync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM messages WHERE session_id = ?',
    [sessionId],
  );

  return mapSessionRow(row, messageCount?.cnt ?? 0);
}

export async function getRecentSessions(limit: number = 20): Promise<ChatSession[]> {
  const database = getDb();
  const rows = database.getAllSync<SessionRow>(
    'SELECT * FROM sessions ORDER BY updated_at DESC LIMIT ?',
    [limit],
  );

  return rows.map((row) => {
    const messageCount = database.getFirstSync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM messages WHERE session_id = ?',
      [row.id],
    );
    return mapSessionRow(row, messageCount?.cnt ?? 0);
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  const database = getDb();
  database.runSync('DELETE FROM messages WHERE session_id = ?', [sessionId]);
  database.runSync('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function addMessage(message: Message): Promise<void> {
  const database = getDb();
  database.runSync(
    `INSERT INTO messages (id, session_id, role, content, timestamp, references_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.sessionId,
      message.role,
      message.content,
      message.timestamp,
      message.references ? JSON.stringify(message.references) : null,
    ],
  );
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const database = getDb();
  const rows = database.getAllSync<MessageRow>(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
    [sessionId],
  );
  return rows.map(mapMessageRow);
}

// ---------------------------------------------------------------------------
// Mood Entries
// ---------------------------------------------------------------------------

export async function addMoodEntry(entry: MoodEntry): Promise<void> {
  const database = getDb();
  database.runSync(
    `INSERT INTO mood_entries (id, level, note, tags_json, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.level,
      entry.note ?? null,
      JSON.stringify(entry.tags),
      entry.timestamp,
    ],
  );
}

export async function updateMoodEntry(
  entryId: string,
  updates: Partial<Pick<MoodEntry, 'level' | 'note' | 'tags'>>,
): Promise<void> {
  const database = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.level !== undefined) {
    sets.push('level = ?');
    values.push(updates.level);
  }
  if (updates.note !== undefined) {
    sets.push('note = ?');
    values.push(updates.note);
  }
  if (updates.tags !== undefined) {
    sets.push('tags_json = ?');
    values.push(JSON.stringify(updates.tags));
  }

  if (sets.length === 0) return;

  values.push(entryId);
  database.runSync(
    `UPDATE mood_entries SET ${sets.join(', ')} WHERE id = ?`,
    values as SQLite.SQLiteBindParams,
  );
}

export async function deleteMoodEntry(entryId: string): Promise<void> {
  const database = getDb();
  database.runSync('DELETE FROM mood_entries WHERE id = ?', [entryId]);
}

export async function getMoodEntries(
  fromDate: number,
  toDate: number,
): Promise<MoodEntry[]> {
  const database = getDb();
  const rows = database.getAllSync<MoodRow>(
    'SELECT * FROM mood_entries WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
    [fromDate, toDate],
  );
  return rows.map(mapMoodRow);
}

export async function getAllMoodEntries(): Promise<MoodEntry[]> {
  const database = getDb();
  const rows = database.getAllSync<MoodRow>(
    'SELECT * FROM mood_entries ORDER BY timestamp DESC',
  );
  return rows.map(mapMoodRow);
}

/**
 * Return the number of consecutive days (ending today) that have at least one
 * mood entry logged.
 */
export async function getMoodStreak(): Promise<number> {
  const database = getDb();
  const rows = database.getAllSync<{ day_str: string }>(
    `SELECT DISTINCT date(timestamp / 1000, 'unixepoch', 'localtime') as day_str
     FROM mood_entries
     ORDER BY day_str DESC`,
  );

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);

    if (rows[i].day_str === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ---------------------------------------------------------------------------
// Danger Zone
// ---------------------------------------------------------------------------

/**
 * Wipe all local data. This is irreversible.
 */
export async function clearAllData(): Promise<void> {
  const database = getDb();
  database.execSync(`
    DELETE FROM messages;
    DELETE FROM sessions;
    DELETE FROM mood_entries;
  `);
}

// ---------------------------------------------------------------------------
// Row types & mappers (internal)
// ---------------------------------------------------------------------------

interface SessionRow {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  summary: string | null;
  mood_at_start: number | null;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: number;
  references_json: string | null;
}

interface MoodRow {
  id: string;
  level: number;
  note: string | null;
  tags_json: string | null;
  timestamp: number;
}

function mapSessionRow(row: SessionRow, messageCount: number): ChatSession {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount,
    summary: row.summary ?? undefined,
    moodAtStart: row.mood_at_start ?? undefined,
  };
}

function mapMessageRow(row: MessageRow): Message {
  let references: KnowledgeReference[] | undefined;
  if (row.references_json) {
    try {
      references = JSON.parse(row.references_json);
    } catch {
      references = undefined;
    }
  }
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    timestamp: row.timestamp,
    references,
  };
}

function mapMoodRow(row: MoodRow): MoodEntry {
  let tags: MoodTag[] = [];
  if (row.tags_json) {
    try {
      tags = JSON.parse(row.tags_json);
    } catch {
      tags = [];
    }
  }
  return {
    id: row.id,
    level: row.level as MoodEntry['level'],
    note: row.note ?? undefined,
    tags,
    timestamp: row.timestamp,
  };
}
