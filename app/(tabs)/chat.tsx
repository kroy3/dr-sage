import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '@/stores/useChatStore';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types/chat';
import { useThemeColors } from '@/theme';
import {
  speak,
  stopSpeaking,
  startRecording,
  stopAndTranscribe,
  cancelRecording,
  requestMicPermission,
  type RecordingState,
} from '@/services/voice';

const SUGGESTED = [
  "I'm feeling anxious and overwhelmed",
  "I have an important decision to make",
  "I've been struggling with low mood",
  "I feel stuck and don't know what to do",
  "Help me with a breathing exercise",
];

// ---------------------------------------------------------------------------
// Pulsing mic ring
// ---------------------------------------------------------------------------

function PulseRing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.8, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute',
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: color,
      transform: [{ scale }],
      opacity,
    }} />
  );
}

// ---------------------------------------------------------------------------
// Typing dots
// ---------------------------------------------------------------------------

function TypingDots() {
  const colors = useThemeColors();
  const dots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(d, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(500),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <View style={[typingStyles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[typingStyles.dot, {
            backgroundColor: colors.primary,
            transform: [{ translateY: d }],
          }]} />
        ))}
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  bubble: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 20, borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message, showTail, showTime, autoSpeak }: {
  message: Message; showTail: boolean; showTime: boolean; autoSpeak: boolean;
}) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;
  const [speaking, setSpeaking] = useState(false);
  const didAutoSpeak = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isUser && autoSpeak && !didAutoSpeak.current && message.id !== '__streaming__') {
      didAutoSpeak.current = true;
      setSpeaking(true);
      speak(message.content, () => setSpeaking(false));
    }
  }, []);

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateX: slideAnim }],
    }}>
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={[styles.botAvatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ fontSize: 13 }}>🧠</Text>
          </View>
        )}

        <View style={{
          maxWidth: '75%',
          backgroundColor: isUser ? colors.primary : colors.surface,
          paddingHorizontal: 15, paddingVertical: 11,
          borderRadius: 20,
          borderBottomRightRadius: isUser && showTail ? 5 : 20,
          borderBottomLeftRadius: !isUser && showTail ? 5 : 20,
          borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isUser ? 0.12 : 0.06,
          shadowRadius: 4,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: 16, lineHeight: 24,
            color: isUser ? colors.onPrimary : colors.text,
          }}>
            {message.content}
          </Text>
        </View>

        {!isUser && (
          <TouchableOpacity
            onPress={() => {
              if (speaking) { stopSpeaking(); setSpeaking(false); }
              else { setSpeaking(true); speak(message.content, () => setSpeaking(false)); }
            }}
            style={{ paddingLeft: 4, paddingBottom: 2 }}
            hitSlop={12}
          >
            <Ionicons
              name={speaking ? 'stop-circle' : 'volume-medium-outline'}
              size={20}
              color={speaking ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {showTime && (
        <Text style={{
          fontSize: 11, color: colors.textTertiary,
          textAlign: isUser ? 'right' : 'left',
          paddingHorizontal: 48, marginTop: 4, marginBottom: 8,
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const colors = useThemeColors();
  const { messages, isStreaming, streamingText, currentSessionId } = useChatStore();
  const { sendMessage, endSession } = useChat();

  const [input, setInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcribedPreview, setTranscribedPreview] = useState('');
  const flatRef = useRef<FlatList>(null);

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  const canSend = input.trim().length > 0 && !isStreaming && !isRecording;

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    setInput('');
    stopSpeaking();
    await sendMessage(msg);
  }, [input, isStreaming, sendMessage]);

  // TAP to start/stop recording
  const handleMicTap = useCallback(async () => {
    if (isProcessing) return;

    if (isRecording) {
      // Stop and transcribe
      setRecordingState('processing');
      setTranscribedPreview('');
      const transcript = await stopAndTranscribe();
      setRecordingState('idle');
      if (transcript) {
        setTranscribedPreview(transcript);
        setInput(transcript);
      } else {
        Alert.alert('Could not understand', 'Please try speaking again clearly.');
      }
      return;
    }

    // Start recording
    if (Platform.OS === 'web') return;
    const granted = await requestMicPermission();
    if (!granted) {
      Alert.alert(
        'Microphone needed',
        'Please enable microphone access in your device Settings to use voice.',
      );
      return;
    }
    try {
      await startRecording();
      setRecordingState('recording');
    } catch (e) {
      Alert.alert('Recording error', 'Could not start recording. Please try again.');
    }
  }, [isRecording, isProcessing]);

  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
    setRecordingState('idle');
    setTranscribedPreview('');
  }, []);

  const handleNewSession = () => {
    Alert.alert(
      'New Conversation',
      'Start a fresh conversation? Dr. Sage will remember this session for next time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'New Chat', style: 'destructive', onPress: () => { stopSpeaking(); endSession(); } },
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

  const decorated = useMemo(() =>
    allMessages.map((m, i) => ({
      msg: m,
      showTail: !allMessages[i + 1] || allMessages[i + 1].role !== m.role,
      showTime: i === allMessages.length - 1,
    })),
    [allMessages],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ fontSize: 22 }}>🧠</Text>
            <View style={[styles.onlineDot, { backgroundColor: isStreaming ? colors.warning : colors.success }]} />
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>Dr. Sage</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {isRecording ? '🎙 Listening…' : isProcessing ? '⏳ Transcribing…' : isStreaming ? '💭 Thinking…' : 'Your mental wellness companion'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.voiceToggleRow}>
            <Ionicons name={autoSpeak ? 'volume-high' : 'volume-mute'} size={16} color={autoSpeak ? colors.primary : colors.textTertiary} />
            <Switch
              value={autoSpeak}
              onValueChange={v => { setAutoSpeak(v); if (!v) stopSpeaking(); }}
              trackColor={{ false: colors.disabled, true: colors.primaryLight }}
              thumbColor={autoSpeak ? colors.primary : colors.textTertiary}
              style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
            />
          </View>
          <TouchableOpacity onPress={handleNewSession} hitSlop={10} style={{ padding: 4 }}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* ── Messages or Welcome ── */}
        {decorated.length === 0 && !isStreaming ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeWrap}>
              {/* Avatar */}
              <View style={[styles.welcomeAvatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ fontSize: 52 }}>🧠</Text>
              </View>
              <Text style={[styles.welcomeName, { color: colors.text }]}>Hi, I'm Dr. Sage</Text>
              <Text style={[styles.welcomeDesc, { color: colors.textSecondary }]}>
                A safe space to talk through what's on your mind — in depth, with care, and zero judgement. Type or tap the mic.
              </Text>

              {/* Voice callout */}
              {Platform.OS !== 'web' && (
                <View style={[styles.voiceCallout, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}>
                  <Ionicons name="mic" size={18} color={colors.primary} />
                  <Text style={[styles.voiceCalloutText, { color: colors.primary }]}>
                    Tap the mic → speak → tap again to send
                  </Text>
                </View>
              )}

              {/* Suggestions */}
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>HOW CAN I HELP TODAY?</Text>
              {SUGGESTED.map((s, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }
                  ]}
                  onPress={() => handleSend(s)}
                >
                  <Text style={[styles.chipText, { color: colors.text }]}>{s}</Text>
                  <View style={[styles.chipArrow, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
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

        {/* ── Recording overlay ── */}
        {(isRecording || isProcessing) && (
          <View style={[styles.recordOverlay, { backgroundColor: colors.surface + 'F5' }]}>
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 80, height: 80 }}>
              {isRecording && <PulseRing color={colors.error} />}
              <View style={[styles.micCircle, { backgroundColor: isRecording ? colors.error : colors.primary }]}>
                <Ionicons name={isProcessing ? 'hourglass-outline' : 'mic'} size={28} color="#fff" />
              </View>
            </View>
            <Text style={[styles.recordLabel, { color: colors.text }]}>
              {isProcessing ? 'Understanding you…' : 'Tap mic again to stop'}
            </Text>
            {isRecording && (
              <TouchableOpacity onPress={handleCancelRecording} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Text input */}
          <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: isRecording ? colors.error : colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={isRecording ? 'Listening…' : 'Message Dr. Sage…'}
              placeholderTextColor={isRecording ? colors.error : colors.placeholder}
              multiline
              maxLength={1000}
              editable={!isStreaming && !isRecording && !isProcessing}
              returnKeyType="default"
            />
          </View>

          {/* Mic button (native only) */}
          {Platform.OS !== 'web' && (
            <Pressable
              onPress={handleMicTap}
              disabled={isProcessing || isStreaming}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: isRecording ? colors.error : colors.backgroundTertiary,
                  opacity: isProcessing || isStreaming ? 0.4 : pressed ? 0.7 : 1,
                }
              ]}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic-outline'}
                size={22}
                color={isRecording ? '#fff' : colors.textSecondary}
              />
            </Pressable>
          )}

          {/* Send button */}
          <Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: canSend ? colors.primary : colors.disabled,
                opacity: pressed ? 0.8 : 1,
              }
            ]}
          >
            <Ionicons name="arrow-up" size={22} color={canSend ? colors.onPrimary : colors.textTertiary} />
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 5.5,
    borderWidth: 2, borderColor: '#fff',
  },
  headerName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 1 },
  voiceToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  // Welcome
  welcomeWrap: { padding: 24, alignItems: 'center', paddingBottom: 40 },
  welcomeAvatar: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  welcomeName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 10 },
  welcomeDesc: {
    fontSize: 15, textAlign: 'center', lineHeight: 23,
    marginBottom: 22, paddingHorizontal: 12,
  },
  voiceCallout: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 24, borderWidth: 1, marginBottom: 28,
  },
  voiceCalloutText: { fontSize: 14, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 14, alignSelf: 'flex-start' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15,
    width: '100%', marginBottom: 10, borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  chipText: { fontSize: 15, flex: 1, lineHeight: 21 },
  chipArrow: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },

  // Messages
  msgRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 2, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start', gap: 8 },
  botAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Recording overlay
  recordOverlay: {
    position: 'absolute', bottom: 72, left: 20, right: 20,
    borderRadius: 24, padding: 28,
    alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  micCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  recordLabel: { fontSize: 16, fontWeight: '600' },
  cancelBtn: {
    paddingHorizontal: 24, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  inputWrap: {
    flex: 1, borderRadius: 24,
    borderWidth: 1.5, paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: 10,
    maxHeight: 120,
  },
  input: { fontSize: 16, lineHeight: 22, padding: 0 },
  actionBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
