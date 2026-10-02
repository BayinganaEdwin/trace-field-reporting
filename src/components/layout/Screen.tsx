import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
  /**
   * Set to false for screens inside a native-stack with a visible header.
   * The header already consumes the top safe area; adding it here creates
   * a double-inset gap below the navigation bar. Defaults to true (safe
   * for headerless tab screens).
   */
  withTopInset?: boolean;
}

export function Screen({
  children,
  scrollable = true,
  padded = true,
  style,
  contentStyle,
  onRefresh,
  refreshing = false,
  withTopInset = true,
}: ScreenProps) {
  const paddingStyle: ViewStyle = padded
    ? {
        paddingHorizontal: layout.screenPaddingH,
        paddingTop: layout.screenPaddingTop,
        paddingBottom: layout.screenPaddingBottom,
      }
    : {};

  const inner = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[paddingStyle, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, paddingStyle, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, style]}
      edges={withTopInset ? ['top', 'left', 'right'] : ['left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
  flex: { flex: 1 },
});
