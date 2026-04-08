import therapeuticApproaches from './therapeutic-approaches.json';
import disorders from './disorders.json';
import techniques from './techniques.json';
import copingStrategies from './coping-strategies.json';
import glossaryTerms from './glossary.json';
import crisisResources from './crisis-resources.json';

export {
  therapeuticApproaches,
  disorders,
  techniques,
  copingStrategies,
  glossaryTerms,
  crisisResources,
};

export type SearchResult = {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
  collection: 'approaches' | 'disorders' | 'techniques' | 'coping' | 'glossary';
};

function normalizeItem(item: any, collection: SearchResult['collection']): SearchResult {
  return {
    id: item.id,
    name: item.name || item.term || item.situation || '',
    shortDescription: item.shortDescription || item.definition || item.description || '',
    category: item.category || collection,
    collection,
  };
}

const allItems: SearchResult[] = [
  ...therapeuticApproaches.map((i: any) => normalizeItem(i, 'approaches')),
  ...disorders.map((i: any) => normalizeItem(i, 'disorders')),
  ...techniques.map((i: any) => normalizeItem(i, 'techniques')),
  ...copingStrategies.map((i: any) => normalizeItem(i, 'coping')),
  ...glossaryTerms.map((i: any) => normalizeItem(i, 'glossary')),
];

export function searchKnowledgeBase(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) return allItems.slice(0, 20);
  const q = query.toLowerCase().trim();
  return allItems.filter(
    (item) =>
      item.name.toLowerCase().includes(q) ||
      item.shortDescription.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  );
}

export function getByCollection(collection: SearchResult['collection']): SearchResult[] {
  return allItems.filter((item) => item.collection === collection);
}

export function getTermById(id: string): any {
  const allRaw = [
    ...therapeuticApproaches,
    ...disorders,
    ...techniques,
    ...copingStrategies,
    ...glossaryTerms,
  ];
  return allRaw.find((item: any) => item.id === id) || null;
}

export function getAllItems(): SearchResult[] {
  return allItems;
}
