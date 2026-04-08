import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTermById } from '../../data/knowledge-base';

const COLLECTION_COLORS: Record<string, { bg: string; text: string }> = {
  approaches: { bg: '#EBF4FF', text: '#4A90D9' },
  techniques: { bg: '#EAFAF1', text: '#27AE60' },
  disorders: { bg: '#F4EEFF', text: '#7B68EE' },
  coping: { bg: '#FEF3E8', text: '#E67E22' },
  glossary: { bg: '#F0F4F8', text: '#6B7394' },
};

export default function TermDetailScreen() {
  const { termId } = useLocalSearchParams<{ termId: string }>();
  const term = termId ? getTermById(termId) : null;

  if (!term) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Term not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = term.name || term.term || 'Unknown';
  const category = term.category || 'general';

  const askDrSage = () => {
    router.push('/(tabs)/chat');
    // Pre-populate will be handled via a global store or route param in a future enhancement
    Alert.alert('Ask Dr. Sage', `Navigate to chat and ask about "${name}" to get personalized guidance.`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Category Badge */}
        <View style={[styles.badge, { backgroundColor: COLLECTION_COLORS[term.collection]?.bg || '#F0F4F8' }]}>
          <Text style={[styles.badgeText, { color: COLLECTION_COLORS[term.collection]?.text || '#6B7394' }]}>
            {term.collection || category}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{name}</Text>

        {/* Full Description */}
        <Text style={styles.bodyText}>{term.fullDescription || term.definition || term.description || term.shortDescription || ''}</Text>

        {/* Disclaimer for disorders */}
        {term.collection === 'disorders' && (
          <View style={styles.disclaimerCard}>
            <Ionicons name="warning-outline" size={18} color="#E67E22" />
            <Text style={styles.disclaimerText}>
              This information is educational only and does not constitute medical advice. Please consult a licensed mental health professional for diagnosis and treatment.
            </Text>
          </View>
        )}

        {/* Key Principles (approaches) */}
        {term.keyPrinciples && term.keyPrinciples.length > 0 && (
          <DetailSection title="Key Principles">
            {term.keyPrinciples.map((p: string, i: number) => (
              <BulletItem key={i} text={p} />
            ))}
          </DetailSection>
        )}

        {/* Steps (techniques) */}
        {term.steps && term.steps.length > 0 && (
          <DetailSection title="How to Practice">
            {term.steps.map((s: string, i: number) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </DetailSection>
        )}

        {/* Symptoms (disorders) */}
        {term.symptoms && term.symptoms.length > 0 && (
          <DetailSection title="Common Symptoms">
            {term.symptoms.map((s: string, i: number) => (
              <BulletItem key={i} text={s} />
            ))}
          </DetailSection>
        )}

        {/* Best For */}
        {term.bestFor && term.bestFor.length > 0 && (
          <DetailSection title="Best For">
            <View style={styles.tagRow}>
              {term.bestFor.map((t: string, i: number) => (
                <View key={i} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
              ))}
            </View>
          </DetailSection>
        )}

        {/* Metadata */}
        {term.founders && <MetaRow label="Developed by" value={term.founders} />}
        {term.yearDeveloped && <MetaRow label="Year" value={term.yearDeveloped} />}
        {term.evidenceLevel && <MetaRow label="Evidence Level" value={term.evidenceLevel} />}
        {term.prevalence && <MetaRow label="Prevalence" value={term.prevalence} />}
        {term.timeRequired && <MetaRow label="Time Required" value={term.timeRequired} />}
        {term.difficulty && <MetaRow label="Difficulty" value={term.difficulty} />}

        {/* Example */}
        {term.example && (
          <View style={styles.exampleCard}>
            <Text style={styles.exampleLabel}>Example</Text>
            <Text style={styles.exampleText}>{term.example}</Text>
          </View>
        )}

        {/* References */}
        {term.references && term.references.length > 0 && (
          <DetailSection title="References">
            {term.references.map((r: string, i: number) => (
              <Text key={i} style={styles.reference}>• {r}</Text>
            ))}
          </DetailSection>
        )}

        {/* Ask Dr. Sage */}
        <TouchableOpacity style={styles.askBtn} onPress={askDrSage}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
          <Text style={styles.askBtnText}>Ask Dr. Sage about this</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 20, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: '#6B7394' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  title: { fontSize: 26, fontWeight: '800', color: '#1A2138', marginBottom: 16, lineHeight: 34 },
  bodyText: { fontSize: 15, color: '#4A5568', lineHeight: 25, marginBottom: 20 },
  disclaimerCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF3E8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FAD7A0',
  },
  disclaimerText: { flex: 1, fontSize: 13, color: '#856404', lineHeight: 19 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A2138', marginBottom: 12 },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A90D9', marginTop: 8, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, color: '#4A5568', lineHeight: 21 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#4A90D9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  stepText: { flex: 1, fontSize: 14, color: '#4A5568', lineHeight: 21 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#EBF4FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 13, color: '#4A90D9', fontWeight: '500' },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  metaLabel: { fontSize: 14, fontWeight: '600', color: '#6B7394' },
  metaValue: { fontSize: 14, color: '#1A2138', flex: 1 },
  exampleCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#4A90D9' },
  exampleLabel: { fontSize: 12, fontWeight: '700', color: '#4A90D9', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  exampleText: { fontSize: 14, color: '#4A5568', lineHeight: 21, fontStyle: 'italic' },
  reference: { fontSize: 12, color: '#6B7394', lineHeight: 18, marginBottom: 4 },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
  },
  askBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
