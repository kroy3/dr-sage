import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/theme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

const sizeConfig: Record<ButtonSize, { height: number; paddingHorizontal: number; textStyle: TextStyle }> = {
  sm: {
    height: 36,
    paddingHorizontal: Spacing.md,
    textStyle: Typography.styles.buttonSmall,
  },
  md: {
    height: 48,
    paddingHorizontal: Spacing.lg,
    textStyle: Typography.styles.button,
  },
  lg: {
    height: 56,
    paddingHorizontal: Spacing.xl,
    textStyle: { ...Typography.styles.button, fontSize: 17 },
  },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [disabled, loading, onPress]);

  const { height, paddingHorizontal, textStyle } = sizeConfig[size];

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? colors.disabled : colors.primary,
          },
          text: {
            color: disabled ? colors.disabledText : colors.onPrimary,
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: disabled ? colors.disabled : colors.accent,
          },
          text: {
            color: disabled ? colors.disabledText : colors.onAccent,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: disabled ? colors.disabled : colors.primary,
          },
          text: {
            color: disabled ? colors.disabledText : colors.primary,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: disabled ? colors.disabledText : colors.primary,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 22;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.base,
        { height, paddingHorizontal, borderRadius: BorderRadius.md },
        variantStyles.container,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color as string}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={variantStyles.text.color as string}
              style={styles.icon}
            />
          )}
          <Text style={[textStyle, variantStyles.text]}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
