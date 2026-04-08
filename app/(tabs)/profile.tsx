import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useMoodStore } from '@/stores/useMoodStore';
import { useChatStore } from '@/stores/useChatStore';
import * as Haptics from 'expo-haptics';

const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const { profile, preferences, updatePreferences, resetUser } = useUserStore();
  const { mode, setTheme } = useThemeStore();
  const { currentStreak } = useMoodStore();
  const { sessions } = useChatStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(preferences.notificationsEnabled);
  const [weeklyReport, setWeeklyReport] = useState(preferences.weeklyReportEnabled);

  const toggleNotifications = (val: boolean) => {
    Haptics.selectionAsync();
    setNotificationsEnabled(val);
    updatePreferences({ notificationsEnabled: val });
  };

  const toggleWeekly = (val: boolean) => {
    Haptics.selectionAsync();
    setWeeklyReport(val);
    updatePreferences({ weeklyReportEnabled: val });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your conversations and mood history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            resetUser();
            Alert.alert('Data cleared', 'All data has been removed.');
          },
        },
      ]
    );
  };

  const initial = profile.name ? profile.name[0].toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name || 'User'}</Text>
          <Text style={styles.profileSub}>Member since {new Date().getFullYear()}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={sessions.length} label="Sessions" icon="chatbubble-outline" />
          <StatCard value={currentStreak} label="Day Streak" icon="flame-outline" />
          <StatCard value={profile.goals?.length || 0} label="Goals" icon="flag-outline" />
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Theme</Text>
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.themeBtn, mode === t && styles.themeBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setTheme(t); }}
              >
                <Text style={styles.themeIcon}>
                  {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '📱'}
                </Text>
                <Text style={[styles.themeLabel, mode === t && styles.themeLabelActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <SettingRow
            label="Daily Check-in Reminder"
            right={<Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: '#4A90D9' }} />}
          />
          <SettingRow
            label="Weekly Wellness Report"
            right={<Switch value={weeklyReport} onValueChange={toggleWeekly} trackColor={{ true: '#4A90D9' }} />}
            noBorder
          />
        </View>

        {/* Goals */}
        <SectionHeader title="My Goals" />
        <View style={styles.card}>
          <View style={styles.goalChips}>
            {(profile.goals || []).map((g) => (
              <View key={g} style={styles.goalChip}>
                <Text style={styles.goalChipText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Crisis Resources */}
        <SectionHeader title="Support" />
        <View style={styles.card}>
          <SettingRow
            icon="call-outline"
            label="Crisis Resources"
            sub="988 Lifeline & support contacts"
            onPress={() => Alert.alert('Crisis Support', 'If you are in crisis, please call or text 988 (US Suicide & Crisis Lifeline).\n\nCrisis Text Line: Text HOME to 741741\n\nYou are not alone. Help is available.')}
          />
          <SettingRow
            icon="information-circle-outline"
            label="About Dr. Sage"
            sub={`Version ${APP_VERSION}`}
            onPress={() => Alert.alert('Dr. Sage', 'Dr. Sage is an AI wellness companion powered by Claude.\n\nThis app provides educational information and supportive conversation, but is not a substitute for professional mental health care.\n\nIn an emergency, call 911.')}
            noBorder
          />
        </View>

        {/* Data */}
        <SectionHeader title="Data & Privacy" />
        <View style={styles.card}>
          <SettingRow
            icon="trash-outline"
            label="Clear All Data"
            sub="Delete all conversations and mood history"
            onPress={handleClearData}
            danger
            noBorder
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: any }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color="#4A90D9" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({ icon, label, sub, right, onPress, danger, noBorder }: any) {
  const content = (
    <View style={[styles.settingRow, !noBorder && styles.settingBorder]}>
      {icon && (
        <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
          <Ionicons name={icon} size={18} color={danger ? '#E74C3C' : '#4A90D9'} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: '#E74C3C' }]}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {right || (onPress && <Ionicons name="chevron-forward" size={16} color="#CBD5E0" />)}
    </View>
  );
  if (!onPress) return content;
  return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingTop: 28, paddingBottom: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#4A90D9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 22, fontWeight: '700', color: '#1A2138' },
  profileSub: { fontSize: 14, color: '#6B7394', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 4 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A2138' },
  statLabel: { fontSize: 11, color: '#6B7394', fontWeight: '500' },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#6B7394', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: { fontSize: 15, fontWeight: '600', color: '#1A2138', paddingTop: 14, marginBottom: 12 },
  themeRow: { flexDirection: 'row', gap: 10, paddingBottom: 16 },
  themeBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', gap: 4 },
  themeBtnActive: { borderColor: '#4A90D9', backgroundColor: '#EBF4FF' },
  themeIcon: { fontSize: 20 },
  themeLabel: { fontSize: 12, color: '#6B7394', fontWeight: '500' },
  themeLabelActive: { color: '#4A90D9', fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  settingIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  settingIconDanger: { backgroundColor: '#FDEDEC' },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1A2138' },
  settingSub: { fontSize: 12, color: '#6B7394', marginTop: 2 },
  goalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 14 },
  goalChip: { backgroundColor: '#EBF4FF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  goalChipText: { fontSize: 13, color: '#4A90D9', fontWeight: '500' },
});
