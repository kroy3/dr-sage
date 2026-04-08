// Groq chat service — OpenAI-compatible API via fetch.
// Works on web + native + Expo Go (no SDK, no native bindings).

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAIN_MODEL = 'llama-3.3-70b-versatile';
const FAST_MODEL = 'llama-3.1-8b-instant'; // used for summaries only

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GroqError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function getApiKey(): string | null {
  return process.env.EXPO_PUBLIC_GROQ_API_KEY ?? null;
}

export function hasGroqKey(): boolean {
  const k = getApiKey();
  return !!k && k.length > 10;
}

async function post(
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GroqError(
      'No Groq API key. Set EXPO_PUBLIC_GROQ_API_KEY in .env and restart Expo.',
    );
  }

  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.65,
        max_tokens: maxTokens,
        stream: false,
      }),
    });
  } catch {
    throw new GroqError('Network error. Check your internet connection.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const json = await response.json();
      detail = json?.error?.message || '';
    } catch {
      // ignore
    }
    if (response.status === 401) throw new GroqError('Invalid Groq API key.', 401);
    if (response.status === 429) throw new GroqError('Rate limit reached. Please wait a moment.', 429);
    throw new GroqError(`Groq error (${response.status}): ${detail}`, response.status);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content ?? '';
}

/**
 * Main chat completion — full 70B model for quality replies.
 * Streams word-by-word to keep the typing animation alive.
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const allMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];
  const fullText = await post(MAIN_MODEL, allMessages, 600);

  const words = fullText.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 4) {
    onChunk(words.slice(i, i + 4).join(''));
    await new Promise((r) => setTimeout(r, 20));
  }
  return fullText;
}

/**
 * Generate a concise session summary for cross-session memory.
 * Uses the smaller/faster model — quality not critical here.
 */
export async function generateSessionSummary(
  messages: ChatMessage[],
): Promise<string> {
  if (messages.length < 2) return '';

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Dr. Sage'}: ${m.content}`)
    .join('\n');

  const summaryMessages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a clinical notes assistant. Summarise the following therapy session in 3-5 bullet points. ' +
        'Focus on: the user\'s main concern, key emotions expressed, any decisions or situations discussed, ' +
        'progress or insights noted, and anything Dr. Sage should remember for next time. ' +
        'Be specific and factual. Do not interpret. Use plain language. No intro sentence.',
    },
    { role: 'user', content: transcript },
  ];

  try {
    return await post(FAST_MODEL, summaryMessages, 300);
  } catch {
    return '';
  }
}
