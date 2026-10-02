import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderWidths } from '../../theme/spacing';

interface DividerProps {
  inset?: number;
  style?: ViewStyle;
}

export function Divider({ inset = 0, style }: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        inset > 0 && { marginLeft: inset },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: borderWidths.thin,
    backgroundColor: colors.separator,
    marginVertical: spacing[1],
  },
});
