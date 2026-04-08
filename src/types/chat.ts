export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  references?: KnowledgeReference[];
}

export interface KnowledgeReference {
  termId: string;
  termName: string;
  category: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  summary?: string;
  moodAtStart?: number;
}
