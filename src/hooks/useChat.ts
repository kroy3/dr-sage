import { useCallback } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useUserStore } from '@/stores/useUserStore';
import { streamMessage } from '@/services/anthropic';
import { buildSystemPrompt } from '@/services/systemPrompt';

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

  const profile = useUserStore((s) => s.profile);

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim() || isStreaming) return;

      try {
        setError(null);

        // Auto-create session if none exists
        let sessionId = currentSessionId;
        if (!sessionId) {
          sessionId = await createSession();
        }

        // Add user message
        await addMessage('user', text.trim());

        // Build system prompt with user context
        const systemPrompt = buildSystemPrompt({
          userName: profile.name,
          userGoals: profile.goals || [],
          recentMoods: [],
          communicationStyle: profile.communicationStyle,
        });

        // Prepare conversation history for the API
        const conversationMessages = [
          ...useChatStore.getState().messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ];

        // Start streaming
        setStreaming(true);
        clearStreamingText();

        let fullResponse = '';

        await streamMessage(
          conversationMessages,
          systemPrompt,
          (chunk: string) => {
            fullResponse += chunk;
            appendStreamingText(chunk);
          }
        );

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
      profile,
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
