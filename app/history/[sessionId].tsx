import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { getSessionMessages } from '@/services/storage';
import { Message } from '@/types/chat';
import { formatDate } from '@/utils/dateHelpers';

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      getSessionMessages(sessionId).then((msgs) => {
        setMessages(msgs);
        setLoading(false);
      });
    }
  }, [sessionId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.loading}><ActivityIndicator color="#4A90D9" size="large" /></View>
      </SafeAreaView>
    );
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && <View style={styles.avatar}><Text>🧠</Text></View>}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.msgText, isUser ? styles.userText : styles.botText]}>{item.content}</Text>
          <Text style={styles.msgTime}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages in this session.</Text>
          </View>
        }
        ListHeaderComponent={
          messages.length > 0 ? (
            <Text style={styles.header}>
              Session · {messages.length} messages · {formatDate(messages[0]?.timestamp || 0)}
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 13, color: '#9BA3BE', textAlign: 'center', marginBottom: 16 },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6EC6A0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: '#4A90D9', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  msgText: { fontSize: 14, lineHeight: 21 },
  userText: { color: '#fff' },
  botText: { color: '#1A2138' },
  msgTime: { fontSize: 10, color: 'rgba(0,0,0,0.3)', marginTop: 4, alignSelf: 'flex-end' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, color: '#6B7394' },
});
