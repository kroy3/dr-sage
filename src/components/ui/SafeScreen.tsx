import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/theme';

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  keyboardAvoiding?: boolean;
}

export default function SafeScreen({
  children,
  style,
  keyboardAvoiding = false,
}: SafeScreenProps) {
  const colors = useThemeColors();

  const content = (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }, style]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
      />
      {children}
    </SafeAreaView>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
