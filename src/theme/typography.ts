/**
 * Typography system for Dr. Sage app.
 * Uses system fonts (San Francisco on iOS, Roboto on Android).
 */
import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyBold = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
} as const;

export const FontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const LineHeights = {
  xs: 16,
  sm: 18,
  md: 22,
  lg: 24,
  xl: 28,
  xxl: 34,
  xxxl: 42,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1.0,
} as const;

export const Typography = {
  fontFamily,
  fontFamilyMedium,
  fontFamilyBold,

  sizes: FontSizes,
  weights: FontWeights,
  lineHeights: LineHeights,
  letterSpacing: LetterSpacing,

  // Pre-composed text styles
  styles: {
    // Headings
    h1: {
      fontFamily: fontFamilyBold,
      fontSize: FontSizes.xxxl,
      fontWeight: FontWeights.bold,
      lineHeight: LineHeights.xxxl,
      letterSpacing: LetterSpacing.tight,
    } as TextStyle,
    h2: {
      fontFamily: fontFamilyBold,
      fontSize: FontSizes.xxl,
      fontWeight: FontWeights.bold,
      lineHeight: LineHeights.xxl,
      letterSpacing: LetterSpacing.tight,
    } as TextStyle,
    h3: {
      fontFamily: fontFamilyBold,
      fontSize: FontSizes.xl,
      fontWeight: FontWeights.semibold,
      lineHeight: LineHeights.xl,
      letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    // Body
    bodyLarge: {
      fontFamily,
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.regular,
      lineHeight: LineHeights.lg,
      letterSpacing: LetterSpacing.normal,
    } as TextStyle,
    body: {
      fontFamily,
      fontSize: FontSizes.md,
      fontWeight: FontWeights.regular,
      lineHeight: LineHeights.md,
      letterSpacing: LetterSpacing.normal,
    } as TextStyle,
    bodySmall: {
      fontFamily,
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.regular,
      lineHeight: LineHeights.sm,
      letterSpacing: LetterSpacing.normal,
    } as TextStyle,

    // Labels
    label: {
      fontFamily: fontFamilyMedium,
      fontSize: FontSizes.md,
      fontWeight: FontWeights.medium,
      lineHeight: LineHeights.md,
      letterSpacing: LetterSpacing.normal,
    } as TextStyle,
    labelSmall: {
      fontFamily: fontFamilyMedium,
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.medium,
      lineHeight: LineHeights.sm,
      letterSpacing: LetterSpacing.wide,
    } as TextStyle,

    // Caption
    caption: {
      fontFamily,
      fontSize: FontSizes.xs,
      fontWeight: FontWeights.regular,
      lineHeight: LineHeights.xs,
      letterSpacing: LetterSpacing.wide,
    } as TextStyle,

    // Button
    button: {
      fontFamily: fontFamilyMedium,
      fontSize: FontSizes.md,
      fontWeight: FontWeights.semibold,
      lineHeight: LineHeights.md,
      letterSpacing: LetterSpacing.wide,
    } as TextStyle,
    buttonSmall: {
      fontFamily: fontFamilyMedium,
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.semibold,
      lineHeight: LineHeights.sm,
      letterSpacing: LetterSpacing.wide,
    } as TextStyle,
  },
} as const;
