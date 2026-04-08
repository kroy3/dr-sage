import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '@/theme';
import { BorderRadius } from '@/theme/spacing';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  color,
  height = 8,
  style,
}: ProgressBarProps) {
  const colors = useThemeColors();
  const barColor = color ?? colors.primary;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, progress));
    animatedProgress.value = withTiming(clamped, { duration: 400 });
  }, [progress, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%` as any,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: colors.surfaceSecondary,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.bar,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: barColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
