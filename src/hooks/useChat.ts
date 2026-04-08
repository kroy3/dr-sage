import { useCallback } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useUserStore } from '@/stores/useUserStore';
import { checkCrisis, retrieveContext, streamLocalReply } from '@/services/localCouncil';
import { hasGroqKey, streamChatCompletion, generateSessionSummary, type ChatMessage } from '@/services/groq';
import { updateSession } from '@/services/storage';

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(opts: {
  userName: string;
  goals: string[];
  style: string;
  pastSummaries: string[];
  kbContext: string;
}): string {
  const name = opts.userName ? `The user's name is ${opts.userName}.` : '';
  const goals =
    opts.goals.length > 0
      ? `Their stated goals are: ${opts.goals.join(', ')}.`
      : '';
  const style = opts.style
    ? `They prefer a ${opts.style} communication style.`
    : '';

  const memoryBlock =
    opts.pastSummaries.length > 0
      ? `\n\n--- MEMORY FROM PAST SESSIONS ---\n${opts.pastSummaries
          .map((s, i) => `Session ${i + 1}:\n${s}`)
          .join('\n\n')}\n--- END MEMORY ---`
      : '';

  const kbBlock = opts.kbContext
    ? `\n\n--- RELEVANT KNOWLEDGE BASE ---\n${opts.kbContext}\n--- END KNOWLEDGE BASE ---`
    : '';

  return `You are Dr. Sage — a warm, rigorous, evidence-based mental health companion. You are not a chatbot that answers questions. You are a skilled therapeutic guide who helps people understand themselves and make better decisions.

${name} ${goals} ${style}

YOUR CORE APPROACH — follow this in every response:

1. LISTEN FIRST. Before offering any guidance, make sure you fully understand the person's situation. Ask one focused, open-ended question at a time. Never ask two questions at once.

2. VALIDATE BEFORE EXPLORING. Acknowledge what the person is feeling before moving forward. Reflect it back so they feel heard.

3. RIGOROUS EXPLORATION. Use Motivational Interviewing and Socratic questioning. Dig beneath the surface. If someone says "I'm stressed", ask what that stress feels like, where it's coming from, what they've tried. Don't accept surface-level answers — gently probe deeper.

4. TRACK THE STORY. Within a conversation, remember what the person has told you. Reference it. If they mention a person, situation, or feeling earlier, bring it back. Build a coherent picture of their life and circumstances.

5. GUIDE DECISIONS RIGOROUSLY. When someone needs to make a decision, don't tell them what to do. Guide them through: (a) clarifying their values, (b) examining the evidence on both sides, (c) identifying what's driving fear or resistance, (d) considering consequences, (e) exploring what their best self would choose.

6. EVIDENCE-BASED GROUNDING. When you suggest a technique or concept, ground it in evidence. Name the approach (CBT, DBT, ACT, mindfulness, etc.) if relevant. Be specific, not vague.

7. SHORT, PRECISE REPLIES. Never write paragraphs of advice. Keep responses to 2-4 sentences unless explaining a technique step-by-step. End most responses with a question that advances understanding.

8. PROFESSIONAL BOUNDARIES. You are a companion and guide, not a therapist. For clinical diagnoses, medication, or crisis, always refer to a licensed professional. If you detect suicidal ideation or self-harm, immediately provide crisis resources.

9. WHAT MAKES YOU DIFFERENT. You remember. You follow up. You notice patterns. If the same issue comes up across sessions, name it. You are honest when something concerns you. You celebrate progress.

WHAT TO AVOID:
- Do NOT give long lists of generic advice.
- Do NOT answer a question with another question more than twice in a row.
- Do NOT use clinical jargon without explaining it.
- Do NOT be falsely positive — be honest and grounded.
- Do NOT forget what was said earlier in the conversation.
${memoryBlock}${kbBlock}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

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
    endSession: endSessionInStore,
    sessions,
  } = useChatStore();

  const profile = useUserStore((s) => s.profile);

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const userText = text.trim();
      if (!userText || isStreaming) return;

      try {
        setError(null);

        let sessionId = currentSessionId;
        if (!sessionId) {
          sessionId = await createSession();
        }

        await addMessage('user', userText);

        setStreaming(true);
        clearStreamingText();

        let fullResponse = '';

        // 1. Crisis short-circuit — never goes to LLM.
        const crisis = checkCrisis(userText);
        if (crisis) {
          fullResponse = crisis;
          for (const word of crisis.split(/(\s+)/)) {
            appendStreamingText(word);
            await new Promise((r) => setTimeout(r, 12));
          }
        } else if (hasGroqKey()) {
          // 2. Retrieve relevant KB context.
          const { context: kbContext } = retrieveContext(userText, 2);

          // 3. Pull past session summaries (up to 3 most recent, excluding current).
          const pastSummaries = sessions
            .filter((s) => s.id !== sessionId && s.summary)
            .slice(0, 3)
            .map((s) => s.summary as string)
            .reverse(); // oldest first so context reads chronologically

          // 4. Build system prompt with full context.
          const systemPrompt = buildSystemPrompt({
            userName: profile.name || '',
            goals: profile.goals || [],
            style: profile.communicationStyle || 'empathetic',
            pastSummaries,
            kbContext,
          });

          // 5. Build conversation history (last 20 messages to stay within token budget).
          const history: ChatMessage[] = useChatStore
            .getState()
            .messages.slice(-20)
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }));

          fullResponse = await streamChatCompletion(
            history,
            systemPrompt,
            (chunk) => appendStreamingText(chunk),
          );
        } else {
          // 6. No Groq key — pure offline retrieval fallback.
          await streamLocalReply(userText, (chunk) => {
            fullResponse += chunk;
            appendStreamingText(chunk);
          });
        }

        clearStreamingText();
        await addMessage('assistant', fullResponse);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
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
      sessions,
      createSession,
      addMessage,
      setStreaming,
      appendStreamingText,
      clearStreamingText,
      setError,
    ],
  );

  // End session and auto-generate a summary for future memory.
  const endSession = useCallback(async () => {
    const sessionId = currentSessionId;
    const currentMessages = useChatStore.getState().messages;

    endSessionInStore();

    // Generate and persist summary in the background — don't block the UI.
    if (sessionId && currentMessages.length >= 4 && hasGroqKey()) {
      try {
        const history: ChatMessage[] = currentMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        const summary = await generateSessionSummary(history);
        if (summary) {
          await updateSession(sessionId, { summary });
          // Patch the in-memory sessions list so it's available immediately.
          useChatStore.setState((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, summary } : s,
            ),
          }));
        }
      } catch {
        // Summary generation is best-effort — silently ignore failures.
      }
    }
  }, [currentSessionId, endSessionInStore]);

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
