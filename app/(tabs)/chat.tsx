import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '@/stores/useChatStore';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types/chat';
import { getRelativeTime } from '@/utils/dateHelpers';
import * as Haptics from 'expo-haptics';

const SUGGESTED = [
  "I'm feeling anxious today",
  'Help me with a breathing exercise',
  'What is cognitive behavioral therapy?',
  'I need help managing stress',
  'Tell me about mindfulness',
  'I want to understand my emotions better',
];

function TypingDots() {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(a, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(300),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={tdStyles.container}>
      <View style={tdStyles.avatar}><Text style={{ fontSize: 14 }}>🧠</Text></View>
      <View style={tdStyles.bubble}>
        {anims.map((a, i) => (
          <Animated.View key={i} style={[tdStyles.dot, { transform: [{ translateY: a }] }]} />
        ))}
      </View>
    </View>
  );
}

const tdStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 4 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6EC6A0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#9BA3BE' },
});

function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[mbStyles.row, isUser ? mbStyles.rowUser : mbStyles.rowBot]}>
        {!isUser && (
          <View style={mbStyles.avatar}><Text style={{ fontSize: 14 }}>🧠</Text></View>
        )}
        <View style={[mbStyles.bubble, isUser ? mbStyles.userBubble : mbStyles.botBubble, isUser ? mbStyles.userRadius : mbStyles.botRadius]}>
          <Text style={[mbStyles.text, isUser ? mbStyles.userText : mbStyles.botText]}>{message.content}</Text>
        </View>
      </View>
      {isLast && (
        <Text style={[mbStyles.time, isUser ? { textAlign: 'right', marginRight: 16 } : { marginLeft: 52 }]}>
          {getRelativeTime(message.timestamp)}
        </Text>
      )}
    </Animated.View>
  );
}

const mbStyles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 3, alignItems: 'flex-end' },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6EC6A0', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: '#4A90D9' },
  botBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  userRadius: { borderRadius: 18, borderBottomRightRadius: 4 },
  botRadius: { borderRadius: 18, borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  botText: { color: '#1A2138' },
  time: { fontSize: 11, color: '#9BA3BE', marginBottom: 8, marginTop: 2 },
});

export default function ChatScreen() {
  const { messages, isStreaming, streamingText, currentSessionId, endSession } = useChatStore();
  const { sendMessage } = useChat();
  const [input, setInput] = useState('');
  const flatRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(sendScale, { toValue: input.length > 0 ? 1 : 0, useNativeDriver: true }).start();
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(text);
  };

  const handleNewSession = () => {
    Alert.alert('New Conversation', 'Start a new conversation with Dr. Sage?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New Chat', onPress: () => endSession() },
    ]);
  };

  const allMessages = isStreaming && streamingText
    ? [...messages, { id: 'streaming', sessionId: currentSessionId || '', role: 'assistant' as const, content: streamingText, timestamp: Date.now() }]
    : messages;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}><Text style={{ fontSize: 18 }}>🧠</Text></View>
          <View>
            <Text style={styles.headerName}>Dr. Sage</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={handleNewSession}>
          <Ionicons name="add-circle-outline" size={26} color="#4A90D9" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Messages or Welcome */}
        {allMessages.length === 0 && !isStreaming ? (
          <ScrollView contentContainerStyle={styles.welcomeScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeAvatar}><Text style={{ fontSize: 40 }}>🧠</Text></View>
              <Text style={styles.welcomeTitle}>Hello, I'm Dr. Sage</Text>
              <Text style={styles.welcomeText}>
                I'm here to support your mental wellness journey with evidence-based guidance, coping strategies, and a compassionate space to explore your thoughts.
              </Text>
              <Text style={styles.suggestedTitle}>How can I help today?</Text>
              {SUGGESTED.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestedChip} onPress={() => { Haptics.selectionAsync(); setInput(s); }}>
                  <Text style={styles.suggestedText}>{s}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#4A90D9" />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatRef}
            data={[...allMessages].reverse()}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MessageBubble message={item} isLast={index === 0} />
            )}
            inverted
            contentContainerStyle={{ paddingVertical: 12 }}
            onContentSizeChange={() => flatRef.current?.scrollToOffset({ offset: 0, animated: true })}
            ListHeaderComponent={isStreaming && !streamingText ? <TypingDots /> : null}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message Dr. Sage..."
            placeholderTextColor="#9BA3BE"
            multiline
            maxLength={1000}
            editable={!isStreaming}
            onSubmitEditing={handleSend}
          />
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity
              style={[styles.sendBtn, isStreaming && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={isStreaming || !input.trim()}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 16, fontWeight: '700', color: '#1A2138' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#27AE60' },
  statusText: { fontSize: 12, color: '#27AE60', fontWeight: '500' },
  newBtn: { padding: 4 },
  welcomeScroll: { flexGrow: 1 },
  welcomeContainer: { flex: 1, padding: 24, alignItems: 'center' },
  welcomeAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#1A2138', marginBottom: 10 },
  welcomeText: { fontSize: 15, color: '#6B7394', textAlign: 'center', lineHeight: 23, marginBottom: 28 },
  suggestedTitle: { fontSize: 14, fontWeight: '600', color: '#6B7394', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, alignSelf: 'flex-start' },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    width: '100%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestedText: { fontSize: 14, color: '#4A5568', flex: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#1A2138',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#CBD5E0' },
});
