import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { Typography } from './Typography';
import type { ReportStatus } from '../../types';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantBg: Record<BadgeVariant, string> = {
  success: colors.successBg,
  warning: colors.warningBg,
  danger:  colors.dangerBg,
  info:    colors.infoBg,
  neutral: 'rgba(145,143,160,0.12)',
};

const variantTextColor: Record<BadgeVariant, string> = {
  success: colors.successText,
  warning: colors.warningText,
  danger:  colors.dangerText,
  info:    colors.infoText,
  neutral: colors.textSecondary,
};

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  return (
    <View style={[styles.base, { backgroundColor: variantBg[variant] }, style]}>
      <Typography
        variant="overline"
        color={variantTextColor[variant]}
      >
        {label}
      </Typography>
    </View>
  );
}

// ── Status → Badge variant mapping ───────────────────────────────────────────

const STATUS_VARIANT: Record<ReportStatus, BadgeVariant> = {
  uploading:     'neutral',
  pending:       'info',
  ai_processing: 'info',
  verified:      'success',
  flagged:       'warning',
  approved:      'success',
  rejected:      'danger',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  uploading:     'Uploading',
  pending:       'Pending AI',
  ai_processing: 'Processing',
  verified:      'Verified',
  flagged:       'Flagged',
  approved:      'Approved',
  rejected:      'Rejected',
};

// Dot colors per variant — slightly more saturated than the text
const STATUS_DOT: Record<BadgeVariant, string> = {
  success: '#22A05B',
  warning: '#D97706',
  danger:  '#EF4444',
  info:    '#3B82F6',
  neutral: colors.textTertiary,
};

interface StatusBadgeProps {
  status: ReportStatus;
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const variant = STATUS_VARIANT[status];
  const dotColor = STATUS_DOT[variant];

  return (
    <View style={[styles.base, styles.statusBase, { backgroundColor: variantBg[variant] }, style]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Typography variant="overline" color={variantTextColor[variant]}>
        {STATUS_LABEL[status]}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pill shape — no border. The shape + tint IS the badge.
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],   // slightly more generous
    paddingVertical: 4,
    borderRadius: radii.full,         // fully rounded pill, not a rectangle
  },
  statusBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing[2] + 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
