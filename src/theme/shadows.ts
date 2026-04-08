/**
 * Platform-specific shadow definitions.
 * iOS uses shadow* properties, Android uses elevation.
 */
import { Platform, ViewStyle } from 'react-native';

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

const createShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
): ShadowStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: Platform.OS === 'ios' ? opacity : 0,
  shadowRadius: Platform.OS === 'ios' ? radius : 0,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

export const Shadows = {
  none: createShadow('transparent', 0, 0, 0, 0),

  small: createShadow('#201C16', 1, 0.08, 3, 2),

  medium: createShadow('#201C16', 2, 0.12, 6, 4),

  large: createShadow('#201C16', 4, 0.16, 12, 8),
} as const;
