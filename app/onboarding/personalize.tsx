import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';
import { useUserStore } from '@/stores/useUserStore';
import * as Haptics from 'expo-haptics';

const GOALS = [
  'Manage Anxiety', 'Improve Mood', 'Build Resilience', 'Better Sleep',
  'Stress Management', 'Self-Discovery', 'Better Relationships', 'Emotional Intelligence',
];

const STYLES = [
  { key: 'empathetic', label: 'Gentle & Supportive', icon: '🤗', desc: 'Warm, reassuring tone with plenty of encouragement' },
  { key: 'direct', label: 'Direct & Practical', icon: '🎯', desc: 'Clear, action-oriented guidance without excess framing' },
  { key: 'analytical', label: 'Curious & Exploratory', icon: '🔍', desc: 'Deep questions and thoughtful exploration of ideas' },
];

export default function PersonalizeScreen() {
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('empathetic');
  const updateProfile = useUserStore((s) => s.updateProfile);

  const canProceed = name.trim().length > 0 && selectedGoals.length > 0;

  const toggleGoal = (goal: string) => {
    Haptics.selectionAsync();
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleContinue = () => {
    updateProfile({
      name: name.trim(),
      goals: selectedGoals,
      communicationStyle: selectedStyle as any,
    });
    router.push('/onboarding/consent');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#4A90D9" />
          </TouchableOpacity>

          <Text style={styles.title}>Let's personalize{'\n'}your experience</Text>
          <Text style={styles.subtitle}>Help Dr. Sage understand how to support you best.</Text>

          {/* Name */}
          <View style={styles.section}>
            <Input
              label="What should Dr. Sage call you?"
              value={name}
              onChangeText={setName}
              placeholder="Your name..."
            />
          </View>

          {/* Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What are your wellness goals?</Text>
            <Text style={styles.sectionHint}>Select all that apply</Text>
            <View style={styles.chipGrid}>
              {GOALS.map((goal) => {
                const selected = selectedGoals.includes(goal);
                return (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => toggleGoal(goal)}
                    activeOpacity={0.7}
                  >
                    {selected && <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} />}
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{goal}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Communication Style */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How do you prefer to communicate?</Text>
            {STYLES.map((style) => (
              <TouchableOpacity
                key={style.key}
                style={[styles.styleCard, selectedStyle === style.key && styles.styleCardSelected]}
                onPress={() => { Haptics.selectionAsync(); setSelectedStyle(style.key); }}
                activeOpacity={0.8}
              >
                <Text style={styles.styleEmoji}>{style.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.styleLabel, selectedStyle === style.key && styles.styleLabelSelected]}>
                    {style.label}
                  </Text>
                  <Text style={styles.styleDesc}>{style.desc}</Text>
                </View>
                {selectedStyle === style.key && (
                  <Ionicons name="checkmark-circle" size={22} color="#4A90D9" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!canProceed}
            variant="primary"
            size="lg"
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 24, paddingTop: 16 },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '700', color: '#1A2138', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7394', marginBottom: 32, lineHeight: 24 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A2138', marginBottom: 4 },
  sectionHint: { fontSize: 13, color: '#6B7394', marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  chipText: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  styleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  styleCardSelected: { borderColor: '#4A90D9', backgroundColor: '#EBF4FF' },
  styleEmoji: { fontSize: 28 },
  styleLabel: { fontSize: 15, fontWeight: '600', color: '#1A2138', marginBottom: 2 },
  styleLabelSelected: { color: '#4A90D9' },
  styleDesc: { fontSize: 13, color: '#6B7394', lineHeight: 18 },
  btn: { marginTop: 8, marginBottom: 32 },
});
