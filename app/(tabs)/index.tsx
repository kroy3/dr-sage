import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/stores/useUserStore';
import { useChatStore } from '@/stores/useChatStore';
import { useMoodStore } from '@/stores/useMoodStore';
import { getGreeting, getRelativeTime } from '@/utils/dateHelpers';
import * as Haptics from 'expo-haptics';

const DAILY_INSIGHTS = [
  'Taking small steps consistently is more powerful than waiting for the perfect moment.',
  'Your feelings are valid. All of them — even the ones that feel uncomfortable.',
  'Rest is not a reward. Rest is a necessity for a healthy mind.',
  'Breathing slowly for 60 seconds activates your parasympathetic nervous system.',
  'Self-compassion is treating yourself with the same kindness you\'d offer a good friend.',
  'Progress often looks like two steps forward, one step back. That\'s still progress.',
  'The present moment is the only place where life actually happens.',
  'Naming an emotion reduces its intensity — this is called "affect labeling."',
  'Connection is one of the most powerful buffers against stress and anxiety.',
  'You don\'t have to feel motivated to take action — action often creates motivation.',
  'Gratitude rewires the brain toward noticing positives without denying negatives.',
  'Discomfort is often a signal that you are growing.',
  'It\'s okay to ask for help. Doing so is a sign of wisdom, not weakness.',
  'Small moments of joy matter. Savoring them builds emotional resilience.',
];

function getDailyInsight() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_INSIGHTS[dayOfYear % DAILY_INSIGHTS.length];
}

export default function HomeScreen() {
  const name = useUserStore((s) => s.profile.name);
  const { sessions, loadSessions } = useChatStore();
  const { entries, loadEntries, currentStreak } = useMoodStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadSessions();
    loadEntries(7);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSessions(), loadEntries(7)]);
    setRefreshing(false);
  };

  const recentSessions = sessions.slice(0, 3);
  const weekMoods = getWeekMoods(entries);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90D9" />}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetText}>{getGreeting(name)} 👋</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          {currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {currentStreak}</Text>
            </View>
          )}
        </View>

        {/* Daily Insight */}
        <LinearGradient colors={['#4A90D9', '#7B68EE']} style={styles.insightCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.insightLabel}>Daily Insight</Text>
          </View>
          <Text style={styles.insightText}>{getDailyInsight()}</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <ActionCard icon="chatbubble-ellipses" label="Talk to Dr. Sage" color="#EBF4FF" iconColor="#4A90D9" onPress={() => { Haptics.impactAsync(); router.push('/(tabs)/chat'); }} />
          <ActionCard icon="happy" label="Log Mood" color="#EAFAF1" iconColor="#27AE60" onPress={() => { Haptics.impactAsync(); router.push('/(tabs)/mood'); }} />
          <ActionCard icon="book" label="Learn" color="#F4EEFF" iconColor="#7B68EE" onPress={() => { Haptics.impactAsync(); router.push('/(tabs)/library'); }} />
        </View>

        {/* Mood This Week */}
        <Text style={styles.sectionTitle}>This Week's Mood</Text>
        <View style={styles.moodWeekCard}>
          {weekMoods.map((m, i) => (
            <View key={i} style={styles.moodDayCol}>
              <View style={[styles.moodDot, { backgroundColor: m.color }]} />
              <Text style={styles.moodDayLabel}>{m.day}</Text>
            </View>
          ))}
        </View>

        {/* Recent Sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {recentSessions.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentSessions.length === 0 ? (
          <TouchableOpacity style={styles.emptySession} onPress={() => router.push('/(tabs)/chat')}>
            <Ionicons name="chatbubble-outline" size={32} color="#4A90D9" />
            <Text style={styles.emptySessionText}>Start your first conversation with Dr. Sage</Text>
            <Text style={styles.emptySessionSub}>Tap to begin →</Text>
          </TouchableOpacity>
        ) : (
          recentSessions.map((session) => (
            <TouchableOpacity key={session.id} style={styles.sessionCard} onPress={() => router.push(`/history/${session.id}` as any)}>
              <View style={styles.sessionIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4A90D9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle} numberOfLines={1}>{session.title || 'Conversation'}</Text>
                <Text style={styles.sessionMeta}>{getRelativeTime(session.updatedAt)} · {session.messageCount} messages</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E0" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, label, color, iconColor, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={26} color={iconColor} />
      <Text style={[styles.actionLabel, { color: iconColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getWeekMoods(entries: any[]) {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const moodColors: Record<number, string> = {
    1: '#E74C3C', 2: '#E67E22', 3: '#F1C40F', 4: '#2ECC71', 5: '#27AE60',
  };

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const entry = entries.find((e) => {
      const ed = new Date(e.timestamp);
      return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth();
    });
    return {
      day: days[i],
      color: entry ? moodColors[entry.level] || '#CBD5E0' : '#E2E8F0',
    };
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greetText: { fontSize: 22, fontWeight: '700', color: '#1A2138' },
  dateText: { fontSize: 14, color: '#6B7394', marginTop: 2 },
  streakBadge: { backgroundColor: '#FFF3CD', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { fontSize: 14, fontWeight: '600', color: '#856404' },
  insightCard: { borderRadius: 16, padding: 20, marginBottom: 24 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  insightLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightText: { fontSize: 15, color: '#fff', lineHeight: 23, fontStyle: 'italic' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A2138', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 14, color: '#4A90D9', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  moodWeekCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    justifyContent: 'space-around',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moodDayCol: { alignItems: 'center', gap: 6 },
  moodDot: { width: 28, height: 28, borderRadius: 14 },
  moodDayLabel: { fontSize: 11, color: '#6B7394', fontWeight: '500' },
  emptySession: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#EBF4FF',
    borderStyle: 'dashed',
  },
  emptySessionText: { fontSize: 15, color: '#4A5568', textAlign: 'center', fontWeight: '500' },
  emptySessionSub: { fontSize: 14, color: '#4A90D9', fontWeight: '600' },
  sessionCard: {
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
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: { fontSize: 15, fontWeight: '600', color: '#1A2138' },
  sessionMeta: { fontSize: 13, color: '#6B7394', marginTop: 2 },
});
