/**
 * Theme barrel export for Dr. Sage app.
 */

export { Colors, type ThemeColors, type ColorScheme } from './colors';
export { Typography, FontSizes, FontWeights, LineHeights, LetterSpacing } from './typography';
export { Spacing, BorderRadius } from './spacing';
export { Shadows, type ShadowStyle } from './shadows';

import { Colors, ThemeColors } from './colors';

/**
 * Hook to get the current theme colors.
 * TODO: Integrate with useThemeStore from @/stores/useThemeStore
 * once the store is implemented. For now, defaults to light theme.
 */
export function useThemeColors(): ThemeColors {
  // TODO: Read from useThemeStore to get 'light' | 'dark' preference
  // import { useThemeStore } from '@/stores/useThemeStore';
  // const scheme = useThemeStore((s) => s.colorScheme);
  // return Colors[scheme];
  return Colors.light;
}
