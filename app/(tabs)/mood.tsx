import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMoodStore } from '@/stores/useMoodStore';
import * as Haptics from 'expo-haptics';

const MOODS = [
  { level: 1, emoji: '😢', label: 'Terrible', color: '#E74C3C', bg: '#FDEDEC' },
  { level: 2, emoji: '😕', label: 'Bad', color: '#E67E22', bg: '#FDEBD0' },
  { level: 3, emoji: '😐', label: 'Okay', color: '#F1C40F', bg: '#FEF9E7' },
  { level: 4, emoji: '🙂', label: 'Good', color: '#2ECC71', bg: '#EAFAF1' },
  { level: 5, emoji: '😄', label: 'Great', color: '#27AE60', bg: '#D5F5E3' },
];

const TAGS = ['Work', 'Relationships', 'Health', 'Sleep', 'Social', 'Exercise', 'Family', 'Other'];

export default function MoodScreen() {
  const { entries, loadEntries, logMood, getTodaysMood, currentStreak, loadStreak } = useMoodStore();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const scaleAnims = MOODS.map(() => useState(new Animated.Value(1))[0]);

  const todaysMood = getTodaysMood();

  useEffect(() => {
    loadEntries(30);
    loadStreak();
    if (todaysMood) {
      setSelectedLevel(todaysMood.level);
      setSaved(true);
    }
  }, []);

  const selectMood = (level: number, i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLevel(level);
    Animated.sequence([
      Animated.timing(scaleAnims[i], { toValue: 1.25, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnims[i], { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const toggleTag = (tag: string) => {
    Haptics.selectionAsync();
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSave = async () => {
    if (!selectedLevel) return;
    await logMood(selectedLevel, note.trim() || undefined, selectedTags.length > 0 ? selectedTags : undefined);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Mood saved! 🎉', 'Thanks for checking in today.');
  };

  const weekData = getWeekData(entries);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How are you feeling?</Text>

        {/* Mood Selector */}
        <View style={styles.moodRow}>
          {MOODS.map((m, i) => {
            const isSelected = selectedLevel === m.level;
            return (
              <Animated.View key={m.level} style={{ transform: [{ scale: scaleAnims[i] }] }}>
                <TouchableOpacity
                  style={[styles.moodItem, isSelected && { backgroundColor: m.bg, borderColor: m.color, borderWidth: 2 }]}
                  onPress={() => selectMood(m.level, i)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, isSelected && { color: m.color, fontWeight: '700' }]}>{m.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Journal */}
        {selectedLevel && !saved && (
          <View style={styles.journalCard}>
            <Text style={styles.journalLabel}>What's on your mind? (optional)</Text>
            <TextInput
              style={styles.journalInput}
              value={note}
              onChangeText={setNote}
              placeholder="Write a few words..."
              placeholderTextColor="#9BA3BE"
              multiline
              numberOfLines={3}
            />

            {/* Tags */}
            <Text style={[styles.journalLabel, { marginTop: 12 }]}>Tag this moment:</Text>
            <View style={styles.tagGrid}>
              {TAGS.map((tag) => {
                const sel = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, sel && styles.tagSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, sel && styles.tagTextSelected]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Mood</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today saved */}
        {saved && todaysMood && (
          <View style={styles.savedCard}>
            <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
            <View style={{ flex: 1 }}>
              <Text style={styles.savedTitle}>Mood logged for today</Text>
              <Text style={styles.savedSub}>Tap any emoji above to update</Text>
            </View>
          </View>
        )}

        {/* Streak */}
        {currentStreak > 0 && (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakTitle}>{currentStreak} day streak!</Text>
              <Text style={styles.streakSub}>Keep tracking your mood daily</Text>
            </View>
          </View>
        )}

        {/* This week */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekCard}>
          {weekData.map((d, i) => (
            <View key={i} style={styles.weekDay}>
              <View style={[styles.weekDot, { backgroundColor: d.color }]} />
              <Text style={styles.weekLabel}>{d.day}</Text>
            </View>
          ))}
        </View>

        {/* History hint */}
        {entries.length > 0 && (
          <View style={styles.insightCard}>
            <Ionicons name="analytics-outline" size={20} color="#4A90D9" />
            <Text style={styles.insightText}>
              Your average mood this week: {getWeekAvg(entries)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getWeekData(entries: any[]) {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const colors: Record<number, string> = { 1: '#E74C3C', 2: '#E67E22', 3: '#F1C40F', 4: '#2ECC71', 5: '#27AE60' };

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const entry = entries.find((e) => {
      const ed = new Date(e.timestamp);
      return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth();
    });
    return { day: days[i], color: entry ? colors[entry.level] || '#E2E8F0' : '#E2E8F0' };
  });
}

function getWeekAvg(entries: any[]) {
  const now = Date.now();
  const weekStart = now - 7 * 24 * 3600 * 1000;
  const weekEntries = entries.filter((e) => e.timestamp >= weekStart);
  if (weekEntries.length === 0) return '—';
  const avg = weekEntries.reduce((s, e) => s + e.level, 0) / weekEntries.length;
  const emojis = ['', '😢', '😕', '😐', '🙂', '😄'];
  return emojis[Math.round(avg)] || '😐';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A2138', marginBottom: 24 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  moodItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
    minWidth: 62,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moodEmoji: { fontSize: 28, marginBottom: 4 },
  moodLabel: { fontSize: 11, color: '#6B7394', fontWeight: '500' },
  journalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  journalLabel: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
  journalInput: {
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1A2138',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 16, borderWidth: 1.5, borderColor: '#CBD5E0', backgroundColor: '#fff' },
  tagSelected: { backgroundColor: '#EBF4FF', borderColor: '#4A90D9' },
  tagText: { fontSize: 13, color: '#6B7394', fontWeight: '500' },
  tagTextSelected: { color: '#4A90D9', fontWeight: '600' },
  saveBtn: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  savedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EAFAF1', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#A9DFBF' },
  savedTitle: { fontSize: 14, fontWeight: '600', color: '#1A2138' },
  savedSub: { fontSize: 12, color: '#6B7394' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF3CD', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFE69C' },
  streakEmoji: { fontSize: 28 },
  streakTitle: { fontSize: 15, fontWeight: '700', color: '#856404' },
  streakSub: { fontSize: 13, color: '#856404' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A2138', marginBottom: 12 },
  weekCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    justifyContent: 'space-around',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDot: { width: 30, height: 30, borderRadius: 15 },
  weekLabel: { fontSize: 11, color: '#6B7394', fontWeight: '500' },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EBF4FF', borderRadius: 12, padding: 14 },
  insightText: { fontSize: 14, color: '#4A5568', flex: 1 },
});
