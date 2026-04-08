import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { searchKnowledgeBase, getAllItems, getByCollection, SearchResult } from '../../data/knowledge-base';
import { useDebounce } from '@/hooks/useDebounce';
import * as Haptics from 'expo-haptics';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'approaches', label: 'Approaches' },
  { key: 'techniques', label: 'Techniques' },
  { key: 'disorders', label: 'Disorders' },
  { key: 'coping', label: 'Coping' },
  { key: 'glossary', label: 'Glossary' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  approaches: { bg: '#EBF4FF', text: '#4A90D9' },
  techniques: { bg: '#EAFAF1', text: '#27AE60' },
  disorders: { bg: '#F4EEFF', text: '#7B68EE' },
  coping: { bg: '#FEF3E8', text: '#E67E22' },
  glossary: { bg: '#F0F4F8', text: '#6B7394' },
};

export default function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    let items: SearchResult[];
    if (debouncedQuery.trim().length >= 2) {
      items = searchKnowledgeBase(debouncedQuery);
    } else {
      items = getAllItems();
    }
    if (category !== 'all') {
      items = items.filter((i) => i.collection === category);
    }
    setResults(items);
  }, [debouncedQuery, category]);

  const selectCategory = (key: string) => {
    Haptics.selectionAsync();
    setCategory(key);
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    const colors = CATEGORY_COLORS[item.collection] || CATEGORY_COLORS.glossary;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/library/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.shortDescription}</Text>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.badge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{item.collection}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E0" style={{ marginTop: 4 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Psychology Library</Text>
        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9BA3BE" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search terms, techniques..."
            placeholderTextColor="#9BA3BE"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9BA3BE" />
            </TouchableOpacity>
          )}
        </View>
        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.catChip, category === c.key && styles.catChipActive]}
              onPress={() => selectCategory(c.key)}
            >
              <Text style={[styles.catText, category === c.key && styles.catTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={40} color="#CBD5E0" />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={styles.resultCount}>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { backgroundColor: '#F0F4F8', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A2138', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A2138' },
  catRow: { paddingRight: 8, gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    backgroundColor: '#fff',
  },
  catChipActive: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  catText: { fontSize: 13, color: '#6B7394', fontWeight: '500' },
  catTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  resultCount: { fontSize: 13, color: '#6B7394', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: { flexDirection: 'row', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A2138', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#6B7394', lineHeight: 19 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#9BA3BE' },
});
