/**
 * Color palette for Dr. Sage virtual counselor app.
 * Uses a calming, therapeutic aesthetic with soft blues and sage greens.
 */

const palette = {
  // Primary - Calming Blue
  blue50: '#EBF2FB',
  blue100: '#C8DDF4',
  blue200: '#A5C8ED',
  blue300: '#82B3E6',
  blue400: '#4A90D9',
  blue500: '#3A7BC8',
  blue600: '#2A66B7',
  blue700: '#1E529A',
  blue800: '#153D7D',
  blue900: '#0D2960',

  // Accent - Sage Green
  sage50: '#EDF8F2',
  sage100: '#CFEDDC',
  sage200: '#B0E2C6',
  sage300: '#8FD7B0',
  sage400: '#6EC6A0',
  sage500: '#5AB58E',
  sage600: '#48A47C',
  sage700: '#378B67',
  sage800: '#287253',
  sage900: '#1A5940',

  // Warm Neutrals
  warmWhite: '#FAF8F5',
  cream: '#F5F0E8',
  sand: '#E8E0D4',
  warmGray100: '#F0ECE6',
  warmGray200: '#DDD6CC',
  warmGray300: '#C4BAA8',
  warmGray400: '#A89E8C',
  warmGray500: '#8C8070',
  warmGray600: '#706454',
  warmGray700: '#544A3C',
  warmGray800: '#3A3228',
  warmGray900: '#201C16',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Semantic
  red50: '#FEF2F2',
  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',

  amber50: '#FFFBEB',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  green50: '#F0FDF4',
  green400: '#4ADE80',
  green500: '#22C55E',
  green600: '#16A34A',

  sky50: '#F0F9FF',
  sky400: '#38BDF8',
  sky500: '#0EA5E9',
  sky600: '#0284C7',
} as const;

export const Colors = {
  light: {
    // Backgrounds
    background: palette.warmWhite,
    backgroundSecondary: palette.cream,
    backgroundTertiary: palette.warmGray100,
    surface: palette.white,
    surfaceSecondary: palette.warmGray100,

    // Primary
    primary: palette.blue400,
    primaryLight: palette.blue100,
    primaryDark: palette.blue600,
    onPrimary: palette.white,

    // Accent
    accent: palette.sage400,
    accentLight: palette.sage100,
    accentDark: palette.sage600,
    onAccent: palette.white,

    // Text
    text: palette.warmGray900,
    textSecondary: palette.warmGray600,
    textTertiary: palette.warmGray400,
    textInverse: palette.white,
    textOnPrimary: palette.white,

    // Borders
    border: palette.warmGray200,
    borderLight: palette.warmGray100,
    borderFocused: palette.blue400,

    // Semantic
    success: palette.green500,
    successLight: palette.green50,
    successDark: palette.green600,
    warning: palette.amber500,
    warningLight: palette.amber50,
    warningDark: palette.amber600,
    error: palette.red500,
    errorLight: palette.red50,
    errorDark: palette.red600,
    info: palette.sky500,
    infoLight: palette.sky50,
    infoDark: palette.sky600,

    // Interactive
    disabled: palette.warmGray200,
    disabledText: palette.warmGray400,
    placeholder: palette.warmGray400,
    overlay: 'rgba(32, 28, 22, 0.5)',
    ripple: 'rgba(74, 144, 217, 0.12)',

    // Components
    cardBackground: palette.white,
    inputBackground: palette.white,
    inputBorder: palette.warmGray200,
    tabBarBackground: palette.white,
    headerBackground: palette.warmWhite,

    // Shadows
    shadowColor: palette.warmGray900,
  },
  dark: {
    // Backgrounds
    background: '#1A1814',
    backgroundSecondary: '#242019',
    backgroundTertiary: '#2E2A22',
    surface: '#2A2620',
    surfaceSecondary: '#343028',

    // Primary
    primary: palette.blue300,
    primaryLight: 'rgba(74, 144, 217, 0.2)',
    primaryDark: palette.blue500,
    onPrimary: palette.warmGray900,

    // Accent
    accent: palette.sage300,
    accentLight: 'rgba(110, 198, 160, 0.2)',
    accentDark: palette.sage500,
    onAccent: palette.warmGray900,

    // Text
    text: '#F0ECE6',
    textSecondary: '#A89E8C',
    textTertiary: '#706454',
    textInverse: palette.warmGray900,
    textOnPrimary: palette.warmGray900,

    // Borders
    border: '#3A3428',
    borderLight: '#2E2A22',
    borderFocused: palette.blue300,

    // Semantic
    success: palette.green400,
    successLight: 'rgba(74, 222, 128, 0.15)',
    successDark: palette.green600,
    warning: palette.amber400,
    warningLight: 'rgba(251, 191, 36, 0.15)',
    warningDark: palette.amber600,
    error: palette.red400,
    errorLight: 'rgba(248, 113, 113, 0.15)',
    errorDark: palette.red600,
    info: palette.sky400,
    infoLight: 'rgba(56, 189, 248, 0.15)',
    infoDark: palette.sky600,

    // Interactive
    disabled: '#3A3428',
    disabledText: '#706454',
    placeholder: '#706454',
    overlay: 'rgba(0, 0, 0, 0.6)',
    ripple: 'rgba(130, 179, 230, 0.15)',

    // Components
    cardBackground: '#2A2620',
    inputBackground: '#2A2620',
    inputBorder: '#3A3428',
    tabBarBackground: '#1A1814',
    headerBackground: '#1A1814',

    // Shadows
    shadowColor: '#000000',
  },
} as const;

export type ThemeColors = typeof Colors.light;
export type ColorScheme = 'light' | 'dark';
