import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '@/services/storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
      } catch (e) {
        console.warn('Database init failed:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="library/[termId]"
          options={{ headerShown: true, title: '', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="history/index"
          options={{ headerShown: true, title: 'Session History', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="history/[sessionId]"
          options={{ headerShown: true, title: 'Session', headerBackTitle: 'History' }}
        />
      </Stack>
    </>
  );
}
