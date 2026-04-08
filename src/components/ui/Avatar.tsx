import React from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType, ViewStyle } from 'react-native';
import { useThemeColors } from '@/theme';
import { Typography } from '@/theme/typography';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, { container: number; fontSize: number }> = {
  sm: { container: 32, fontSize: 13 },
  md: { container: 44, fontSize: 17 },
  lg: { container: 64, fontSize: 26 },
};

// Deterministic color from a name string for the fallback background
const fallbackColors = [
  '#4A90D9', '#6EC6A0', '#E8A87C', '#C38ED9',
  '#71C9CE', '#D9A066', '#8C9EFF', '#FF8A80',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

export default function Avatar({ source, name, size = 'md', style }: AvatarProps) {
  const colors = useThemeColors();
  const { container: containerSize, fontSize } = sizeMap[size];
  const borderRadius = containerSize / 2;

  if (source) {
    return (
      <Image
        source={source}
        style={[
          {
            width: containerSize,
            height: containerSize,
            borderRadius,
          },
          style,
        ]}
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const bgColor = name ? getColorForName(name) : colors.primary;

  return (
    <View
      style={[
        styles.fallback,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      <Text style={[{ fontSize, color: '#FFFFFF', fontWeight: '600' }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
