import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { useUserStore } from '@/stores/useUserStore';
import * as Haptics from 'expo-haptics';

const POINTS = [
  {
    icon: 'person-outline' as const,
    title: 'AI Companion, Not a Therapist',
    text: 'Dr. Sage is an AI wellness companion. It is not a licensed therapist and cannot provide clinical diagnosis, treatment, or medical advice.',
  },
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Your Data Stays on Your Device',
    text: 'Conversations are stored only on your device. Only your messages to Dr. Sage are sent to an AI service for responses.',
  },
  {
    icon: 'warning-outline' as const,
    title: 'Crisis Situations',
    text: 'If you are experiencing a mental health crisis, please contact the 988 Suicide & Crisis Lifeline (call or text 988) or your local emergency services.',
  },
  {
    icon: 'information-circle-outline' as const,
    title: 'For Educational Use',
    text: 'Psychological information provided is for educational purposes only. Always consult a qualified mental health professional for personal medical concerns.',
  },
];

export default function ConsentScreen() {
  const [agreed, setAgreed] = useState(false);
  const { giveConsent, completeOnboarding } = useUserStore();

  const handleStart = () => {
    giveConsent();
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#4A90D9" />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#4A90D9" />
          </View>
        </View>

        <Text style={styles.title}>Before we begin</Text>
        <Text style={styles.subtitle}>
          Please take a moment to understand how Dr. Sage works.
        </Text>

        {/* Points */}
        <View style={styles.card}>
          {POINTS.map((point, i) => (
            <View key={i} style={[styles.point, i < POINTS.length - 1 && styles.pointBorder]}>
              <View style={styles.pointIcon}>
                <Ionicons name={point.icon} size={20} color="#4A90D9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointText}>{point.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => { Haptics.selectionAsync(); setAgreed(!agreed); }}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkLabel}>
            I understand that Dr. Sage is an AI companion and not a licensed mental health professional.
          </Text>
        </TouchableOpacity>

        <Button
          title="Start My Journey"
          onPress={handleStart}
          disabled={!agreed}
          variant="primary"
          size="lg"
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 24 },
  backBtn: { marginBottom: 16 },
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1A2138', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7394', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  point: { flexDirection: 'row', gap: 12, padding: 14 },
  pointBorder: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  pointIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pointTitle: { fontSize: 14, fontWeight: '600', color: '#1A2138', marginBottom: 3 },
  pointText: { fontSize: 13, color: '#6B7394', lineHeight: 19 },
  checkRow: { flexDirection: 'row', gap: 12, marginBottom: 28, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#4A90D9', borderColor: '#4A90D9' },
  checkLabel: { flex: 1, fontSize: 14, color: '#4A5568', lineHeight: 21 },
  btn: { marginBottom: 32 },
});
