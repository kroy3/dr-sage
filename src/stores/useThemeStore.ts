import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import type { ThemePreference } from '@/types/user';

type EffectiveTheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setTheme: (mode: ThemePreference) => void;
}

function resolveEffectiveTheme(mode: ThemePreference): EffectiveTheme {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      effectiveTheme: resolveEffectiveTheme('system'),

      setTheme: (mode: ThemePreference) =>
        set({
          mode,
          effectiveTheme: resolveEffectiveTheme(mode),
        }),
    }),
    {
      name: 'dr-sage-theme',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Re-resolve effective theme on rehydration in case system theme changed
        if (state) {
          state.effectiveTheme = resolveEffectiveTheme(state.mode);
        }
      },
    }
  )
);

// Listen for system appearance changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState();
  if (mode === 'system') {
    useThemeStore.setState({
      effectiveTheme: colorScheme === 'dark' ? 'dark' : 'light',
    });
  }
});
