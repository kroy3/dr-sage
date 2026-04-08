// Offline retrieval-based "Dr. Sage". No API, no model — searches the local
// knowledge base and stitches a concise reply from the best-matching articles.

import {
  therapeuticApproaches,
  disorders,
  techniques,
  copingStrategies,
  glossaryTerms,
  crisisResources,
} from '@/data/knowledge-base';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoredItem {
  score: number;
  collection: 'approach' | 'disorder' | 'technique' | 'coping' | 'glossary';
  raw: any;
  searchableText: string;
}

// ---------------------------------------------------------------------------
// Tokenization & scoring
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'and', 'or', 'but', 'if', 'so', 'of', 'in', 'on', 'at', 'to', 'for', 'with',
  'about', 'as', 'by', 'this', 'that', 'these', 'those', 'have', 'has', 'had',
  'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will', 'just',
  'feel', 'feeling', 'feels', 'felt', 'get', 'got', 'getting', 'really',
  'very', 'much', 'some', 'any', 'what', 'how', 'why', 'when', 'where', 'who',
  'me', 'myself', 'm', 's', 't', 'don', 'didn', 'isn', 'aren',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

// Build a flat searchable corpus once.
function buildCorpus(): ScoredItem[] {
  const items: ScoredItem[] = [];

  for (const a of therapeuticApproaches as any[]) {
    items.push({
      score: 0,
      collection: 'approach',
      raw: a,
      searchableText: [
        a.name, a.shortDescription, a.fullDescription,
        (a.bestFor || []).join(' '),
        (a.keyPrinciples || []).join(' '),
      ].join(' ').toLowerCase(),
    });
  }

  for (const d of disorders as any[]) {
    items.push({
      score: 0,
      collection: 'disorder',
      raw: d,
      searchableText: [
        d.name, d.shortDescription, d.fullDescription,
        (d.symptoms || []).join(' '),
        d.category,
      ].join(' ').toLowerCase(),
    });
  }

  for (const t of techniques as any[]) {
    items.push({
      score: 0,
      collection: 'technique',
      raw: t,
      searchableText: [
        t.name, t.shortDescription, t.fullDescription,
        (t.bestFor || []).join(' '),
        (t.steps || []).join(' '),
      ].join(' ').toLowerCase(),
    });
  }

  for (const c of copingStrategies as any[]) {
    const stratText = (c.strategies || [])
      .map((s: any) => `${s.name} ${s.description} ${(s.steps || []).join(' ')}`)
      .join(' ');
    items.push({
      score: 0,
      collection: 'coping',
      raw: c,
      searchableText: [c.situation, c.description, stratText].join(' ').toLowerCase(),
    });
  }

  for (const g of glossaryTerms as any[]) {
    items.push({
      score: 0,
      collection: 'glossary',
      raw: g,
      searchableText: [g.term, g.definition, g.category].join(' ').toLowerCase(),
    });
  }

  return items;
}

const CORPUS = buildCorpus();

