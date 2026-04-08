import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChatStore } from '@/stores/useChatStore';
import { ChatSession } from '@/types/chat';
import { getRelativeTime } from '@/utils/dateHelpers';

export default function HistoryScreen() {
  const { sessions, loadSessions, deleteSession } = useChatStore();

  useEffect(() => {
    loadSessions();
  }, []);

  const confirmDelete = (session: ChatSession) => {
    Alert.alert('Delete Session', `Delete "${session.title || 'this conversation'}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSession(session.id) },
    ]);
  };

  const renderItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/history/${item.id}` as any)}
      onLongPress={() => confirmDelete(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#4A90D9" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Conversation'}</Text>
        <Text style={styles.cardMeta}>
          {getRelativeTime(item.updatedAt)} · {item.messageCount} messages
        </Text>
        {item.summary && (
          <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#CBD5E0" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={48} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>Start a conversation with Dr. Sage to see your history here.</Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/(tabs)/chat')}>
              <Text style={styles.startBtnText}>Start Chatting</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          sessions.length > 0 ? (
            <Text style={styles.hint}>Long press to delete a session</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  list: { padding: 20, paddingBottom: 40 },
  hint: { fontSize: 12, color: '#9BA3BE', marginBottom: 12, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A2138' },
  cardMeta: { fontSize: 13, color: '#6B7394', marginTop: 2 },
  cardSummary: { fontSize: 13, color: '#9BA3BE', marginTop: 4, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A2138' },
  emptyText: { fontSize: 14, color: '#6B7394', textAlign: 'center', lineHeight: 21 },
  startBtn: { backgroundColor: '#4A90D9', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
