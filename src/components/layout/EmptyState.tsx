import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '../ui/Typography';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({ title, subtitle, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Typography variant="headline" color={colors.textPrimary} align="center">
        {title}
      </Typography>
      {subtitle ? (
        <Typography
          variant="subhead"
          color={colors.textSecondary}
          align="center"
          style={styles.subtitle}
        >
          {subtitle}
        </Typography>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[8],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  action: {
    marginTop: spacing[5],
  },
});