function scoreItem(item: ScoredItem, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const text = item.searchableText;
  let score = 0;

  for (const token of queryTokens) {
    // Count occurrences (cheap term frequency).
    let from = 0;
    let count = 0;
    while (true) {
      const idx = text.indexOf(token, from);
      if (idx === -1) break;
      count++;
      from = idx + token.length;
      if (count > 10) break;
    }
    if (count === 0) continue;

    score += count;

    // Bonus for matches in name/title field — first ~80 chars are typically the name.
    if (text.slice(0, 80).includes(token)) score += 3;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Crisis detection
// ---------------------------------------------------------------------------

const CRISIS_PATTERNS = [
  /\bsuicid/i,
  /\bkill (myself|me)\b/i,
  /\bend (my|it all|my life)\b/i,
  /\bwant to die\b/i,
  /\bhurt(ing)? myself\b/i,
  /\bself.?harm/i,
  /\bcan'?t go on\b/i,
  /\bno reason to live\b/i,
];

function isCrisisMessage(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

function buildCrisisReply(): string {
  const lines: string[] = [];
  lines.push("I'm really glad you reached out. What you're feeling matters, and you don't have to face this alone.");
  lines.push('');
  lines.push((crisisResources as any).emergencyMessage || '');
  lines.push('');
  lines.push('Please consider contacting one of these right now:');
  lines.push('');
  for (const r of ((crisisResources as any).resources || []).slice(0, 4)) {
    lines.push(`• ${r.name} — ${r.contact} (${r.available})`);
  }
  lines.push('');
  lines.push((crisisResources as any).disclaimer || '');
  return lines.filter((l) => l !== undefined).join('\n');
}

// ---------------------------------------------------------------------------
// Reply formatting
// ---------------------------------------------------------------------------

function formatDisorderReply(d: any): string {
  const parts: string[] = [];
  parts.push(`**${d.name}**`);
  parts.push('');
  parts.push(d.shortDescription || '');
  if (d.symptoms && d.symptoms.length) {
    parts.push('');
    parts.push('Common signs include:');
    for (const s of d.symptoms.slice(0, 5)) parts.push(`• ${s}`);
  }
  if (d.disclaimer) {
    parts.push('');
    parts.push(`_${d.disclaimer}_`);
  }
  return parts.join('\n');
}

function formatApproachReply(a: any): string {
  const parts: string[] = [];
  parts.push(`**${a.name}**`);
  parts.push('');
  parts.push(a.shortDescription || '');
  if (a.keyPrinciples && a.keyPrinciples.length) {
    parts.push('');
    parts.push('Key ideas:');
    for (const p of a.keyPrinciples.slice(0, 4)) parts.push(`• ${p}`);
  }
  return parts.join('\n');
}

function formatTechniqueReply(t: any): string {
  const parts: string[] = [];
  parts.push(`**${t.name}**`);
  parts.push('');
  parts.push(t.shortDescription || '');
  if (t.steps && t.steps.length) {
    parts.push('');
    parts.push('How to try it:');
    for (let i = 0; i < Math.min(t.steps.length, 6); i++) {
      parts.push(`${i + 1}. ${t.steps[i]}`);
    }
  }
  return parts.join('\n');
}

function formatCopingReply(c: any): string {
  const parts: string[] = [];
  parts.push(`**${c.situation}**`);
  parts.push('');
  parts.push(c.description || '');
  const strategies = (c.strategies || []).slice(0, 2);
  for (const s of strategies) {
    parts.push('');
    parts.push(`**${s.name}**`);
    if (s.description) parts.push(s.description);
    if (s.steps && s.steps.length) {
      for (let i = 0; i < Math.min(s.steps.length, 5); i++) {
        parts.push(`${i + 1}. ${s.steps[i]}`);
      }
    }
    if (s.timeRequired) parts.push(`_(${s.timeRequired})_`);
  }
  return parts.join('\n');
}

function formatGlossaryReply(g: any): string {
  return `**${g.term}**\n\n${g.definition}`;
}

function formatItem(item: ScoredItem): string {
  switch (item.collection) {
    case 'disorder': return formatDisorderReply(item.raw);
    case 'approach': return formatApproachReply(item.raw);
    case 'technique': return formatTechniqueReply(item.raw);
    case 'coping': return formatCopingReply(item.raw);
    case 'glossary': return formatGlossaryReply(item.raw);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LocalReply {
  text: string;
  references: { termId: string; termName: string; category: string }[];
}

export function generateLocalReply(userMessage: string): LocalReply {
  if (isCrisisMessage(userMessage)) {
    return {
      text: buildCrisisReply(),
      references: [],
    };
  }

  const tokens = tokenize(userMessage);

  if (tokens.length === 0) {
    return {
      text: "I'm here to listen. Could you tell me a bit more about what's on your mind?",
      references: [],
    };
  }

  const scored = CORPUS
    .map((item) => ({ ...item, score: scoreItem(item, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      text:
        "I hear you. I don't have a specific article that matches that, but I'm here to listen.\n\n" +
        'You could tell me more about how you\'re feeling, or ask me about things like anxiety, low mood, sleep, stress, mindfulness, CBT, breathing techniques, or grounding exercises.',
      references: [],
    };
  }

  // Take the top match. If the second match is close in score, include it too.
  const top = scored[0];
  const sections: string[] = [formatItem(top)];
  const refs: LocalReply['references'] = [
    {
      termId: top.raw.id,
      termName: top.raw.name || top.raw.term || top.raw.situation || '',
      category: top.collection,
    },
  ];

  if (scored.length > 1 && scored[1].score >= top.score * 0.6) {
    sections.push('');
    sections.push('---');
    sections.push('');
    sections.push(formatItem(scored[1]));
    refs.push({
      termId: scored[1].raw.id,
      termName: scored[1].raw.name || scored[1].raw.term || scored[1].raw.situation || '',
      category: scored[1].collection,
    });
  }

  sections.push('');
  sections.push('_This is educational information, not a substitute for professional care._');

  return {
    text: sections.join('\n'),
    references: refs,
  };
}

/**
 * Retrieve the top-K knowledge base snippets as plain text, suitable for
 * injecting into an LLM system prompt as grounding context.
 */
export function retrieveContext(userMessage: string, topK: number = 3): {
  context: string;
  references: { termId: string; termName: string; category: string }[];
} {
  const tokens = tokenize(userMessage);
  if (tokens.length === 0) {
    return { context: '', references: [] };
  }

  const scored = CORPUS
    .map((item) => ({ ...item, score: scoreItem(item, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (scored.length === 0) {
    return { context: '', references: [] };
  }

  const sections: string[] = [];
  const references: { termId: string; termName: string; category: string }[] = [];

  for (const item of scored) {
    sections.push(formatItem(item));
    sections.push('');
    references.push({
      termId: item.raw.id,
      termName: item.raw.name || item.raw.term || item.raw.situation || '',
      category: item.collection,
    });
  }

  return { context: sections.join('\n').trim(), references };
}

export function checkCrisis(text: string): string | null {
  return isCrisisMessage(text) ? buildCrisisReply() : null;
}

// Simulate streaming so the chat UI's typing animation still works.
export async function streamLocalReply(
  userMessage: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const { text } = generateLocalReply(userMessage);

  // Emit ~3 words at a time with a tiny delay.
  const words = text.split(/(\s+)/);
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + 6).join('');
    onChunk(chunk);
    i += 6;
    await new Promise((r) => setTimeout(r, 18));
  }
  return text;
}
