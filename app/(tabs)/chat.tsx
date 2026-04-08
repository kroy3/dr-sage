import React, { useRef, useEffect, useState, useMemo } from 'react';
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
import { useThemeColors } from '@/theme';
import * as Haptics from 'expo-haptics';

const SUGGESTED = [
  "I'm feeling anxious today",
  'Help me with a breathing exercise',
  'What is cognitive behavioral therapy?',
  'I need help managing stress',
  'Tell me about mindfulness',
];

// ---------------------------------------------------------------------------
// Typing dots
// ---------------------------------------------------------------------------

function TypingDots() {
  const colors = useThemeColors();
  const anims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(a, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(280),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 6 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: colors.surface,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        }}
      >
        {anims.map((a, i) => (
          <Animated.View
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: colors.textTertiary,
              transform: [{ translateY: a }],
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Message bubble (iMessage-style)
// ---------------------------------------------------------------------------

interface BubbleProps {
  message: Message;
  showTail: boolean;
  showTime: boolean;
}

function MessageBubble({ message, showTail, showTime }: BubbleProps) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, []);

  const bubbleBg = isUser ? colors.primary : colors.surface;
  const textColor = isUser ? colors.onPrimary : colors.text;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 14,
          paddingVertical: 1.5,
          justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <View
          style={{
            maxWidth: '78%',
            backgroundColor: bubbleBg,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 22,
            borderBottomRightRadius: isUser && showTail ? 6 : 22,
            borderBottomLeftRadius: !isUser && showTail ? 6 : 22,
            borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, lineHeight: 22, color: textColor }}>
            {message.content}
          </Text>
        </View>
      </View>
      {showTime && (
        <Text
          style={{
            fontSize: 11,
            color: colors.textTertiary,
            textAlign: isUser ? 'right' : 'left',
            paddingHorizontal: 22,
            paddingTop: 4,
            paddingBottom: 6,
          }}
        >
          {formatTime(message.timestamp)}
        </Text>
      )}
    </Animated.View>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const colors = useThemeColors();
  const { messages, isStreaming, streamingText, currentSessionId, endSession } = useChatStore();
  const { sendMessage } = useChat();
  const [input, setInput] = useState('');
  const flatRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await sendMessage(text);
  };

  const handleNewSession = () => {
    Alert.alert('New Conversation', 'Start a new conversation with Dr. Sage?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New Chat', onPress: () => endSession() },
    ]);
  };

  // Build the list with a synthetic streaming message if needed.
  const allMessages = useMemo(() => {
    if (isStreaming && streamingText) {
      return [
        ...messages,
        {
          id: '__streaming__',
          sessionId: currentSessionId || '',
          role: 'assistant' as const,
          content: streamingText,
          timestamp: Date.now(),
        },
      ];
    }
    return messages;
  }, [messages, isStreaming, streamingText, currentSessionId]);

  // Decide which bubbles get a tail and a timestamp.
  const decorated = useMemo(() => {
    return allMessages.map((m, i) => {
      const next = allMessages[i + 1];
      const isLastInGroup = !next || next.role !== m.role;
      const isLast = i === allMessages.length - 1;
      return { msg: m, showTail: isLastInGroup, showTime: isLast };
    });
  }, [allMessages]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ fontSize: 20 }}>🧠</Text>
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>Dr. Sage</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {isStreaming ? 'Thinking…' : 'Online'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={handleNewSession} hitSlop={10}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {decorated.length === 0 && !isStreaming ? (
          <ScrollView contentContainerStyle={styles.welcomeScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeContainer}>
              <View style={[styles.welcomeAvatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ fontSize: 44 }}>🧠</Text>
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Hi, I'm Dr. Sage</Text>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                A calm space to talk through what's on your mind. Try one of the prompts below or message me directly.
              </Text>
              <Text style={[styles.suggestedTitle, { color: colors.textTertiary }]}>SUGGESTED</Text>
              {SUGGESTED.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestedChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setInput(s);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestedText, { color: colors.text }]}>{s}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatRef}
            data={[...decorated].reverse()}
            keyExtractor={(item) => item.msg.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item.msg}
                showTail={item.showTail}
                showTime={item.showTime}
              />
            )}
            inverted
            contentContainerStyle={{ paddingVertical: 12 }}
            onContentSizeChange={() => flatRef.current?.scrollToOffset({ offset: 0, animated: true })}
            ListHeaderComponent={isStreaming && !streamingText ? <TypingDots /> : null}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Message Dr. Sage…"
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={1000}
            editable={!isStreaming}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  input.trim() && !isStreaming ? colors.primary : colors.disabled,
              },
            ]}
            onPress={handleSend}
            disabled={isStreaming || !input.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: { fontSize: 17, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontWeight: '500' },
  newBtn: { padding: 6 },
  welcomeScroll: { flexGrow: 1 },
  welcomeContainer: { flex: 1, padding: 28, alignItems: 'center' },
  welcomeAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  welcomeTitle: { fontSize: 26, fontWeight: '700', marginBottom: 10 },
  welcomeText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  suggestedTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    width: '100%',
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestedText: { fontSize: 15, flex: 1, marginRight: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
