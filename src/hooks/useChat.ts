import { useCallback } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { checkCrisis, retrieveContext, streamLocalReply } from '@/services/localCouncil';
import { hasGroqKey, streamChatCompletion, type ChatMessage } from '@/services/groq';

const SYSTEM_PROMPT_BASE = `You are Dr. Sage, a warm, calm, and grounded mental wellbeing companion.

Your style:
- Concise. Reply in 2-5 short sentences unless the user asks for more depth.
- Validate the user's feelings before offering ideas.
- Use plain, conversational language. No clinical jargon unless asked.
- Never diagnose. Suggest professional help when the situation calls for it.
- If the user is in crisis or talks about self-harm, gently urge them to contact a hotline.

You are given excerpts from a curated mental-health knowledge base below. Ground your reply in those excerpts when they are relevant. If they are not relevant, answer from general supportive knowledge but stay within wellbeing topics. Do not invent statistics, references, or hotline numbers.`;

function buildSystemPrompt(context: string): string {
  if (!context) return SYSTEM_PROMPT_BASE;
  return `${SYSTEM_PROMPT_BASE}\n\n--- KNOWLEDGE BASE EXCERPTS ---\n${context}\n--- END EXCERPTS ---`;
}

export function useChat() {
  const {
    currentSessionId,
    messages,
    isStreaming,
    streamingText,
    error,
    createSession,
    addMessage,
    setStreaming,
    appendStreamingText,
    clearStreamingText,
    setError,
    endSession,
  } = useChatStore();

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const userText = text.trim();
      if (!userText || isStreaming) return;

      try {
        setError(null);

        // Auto-create session if none exists
        let sessionId = currentSessionId;
        if (!sessionId) {
          sessionId = await createSession();
        }

        // Add user message
        await addMessage('user', userText);

        // Start streaming
        setStreaming(true);
        clearStreamingText();

        let fullResponse = '';

        // 1) Crisis short-circuit — never go to LLM for self-harm messages.
        const crisis = checkCrisis(userText);
        if (crisis) {
          fullResponse = crisis;
          for (const word of crisis.split(/(\s+)/)) {
            appendStreamingText(word);
            await new Promise((r) => setTimeout(r, 12));
          }
        } else if (hasGroqKey()) {
          // 2) Retrieve KB grounding for the LLM.
          const { context } = retrieveContext(userText, 3);
          const systemPrompt = buildSystemPrompt(context);

          const history: ChatMessage[] = useChatStore
            .getState()
            .messages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }));

          fullResponse = await streamChatCompletion(
            history,
            systemPrompt,
            (chunk: string) => {
              appendStreamingText(chunk);
            },
          );
        } else {
          // 3) No Groq key — fall back to fully offline retrieval reply.
          await streamLocalReply(userText, (chunk: string) => {
            fullResponse += chunk;
            appendStreamingText(chunk);
          });
        }

        // Save assistant response
        clearStreamingText();
        await addMessage('assistant', fullResponse);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
      } finally {
        setStreaming(false);
        clearStreamingText();
      }
    },
    [
      currentSessionId,
      isStreaming,
      createSession,
      addMessage,
      setStreaming,
      appendStreamingText,
      clearStreamingText,
      setError,
    ]
  );

  return {
    messages,
    isStreaming,
    streamingText,
    error,
    currentSessionId,
    sendMessage,
    endSession,
  };
}
