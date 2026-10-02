import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Typography } from '../ui/Typography';
import { Divider } from '../ui/Divider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { AIResult, ReportStatus } from '../../types';

interface AIVerificationCardProps {
  status: ReportStatus;
  aiResult: AIResult | null;
}

export function AIVerificationCard({ status, aiResult }: AIVerificationCardProps) {
  // Loading / pending state
  if (!aiResult || status === 'uploading' || status === 'pending' || status === 'ai_processing') {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <View style={styles.loadingText}>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              AI Verification
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              {status === 'uploading' ? 'Uploading photo…' : 'Running MobileNetV2 classifier…'}
            </Typography>
          </View>
        </View>
      </Card>
    );
  }

  const isMatch = aiResult.isMatch;
  const confidence = aiResult.confidenceScore;
  const confidenceColor =
    confidence >= 90 ? colors.successText :
    confidence >= 75 ? colors.warningText :
    colors.dangerText;

  const fillColor =
    confidence >= 90 ? '#10B981' :
    confidence >= 75 ? '#F59E0B' :
    '#EF4444';

  return (
    <Card style={styles.card} padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="subheadMedium" color={colors.textPrimary}>
            AI Verification
          </Typography>
          <Typography variant="footnote" color={colors.textSecondary}>
            MobileNetV2 · {aiResult.modelVersion}
          </Typography>
        </View>
        <View style={[styles.modePill, aiResult.inferenceMode === 'on_device' ? styles.onDevice : styles.serverMode]}>
          <Typography
            variant="overline"
            color={aiResult.inferenceMode === 'on_device' ? colors.infoText : colors.textSecondary}
          >
            {aiResult.inferenceMode === 'on_device' ? 'On-Device' : 'Server'}
          </Typography>
        </View>
      </View>

      <Divider />

      {/* Confidence */}
      <View style={styles.section}>
        <View style={styles.confidenceRow}>
          <Typography variant="footnote" color={colors.textSecondary}>
            Confidence Score
          </Typography>
          <Typography variant="footnoteSemiBold" color={confidenceColor}>
            {confidence}%
          </Typography>
        </View>
        <ProgressBar value={confidence} fillColor={fillColor} style={styles.bar} />
      </View>

      <Divider />

      {/* Stage comparison */}
      <View style={styles.section}>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonCell}>
            <Typography variant="overline" color={colors.textTertiary}>Reported</Typography>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              {STAGE_LABELS[aiResult.reportedStage]}
            </Typography>
          </View>
          <View style={styles.arrow}>
            <Typography variant="headline" color={isMatch ? colors.successText : colors.warningText}>
              {isMatch ? '=' : '≠'}
            </Typography>
          </View>
          <View style={styles.comparisonCell}>
            <Typography variant="overline" color={colors.textTertiary}>Detected</Typography>
            <Typography
              variant="subheadMedium"
              color={isMatch ? colors.textPrimary : colors.warningText}
            >
              {STAGE_LABELS[aiResult.detectedStage]}
            </Typography>
          </View>
        </View>
      </View>

      {/* Verdict banner */}
      <View style={[styles.verdict, isMatch ? styles.verdictMatch : styles.verdictMismatch]}>
        <Typography
          variant="subheadMedium"
          color={isMatch ? colors.successText : colors.warningText}
        >
          {isMatch
            ? `Stage confirmed — ${confidence}% confidence`
            : `Stage mismatch detected — review required`}
        </Typography>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  modePill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  onDevice: {
    backgroundColor: colors.infoBg,
    borderColor: colors.infoBorder,
  },
  serverMode: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.separator,
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  bar: {},
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  comparisonCell: {
    flex: 1,
    gap: 2,
  },
  arrow: {
    width: 24,
    alignItems: 'center',
  },
  verdict: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  verdictMatch: {
    backgroundColor: colors.successBg,
  },
  verdictMismatch: {
    backgroundColor: colors.warningBg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingText: {
    gap: 2,
  },
});
