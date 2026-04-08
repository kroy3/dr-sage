export interface SuggestedPrompt {
  id: string;
  text: string;
  category: PromptCategory;
}

export type PromptCategory =
  | 'emotional_support'
  | 'self_discovery'
  | 'coping_techniques'
  | 'psychological_education';

export const PROMPT_CATEGORIES: Record<PromptCategory, string> = {
  emotional_support: 'Emotional Support',
  self_discovery: 'Self-Discovery',
  coping_techniques: 'Coping Techniques',
  psychological_education: 'Psychological Education',
};

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  // Emotional Support
  {
    id: 'es-1',
    text: "I'm feeling overwhelmed and don't know where to start.",
    category: 'emotional_support',
  },
  {
    id: 'es-2',
    text: "I've been feeling really anxious lately. Can we talk about it?",
    category: 'emotional_support',
  },
  {
    id: 'es-3',
    text: "I'm going through a difficult breakup and need support.",
    category: 'emotional_support',
  },
  {
    id: 'es-4',
    text: "I feel lonely even when I'm around people.",
    category: 'emotional_support',
  },
  {
    id: 'es-5',
    text: "I'm struggling with motivation and everything feels pointless.",
    category: 'emotional_support',
  },

  // Self-Discovery
  {
    id: 'sd-1',
    text: 'Help me understand why I react so strongly to criticism.',
    category: 'self_discovery',
  },
  {
    id: 'sd-2',
    text: "I'd like to explore my core values and what matters most to me.",
    category: 'self_discovery',
  },
  {
    id: 'sd-3',
    text: 'Can you help me identify patterns in my relationships?',
    category: 'self_discovery',
  },
  {
    id: 'sd-4',
    text: "I want to understand my attachment style and how it affects me.",
    category: 'self_discovery',
  },
  {
    id: 'sd-5',
    text: 'What are some ways to build better self-awareness?',
    category: 'self_discovery',
  },

  // Coping Techniques
  {
    id: 'ct-1',
    text: 'Teach me a grounding technique for when I feel anxious.',
    category: 'coping_techniques',
  },
  {
    id: 'ct-2',
    text: 'What breathing exercises can help me calm down quickly?',
    category: 'coping_techniques',
  },
  {
    id: 'ct-3',
    text: 'How can I manage negative thought spirals?',
    category: 'coping_techniques',
  },
  {
    id: 'ct-4',
    text: 'I need strategies for dealing with work-related stress.',
    category: 'coping_techniques',
  },
  {
    id: 'ct-5',
    text: 'Can you guide me through a progressive muscle relaxation exercise?',
    category: 'coping_techniques',
  },
  {
    id: 'ct-6',
    text: 'What are healthy ways to process anger?',
    category: 'coping_techniques',
  },

  // Psychological Education
  {
    id: 'pe-1',
    text: 'What is cognitive behavioral therapy and how does it work?',
    category: 'psychological_education',
  },
  {
    id: 'pe-2',
    text: 'Explain the difference between sadness and depression.',
    category: 'psychological_education',
  },
  {
    id: 'pe-3',
    text: 'How does mindfulness help with mental health?',
    category: 'psychological_education',
  },
  {
    id: 'pe-4',
    text: 'What are cognitive distortions and how do I recognize them?',
    category: 'psychological_education',
  },
  {
    id: 'pe-5',
    text: "Can you explain the fight-or-flight response and why it's important?",
    category: 'psychological_education',
  },
];

export const getPromptsByCategory = (
  category: PromptCategory
): SuggestedPrompt[] =>
  SUGGESTED_PROMPTS.filter((prompt) => prompt.category === category);
