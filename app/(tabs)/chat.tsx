import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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
  stopRecording,
  cancelRecording,
  requestMicPermission,
  type RecordingState,
} from '@/services/voice';

const SUGGESTED = [
  "I'm feeling anxious and overwhelmed",
  'I have an important decision to make',
  'Help me with a breathing exercise',
  'I feel stuck and don\'t know what to do',
  'I\'ve been struggling with low mood',
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
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: colors.surface, borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 12,
        borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
      }}>
        {anims.map((a, i) => (
          <Animated.View key={i} style={{
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: colors.textTertiary,
            transform: [{ translateY: a }],
          }} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mic recording pulse animation
// ---------------------------------------------------------------------------

function RecordingPulse({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
    return () => pulse.stopAnimation();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', width: 64, height: 64, borderRadius: 32,
      backgroundColor: color + '30',
      transform: [{ scale: pulse }],
    }} />
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message, showTail, showTime, autoSpeak,
}: {
  message: Message;
  showTail: boolean;
  showTime: boolean;
  autoSpeak: boolean;
}) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSpeakingThis, setIsSpeakingThis] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, []);

  // Auto-speak new assistant messages when voice mode is on.
  const spokenRef = useRef(false);
  useEffect(() => {
    if (!isUser && autoSpeak && !spokenRef.current) {
      spokenRef.current = true;
      setIsSpeakingThis(true);
      speak(message.content, () => setIsSpeakingThis(false));
    }
  }, []);

  const handleSpeakPress = () => {
    if (isSpeakingThis) {
      stopSpeaking();
      setIsSpeakingThis(false);
    } else {
      setIsSpeakingThis(true);
      speak(message.content, () => setIsSpeakingThis(false));
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 14, paddingVertical: 1.5,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
      }}>
        <View style={{
          maxWidth: '78%',
          backgroundColor: isUser ? colors.primary : colors.surface,
          paddingHorizontal: 14, paddingVertical: 10,
          borderRadius: 22,
          borderBottomRightRadius: isUser && showTail ? 6 : 22,
          borderBottomLeftRadius: !isUser && showTail ? 6 : 22,
          borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 16, lineHeight: 23, color: isUser ? colors.onPrimary : colors.text }}>
            {message.content}
          </Text>
        </View>
        {/* Speaker button for assistant messages */}
        {!isUser && (
          <TouchableOpacity onPress={handleSpeakPress} style={{ marginLeft: 6, marginBottom: 2 }} hitSlop={10}>
            <Ionicons
              name={isSpeakingThis ? 'stop-circle' : 'volume-medium-outline'}
              size={18}
              color={isSpeakingThis ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {showTime && (
        <Text style={{
          fontSize: 11, color: colors.textTertiary,
          textAlign: isUser ? 'right' : 'left',
          paddingHorizontal: 22, paddingTop: 3, paddingBottom: 6,
        }}>
          {formatTime(message.timestamp)}
        </Text>
      )}
    </Animated.View>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const flatRef = useRef<FlatList>(null);
  const pressStartRef = useRef<number>(0);

  // Check mic permission on mount.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestMicPermission().then(setMicGranted);
    }
  }, []);

  // Stop speaking when user starts typing.
  useEffect(() => {
    if (input.length > 0) stopSpeaking();
  }, [input]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    setInput('');
    stopSpeaking();
    await sendMessage(msg);
  }, [input, isStreaming, sendMessage]);

  // Mic press-and-hold handlers.
  const handleMicPressIn = useCallback(async () => {
    if (Platform.OS === 'web' || recordingState !== 'idle') return;
    if (!micGranted) {
      const granted = await requestMicPermission();
      setMicGranted(granted);
      if (!granted) {
        Alert.alert('Microphone Access', 'Please allow microphone access in Settings to use voice.');
        return;
      }
    }
    pressStartRef.current = Date.now();
    setRecordingState('recording');
    try {
      await startRecording();
    } catch {
      setRecordingState('idle');
    }
  }, [micGranted, recordingState]);

  const handleMicPressOut = useCallback(async () => {
    if (recordingState !== 'recording') return;
    const duration = Date.now() - pressStartRef.current;

    if (duration < 400) {
      // Too short — cancel.
      await cancelRecording();
      setRecordingState('idle');
      return;
    }

    setRecordingState('processing');
    const transcript = await stopRecording();
    setRecordingState('idle');

    if (transcript && transcript.length > 1) {
      await handleSend(transcript);
    }
  }, [recordingState, handleSend]);

  const handleMicLongPress = useCallback(() => {
    // Long press switches to tap-to-toggle mode (already handled by pressIn/Out).
  }, []);

  const handleNewSession = () => {
    Alert.alert('New Conversation', 'Start a fresh conversation? Dr. Sage will remember this session for next time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New Chat', onPress: () => { stopSpeaking(); endSession(); } },
    ]);
  };

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

  const decorated = useMemo(() =>
    allMessages.map((m, i) => {
      const next = allMessages[i + 1];
      return {
        msg: m,
        showTail: !next || next.role !== m.role,
        showTime: i === allMessages.length - 1,
      };
    }),
    [allMessages],
  );

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

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
              <View style={[styles.statusDot, {
                backgroundColor: isStreaming ? colors.warning : colors.success,
              }]} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {isRecording ? 'Listening…' : isProcessing ? 'Transcribing…' : isStreaming ? 'Thinking…' : 'Online'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* Auto-speak toggle */}
          <View style={styles.speakToggle}>
            <Ionicons name="volume-medium-outline" size={16} color={autoSpeak ? colors.primary : colors.textTertiary} />
            <Switch
              value={autoSpeak}
              onValueChange={(v) => {
                setAutoSpeak(v);
                if (!v) stopSpeaking();
              }}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={autoSpeak ? colors.primary : colors.textTertiary}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={handleNewSession} hitSlop={10}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Welcome or messages */}
        {decorated.length === 0 && !isStreaming ? (
          <ScrollView contentContainerStyle={styles.welcomeScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.welcomeContainer}>
              <View style={[styles.welcomeAvatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={{ fontSize: 44 }}>🧠</Text>
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Hi, I'm Dr. Sage</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                Your personal mental wellness companion. Talk to me — type or hold the mic button to speak.
              </Text>

              {/* Voice hint */}
              {Platform.OS !== 'web' && (
                <View style={[styles.voiceHint, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
                  <Ionicons name="mic-outline" size={16} color={colors.primary} />
                  <Text style={[styles.voiceHintText, { color: colors.primary }]}>
                    Hold mic to speak — release to send
                  </Text>
                </View>
              )}

              <Text style={[styles.suggestedTitle, { color: colors.textTertiary }]}>WHERE WOULD YOU LIKE TO START?</Text>
              {SUGGESTED.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestedChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleSend(s)}
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
                autoSpeak={autoSpeak && item.msg.id !== '__streaming__'}
              />
            )}
            inverted
            contentContainerStyle={{ paddingVertical: 12 }}
            onContentSizeChange={() => flatRef.current?.scrollToOffset({ offset: 0, animated: true })}
            ListHeaderComponent={isStreaming && !streamingText ? <TypingDots /> : null}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Recording overlay */}
        {(isRecording || isProcessing) && (
          <View style={[styles.recordingOverlay, { backgroundColor: colors.background + 'EE' }]}>
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 64, height: 64 }}>
              <RecordingPulse color={colors.error} />
              <Ionicons name="mic" size={28} color={colors.error} />
            </View>
            <Text style={[styles.recordingLabel, { color: colors.text }]}>
              {isProcessing ? 'Understanding you…' : 'Listening — release to send'}
            </Text>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            }]}
            value={input}
            onChangeText={setInput}
            placeholder="Message Dr. Sage…"
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={1000}
            editable={!isStreaming && !isRecording}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          {/* Mic button — hold to record (native only) */}
          {Platform.OS !== 'web' && !input.trim() && (
            <TouchableOpacity
              style={[styles.micBtn, {
                backgroundColor: isRecording ? colors.error : colors.backgroundTertiary,
              }]}
              onPressIn={handleMicPressIn}
              onPressOut={handleMicPressOut}
              onLongPress={handleMicLongPress}
              disabled={isStreaming || isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={22}
                color={isRecording ? '#fff' : colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {/* Send button — shows when text is entered */}
          {(input.trim().length > 0 || Platform.OS === 'web') && (
            <TouchableOpacity
              style={[styles.sendBtn, {
                backgroundColor: input.trim() && !isStreaming ? colors.primary : colors.disabled,
              }]}
              onPress={() => handleSend()}
              disabled={isStreaming || !input.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          )}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 17, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 12, fontWeight: '500' },
  speakToggle: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  newBtn: { padding: 6 },
  welcomeScroll: { flexGrow: 1 },
  welcomeContainer: { flex: 1, padding: 28, alignItems: 'center' },
  welcomeAvatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, marginTop: 16,
  },
  welcomeTitle: { fontSize: 26, fontWeight: '700', marginBottom: 10 },
  welcomeSubtitle: {
    fontSize: 15, textAlign: 'center', lineHeight: 22,
    marginBottom: 20, paddingHorizontal: 8,
  },
  voiceHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
    marginBottom: 24,
  },
  voiceHintText: { fontSize: 14, fontWeight: '500' },
  suggestedTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginBottom: 12, alignSelf: 'flex-start',
  },
  suggestedChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 15,
    width: '100%', marginBottom: 10, borderWidth: StyleSheet.hairlineWidth,
  },
  suggestedText: { fontSize: 15, flex: 1, marginRight: 8 },
  recordingOverlay: {
    position: 'absolute', bottom: 80, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, gap: 12,
  },
  recordingLabel: { fontSize: 15, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  input: {
    flex: 1, borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11,
    fontSize: 16, maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
