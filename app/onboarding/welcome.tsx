import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';

const { width } = Dimensions.get('window');

const features = [
  { icon: 'shield-checkmark-outline' as const, text: 'Evidence-based guidance' },
  { icon: 'trending-up-outline' as const, text: 'Track your mood journey' },
  { icon: 'book-outline' as const, text: 'Learn psychological concepts' },
];

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#4A90D9', '#7DB3E8', '#F0F4F8']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🧠</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Welcome to Dr. Sage</Text>
          <Text style={styles.subtitle}>
            Your personal space for mental wellness{'\n'}and self-discovery
          </Text>

          {/* Features */}
          <View style={styles.features}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={20} color="#4A90D9" />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Button
            title="Get Started"
            onPress={() => router.push('/onboarding/personalize')}
            variant="primary"
            size="lg"
            style={styles.button}
          />
          <Text style={styles.disclaimer}>
            Not a replacement for professional therapy
          </Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: { marginBottom: 32 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: { fontSize: 48 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  features: { width: '100%', marginBottom: 48, gap: 16 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500', flex: 1 },
  button: { width: '100%', marginBottom: 16 },
  disclaimer: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
});
