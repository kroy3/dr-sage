import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  TouchableOpacity, KeyboardAvoidingView, Platform, Animated,
  Alert, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '@/stores/useChatStore';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types/chat';
import { useThemeColors } from '@/theme';
import {
  speakText, stopSpeaking,
  startRecording, stopAndTranscribe, cancelRecording,
  requestMicPermission, getMicPermission,
  type RecordingState,
} from '@/services/voice';

// Each suggestion gets its own accent color
const SUGGESTIONS = [
  { text: "I'm feeling anxious and overwhelmed", icon: '😰', color: '#4A90D9', bg: '#EBF2FB' },
  { text: "I have an important decision to make", icon: '🤔', color: '#9B59B6', bg: '#F5EEF8' },
  { text: "I've been struggling with low mood", icon: '😔', color: '#2E86C1', bg: '#EBF5FB' },
  { text: "I feel stuck and don't know what to do", icon: '🌀', color: '#E67E22', bg: '#FEF5E7' },
  { text: "Help me with a breathing exercise", icon: '🌬️', color: '#27AE60', bg: '#EAFAF1' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animated pulse ring (for mic recording)
// ─────────────────────────────────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
  const s = useRef(new Animated.Value(1)).current;
  const o = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(s, { toValue: 2.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(s, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(o, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.7, duration: 0, useNativeDriver: true }),
      ]),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', width: 56, height: 56, borderRadius: 28,
      backgroundColor: color, transform: [{ scale: s }], opacity: o,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Typing dots
// ─────────────────────────────────────────────────────────────────────────────
function TypingDots() {
  const colors = useThemeColors();
  const dots = useRef([
    new Animated.Value(0), new Animated.Value(0), new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const anims = dots.map((d, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 180),
      Animated.timing(d, { toValue: -7, duration: 320, useNativeDriver: true }),
      Animated.timing(d, { toValue: 0, duration: 320, useNativeDriver: true }),
      Animated.delay(600),
    ])));
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.botAvatar, { backgroundColor: '#E8F4FD' }]}>
          <Text style={{ fontSize: 13 }}>🧠</Text>
        </View>
        <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {dots.map((d, i) => (
            <Animated.View key={i} style={[
              styles.typingDot,
              { backgroundColor: colors.primary, transform: [{ translateY: d }] },
            ]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ message, showTail, showTime, autoSpeak }: {
  message: Message; showTail: boolean; showTime: boolean; autoSpeak: boolean;
}) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(isUser ? 30 : -30)).current;
  const [speaking, setSpeaking] = useState(false);
  const didSpeak = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // Auto-speak assistant messages when toggle is on
  useEffect(() => {
    if (!isUser && autoSpeak && !didSpeak.current && message.id !== '__streaming__') {
      didSpeak.current = true;
      setSpeaking(true);
      speakText(message.content, () => setSpeaking(false));
    }
  }, []);

  const handleSpeak = async () => {
    if (speaking) {
      await stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      await speakText(message.content, () => setSpeaking(false));
    }
  };

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateX: slide }] }}>
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={[styles.botAvatar, { backgroundColor: '#E8F4FD' }]}>
            <Text style={{ fontSize: 13 }}>🧠</Text>
          </View>
        )}

        <View style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
          showTail && isUser && { borderBottomRightRadius: 5 },
          showTail && !isUser && { borderBottomLeftRadius: 5 },
        ]}>
          <Text style={[
            styles.bubbleText,
            { color: isUser ? colors.onPrimary : colors.text },
          ]}>
            {message.content}
          </Text>
        </View>

        {!isUser && (
          <TouchableOpacity onPress={handleSpeak} hitSlop={12} style={{ paddingLeft: 4 }}>
            <Ionicons
              name={speaking ? 'stop-circle' : 'volume-medium-outline'}
              size={20}
              color={speaking ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {showTime && (
        <Text style={[styles.timeLabel, {
          color: colors.textTertiary,
          textAlign: isUser ? 'right' : 'left',
          paddingHorizontal: isUser ? 16 : 58,
        }]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const colors = useThemeColors();
  const { messages, isStreaming, streamingText, currentSessionId } = useChatStore();
  const { sendMessage, endSession } = useChat();

  const [input, setInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [recState, setRecState] = useState<RecordingState>('idle');
  const [voiceError, setVoiceError] = useState('');
  const flatRef = useRef<FlatList>(null);

  const isRecording = recState === 'recording';
  const isProcessing = recState === 'processing';
  const canSend = input.trim().length > 0 && !isStreaming && recState === 'idle';

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    setInput('');
    setVoiceError('');
    await stopSpeaking();
    await sendMessage(msg);
  }, [input, isStreaming, sendMessage]);

  // ── Mic tap: start or stop recording ──────────────────────────────────────
  const handleMicTap = useCallback(async () => {
    if (isProcessing) return;
    setVoiceError('');

    if (isRecording) {
      // ── Stop and transcribe ──
      setRecState('processing');
      try {
        const transcript = await stopAndTranscribe();
        if (transcript) {
          setInput(transcript);
        } else {
          setVoiceError("Couldn't understand that. Please try again.");
        }
      } catch (e) {
        setVoiceError('Recording error. Please try again.');
      } finally {
        setRecState('idle');
      }
      return;
    }

    // ── Start recording ──
    // Check permission first without prompting
    const already = await getMicPermission();
    if (!already) {
      const granted = await requestMicPermission();
      if (!granted) {
        Alert.alert(
          'Microphone Permission',
          'Dr. Sage needs microphone access to hear you. Please enable it in Settings.',
          [{ text: 'OK' }],
        );
        return;
      }
    }

    try {
      await startRecording();
      setRecState('recording');
    } catch (e: any) {
      setVoiceError('Could not start recording. Please try again.');
      setRecState('idle');
    }
  }, [isRecording, isProcessing]);

  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
    setRecState('idle');
    setVoiceError('');
  }, []);

  const handleNewSession = () => {
    Alert.alert(
      'New Conversation',
      'Start fresh? Dr. Sage will remember this session for next time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'New Chat', style: 'destructive', onPress: async () => { await stopSpeaking(); endSession(); } },
      ],
    );
  };

  const allMessages = useMemo(() => {
    if (isStreaming && streamingText) {
      return [...messages, {
        id: '__streaming__', sessionId: currentSessionId || '',
        role: 'assistant' as const, content: streamingText, timestamp: Date.now(),
      }];
    }
    return messages;
  }, [messages, isStreaming, streamingText, currentSessionId]);

  const decorated = useMemo(() => allMessages.map((m, i) => ({
    msg: m,
    showTail: !allMessages[i + 1] || allMessages[i + 1].role !== m.role,
    showTime: i === allMessages.length - 1,
  })), [allMessages]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Colorful header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Gradient-like layered background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1A3A5C' }]} />
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: colors.primary,
          opacity: 0.92,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }]} />

        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {/* Avatar with glow */}
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Text style={{ fontSize: 24 }}>🧠</Text>
              </View>
              <View style={[styles.onlineDot, {
                backgroundColor: isStreaming ? '#F39C12' : '#2ECC71',
              }]} />
            </View>
            <View>
              <Text style={styles.headerName}>Dr. Sage</Text>
              <Text style={styles.headerStatus}>
                {isRecording ? '🎙 Listening to you…'
                  : isProcessing ? '⏳ Understanding…'
                  : isStreaming ? '💭 Thinking…'
                  : '✨ Your wellness companion'}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Voice toggle */}
            <View style={styles.voiceToggle}>
              <Ionicons
                name={autoSpeak ? 'volume-high' : 'volume-mute-outline'}
                size={15}
                color={autoSpeak ? '#2ECC71' : 'rgba(255,255,255,0.6)'}
              />
              <Switch
                value={autoSpeak}
                onValueChange={async (v) => {
                  setAutoSpeak(v);
                  if (!v) await stopSpeaking();
                }}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(46,204,113,0.6)' }}
                thumbColor={autoSpeak ? '#2ECC71' : 'rgba(255,255,255,0.8)'}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
            <TouchableOpacity onPress={handleNewSession} hitSlop={10} style={{ padding: 4 }}>
              <Ionicons name="create-outline" size={22} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* ── Welcome screen ─────────────────────────────────────────────── */}
        {decorated.length === 0 && !isStreaming ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeWrap}>
              {/* Hero */}
              <View style={styles.heroCard}>
                <Text style={styles.heroEmoji}>🧠</Text>
                <Text style={styles.heroTitle}>Hi, I'm Dr. Sage</Text>
                <Text style={styles.heroDesc}>
                  A safe, judgment-free space to explore your thoughts and feelings.{'\n'}
                  I'll ask questions, listen deeply, and help you find clarity.
                </Text>
                {Platform.OS !== 'web' && (
                  <View style={styles.voiceHint}>
                    <Ionicons name="mic" size={16} color="#4A90D9" />
                    <Text style={styles.voiceHintText}>Tap mic → speak → tap mic to send</Text>
                  </View>
                )}
              </View>

              {/* Suggestions */}
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                WHERE WOULD YOU LIKE TO START?
              </Text>
              {SUGGESTIONS.map((s, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: s.bg, borderColor: s.color + '40', opacity: pressed ? 0.75 : 1 },
                  ]}
                  onPress={() => handleSend(s.text)}
                >
                  <Text style={styles.chipIcon}>{s.icon}</Text>
                  <Text style={[styles.chipText, { color: colors.text }]}>{s.text}</Text>
                  <View style={[styles.chipArrow, { backgroundColor: s.color + '20' }]}>
                    <Ionicons name="arrow-forward" size={14} color={s.color} />
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatRef}
            data={[...decorated].reverse()}
            keyExtractor={item => item.msg.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item.msg}
                showTail={item.showTail}
                showTime={item.showTime}
                autoSpeak={autoSpeak}
              />
            )}
            inverted
            contentContainerStyle={{ paddingVertical: 14 }}
            ListHeaderComponent={isStreaming && !streamingText ? <TypingDots /> : null}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* ── Recording overlay ──────────────────────────────────────────── */}
        {(isRecording || isProcessing) && (
          <View style={[styles.recOverlay, { backgroundColor: colors.surface + 'F8' }]}>
            <View style={styles.micWrap}>
              {isRecording && <PulseRing color="#E74C3C" />}
              <View style={[styles.micCircle, {
                backgroundColor: isRecording ? '#E74C3C' : colors.primary,
              }]}>
                <Ionicons
                  name={isProcessing ? 'hourglass-outline' : 'mic'}
                  size={30}
                  color="#fff"
                />
              </View>
            </View>
            <Text style={[styles.recTitle, { color: colors.text }]}>
              {isProcessing ? 'Understanding you…' : 'Listening…'}
            </Text>
            <Text style={[styles.recSub, { color: colors.textSecondary }]}>
              {isProcessing ? 'Sending to Whisper AI' : 'Tap mic again to send'}
            </Text>
            {isRecording && (
              <Pressable
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={handleCancelRecording}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Cancel</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Voice error ────────────────────────────────────────────────── */}
        {!!voiceError && (
          <View style={[styles.errorBar, { backgroundColor: '#FDEDEC' }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#E74C3C" />
            <Text style={styles.errorText}>{voiceError}</Text>
            <TouchableOpacity onPress={() => setVoiceError('')} hitSlop={8}>
              <Ionicons name="close" size={16} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Input bar ─────────────────────────────────────────────────── */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={[styles.inputWrap, {
            backgroundColor: colors.background,
            borderColor: isRecording ? '#E74C3C' : colors.border,
          }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={isRecording ? '🎙 Listening…' : 'Message Dr. Sage…'}
              placeholderTextColor={isRecording ? '#E74C3C' : colors.placeholder}
              multiline
              maxLength={1000}
              editable={!isStreaming && recState === 'idle'}
              returnKeyType="default"
            />
          </View>

          {/* Mic button */}
          {Platform.OS !== 'web' && (
            <Pressable
              onPress={handleMicTap}
              disabled={isProcessing || isStreaming}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: isRecording
                    ? '#E74C3C'
                    : recState === 'processing'
                    ? colors.primary
                    : colors.backgroundTertiary,
                  opacity: (isProcessing || isStreaming) ? 0.4 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name={isRecording ? 'stop' : isProcessing ? 'hourglass-outline' : 'mic-outline'}
                size={22}
                color={isRecording || isProcessing ? '#fff' : colors.textSecondary}
              />
            </Pressable>
          )}

          {/* Send button */}
          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: canSend ? colors.primary : colors.disabled,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="arrow-up" size={22} color={canSend ? colors.onPrimary : colors.textTertiary} />
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1A3A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarOuter: { position: 'relative' },
  avatarInner: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 13, height: 13, borderRadius: 6.5,
    borderWidth: 2.5, borderColor: '#fff',
  },
  headerName: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  voiceToggle: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  // Welcome
  welcomeWrap: { padding: 20, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 24, padding: 24,
    alignItems: 'center', marginBottom: 28,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  heroEmoji: { fontSize: 56, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#1A2138', marginBottom: 10, letterSpacing: -0.5 },
  heroDesc: { fontSize: 15, color: '#6B7394', textAlign: 'center', lineHeight: 23, marginBottom: 16 },
  voiceHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EBF2FB', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  voiceHintText: { fontSize: 14, fontWeight: '600', color: '#4A90D9' },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
    marginBottom: 14, marginLeft: 4,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 15,
    marginBottom: 10, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  chipIcon: { fontSize: 20, marginRight: 12 },
  chipText: { fontSize: 15, flex: 1, lineHeight: 21 },
  chipArrow: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },

  // Messages
  msgRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 2, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start', gap: 8 },
  botAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: {
    maxWidth: '76%', paddingHorizontal: 15, paddingVertical: 11, borderRadius: 20,
  },
  userBubble: {
    shadowColor: '#4A90D9', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  botBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bubbleText: { fontSize: 16, lineHeight: 24 },
  timeLabel: { fontSize: 11, marginTop: 3, marginBottom: 8 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 20, borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typingDot: { width: 7, height: 7, borderRadius: 3.5 },

  // Recording overlay
  recOverlay: {
    position: 'absolute', bottom: 80, left: 24, right: 24,
    borderRadius: 28, padding: 32,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  micWrap: { alignItems: 'center', justifyContent: 'center', width: 80, height: 80, marginBottom: 4 },
  micCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E74C3C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  recTitle: { fontSize: 18, fontWeight: '700' },
  recSub: { fontSize: 13 },
  cancelBtn: {
    marginTop: 8, paddingHorizontal: 28, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1,
  },

  // Error bar
  errorBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    marginHorizontal: 12, marginBottom: 4,
    borderRadius: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#E74C3C' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  inputWrap: {
    flex: 1, borderRadius: 26, borderWidth: 1.5,
    paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, maxHeight: 120,
  },
  input: { fontSize: 16, lineHeight: 22, padding: 0 },
  iconBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
});
