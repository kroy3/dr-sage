import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useThemeColors } from '@/theme';
import { Typography } from '@/theme/typography';
import { Spacing, BorderRadius } from '@/theme/spacing';

const AnimatedView = Animated.View;

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  style?: ViewStyle;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  secureTextEntry = false,
  style,
  ...rest
}: InputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
  }, [focusAnim]);

  const borderColor = error
    ? colors.error
    : isFocused
      ? colors.borderFocused
      : colors.inputBorder;

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderWidth: withTiming(isFocused || error ? 1.5 : 1, { duration: 200 }),
    };
  });

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text
          style={[
            Typography.styles.label,
            styles.label,
            { color: error ? colors.error : colors.text },
          ]}
        >
          {label}
        </Text>
      )}
      <AnimatedView
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor,
            borderRadius: BorderRadius.md,
          },
          animatedBorderStyle,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            Typography.styles.body,
            styles.input,
            {
              color: colors.text,
              minHeight: multiline ? 100 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
          {...rest}
        />
      </AnimatedView>
      {error && (
        <Text style={[Typography.styles.caption, styles.error, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    borderWidth: 1,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
