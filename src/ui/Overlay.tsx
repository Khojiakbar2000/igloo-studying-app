import React, { type ComponentProps, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { colors, ui } from '../theme';

export function Overlay({ children, animationType, ...props }: ComponentProps<typeof Modal> & { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return <Modal {...props} transparent animationType={reduceMotion ? 'none' : animationType ?? 'fade'} statusBarTranslucent navigationBarTranslucent>
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.scrim },
  content: { flex: 1 },
});

export function SheetSurface({ children, style, accessibilityLabel }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  return <View accessibilityLabel={accessibilityLabel} style={[ui.card, style]}>{children}</View>;
}
