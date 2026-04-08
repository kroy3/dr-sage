import { create } from 'zustand';
import type { Message, ChatSession } from '@/types/chat';
import {
  createSession as insertSession,
  getSessionMessages,
  addMessage as insertMessage,
  getRecentSessions,
  deleteSession as deleteSessionFromDb,
} from '@/services/storage';

interface ChatState {
  currentSessionId: string | null;
  messages: Message[];
  sessions: ChatSession[];
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
  // Actions
  createSession: (moodAtStart?: number) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  addMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  setStreaming: (streaming: boolean) => void;
  appendStreamingText: (text: string) => void;
  clearStreamingText: () => void;
  setError: (error: string | null) => void;
  loadSessions: () => Promise<void>;
  endSession: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export const useChatStore = create<ChatState>()((set, get) => ({
  currentSessionId: null,
  messages: [],
  sessions: [],
  isStreaming: false,
  streamingText: '',
  error: null,

  createSession: async (moodAtStart?: number) => {
    const id = generateId();
    const now = Date.now();
    const session: ChatSession = {
      id,
      title: 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      moodAtStart,
    };

    try {
      await insertSession(session);
      set((state) => ({
        currentSessionId: id,
        messages: [],
        sessions: [session, ...state.sessions],
        error: null,
      }));
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      set({ error: message });
      throw err;
    }
  },

  loadSession: async (sessionId: string) => {
    try {
      const messages = await getSessionMessages(sessionId);
      set({
        currentSessionId: sessionId,
        messages,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session';
      set({ error: message });
    }
  },

  addMessage: async (role: 'user' | 'assistant', content: string) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    const msg: Message = {
      id: generateId(),
      sessionId: currentSessionId,
      role,
      content,
      timestamp: Date.now(),
    };

    try {
      await insertMessage(msg);
      set((state) => ({
        messages: [...state.messages, msg],
        sessions: state.sessions.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                updatedAt: msg.timestamp,
                messageCount: s.messageCount + 1,
                title:
                  role === 'user' && s.messageCount === 0
                    ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
                    : s.title,
              }
            : s
        ),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add message';
      set({ error: message });
    }
  },

  setStreaming: (streaming: boolean) => set({ isStreaming: streaming }),

  appendStreamingText: (text: string) =>
    set((state) => ({ streamingText: state.streamingText + text })),

  clearStreamingText: () => set({ streamingText: '' }),

  setError: (error: string | null) => set({ error }),

  loadSessions: async () => {
    try {
      const sessions = await getRecentSessions();
      set({ sessions, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sessions';
      set({ error: message });
    }
  },

  endSession: () =>
    set({
      currentSessionId: null,
      messages: [],
      streamingText: '',
      isStreaming: false,
    }),

  deleteSession: async (sessionId: string) => {
    try {
      await deleteSessionFromDb(sessionId);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        ...(state.currentSessionId === sessionId
          ? { currentSessionId: null, messages: [] }
          : {}),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      set({ error: message });
    }
  },
}));
