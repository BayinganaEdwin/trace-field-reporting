import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, style, onPress, padded = true }: CardProps) {
  const content = (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,          // 20px — more premium than 16
    // Shadow over border: feels physical, not like a drawn box
    ...Platform.select({
      ios: {
        shadowColor: '#1A1833',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  padded: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
});
