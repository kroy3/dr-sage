// Groq chat service. Uses Groq's OpenAI-compatible API via fetch — no SDK,
// works on web + native + Expo Go.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

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

/**
 * Send a chat completion to Groq and return the assistant's reply text.
 * Non-streaming for reliability across all platforms; the caller can chunk
 * the result client-side to keep the typing animation.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GroqError(
      'No Groq API key found. Set EXPO_PUBLIC_GROQ_API_KEY in .env and restart Expo.',
    );
  }

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.6,
    max_tokens: 700,
    stream: false,
  };

  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new GroqError('Network error reaching Groq. Check your internet connection.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const json = await response.json();
      detail = json?.error?.message || '';
    } catch {
      // ignore
    }
    if (response.status === 401) {
      throw new GroqError('Invalid Groq API key. Update EXPO_PUBLIC_GROQ_API_KEY.', 401);
    }
    if (response.status === 429) {
      throw new GroqError('Groq rate limit reached. Please wait a moment.', 429);
    }
    throw new GroqError(`Groq error (${response.status}): ${detail}`, response.status);
  }

  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content ?? '';
  return text;
}

/**
 * Convenience wrapper that streams the reply word-by-word to `onChunk` so the
 * UI's typing animation still feels alive.
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const fullText = await chatCompletion(messages, systemPrompt);

  const words = fullText.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 4) {
    onChunk(words.slice(i, i + 4).join(''));
    await new Promise((r) => setTimeout(r, 22));
  }
  return fullText;
}
