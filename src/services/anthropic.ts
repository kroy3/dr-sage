import Anthropic from '@anthropic-ai/sdk';
import * as SecureStore from 'expo-secure-store';
import { API_RETRY_COUNT, API_RETRY_DELAY_MS } from '@/constants/config';

const SECURE_STORE_KEY = 'anthropic_api_key';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

let clientInstance: Anthropic | null = null;

/**
 * Retrieve the API key from secure storage, falling back to the
 * EXPO_PUBLIC_ANTHROPIC_API_KEY environment variable.
 */
export async function getApiKey(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (stored) return stored;
  } catch {
    // SecureStore may not be available (e.g. on web) -- fall through
  }
  return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? null;
}

/**
 * Persist an API key in secure storage and reset the cached client so the
 * next call picks up the new key.
 */
export async function setApiKey(key: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, key);
  } catch {
    // Fail silently on platforms where SecureStore is unavailable
  }
  clientInstance = null;
}

/**
 * Check whether an API key is available from any source.
 */
export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return key !== null && key.length > 0;
}

/**
 * Return (or lazily create) a singleton Anthropic client.
 */
async function getClient(): Promise<Anthropic> {
  if (clientInstance) return clientInstance;

  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error(
      'No Anthropic API key found. Please set one in Settings or provide EXPO_PUBLIC_ANTHROPIC_API_KEY.',
    );
  }

  clientInstance = new Anthropic({ apiKey });
  return clientInstance;
}

/**
 * Sleep helper for exponential back-off.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine whether an error is transient and worth retrying.
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    // 429 rate-limited, 500+ server errors, 408 timeout, 409 overloaded
    return [408, 409, 429, 500, 502, 503, 504].includes(error.status);
  }
  // Network failures (fetch throws TypeError for network issues)
  if (error instanceof TypeError) return true;
  return false;
}

/**
 * Format the messages array into the shape the Anthropic SDK expects.
 */
function formatMessages(
  messages: Array<{ role: string; content: string }>,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}

/**
 * Send a non-streaming message to Claude and return the full response text.
 * Retries up to API_RETRY_COUNT times with exponential back-off on transient errors.
 */
export async function sendMessage(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
): Promise<string> {
  const client = await getClient();
  const formatted = formatMessages(messages);

  let lastError: unknown;

  for (let attempt = 0; attempt < API_RETRY_COUNT; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: formatted,
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      return textBlock ? textBlock.text : '';
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === API_RETRY_COUNT - 1) {
        break;
      }

      const delay = API_RETRY_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw normalizeError(lastError);
}

/**
 * Stream a message from Claude, invoking `onChunk` for each piece of text as
 * it arrives.  Returns the fully-assembled response when the stream completes.
 * Retries the entire stream on transient failures.
 */
export async function streamMessage(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const client = await getClient();
  const formatted = formatMessages(messages);

  let lastError: unknown;

  for (let attempt = 0; attempt < API_RETRY_COUNT; attempt++) {
    try {
      let fullText = '';

      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: formatted,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const chunk = event.delta.text;
          fullText += chunk;
          onChunk(chunk);
        }
      }

      return fullText;
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === API_RETRY_COUNT - 1) {
        break;
      }

      const delay = API_RETRY_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw normalizeError(lastError);
}

/**
 * Turn an unknown error into a readable Error instance.
 */
function normalizeError(error: unknown): Error {
  if (error instanceof Anthropic.APIError) {
    if (error.status === 401) {
      // Invalidate cached client so the user can supply a new key
      clientInstance = null;
      return new Error(
        'Invalid API key. Please update your key in Settings.',
      );
    }
    if (error.status === 429) {
      return new Error(
        'Rate limit reached. Please wait a moment and try again.',
      );
    }
    return new Error(`API error (${error.status}): ${error.message}`);
  }

  if (error instanceof TypeError) {
    return new Error(
      'Network error. Please check your internet connection and try again.',
    );
  }

  if (error instanceof Error) return error;
  return new Error('An unexpected error occurred while contacting Dr. Sage.');
}
