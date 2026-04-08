import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/theme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

type BadgeVariant = 'filled' | 'outline';

interface BadgeProps {
  label: string;
  color?: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export default function Badge({
  label,
  color,
  variant = 'filled',
  style,
}: BadgeProps) {
  const colors = useThemeColors();
  const badgeColor = color ?? colors.primary;

  const containerStyle: ViewStyle =
    variant === 'filled'
      ? {
          backgroundColor: badgeColor,
        }
      : {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: badgeColor,
        };

  const textColor = variant === 'filled' ? colors.textInverse : badgeColor;

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Text style={[Typography.styles.caption, { color: textColor, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
});
