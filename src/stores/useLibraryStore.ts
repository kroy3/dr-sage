import { create } from 'zustand';
import type { KnowledgeItem, KnowledgeCategory } from '@/types/library';

interface LibraryState {
  searchQuery: string;
  selectedCategory: string;
  filteredResults: KnowledgeItem[];
  allItems: KnowledgeItem[];
  isLoading: boolean;
  // Actions
  setSearchQuery: (query: string) => void;
  setCategory: (category: string) => void;
  search: () => void;
  setItems: (items: KnowledgeItem[]) => void;
}

function filterItems(
  items: KnowledgeItem[],
  query: string,
  category: string
): KnowledgeItem[] {
  let results = items;

  if (category !== 'all') {
    results = results.filter((item) => item.category === category);
  }

  if (query.trim()) {
    const lowerQuery = query.toLowerCase().trim();
    results = results.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
  }

  return results;
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  searchQuery: '',
  selectedCategory: 'all',
  filteredResults: [],
  allItems: [],
  isLoading: false,

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().search();
  },

  setCategory: (category: string) => {
    set({ selectedCategory: category });
    get().search();
  },

  search: () => {
    const { allItems, searchQuery, selectedCategory } = get();
    const filteredResults = filterItems(allItems, searchQuery, selectedCategory);
    set({ filteredResults });
  },

  setItems: (items: KnowledgeItem[]) => {
    set({ allItems: items });
    get().search();
  },
}));
