/**
 * Theme barrel export for Dr. Sage app.
 */

export { Colors, type ThemeColors, type ColorScheme } from './colors';
export { Typography, FontSizes, FontWeights, LineHeights, LetterSpacing } from './typography';
export { Spacing, BorderRadius } from './spacing';
export { Shadows, type ShadowStyle } from './shadows';

import { Colors, ThemeColors } from './colors';
import { useThemeStore } from '@/stores/useThemeStore';

/**
 * Hook to get the current theme colors based on the user's preference
 * (light / dark / system).
 */
export function useThemeColors(): ThemeColors {
  const effectiveTheme = useThemeStore((s) => s.effectiveTheme);
  return Colors[effectiveTheme] ?? Colors.light;
}
