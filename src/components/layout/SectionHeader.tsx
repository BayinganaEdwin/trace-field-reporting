import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '../ui/Typography';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <Typography variant="footnoteSemiBold" color={colors.textSecondary}>
        {title.toUpperCase()}
      </Typography>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
});
