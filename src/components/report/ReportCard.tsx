import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Typography } from '../ui/Typography';
import { Divider } from '../ui/Divider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { Report } from '../../types';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function ReportCard({ report, onPress }: ReportCardProps) {
  const hasMismatch = report.aiResult && !report.aiResult.isMatch;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.card} padded={false}>
        {/* Header row */}
        <View style={styles.header}>
          <Avatar name={report.submittedByName} size={36} />
          <View style={styles.headerText}>
            <Typography variant="subheadMedium" color={colors.textPrimary} numberOfLines={1}>
              {report.submittedByName}
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              {report.siteName} · {formatRelativeTime(report.submittedAt)}
            </Typography>
          </View>
          <StatusBadge status={report.status} />
        </View>

        <Divider style={styles.divider} />

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.stageRow}>
            <Typography variant="overline" color={colors.textTertiary}>
              Reported Stage
            </Typography>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              {STAGE_LABELS[report.reportedStage]}
            </Typography>
          </View>

          {report.aiResult ? (
            <View style={styles.aiRow}>
              <View style={styles.confidencePill}>
                <Typography
                  variant="footnoteSemiBold"
                  color={hasMismatch ? colors.warningText : colors.successText}
                >
                  {report.aiResult.isMatch ? '✓ Match' : '⚠ Mismatch'}{' '}
                  {report.aiResult.confidenceScore}%
                </Typography>
              </View>
              {report.aiResult.inferenceMode === 'on_device' && (
                <View style={styles.offlinePill}>
                  <Typography variant="overline" color={colors.infoText}>
                    On-Device
                  </Typography>
                </View>
              )}
            </View>
          ) : null}

          {report.isOfflineSubmission && (
            <View style={styles.offlineBanner}>
              <Typography variant="footnote" color={colors.infoText}>
                Submitted offline — synced when connected
              </Typography>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  headerText: {
    flex: 1,
  },
  divider: {
    marginVertical: 0,
  },
  body: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  stageRow: {
    gap: 2,
  },
  aiRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
    marginTop: spacing[1],
  },
  confidencePill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    backgroundColor: colors.bgSecondary,
    borderRadius: 6,
  },
  offlinePill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    backgroundColor: colors.infoBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.infoBorder,
  },
  offlineBanner: {
    marginTop: spacing[1],
  },
});
