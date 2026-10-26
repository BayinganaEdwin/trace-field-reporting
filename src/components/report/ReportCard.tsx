import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { Typography } from '../ui/Typography';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { Report, ReportStatus } from '../../types';

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

// Left accent border colour per status — gives instant visual triage
function accentColor(status: ReportStatus): string {
  switch (status) {
    case 'flagged':   return colors.warningText;
    case 'verified':  return colors.accentMid;
    case 'approved':  return colors.successText;
    case 'rejected':  return colors.dangerText;
    case 'pending':   return colors.textQuaternary;
    default:          return colors.separator;
  }
}

export function ReportCard({ report, onPress }: ReportCardProps) {
  const hasMismatch    = report.aiResult && !report.aiResult.isMatch && report.aiResult.detectedStage !== null;
  const isNotConstruction = report.aiResult?.detectedStage === null && report.aiResult != null;
  const needsAttention = report.status === 'flagged' || hasMismatch;
  const accent         = accentColor(report.status);

  const confidenceColor =
    !report.aiResult                       ? colors.textQuaternary :
    report.aiResult.confidenceScore >= 90  ? colors.successText :
    report.aiResult.confidenceScore >= 70  ? colors.warningText :
    colors.dangerText;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.outer}>
      <Card style={styles.card} padded={false}>
        {/* ── Left accent strip ───────────────────────────────── */}
        <View style={[styles.accentStrip, { backgroundColor: accent }]} />

        <View style={styles.inner}>
          {/* ── Top row: stage + status badge ─────────────────── */}
          <View style={styles.topRow}>
            <View style={styles.topLeft}>
              <Typography variant="subheadMedium" color={colors.textPrimary} numberOfLines={1}>
                {STAGE_LABELS[report.reportedStage]}
              </Typography>
              <View style={styles.metaRow}>
                <Typography variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                  {report.siteName}
                </Typography>
                <View style={styles.dot} />
                <Typography variant="footnote" color={colors.textQuaternary}>
                  {formatRelativeTime(report.submittedAt)}
                </Typography>
              </View>
            </View>

            <View style={styles.topRight}>
              <StatusBadge status={report.status} />
              {/* Photo thumbnail — if available */}
              {report.photoUri ? (
                <Image
                  source={{ uri: report.photoUri }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.noPhoto}>
                  <Ionicons name="image-outline" size={14} color={colors.textQuaternary} />
                </View>
              )}
            </View>
          </View>

          {/* ── Separator ─────────────────────────────────────── */}
          <View style={styles.divider} />

          {/* ── Bottom row: worker + AI result ────────────────── */}
          <View style={styles.bottomRow}>
            {/* Worker name */}
            <View style={styles.workerRow}>
              <Ionicons name="person-outline" size={12} color={colors.textQuaternary} />
              <Typography variant="footnote" color={colors.textSecondary} numberOfLines={1}>
                {report.submittedByName}
              </Typography>
            </View>

            {/* AI result pill */}
            {report.aiResult ? (
              hasMismatch ? (
                /* Stage mismatch callout */
                <View style={styles.mismatchCallout}>
                  <Ionicons name="alert-circle" size={12} color={colors.warningText} />
                  <Typography variant="overline" color={colors.warningText}>
                    {STAGE_LABELS[report.aiResult.reportedStage]} → {STAGE_LABELS[report.aiResult.detectedStage!]}
                  </Typography>
                </View>
              ) : isNotConstruction ? (
                /* Not a construction site */
                <View style={styles.notConstructionPill}>
                  <Ionicons name="camera-outline" size={12} color={colors.warningText} />
                  <Typography variant="overline" color={colors.warningText}>
                    Not a site photo
                  </Typography>
                </View>
              ) : (
                /* Confirmed match */
                <View style={styles.matchPill}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.successText} />
                  <Typography variant="overline" color={colors.successText}>
                    Confirmed · {report.aiResult.confidenceScore}%
                  </Typography>
                </View>
              )
            ) : report.status === 'pending' && report.photoUri ? (
              /* Still processing */
              <View style={styles.processingPill}>
                <Typography variant="overline" color={colors.textTertiary}>
                  Analysing…
                </Typography>
              </View>
            ) : !report.photoUri ? (
              /* No photo */
              <View style={styles.noAiPill}>
                <Ionicons name="eye-outline" size={12} color={colors.textQuaternary} />
                <Typography variant="overline" color={colors.textQuaternary}>
                  Manual review
                </Typography>
              </View>
            ) : null}
          </View>

          {/* ── Offline banner ─────────────────────────────────── */}
          {report.isOfflineSubmission && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline-outline" size={11} color={colors.infoText} />
              <Typography variant="overline" color={colors.infoText}>
                Submitted offline · synced on reconnect
              </Typography>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: spacing[3],
  },
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentStrip: {
    width: 4,
    alignSelf: 'stretch',
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3] + 2,
    paddingBottom: spacing[3] + 2,
  },

  // ── Top ───────────────────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[2] + 2,
  },
  topLeft: {
    flex: 1,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    flexWrap: 'wrap',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textQuaternary,
  },
  topRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.bgSecondary,
  },
  noPhoto: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Divider ───────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginBottom: spacing[2] + 2,
  },

  // ── Bottom ────────────────────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 1,
    flex: 1,
    minWidth: 0,
  },

  // ── AI result pills ───────────────────────────────────────────
  mismatchCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.warningBg,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    flexShrink: 1,
  },
  notConstructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.warningBg,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.successBg,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  processingPill: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  noAiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },

  // ── Offline ───────────────────────────────────────────────────
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 1,
    marginTop: spacing[2],
    backgroundColor: colors.infoBg,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
});
